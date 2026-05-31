package controllers

import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type comprobanteItem struct {
	VentaID        int            `json:"venta_id"`
	PagoID         *uint          `json:"pago_id,omitempty"`
	ComprobanteURL string         `json:"comprobante_url"`
	FechaVenta     time.Time      `json:"fecha_venta"`
	FechaPago      *time.Time     `json:"fecha_pago,omitempty"`
	Monto          *float64       `json:"monto,omitempty"`
	Vendedor       miniUser       `json:"vendedor"`
	Cliente        miniCliente    `json:"cliente"`
	TotalFinal     float64        `json:"total_final"`
	Revisado       bool           `json:"revisado"`
	RevisadoAt     *time.Time     `json:"revisado_at"`
	FormaPago      *miniFormaPago `json:"forma_pago,omitempty"`
	// Origen del registro: "venta" (legacy) o "pago" (tabla pago_venta).
	Origen string `json:"origen"`
}

type miniUser struct {
	ID     int    `json:"id"`
	Nombre string `json:"nombre"`
}

type miniCliente struct {
	ID     int    `json:"id"`
	Nombre string `json:"nombre"`
}

type miniFormaPago struct {
	ID     int    `json:"id"`
	Nombre string `json:"nombre"`
}

type revisarComprobanteRequest struct {
	Revisado bool  `json:"revisado"`
	PagoID   *uint `json:"pago_id,omitempty"`
}

type revisarTodosRequest struct {
	VentaIDs []int `json:"venta_ids"`
	Revisado bool  `json:"revisado"`
}

func parsePeriodo(c *gin.Context) (string, error) {
	periodo := strings.TrimSpace(strings.ToLower(c.DefaultQuery("periodo", "hoy")))
	switch periodo {
	case "hoy", "ayer", "7dias", "todo":
		return periodo, nil
	default:
		return "", fmt.Errorf("periodo invalido")
	}
}

func parseBoolQuery(c *gin.Context, key string, def bool) (bool, error) {
	val := strings.TrimSpace(strings.ToLower(c.DefaultQuery(key, strconv.FormatBool(def))))
	if val == "true" || val == "1" {
		return true, nil
	}
	if val == "false" || val == "0" {
		return false, nil
	}
	return def, fmt.Errorf("valor invalido")
}

func buildComprobantesQuery(c *gin.Context) (*gorm.DB, error) {
	periodo, err := parsePeriodo(c)
	if err != nil {
		return nil, err
	}

	soloPendientes, err := parseBoolQuery(c, "solo_pendientes", false)
	if err != nil {
		return nil, err
	}

	vendedorID := strings.TrimSpace(c.Query("vendedor_id"))
	formaPagoID := strings.TrimSpace(c.Query("forma_pago_id"))

	subqPagos := config.DB.Model(&models.PagoVenta{}).
		Select("venta_id").
		Where("comprobante_url IS NOT NULL AND comprobante_url <> ''")

	query := config.DB.Model(&models.Venta{}).
		Where("comprobante_url IS NOT NULL AND comprobante_url <> ''").
		Where("id NOT IN (?)", subqPagos)

	if vendedorID != "" {
		id, err := strconv.Atoi(vendedorID)
		if err != nil {
			return nil, err
		}
		query = query.Where("usuario_id = ?", id)
	}

	if formaPagoID != "" {
		id, err := strconv.Atoi(formaPagoID)
		if err != nil {
			return nil, err
		}
		query = query.Where("forma_pago_id = ?", id)
	}

	if periodo != "todo" {
		now := time.Now()
		switch periodo {
		case "hoy":
			since := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			query = query.Where("fecha_venta >= ?", since)
		case "ayer":
			ayer := now.AddDate(0, 0, -1)
			inicio := time.Date(ayer.Year(), ayer.Month(), ayer.Day(), 0, 0, 0, 0, ayer.Location())
			fin := time.Date(ayer.Year(), ayer.Month(), ayer.Day(), 23, 59, 59, 0, ayer.Location())
			query = query.Where("fecha_venta BETWEEN ? AND ?", inicio, fin)
		default:
			since := now.AddDate(0, 0, -7)
			query = query.Where("fecha_venta >= ?", since)
		}
	}

	if soloPendientes {
		query = query.Where("comprobante_revisado = ?", false)
	}

	return query, nil
}

