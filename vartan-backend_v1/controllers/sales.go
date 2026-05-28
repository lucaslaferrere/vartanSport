package controllers

import (
	"encoding/json"
	"fmt"
	"io"
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

const financieraRate = 0.025

func normalizeFormaPagoName(nombre string) string {
	normalized := strings.TrimSpace(strings.ToLower(nombre))
	normalized = strings.NewReplacer(
		"á", "a",
		"é", "e",
		"í", "i",
		"ó", "o",
		"ú", "u",
		"ñ", "n",
		"Ã¡", "a",
		"Ã©", "e",
		"Ã­", "i",
		"Ã³", "o",
		"Ãº", "u",
		"Ã±", "n",
		"Ã£Â±", "n",
	).Replace(normalized)
	return normalized
}

func isFormaPagoFinanciera(formaPago models.FormaPago) bool {
	normalized := normalizeFormaPagoName(formaPago.Nombre)
	return normalized == "financiera" || normalized == "transferencia financiera"
}

// CreateVenta godoc
// @Summary Crear venta
// @Description Crea una nueva venta con descuentos automáticos y opcionalmente un comprobante
// @Tags Ventas
// @Accept json,multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param request body models.VentaCreateRequest false "Datos de la venta (JSON)"
// @Param cliente_id formData int false "ID del cliente (form-data)"
// @Param forma_pago_id formData int false "ID de la forma de pago (form-data)"
// @Param sena formData number false "Seña abonada (form-data)"
// @Param observaciones formData string false "Observaciones de la venta"
// @Param detalles formData string false "JSON con los detalles de la venta (form-data)"
// @Param comprobante formData file false "Comprobante de pago (PDF, JPG, PNG)"
// @Success 201 {object} models.Venta
// @Failure 400 {object} map[string]string "Datos inválidos o stock insuficiente"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/ventas [post]

// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/ventas/{id} [delete]
func DeleteVenta(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.Preload("Detalles").First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, detalle := range venta.Detalles {
		var stock models.ProductoStock
		if err := tx.Where("producto_id = ? AND talle = ?", detalle.ProductoID, detalle.Talle).First(&stock).Error; err == nil {
			stock.Cantidad += detalle.Cantidad
			if err := tx.Save(&stock).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al restaurar stock"})
				return
			}
		}
	}

	if venta.ComprobanteURL != nil && *venta.ComprobanteURL != "" {
		os.Remove(*venta.ComprobanteURL)
	}
	if venta.ComprobanteSaldoURL != nil && *venta.ComprobanteSaldoURL != "" {
		os.Remove(*venta.ComprobanteSaldoURL)
	}

	var pagosVenta []models.PagoVenta
	if err := tx.Where("venta_id = ?", venta.ID).Find(&pagosVenta).Error; err == nil {
		for _, pago := range pagosVenta {
			if pago.ComprobanteURL != nil && *pago.ComprobanteURL != "" {
				os.Remove(*pago.ComprobanteURL)
			}
		}
		if err := tx.Where("venta_id = ?", venta.ID).Delete(&models.PagoVenta{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar pagos de venta"})
			return
		}
	}

	if err := tx.Where("venta_id = ?", venta.ID).Delete(&models.Pedido{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar pedido"})
		return
	}

	if err := tx.Where("venta_id = ?", venta.ID).Delete(&models.VentaDetalle{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar detalles de venta"})
		return
	}

	if err := tx.Delete(&venta).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar venta"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar eliminación"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Venta eliminada exitosamente"})
}

// GetVenta godoc
// @Summary Obtener una venta por ID
// @Description Obtiene los detalles de una venta específica
// @Tags Ventas
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Param forma_pago_saldo_id formData int false "ID de la forma de pago del saldo"
// @Param forma_pago_saldo_id formData int false "ID de la forma de pago del saldo"
// @Success 200 {object} models.Venta
// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Router /api/ventas/{id} [get]
func GetVenta(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos", func(db *gorm.DB) *gorm.DB {
			return db.Order("pagos_venta.fecha ASC")
		}).
		Preload("Pagos.FormaPago").
		First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	c.JSON(http.StatusOK, venta)
}

// UpdateVentaDetalles godoc
// @Summary Actualizar detalles de una venta
// @Description Actualiza los productos de una venta existente, restaurando y actualizando stock
// @Tags Ventas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Param request body models.VentaUpdateDetallesRequest true "Datos de los detalles"
// @Success 200 {object} models.Venta
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Failure 500 {object} map[string]string "Error del servidor"
// GetFormasPago godoc
// @Summary Listar formas de pago
// @Description Obtiene todas las formas de pago disponibles
// @Tags Ventas
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.FormaPago
// @Router /api/formas-pago [get]
func GetFormasPago(c *gin.Context) {
	var formasPago []models.FormaPago
	if err := config.DB.Find(&formasPago).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener formas de pago"})
		return
	}

	orden := []string{"senas", "financiera", "valu tahiel", "cuenta 0", "efectivo"}
	permitidas := map[string]models.FormaPago{}
	for _, formaPago := range formasPago {
		key := normalizeFormaPagoName(formaPago.Nombre)
		if key == "senas" || key == "sena" || key == "señas" {
			permitidas["senas"] = formaPago
			continue
		}
		if key == "transferencia financiera" {
			formaPago.Nombre = "Financiera"
			permitidas["financiera"] = formaPago
			continue
		}
		if key == "transferencia a cero" {
			formaPago.Nombre = "Cuenta 0"
			permitidas["cuenta 0"] = formaPago
			continue
		}
		if key == "financiera" || key == "valu tahiel" || key == "cuenta 0" || key == "efectivo" {
			permitidas[key] = formaPago
		}
	}

	response := make([]models.FormaPago, 0, len(orden))
	for _, key := range orden {
		if formaPago, ok := permitidas[key]; ok {
			if key == "senas" {
				formaPago.Nombre = "Señas"
			}
			response = append(response, formaPago)
		}
	}

	c.JSON(http.StatusOK, response)
}

