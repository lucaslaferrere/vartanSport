package controllers

import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type comprobanteItem struct {
	VentaID             int            `json:"venta_id"`
	ComprobanteURL      string         `json:"comprobante_url"`
	ComprobanteSaldoURL *string        `json:"comprobante_saldo_url,omitempty"`
	FechaVenta          time.Time      `json:"fecha_venta"`
	Vendedor            miniUser       `json:"vendedor"`
	Cliente             miniCliente    `json:"cliente"`
	FormaPago           miniFormaPago  `json:"forma_pago"`
	FormaPagoSaldo      *miniFormaPago `json:"forma_pago_saldo,omitempty"`
	TotalFinal          float64        `json:"total_final"`
	Revisado            bool           `json:"revisado"`
	RevisadoAt          *time.Time     `json:"revisado_at"`
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
	Revisado bool `json:"revisado"`
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

	query := config.DB.Model(&models.Venta{}).
		Where("(comprobante_url IS NOT NULL AND comprobante_url <> '') OR (comprobante_saldo_url IS NOT NULL AND comprobante_saldo_url <> '')")

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
		query = query.Where("(forma_pago_id = ? OR forma_pago_saldo_id = ?)", id, id)
	}

	if periodo != "todo" {
		loc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
		ahora := time.Now().In(loc)

		var desde, hasta time.Time
		switch periodo {
		case "hoy":
			desde = time.Date(ahora.Year(), ahora.Month(), ahora.Day(), 0, 0, 0, 0, loc)
			hasta = desde.Add(24 * time.Hour)
		case "ayer":
			ayer := ahora.AddDate(0, 0, -1)
			desde = time.Date(ayer.Year(), ayer.Month(), ayer.Day(), 0, 0, 0, 0, loc)
			hasta = desde.Add(24 * time.Hour)
		default: // 7dias
			desde = ahora.AddDate(0, 0, -7)
			hasta = ahora
		}

		query = query.Where("COALESCE(fecha_pago_saldo, fecha_venta) >= ? AND COALESCE(fecha_pago_saldo, fecha_venta) < ?", desde, hasta)
	}

	if soloPendientes {
		query = query.Where("comprobante_revisado = ?", false)
	}

	return query, nil
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

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al contar comprobantes"})
		return
	}

	var pendientes int64
	if err := query.Session(&gorm.Session{}).Where("comprobante_revisado = ?", false).Count(&pendientes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al contar comprobantes pendientes"})
		return
	}

	var ventas []models.Venta
	if err := query.Session(&gorm.Session{}).
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Order("fecha_venta DESC").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comprobantes"})
		return
	}

	items := make([]comprobanteItem, 0, len(ventas))
	for _, venta := range ventas {
		url := ""
		if venta.ComprobanteURL != nil {
			url = *venta.ComprobanteURL
		}
		var formaPagoSaldo *miniFormaPago
		if venta.FormaPagoSaldoID != nil {
			formaPagoSaldo = &miniFormaPago{
				ID:     venta.FormaPagoSaldo.ID,
				Nombre: venta.FormaPagoSaldo.Nombre,
			}
		}
		items = append(items, comprobanteItem{
			VentaID:             venta.ID,
			ComprobanteURL:      url,
			ComprobanteSaldoURL: venta.ComprobanteSaldoURL,
			FechaVenta:          venta.FechaVenta,
			Vendedor: miniUser{
				ID:     venta.Usuario.ID,
				Nombre: venta.Usuario.Nombre,
			},
			Cliente: miniCliente{
				ID:     venta.Cliente.ID,
				Nombre: venta.Cliente.Nombre,
			},
			FormaPago: miniFormaPago{
				ID:     venta.FormaPago.ID,
				Nombre: venta.FormaPago.Nombre,
			},
			FormaPagoSaldo: formaPagoSaldo,
			TotalFinal:     venta.TotalFinal,
			Revisado:       venta.ComprobanteRevisado,
			RevisadoAt:     venta.ComprobanteRevisadoAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"comprobantes": items,
		"total":        total,
		"pendientes":   pendientes,
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
	ventaID := c.Param("venta_id")

	var req revisarComprobanteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos invÃ¡lidos"})
		return
	}

	var venta models.Venta
	if err := config.DB.First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
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

	var ventas []models.Venta
	if err := query.Session(&gorm.Session{}).
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Order("fecha_venta DESC").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comprobantes"})
		return
	}

	filename := "comprobantes_" + time.Now().Format("2006-01-02") + ".zip"
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")

	zipWriter := zip.NewWriter(c.Writer)
	defer zipWriter.Close()

	addToZip := func(venta models.Venta, filePath string, sufijo string) {
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			log.Printf("Comprobante no encontrado en disco: %s", filePath)
			return
		}
		ext := filepath.Ext(filePath)
		if ext == "" {
			ext = ".pdf"
		}
		vendedor := sanitizeFilename(venta.Usuario.Nombre)
		if vendedor == "" {
			vendedor = "vendedor"
		}
		fileName := "venta_" + strconv.Itoa(venta.ID) + "_" + vendedor + "_" + venta.FechaVenta.Format("2006-01-02") + sufijo + ext
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

	for _, venta := range ventas {
		if venta.ComprobanteURL != nil && *venta.ComprobanteURL != "" {
			sufijo := ""
			if venta.ComprobanteSaldoURL != nil && *venta.ComprobanteSaldoURL != "" {
				sufijo = "_sena"
			}
			addToZip(venta, *venta.ComprobanteURL, sufijo)
		}
		if venta.ComprobanteSaldoURL != nil && *venta.ComprobanteSaldoURL != "" {
			addToZip(venta, *venta.ComprobanteSaldoURL, "_saldo")
		}
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