// buildPagosVentaQuery arma el query base para los comprobantes de la tabla
// pago_venta, aplicando los mismos filtros que el listado legacy.
// El filtro de periodo se aplica sobre pago_venta.created_at (cuando se hizo
// el pago, que es lo relevante para el dueño que revisa comprobantes).
func buildPagosVentaQuery(c *gin.Context) (*gorm.DB, error) {
	periodo, err := parsePeriodo(c)
	if err != nil {
		return nil, err
	}

	soloPendientes, err := parseBoolQuery(c, "solo_pendientes", false)
	if err != nil {
		return nil, err
	}

	vendedorID := strings.TrimSpace(c.Query("vendedor_id"))
	formaPagoID := strings.TrimSpace(c.Query("forma_pago_id"))

	query := config.DB.Model(&models.PagoVenta{}).
		Joins("JOIN venta ON venta.id = pago_venta.venta_id").
		Where("pago_venta.comprobante_url IS NOT NULL AND pago_venta.comprobante_url <> ''")

	if vendedorID != "" {
		id, err := strconv.Atoi(vendedorID)
		if err != nil {
			return nil, err
		}
		query = query.Where("venta.usuario_id = ?", id)
	}

	if formaPagoID != "" {
		id, err := strconv.Atoi(formaPagoID)
		if err != nil {
			return nil, err
		}
		query = query.Where("pago_venta.forma_pago_id = ?", id)
	}

	if periodo != "todo" {
		now := time.Now()
		switch periodo {
		case "hoy":
			since := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			query = query.Where("pago_venta.created_at >= ?", since)
		case "ayer":
			ayer := now.AddDate(0, 0, -1)
			inicio := time.Date(ayer.Year(), ayer.Month(), ayer.Day(), 0, 0, 0, 0, ayer.Location())
			fin := time.Date(ayer.Year(), ayer.Month(), ayer.Day(), 23, 59, 59, 0, ayer.Location())
			query = query.Where("pago_venta.created_at BETWEEN ? AND ?", inicio, fin)
		default:
			since := now.AddDate(0, 0, -7)
			query = query.Where("pago_venta.created_at >= ?", since)
		}
	}

	if soloPendientes {
		query = query.Where("pago_venta.revisado = ?", false)
	}

	return query, nil
}

// pagoVentaRow agrega todo lo necesario para armar un comprobanteItem desde la
// tabla pago_venta sin cargar el modelo Venta completo.
type pagoVentaRow struct {
	PagoID          uint       `gorm:"column:pago_id"`
	VentaID         int        `gorm:"column:venta_id"`
	Monto           float64    `gorm:"column:monto"`
	ComprobanteURL  string     `gorm:"column:comprobante_url"`
	Revisado        bool       `gorm:"column:revisado"`
	RevisadoAt      *time.Time `gorm:"column:revisado_at"`
	CreatedAt       time.Time  `gorm:"column:created_at"`
	FormaPagoID     *int       `gorm:"column:forma_pago_id"`
	FormaPagoNombre *string    `gorm:"column:forma_pago_nombre"`
	UsuarioID       int        `gorm:"column:usuario_id"`
	UsuarioNombre   string     `gorm:"column:usuario_nombre"`
	ClienteID       int        `gorm:"column:cliente_id"`
	ClienteNombre   string     `gorm:"column:cliente_nombre"`
	FechaVenta      time.Time  `gorm:"column:fecha_venta"`
	TotalFinal      float64    `gorm:"column:total_final"`
}

// fetchPagosVentaComprobantes devuelve los pagos que matchean el query base,
// con las columnas de venta/usuario/cliente/forma_pago necesarias para el listado.
func fetchPagosVentaComprobantes(baseQuery *gorm.DB) ([]pagoVentaRow, error) {
	var rows []pagoVentaRow
	err := baseQuery.Session(&gorm.Session{}).
		Select(`pago_venta.id            AS pago_id,
		        pago_venta.venta_id      AS venta_id,
		        pago_venta.monto         AS monto,
		        pago_venta.comprobante_url AS comprobante_url,
		        pago_venta.revisado      AS revisado,
		        pago_venta.revisado_at   AS revisado_at,
		        pago_venta.created_at    AS created_at,
		        pago_venta.forma_pago_id AS forma_pago_id,
		        fp.nombre                AS forma_pago_nombre,
		        venta.usuario_id         AS usuario_id,
		        u.nombre                 AS usuario_nombre,
		        venta.cliente_id         AS cliente_id,
		        cli.nombre               AS cliente_nombre,
		        venta.fecha_venta        AS fecha_venta,
		        venta.total_final        AS total_final`).
		Joins("LEFT JOIN forma_pagos fp ON fp.id = pago_venta.forma_pago_id").
		Joins("JOIN usuarios u ON u.id = venta.usuario_id").
		Joins("JOIN clientes cli ON cli.id = venta.cliente_id").
		Order("pago_venta.created_at DESC").
		Scan(&rows).Error
	return rows, err
}