// @Router /api/ventas/{id}/detalles [put]
func UpdateVentaDetalles(c *gin.Context) {
	ventaID := c.Param("id")

	var request models.VentaUpdateDetallesRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar que la venta existe
	var venta models.Venta
	if err := config.DB.Preload("Detalles").First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	// Comenzar transacción
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// PASO 1: Restaurar el stock de los productos viejos
	for _, detalleViejo := range venta.Detalles {
		// Buscar el stock del producto viejo
		var stockViejo models.ProductoStock
		if err := tx.Where("producto_id = ? AND talle = ?", detalleViejo.ProductoID, detalleViejo.Talle).First(&stockViejo).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar stock viejo"})
			return
		}

		// Restaurar la cantidad
		stockViejo.Cantidad += detalleViejo.Cantidad
		if err := tx.Save(&stockViejo).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al restaurar stock"})
			return
		}
	}

	// PASO 2: Eliminar los detalles viejos
	if err := tx.Where("venta_id = ?", venta.ID).Delete(&models.VentaDetalle{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar detalles viejos"})
		return
	}

	// PASO 3: Calcular nuevos valores y crear nuevos detalles
	var nuevosTotales struct {
		costo       float64
		precioVenta float64
		ganancia    float64
	}

	nuevosDetalles := make([]models.VentaDetalle, 0)

	for _, detalle := range request.Detalles {
		// Verificar stock disponible
		var stock models.ProductoStock
		if err := tx.Where("producto_id = ? AND talle = ?", detalle.ProductoID, detalle.Talle).First(&stock).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stock no encontrado para producto %d talle %s", detalle.ProductoID, detalle.Talle)})
			return
		}

		if stock.Cantidad < detalle.Cantidad {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stock insuficiente para producto %d talle %s. Disponible: %d, Solicitado: %d", detalle.ProductoID, detalle.Talle, stock.Cantidad, detalle.Cantidad)})
			return
		}

		// Obtener el producto para calcular costo
		var producto models.Producto
		if err := tx.First(&producto, detalle.ProductoID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener producto"})
			return
		}

		// Calcular subtotal y costo
		subtotal := detalle.PrecioUnitario * float64(detalle.Cantidad)
		costoDetalle := producto.CostoUnitario * float64(detalle.Cantidad)

		nuevosTotales.costo += costoDetalle
		nuevosTotales.precioVenta += subtotal

		// Crear nuevo detalle
		nuevoDetalle := models.VentaDetalle{
			VentaID:        venta.ID,
			ProductoID:     detalle.ProductoID,
			Talle:          detalle.Talle,
			Cantidad:       detalle.Cantidad,
			PrecioUnitario: detalle.PrecioUnitario,
			Subtotal:       subtotal,
		}

		if err := tx.Create(&nuevoDetalle).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear nuevo detalle"})
			return
		}

		nuevosDetalles = append(nuevosDetalles, nuevoDetalle)

		// Descontar el nuevo stock
		stock.Cantidad -= detalle.Cantidad
		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar stock"})
			return
		}
	}

	if request.Sena < 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "sena no puede ser negativa"})
		return
	}
	if request.Sena > request.PrecioVenta {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "La seña no puede superar el precio de venta"})
		return
	}

	var formaPago models.FormaPago
	if err := tx.First(&formaPago, venta.FormaPagoID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Forma de pago no encontrada"})
		return
	}

	// Misma regla de alta: si seña=0, se considera contado y el saldo queda en 0.
	saldo := 0.0
	if request.Sena > 0 {
		saldo = request.PrecioVenta - request.Sena
	}

	descuento := 0.0
	usaFinanciera := false
	if request.UsaDescuentoFinanciera && isFormaPagoFinanciera(formaPago) {
		descuento = request.PrecioVenta * financieraRate
		usaFinanciera = true
	}

	total := request.PrecioVenta
	totalFinal := total
	ganancia := total - nuevosTotales.costo - descuento

	// PASO 5: Actualizar la venta
	venta.Transporte = request.Transporte
	venta.Costo = nuevosTotales.costo
	venta.PrecioVenta = request.PrecioVenta
	venta.Ganancia = ganancia
	venta.Total = total

	if request.Sena > 0 {
		venta.Sena = &request.Sena
	} else {
		venta.Sena = nil
	}

	venta.Saldo = saldo
	venta.Descuento = descuento
	venta.TotalFinal = totalFinal
	venta.UsaFinanciera = usaFinanciera

	if request.Observaciones != "" {
		venta.Observaciones = &request.Observaciones
	} else {
		venta.Observaciones = nil
	}

	// Evita que GORM intente re-guardar asociaciones precargadas (Detalles viejos).
	venta.Detalles = nil
	if err := tx.Omit("Detalles").Save(&venta).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar venta"})
		return
	}

	// Commit de la transacción
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar transacción"})
		return
	}

	// Recargar la venta con todas las relaciones
	if err := config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos", func(db *gorm.DB) *gorm.DB {
			return db.Order("pagos_venta.fecha ASC")
		}).
		Preload("Pagos.FormaPago").
		First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al recargar venta"})
		return
	}

	c.JSON(http.StatusOK, venta)
}

func GetPagosPendientes(c *gin.Context) {
	userID := c.GetInt("user_id")
	userRol := c.GetString("rol")

	query := config.DB.
		Where("saldo > 0").
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos", func(db *gorm.DB) *gorm.DB {
			return db.Order("pagos_venta.fecha ASC")
		}).
		Preload("Pagos.FormaPago").
		Order("fecha_venta DESC")

	if userRol != "dueño" {
		query = query.Where("usuario_id = ?", userID)
	}

	var ventas []models.Venta
	if err := query.Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pagos pendientes"})
		return
	}

	c.JSON(http.StatusOK, ventas)
}

func CreateVenta(c *gin.Context) {
	contentType := c.ContentType()

	if strings.Contains(contentType, "application/json") {
		var jsonReq models.VentaCreateRequest
		if err := c.ShouldBindJSON(&jsonReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
			return
		}
		processVenta(c, jsonReq.UsuarioID, jsonReq.ClienteID, jsonReq.FormaPagoID, jsonReq.Transporte, jsonReq.PrecioVenta, jsonReq.Sena, jsonReq.UsaDescuentoFinanciera, jsonReq.Observaciones, jsonReq.Detalles, nil)
		return
	}

	if strings.Contains(contentType, "multipart/form-data") {
		var formReq models.VentaCreateFormRequest
		if err := c.ShouldBind(&formReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Datos de formulario inválidos: " + err.Error()})
			return
		}

		var detalles []models.VentaDetalleCreateRequest
		if err := json.Unmarshal([]byte(formReq.Detalles), &detalles); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de detalles inválido: " + err.Error()})
			return
		}

		var comprobanteURL *string
		file, err := c.FormFile("comprobante")
		if err == nil && file != nil {
			ext := strings.ToLower(filepath.Ext(file.Filename))
			allowedExts := map[string]bool{".pdf": true, ".jpg": true, ".jpeg": true, ".png": true}
			if !allowedExts[ext] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se permiten archivos PDF, JPG, JPEG y PNG"})
				return
			}

			if file.Size > 5*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo no puede superar los 5MB"})
				return
			}

			uploadDir := "uploads/comprobantes"
			filename := fmt.Sprintf("comprobante_%d%s", time.Now().UnixNano(), ext)
			filePath := filepath.Join(uploadDir, filename)

			src, err := file.Open()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error abriendo comprobante: " + err.Error()})
				return
			}
			defer src.Close()

			dst, err := os.Create(filePath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando archivo: " + err.Error()})
				return
			}
			defer dst.Close()

			if _, err := io.Copy(dst, src); err != nil {
				fmt.Println("❌ ERROR GUARDANDO ARCHIVO:", err)
				fmt.Println("❌ FilePath:", filePath)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar comprobante: " + err.Error()})
				return
			}

			comprobanteURL = &filePath
		}

		var usuarioID *int
		if formReq.UsuarioID != "" {
			id, err := strconv.Atoi(formReq.UsuarioID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "usuario_id inválido"})
				return
			}
			usuarioID = &id
		}

		clienteID, err := strconv.Atoi(formReq.ClienteID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cliente_id inválido"})
			return
		}

		formaPagoID, err := strconv.Atoi(formReq.FormaPagoID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "forma_pago_id inválido"})
			return
		}

		precioVenta, err := strconv.ParseFloat(formReq.PrecioVenta, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "precio_venta inválido"})
			return
		}

		var sena float64
		if formReq.Sena != "" {
			var errSena error
			sena, errSena = strconv.ParseFloat(formReq.Sena, 64)
			if errSena != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "sena inválida"})
				return
			}
		}

		usaDescuentoFinanciera := false
		if formReq.UsaDescuentoFinanciera == "true" || formReq.UsaDescuentoFinanciera == "1" {
			usaDescuentoFinanciera = true
		}

		processVenta(c, usuarioID, clienteID, formaPagoID, formReq.Transporte, precioVenta, sena, usaDescuentoFinanciera, formReq.Observaciones, detalles, comprobanteURL)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Content-Type no soportado. Use application/json o multipart/form-data"})
}