// GetComprobantes godoc
// @Summary Listar comprobantes
// @Description Obtiene comprobantes con filtros (solo dueÃ±o)
// @Tags Comprobantes
// @Produce json
// @Security BearerAuth
// @Param periodo query string false "hoy | ayer | 7dias | todo"
// @Param vendedor_id query int false "ID vendedor"
// @Param forma_pago_id query int false "ID forma de pago"
// @Param solo_pendientes query bool false "true | false"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string "ParÃ¡metros invÃ¡lidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comprobantes [get]
func GetComprobantes(c *gin.Context) {
	query, err := buildComprobantesQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ParÃ¡metros invÃ¡lidos"})
		return
	}

	pagosQuery, err := buildPagosVentaQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ParÃ¡metros invÃ¡lidos"})
		return
	}

	var totalLegacy int64
	if err := query.Session(&gorm.Session{}).Count(&totalLegacy).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al contar comprobantes"})
		return
	}

	var pendientesLegacy int64
	if err := query.Session(&gorm.Session{}).Where("comprobante_revisado = ?", false).Count(&pendientesLegacy).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al contar comprobantes pendientes"})
		return
	}

	var totalPagos int64
	if err := pagosQuery.Session(&gorm.Session{}).Count(&totalPagos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al contar pagos"})
		return
	}

	var pendientesPagos int64
	if err := pagosQuery.Session(&gorm.Session{}).Where("pago_venta.revisado = ?", false).Count(&pendientesPagos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al contar pagos pendientes"})
		return
	}

	var ventas []models.Venta
	if err := query.Session(&gorm.Session{}).
		Preload("Usuario").
		Preload("Cliente").
		Order("fecha_venta DESC").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comprobantes"})
		return
	}

	pagosRows, err := fetchPagosVentaComprobantes(pagosQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pagos"})
		return
	}

	items := make([]comprobanteItem, 0, len(ventas)+len(pagosRows))

	for _, venta := range ventas {
		url := ""
		if venta.ComprobanteURL != nil {
			url = *venta.ComprobanteURL
		}
		items = append(items, comprobanteItem{
			VentaID:        venta.ID,
			ComprobanteURL: url,
			FechaVenta:     venta.FechaVenta,
			Vendedor: miniUser{
				ID:     venta.Usuario.ID,
				Nombre: venta.Usuario.Nombre,
			},
			Cliente: miniCliente{
				ID:     venta.Cliente.ID,
				Nombre: venta.Cliente.Nombre,
			},
			TotalFinal: venta.TotalFinal,
			Revisado:   venta.ComprobanteRevisado,
			RevisadoAt: venta.ComprobanteRevisadoAt,
			Origen:     "venta",
		})
	}

	for i := range pagosRows {
		row := pagosRows[i]
		pagoID := row.PagoID
		fechaPago := row.CreatedAt
		monto := row.Monto

		item := comprobanteItem{
			VentaID:        row.VentaID,
			PagoID:         &pagoID,
			ComprobanteURL: row.ComprobanteURL,
			FechaVenta:     row.FechaVenta,
			FechaPago:      &fechaPago,
			Monto:          &monto,
			Vendedor: miniUser{
				ID:     row.UsuarioID,
				Nombre: row.UsuarioNombre,
			},
			Cliente: miniCliente{
				ID:     row.ClienteID,
				Nombre: row.ClienteNombre,
			},
			TotalFinal: row.TotalFinal,
			Revisado:   row.Revisado,
			RevisadoAt: row.RevisadoAt,
			Origen:     "pago",
		}
		if row.FormaPagoID != nil && row.FormaPagoNombre != nil {
			item.FormaPago = &miniFormaPago{
				ID:     *row.FormaPagoID,
				Nombre: *row.FormaPagoNombre,
			}
		}
		items = append(items, item)
	}

	// Orden combinado por fecha relevante DESC (pago → fecha_pago; venta legacy → fecha_venta).
	sort.SliceStable(items, func(i, j int) bool {
		var ti, tj time.Time
		if items[i].FechaPago != nil {
			ti = *items[i].FechaPago
		} else {
			ti = items[i].FechaVenta
		}
		if items[j].FechaPago != nil {
			tj = *items[j].FechaPago
		} else {
			tj = items[j].FechaVenta
		}
		return ti.After(tj)
	})

	c.JSON(http.StatusOK, gin.H{
		"comprobantes": items,
		"total":        totalLegacy + totalPagos,
		"pendientes":   pendientesLegacy + pendientesPagos,
	})
}

// PutComprobanteRevisado godoc
// @Summary Marcar comprobante como revisado
// @Description Actualiza el estado de revisiÃ³n (solo dueÃ±o)
// @Tags Comprobantes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param venta_id path int true "ID de la venta"
// @Param request body revisarComprobanteRequest true "Estado de revisiÃ³n"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string "Datos invÃ¡lidos"
// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comprobantes/{venta_id}/revisar [put]
func PutComprobanteRevisado(c *gin.Context) {
	ventaIDParam := c.Param("venta_id")
	ventaIDInt, err := strconv.Atoi(ventaIDParam)
	if err != nil || ventaIDInt <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "venta_id invÃ¡lido"})
		return
	}

	var req revisarComprobanteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos invÃ¡lidos"})
		return
	}

	var venta models.Venta
	if err := config.DB.First(&venta, ventaIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	// Si viene pago_id, marcamos ese PagoVenta puntual. Si no, comportamiento legacy.
	if req.PagoID != nil {
		var pago models.PagoVenta
		if err := config.DB.First(&pago, *req.PagoID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pago no encontrado"})
			return
		}
		if int(pago.VentaID) != venta.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "El pago no pertenece a la venta indicada"})
			return
		}

		pago.Revisado = req.Revisado
		if req.Revisado {
			now := time.Now()
			pago.RevisadoAt = &now
		} else {
			pago.RevisadoAt = nil
		}

		if err := config.DB.Save(&pago).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar pago"})
			return
		}

		message := "Comprobante de pago marcado como revisado"
		if !pago.Revisado {
			message = "Comprobante de pago marcado como no revisado"
		}
		c.JSON(http.StatusOK, gin.H{
			"message":     message,
			"venta_id":    venta.ID,
			"pago_id":     pago.ID,
			"revisado":    pago.Revisado,
			"revisado_at": pago.RevisadoAt,
		})
		return
	}

	venta.ComprobanteRevisado = req.Revisado
	if req.Revisado {
		now := time.Now()
		venta.ComprobanteRevisadoAt = &now
	} else {
		venta.ComprobanteRevisadoAt = nil
	}

	if err := config.DB.Save(&venta).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar comprobante"})
		return
	}

	message := "Comprobante marcado como revisado"
	if !venta.ComprobanteRevisado {
		message = "Comprobante marcado como no revisado"
	}
	c.JSON(http.StatusOK, gin.H{
		"message":     message,
		"venta_id":    venta.ID,
		"revisado":    venta.ComprobanteRevisado,
		"revisado_at": venta.ComprobanteRevisadoAt,
	})
}

// PutComprobantesRevisarTodos godoc
// @Summary Marcar varios comprobantes
// @Description Marca comprobantes como revisados (solo dueÃ±o)
// @Tags Comprobantes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body revisarTodosRequest true "IDs y estado"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string "Datos invÃ¡lidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comprobantes/revisar-todos [put]
func PutComprobantesRevisarTodos(c *gin.Context) {
	var req revisarTodosRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.VentaIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos invÃ¡lidos"})
		return
	}

	updates := map[string]interface{}{
		"comprobante_revisado": req.Revisado,
	}
	if req.Revisado {
		updates["comprobante_revisado_at"] = time.Now()
	} else {
		updates["comprobante_revisado_at"] = gorm.Expr("NULL")
	}

	result := config.DB.Model(&models.Venta{}).Where("id IN ?", req.VentaIDs).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar comprobantes"})
		return
	}

	action := "marcados como revisados"
	if !req.Revisado {
		action = "marcados como no revisados"
	}
	c.JSON(http.StatusOK, gin.H{
		"message":      strconv.FormatInt(result.RowsAffected, 10) + " comprobantes " + action,
		"actualizados": result.RowsAffected,
	})
}