func processVenta(c *gin.Context, usuarioID *int, clienteID int, formaPagoID int, transporte string, precioVenta float64, sena float64, usaDescuentoFinanciera bool, observaciones string, detalles []models.VentaDetalleCreateRequest, comprobanteURL *string) {
	var vendedorID int
	if usuarioID != nil && *usuarioID > 0 {
		var usuario models.Usuario
		if err := config.DB.First(&usuario, *usuarioID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Usuario vendedor no encontrado"})
			return
		}
		if usuario.Rol != "empleado" && usuario.Rol != "dueño" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "El usuario seleccionado no es un vendedor"})
			return
		}
		vendedorID = *usuarioID
	} else {
		vendedorID = c.GetInt("user_id")
	}

	// Pre-validar stock y calcular costo real desde la DB (ignorar lo que mande el frontend)
	costoPorProducto := make(map[int]float64)
	for _, detalleReq := range detalles {
		var producto models.Producto
		if err := config.DB.First(&producto, detalleReq.ProductoID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Producto ID %d no encontrado", detalleReq.ProductoID)})
			return
		}
		costoPorProducto[detalleReq.ProductoID] = producto.CostoUnitario
		var stock models.ProductoStock
		if err := config.DB.Where("producto_id = ? AND talle = ?", detalleReq.ProductoID, detalleReq.Talle).First(&stock).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Sin stock registrado: %s – Talle %s", producto.Nombre, detalleReq.Talle)})
			return
		}
		if stock.Cantidad < detalleReq.Cantidad {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stock insuficiente: %s – Talle %s (disponible: %d, pedido: %d)", producto.Nombre, detalleReq.Talle, stock.Cantidad, detalleReq.Cantidad)})
			return
		}
	}

	var costo float64
	for _, detalleReq := range detalles {
		costo += costoPorProducto[detalleReq.ProductoID] * float64(detalleReq.Cantidad)
	}

	if precioVenta == 0 {
		precioVenta = costo
	}

	total := precioVenta

	senaValue := float64(0)
	if sena > 0 {
		senaValue = sena
	}

	var descuento float64
	var formaPago models.FormaPago
	var usaFinanciera bool

	if err := config.DB.First(&formaPago, formaPagoID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Forma de pago no encontrada"})
		return
	}

	// El cliente SIEMPRE paga el precio de venta completo
	totalFinal := total

	// Calcular saldo (lo que falta pagar)
	// Si seña = 0 → pagó todo de contado → saldo = 0
	// Si seña > 0 → pagó parcial → saldo = total - seña
	var saldo float64
	if sena > 0 {
		saldo = total - senaValue
	} else {
		saldo = 0
	}

	// La financiera afecta la GANANCIA, no lo que paga el cliente.
	if usaDescuentoFinanciera && isFormaPagoFinanciera(formaPago) {
		descuento = total * financieraRate
		usaFinanciera = true
	}

	// Ganancia = precio venta - costo - comisión financiera
	ganancia := total - costo - descuento

	var obs *string
	if observaciones != "" {
		obs = &observaciones
	}

	senaPtr := &sena

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	venta := models.Venta{
		UsuarioID:      vendedorID,
		ClienteID:      clienteID,
		FormaPagoID:    formaPagoID,
		Transporte:     transporte,
		Costo:          costo,
		PrecioVenta:    precioVenta,
		Ganancia:       ganancia,
		Total:          total,
		Sena:           senaPtr,
		SenaInicial:    senaValue,
		Saldo:          saldo,
		Descuento:      descuento,
		TotalFinal:     totalFinal,
		UsaFinanciera:  usaFinanciera,
		ComprobanteURL: comprobanteURL,
		Observaciones:  obs,
	}

	if err := tx.Create(&venta).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear venta"})
		return
	}

	for _, detalleReq := range detalles {
		costoUnitario := costoPorProducto[detalleReq.ProductoID]
		subtotal := costoUnitario * float64(detalleReq.Cantidad)

		detalle := models.VentaDetalle{
			VentaID:        venta.ID,
			ProductoID:     detalleReq.ProductoID,
			Talle:          detalleReq.Talle,
			Cantidad:       detalleReq.Cantidad,
			PrecioUnitario: costoUnitario,
			Subtotal:       subtotal,
		}

		if err := tx.Create(&detalle).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear detalle de venta"})
			return
		}

		var stock models.ProductoStock
		if err := tx.Where("producto_id = ? AND talle = ?", detalleReq.ProductoID, detalleReq.Talle).First(&stock).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Stock no encontrado para el producto y talle especificado"})
			return
		}

		if stock.Cantidad < detalleReq.Cantidad {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Stock insuficiente"})
			return
		}

		stock.Cantidad -= detalleReq.Cantidad
		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar stock"})
			return
		}
	}

	pedido := models.Pedido{
		VentaID: venta.ID,
		Estado:  "pendiente",
	}

	if err := tx.Create(&pedido).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear pedido"})
		return
	}

	if comprobanteURL != nil && *comprobanteURL != "" {
		montoInicial := senaValue
		if montoInicial == 0 {
			montoInicial = totalFinal
		}
		formaPagoIDCopy := formaPagoID
		pagoInicial := models.PagoVenta{
			VentaID:        venta.ID,
			Monto:          montoInicial,
			ComprobanteURL: comprobanteURL,
			FormaPagoID:    &formaPagoIDCopy,
			Fecha:          time.Now(),
		}
		if err := tx.Create(&pagoInicial).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar pago inicial"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar venta"})
		return
	}

	config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos").
		Preload("Pagos.FormaPago").
		First(&venta, venta.ID)

	c.JSON(http.StatusCreated, venta)
}

// GetMisVentas godoc
// @Summary Obtener mis ventas
// @Description Obtiene las ventas del usuario autenticado
// @Tags Ventas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Venta
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/mis-ventas [get]
func GetMisVentas(c *gin.Context) {
	userID := c.GetInt("user_id")

	var ventas []models.Venta
	if err := config.DB.
		Where("usuario_id = ?", userID).
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos", func(db *gorm.DB) *gorm.DB {
			return db.Order("pagos_venta.fecha ASC")
		}).
		Preload("Pagos.FormaPago").
		Order("fecha_venta DESC").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas"})
		return
	}

	c.JSON(http.StatusOK, ventas)
}

// GetVentas godoc
// @Summary Listar todas las ventas
// @Description Obtiene todas las ventas (solo dueño)
// @Tags Ventas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Venta
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/ventas [get]
func GetVentas(c *gin.Context) {
	pageStr := c.Query("page")
	limitStr := c.Query("limit")
	clienteFilter := strings.TrimSpace(c.Query("cliente"))
	productoFilter := strings.TrimSpace(c.Query("producto"))
	metodoPagoFilter := strings.TrimSpace(c.Query("metodoPago"))

	// Construir query base con filtros
	query := config.DB.Model(&models.Venta{})

	if clienteFilter != "" {
		query = query.Where("cliente_id IN (SELECT id FROM clientes WHERE nombre ILIKE ?)", "%"+clienteFilter+"%")
	}

	if productoFilter != "" {
		query = query.Where("id IN (SELECT vd.venta_id FROM venta_detalles vd JOIN productos p ON p.id = vd.producto_id WHERE p.nombre ILIKE ?)", "%"+productoFilter+"%")
	}

	if metodoPagoFilter != "" {
		query = query.Where("forma_pago_id IN (SELECT id FROM forma_pagos WHERE nombre ILIKE ?)", "%"+metodoPagoFilter+"%")
	}

	// Sin page/limit → devolver todo (compatibilidad con código existente)
	if pageStr == "" && limitStr == "" {
		var ventas []models.Venta
		if err := query.
			Preload("Usuario").
			Preload("Cliente").
			Preload("FormaPago").
			Preload("FormaPagoSaldo").
			Preload("Detalles").
			Preload("Detalles.Producto").
			Preload("Pagos", func(db *gorm.DB) *gorm.DB {
				return db.Order("pagos_venta.fecha ASC")
			}).
			Preload("Pagos.FormaPago").
			Order("venta.fecha_venta DESC").
			Find(&ventas).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas"})
			return
		}
		c.JSON(http.StatusOK, ventas)
		return
	}

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 50
	}
	offset := (page - 1) * limit

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al contar ventas"})
		return
	}

	var ventas []models.Venta
	if err := query.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos", func(db *gorm.DB) *gorm.DB {
			return db.Order("pagos_venta.fecha ASC")
		}).
		Preload("Pagos.FormaPago").
		Order("venta.fecha_venta DESC").
		Limit(limit).
		Offset(offset).
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas"})
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"ventas":      ventas,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