// GetComprobantesZip godoc
// @Summary Descargar comprobantes en ZIP
// @Description Genera un ZIP con comprobantes filtrados (solo dueÃ±o)
// @Tags Comprobantes
// @Produce application/zip
// @Security BearerAuth
// @Param periodo query string false "hoy | ayer | 7dias | todo"
// @Param vendedor_id query int false "ID vendedor"
// @Param forma_pago_id query int false "ID forma de pago"
// @Param solo_pendientes query bool false "true | false"
// @Success 200 {file} file "ZIP de comprobantes"
// @Failure 400 {object} map[string]string "ParÃ¡metros invÃ¡lidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comprobantes/descargar [get]
func GetComprobantesZip(c *gin.Context) {
	query, err := buildComprobantesQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ParÃ¡metros invÃ¡lidos"})
		return
	}

	pagosQuery, err := buildPagosVentaQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ParÃ¡metros invÃ¡lidos"})
		return
	}

	var ventas []models.Venta
	if err := query.Session(&gorm.Session{}).
		Preload("Usuario").
		Preload("Cliente").
		Order("fecha_venta DESC").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comprobantes"})
		return
	}

	pagosRows, err := fetchPagosVentaComprobantes(pagosQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pagos"})
		return
	}

	filename := "comprobantes_" + time.Now().Format("2006-01-02") + ".zip"
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")

	zipWriter := zip.NewWriter(c.Writer)
	defer zipWriter.Close()

	for _, venta := range ventas {
		if venta.ComprobanteURL == nil || *venta.ComprobanteURL == "" {
			continue
		}

		filePath := *venta.ComprobanteURL
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			log.Printf("Comprobante no encontrado en disco: %s", filePath)
			continue
		}

		ext := filepath.Ext(filePath)
		if ext == "" {
			ext = ".pdf"
		}

		vendedor := sanitizeFilename(venta.Usuario.Nombre)
		if vendedor == "" {
			vendedor = "vendedor"
		}
		fileName := "venta_" + strconv.Itoa(venta.ID) + "_" + vendedor + "_" + venta.FechaVenta.Format("2006-01-02") + ext

		appendFileToZip(zipWriter, filePath, fileName)
	}

	for _, row := range pagosRows {
		if row.ComprobanteURL == "" {
			continue
		}
		filePath := row.ComprobanteURL
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			log.Printf("Comprobante de pago no encontrado en disco: %s", filePath)
			continue
		}
		ext := filepath.Ext(filePath)
		if ext == "" {
			ext = ".pdf"
		}
		vendedor := sanitizeFilename(row.UsuarioNombre)
		if vendedor == "" {
			vendedor = "vendedor"
		}
		fileName := "pago_" + strconv.Itoa(row.VentaID) + "_" + strconv.FormatUint(uint64(row.PagoID), 10) + "_" + vendedor + "_" + row.CreatedAt.Format("2006-01-02") + ext
		appendFileToZip(zipWriter, filePath, fileName)
	}
}

func appendFileToZip(zipWriter *zip.Writer, filePath, fileName string) {
	zipFile, err := zipWriter.Create(fileName)
	if err != nil {
		log.Printf("Error creando archivo en ZIP: %v", err)
		return
	}

	f, err := os.Open(filePath)
	if err != nil {
		log.Printf("Error abriendo comprobante: %v", err)
		return
	}
	defer f.Close()

	if _, err := io.Copy(zipFile, f); err != nil {
		log.Printf("Error copiando comprobante al ZIP: %v", err)
	}
}

func sanitizeFilename(input string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return ""
	}
	var b strings.Builder
	for _, r := range input {
		switch {
		case r >= 'a' && r <= 'z':
			b.WriteRune(r)
		case r >= 'A' && r <= 'Z':
			b.WriteRune(r)
		case r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == ' ' || r == '-' || r == '_':
			b.WriteRune('_')
		}
	}
	return b.String()
}