func GetVentaByID(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos", func(db *gorm.DB) *gorm.DB {
			return db.Order("pagos_venta.fecha ASC")
		}).
		Preload("Pagos.FormaPago").
		First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	c.JSON(http.StatusOK, venta)
}

// GetVentasByUsuario godoc
// @Summary Obtener ventas por usuario
// @Description Obtiene las ventas de un usuario específico (solo dueño)
// @Tags Ventas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del usuario"
// @Success 200 {array} models.Venta
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/ventas/usuario/{id} [get]
func GetVentasByUsuario(c *gin.Context) {
	usuarioID := c.Param("id")

	var ventas []models.Venta
	if err := config.DB.
		Where("usuario_id = ?", usuarioID).
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos", func(db *gorm.DB) *gorm.DB {
			return db.Order("pagos_venta.fecha ASC")
		}).
		Preload("Pagos.FormaPago").
		Order("fecha_venta DESC").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas"})
		return
	}

	c.JSON(http.StatusOK, ventas)
}

// GetVentaComprobante godoc
// @Summary Descargar comprobante de venta
// @Description Descarga el comprobante adjunto a una venta
// @Tags Ventas
// @Produce octet-stream
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Success 200 {file} file "Archivo del comprobante"
// @Failure 404 {object} map[string]string "Comprobante no encontrado"
// @Router /api/ventas/{id}/comprobante [get]
func GetVentaComprobante(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	if venta.ComprobanteURL == nil || *venta.ComprobanteURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Esta venta no tiene comprobante adjunto"})
		return
	}

	if _, err := os.Stat(*venta.ComprobanteURL); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Archivo de comprobante no encontrado"})
		return
	}

	c.File(*venta.ComprobanteURL)
}

// DeleteVentaComprobante godoc
// @Summary Eliminar comprobante de venta
// @Description Elimina el comprobante adjunto a una venta
// @Tags Ventas
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Success 200 {object} map[string]string "Comprobante eliminado"
// @Failure 404 {object} map[string]string "Venta o comprobante no encontrado"
// @Router /api/ventas/{id}/comprobante [delete]
// GetVentaComprobantes godoc
// @Summary Listar comprobantes de una venta
// @Description Devuelve todos los comprobantes registrados para la venta (uno por cada pago).
// @Tags Ventas
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Router /api/ventas/{id}/comprobantes [get]
func GetVentaComprobantes(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	var pagos []models.PagoVenta
	if err := config.DB.
		Where("venta_id = ?", venta.ID).
		Preload("FormaPago").
		Order("fecha ASC").
		Find(&pagos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pagos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"venta_id": venta.ID,
		"pagos":    pagos,
	})
}

func GetVentaComprobanteSaldo(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	if venta.ComprobanteSaldoURL == nil || *venta.ComprobanteSaldoURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Esta venta no tiene comprobante de saldo adjunto"})
		return
	}

	if _, err := os.Stat(*venta.ComprobanteSaldoURL); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Archivo de comprobante de saldo no encontrado"})
		return
	}

	c.File(*venta.ComprobanteSaldoURL)
}

func DeleteVentaComprobante(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	if venta.ComprobanteURL == nil || *venta.ComprobanteURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Esta venta no tiene comprobante adjunto"})
		return
	}

	if err := os.Remove(*venta.ComprobanteURL); err != nil && !os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar archivo"})
		return
	}

	venta.ComprobanteURL = nil
	if err := config.DB.Save(&venta).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar venta"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comprobante eliminado exitosamente"})
}

// UpdateVenta godoc
// @Summary Actualizar venta
// @Description Actualiza los datos de una venta existente (solo campos básicos, no detalles)
// @Tags Ventas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Param request body models.VentaUpdateRequest true "Datos a actualizar"
// @Success 200 {object} models.Venta
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/ventas/{id} [put]
func UpdateVenta(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	var req models.VentaUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	if req.UsuarioID != nil {
		var usuario models.Usuario
		if err := config.DB.First(&usuario, *req.UsuarioID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Usuario vendedor no encontrado"})
			return
		}
		if usuario.Rol != "empleado" && usuario.Rol != "dueño" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "El usuario seleccionado no es un vendedor"})
			return
		}
		venta.UsuarioID = *req.UsuarioID
	}

	if req.ClienteID != nil {
		var cliente models.Cliente
		if err := config.DB.First(&cliente, *req.ClienteID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cliente no encontrado"})
			return
		}
		venta.ClienteID = *req.ClienteID
	}

	if req.FormaPagoID != nil {
		var formaPago models.FormaPago
		if err := config.DB.First(&formaPago, *req.FormaPagoID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Forma de pago no encontrada"})
			return
		}
		venta.FormaPagoID = *req.FormaPagoID
	}

	if req.Transporte != nil {
		venta.Transporte = *req.Transporte
	}

	if req.PrecioVenta != nil {
		if *req.PrecioVenta < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "precio_venta no puede ser negativo"})
			return
		}
		venta.PrecioVenta = *req.PrecioVenta
	}

	if req.Sena != nil {
		if *req.Sena < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "sena no puede ser negativa"})
			return
		}
		venta.Sena = req.Sena
	}

	if req.UsaDescuentoFinanciera != nil {
		venta.UsaFinanciera = *req.UsaDescuentoFinanciera
	}
	if req.UsaFinanciera != nil {
		venta.UsaFinanciera = *req.UsaFinanciera
	}

	if req.Observaciones != nil {
		venta.Observaciones = req.Observaciones
	}

	var formaPago models.FormaPago
	if err := config.DB.First(&formaPago, venta.FormaPagoID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Forma de pago no encontrada"})
		return
	}

	senaValue := float64(0)
	if venta.Sena != nil {
		senaValue = *venta.Sena
	}
	if senaValue > venta.PrecioVenta {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La seña no puede superar el precio de venta"})
		return
	}

	saldo := float64(0)
	if senaValue > 0 {
		saldo = venta.PrecioVenta - senaValue
	}

	if venta.UsaFinanciera && isFormaPagoFinanciera(formaPago) {
		venta.Descuento = venta.PrecioVenta * financieraRate
		venta.UsaFinanciera = true
	} else {
		venta.Descuento = 0
		venta.UsaFinanciera = false
	}
	venta.Total = venta.PrecioVenta
	venta.TotalFinal = venta.PrecioVenta
	venta.Saldo = saldo
	venta.Ganancia = venta.PrecioVenta - venta.Costo - venta.Descuento

	if err := config.DB.Save(&venta).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar venta"})
		return
	}

	config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos", func(db *gorm.DB) *gorm.DB {
			return db.Order("pagos_venta.fecha ASC")
		}).
		Preload("Pagos.FormaPago").
		First(&venta, venta.ID)

	c.JSON(http.StatusOK, venta)
}

// DeleteVenta godoc
// @Summary Eliminar venta
// @Description Elimina una venta y restaura el stock de los productos
// @Tags Ventas
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Success 200 {object} map[string]string "Venta eliminada"
// UpdateVentaPago godoc
// @Summary Actualizar pago de venta (seña y comprobante)
// @Description Permite actualizar la seña y agregar/actualizar comprobante cuando el cliente hace un pago
// @Tags Ventas
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Param sena formData number true "Nueva seña (acumulativa o total)"
// @Param forma_pago_saldo_id formData int false "ID de la forma de pago del saldo"
// @Param comprobante formData file false "Comprobante de pago"
// @Success 200 {object} models.Venta
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/ventas/{id}/pago [put]
func UpdateVentaPago(c *gin.Context) {
	ventaID := c.Param("id")

	var venta models.Venta
	if err := config.DB.First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	senaStr := c.PostForm("sena")
	if senaStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El campo 'sena' es requerido"})
		return
	}

	nuevaSena, err := strconv.ParseFloat(senaStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Seña inválida"})
		return
	}

	if nuevaSena > venta.PrecioVenta {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":        "La seña no puede superar el precio de venta",
			"precio_venta": venta.PrecioVenta,
			"sena_enviada": nuevaSena,
		})
		return
	}

	// Actualizar seña
	senaActual := float64(0)
	if venta.Sena != nil {
		senaActual = *venta.Sena
	}

	formaPagoSaldoStr := c.PostForm("forma_pago_saldo_id")
	if formaPagoSaldoStr != "" {
		formaPagoSaldoID, err := strconv.Atoi(formaPagoSaldoStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "forma_pago_saldo_id invalido"})
			return
		}

		var formaPagoSaldo models.FormaPago
		if err := config.DB.First(&formaPagoSaldo, formaPagoSaldoID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Forma de pago del saldo no encontrada"})
			return
		}
		venta.FormaPagoSaldoID = &formaPagoSaldoID
	}

	venta.Sena = &nuevaSena

	// El saldo depende solo de precio_venta - seña.
	saldo := venta.PrecioVenta - nuevaSena

	// La financiera impacta solo en la ganancia.
	if venta.UsaFinanciera {
		venta.Descuento = venta.PrecioVenta * financieraRate
	} else {
		venta.Descuento = 0
	}

	venta.TotalFinal = venta.PrecioVenta
	venta.Saldo = saldo
	ganancia := venta.PrecioVenta - venta.Costo - venta.Descuento
	pagoDeHoy := nuevaSena - senaActual
	if venta.FormaPagoSaldoID != nil && pagoDeHoy > 0 {
		var formaPagoSaldo models.FormaPago
		if err := config.DB.First(&formaPagoSaldo, *venta.FormaPagoSaldoID).Error; err == nil && isFormaPagoFinanciera(formaPagoSaldo) {
			descuentoFinanciera := pagoDeHoy * financieraRate
			ganancia -= descuentoFinanciera
		}
	}
	venta.Ganancia = ganancia

	var nuevoComprobantePath *string
	file, err := c.FormFile("comprobante")
	if err == nil && file != nil {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		allowedExts := map[string]bool{".pdf": true, ".jpg": true, ".jpeg": true, ".png": true}
		if !allowedExts[ext] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se permiten archivos PDF, JPG, JPEG y PNG"})
			return
		}

		if file.Size > 5*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo no puede superar los 5MB"})
			return
		}

		uploadDir := "uploads/comprobantes"
		filename := fmt.Sprintf("comprobante_pago_%d%s", time.Now().UnixNano(), ext)
		filePath := filepath.Join(uploadDir, filename)

		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error abriendo comprobante"})
			return
		}
		defer src.Close()

		dst, err := os.Create(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando archivo"})
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, src); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar comprobante"})
			return
		}

		nuevoComprobantePath = &filePath
		// Espejo en el campo legacy: queda apuntando al último comprobante
		// para no romper endpoints existentes que aún leen comprobante_saldo_url.
		// NO se borra el archivo anterior: cada pago conserva su comprobante en pagos_venta.
		venta.ComprobanteSaldoURL = &filePath
	}

	if err := config.DB.Save(&venta).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar venta"})
		return
	}

	if err := config.DB.Model(&venta).Update("fecha_pago_saldo", time.Now()).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar fecha de pago"})
		return
	}

	if pagoDeHoy > 0 || nuevoComprobantePath != nil {
		pago := models.PagoVenta{
			VentaID:        venta.ID,
			Monto:          pagoDeHoy,
			ComprobanteURL: nuevoComprobantePath,
			FormaPagoID:    venta.FormaPagoSaldoID,
			Fecha:          time.Now(),
		}
		if err := config.DB.Create(&pago).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar el pago"})
			return
		}
	}

	config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("FormaPagoSaldo").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Preload("Pagos").
		Preload("Pagos.FormaPago").
		First(&venta, venta.ID)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Pago actualizado exitosamente",
		"venta":        venta,
		"saldo_actual": venta.Saldo,
	})
}
