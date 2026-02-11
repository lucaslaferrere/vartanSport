package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

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
func CreateVenta(c *gin.Context) {
	contentType := c.ContentType()

	// Si es JSON, procesar como JSON
	if strings.Contains(contentType, "application/json") {
		var jsonReq models.VentaCreateRequest
		if err := c.ShouldBindJSON(&jsonReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
			return
		}
		// Procesar como JSON (sin comprobante)
		processVenta(c, jsonReq.UsuarioID, jsonReq.ClienteID, jsonReq.FormaPagoID, jsonReq.Sena, jsonReq.Observaciones, jsonReq.Detalles, nil)
		return
	}

	// Si es multipart/form-data, procesar con archivo
	if strings.Contains(contentType, "multipart/form-data") {
		var formReq models.VentaCreateFormRequest
		if err := c.ShouldBind(&formReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Datos de formulario inválidos: " + err.Error()})
			return
		}

		// Parsear detalles desde JSON string
		var detalles []models.VentaDetalleCreateRequest
		if err := json.Unmarshal([]byte(formReq.Detalles), &detalles); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de detalles inválido: " + err.Error()})
			return
		}

		// Manejar el archivo comprobante
		var comprobanteURL *string
		file, err := c.FormFile("comprobante")
		if err == nil && file != nil {
			// Validar extensión
			ext := strings.ToLower(filepath.Ext(file.Filename))
			allowedExts := map[string]bool{".pdf": true, ".jpg": true, ".jpeg": true, ".png": true}
			if !allowedExts[ext] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se permiten archivos PDF, JPG, JPEG y PNG"})
				return
			}

			// Validar tamaño (máximo 5MB)
			if file.Size > 5*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo no puede superar los 5MB"})
				return
			}

			// Usar directorio existente (ya creado por el volumen)
			uploadDir := "uploads/comprobantes"

			// Generar nombre único
			filename := fmt.Sprintf("comprobante_%d%s", time.Now().UnixNano(), ext)
			filePath := filepath.Join(uploadDir, filename)

			// Guardar archivo
			if err := c.SaveUploadedFile(file, filePath); err != nil {
				fmt.Println("❌ ERROR GUARDANDO ARCHIVO:", err)
				fmt.Println("❌ FilePath:", filePath)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar comprobante: " + err.Error()})
				return
			}

			comprobanteURL = &filePath
		}

		// Convertir los valores de string a los tipos correctos
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

		var sena float64
		if formReq.Sena != "" {
			var errSena error
			sena, errSena = strconv.ParseFloat(formReq.Sena, 64)
			if errSena != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "sena inválida"})
				return
			}
		}

		processVenta(c, usuarioID, clienteID, formaPagoID, sena, formReq.Observaciones, detalles, comprobanteURL)
		return
	}

	// Content-Type no soportado
	c.JSON(http.StatusBadRequest, gin.H{"error": "Content-Type no soportado. Use application/json o multipart/form-data"})
}

// processVenta procesa la creación de la venta
func processVenta(c *gin.Context, usuarioID *int, clienteID int, formaPagoID int, sena float64, observaciones string, detalles []models.VentaDetalleCreateRequest, comprobanteURL *string) {
	// Determinar el vendedor que realiza la venta
	var vendedorID int
	if usuarioID != nil && *usuarioID > 0 {
		// Verificar que el usuario existe y es un vendedor
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
		// Si no se especifica, usar el usuario autenticado
		vendedorID = c.GetInt("user_id")
	}

	// Calcular el total de la venta (suma de productos)
	var total float64
	for _, detalle := range detalles {
		total += detalle.PrecioUnitario * float64(detalle.Cantidad)
	}

	// Calcular el saldo (lo que resta pagar)
	saldo := total - sena

	// Calcular descuento según forma de pago
	var descuento float64
	var formaPago models.FormaPago
	var usaFinanciera bool

	if err := config.DB.First(&formaPago, formaPagoID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Forma de pago no encontrada"})
		return
	}

	// Si es "Transferencia Financiera" (ID 1), aplicar 3% de descuento sobre el SALDO
	if formaPago.Nombre == "Transferencia Financiera" {
		descuento = saldo * 0.03
		usaFinanciera = true
	}

	// Total final = Total - Descuento
	totalFinal := total - descuento

	// Manejar observaciones
	var obs *string
	if observaciones != "" {
		obs = &observaciones
	}

	// Iniciar transacción
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Crear la venta
	venta := models.Venta{
		UsuarioID:      vendedorID,
		ClienteID:      clienteID,
		FormaPagoID:    formaPagoID,
		Total:          total,
		Sena:           sena,
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
		subtotal := detalleReq.PrecioUnitario * float64(detalleReq.Cantidad)

		detalle := models.VentaDetalle{
			VentaID:        venta.ID,
			ProductoID:     detalleReq.ProductoID,
			Talle:          detalleReq.Talle,
			Cantidad:       detalleReq.Cantidad,
			PrecioUnitario: detalleReq.PrecioUnitario,
			Subtotal:       subtotal,
		}

		if err := tx.Create(&detalle).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear detalle de venta"})
			return
		}

		// Descontar del stock
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

	// Crear el pedido automáticamente
	pedido := models.Pedido{
		VentaID: venta.ID,
		Estado:  "pendiente",
	}

	if err := tx.Create(&pedido).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear pedido"})
		return
	}

	// Commit de la transacción
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar venta"})
		return
	}

	// Cargar la venta con todas sus relaciones
	config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("Detalles").
		Preload("Detalles.Producto").
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
		Preload("Detalles").
		Preload("Detalles.Producto").
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
	var ventas []models.Venta
	if err := config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("Detalles").
		Preload("Detalles.Producto").
		Order("fecha_venta DESC").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas"})
		return
	}

	c.JSON(http.StatusOK, ventas)
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
		Preload("Detalles").
		Preload("Detalles.Producto").
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

	// Verificar que el archivo existe
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

	// Eliminar archivo
	if err := os.Remove(*venta.ComprobanteURL); err != nil && !os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar archivo"})
		return
	}

	// Actualizar venta
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

	// Actualizar campos si fueron enviados
	if req.UsuarioID != nil {
		// Verificar que el usuario existe y es un vendedor
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
		// Verificar que el cliente existe
		var cliente models.Cliente
		if err := config.DB.First(&cliente, *req.ClienteID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cliente no encontrado"})
			return
		}
		venta.ClienteID = *req.ClienteID
	}

	if req.FormaPagoID != nil {
		// Verificar que la forma de pago existe
		var formaPago models.FormaPago
		if err := config.DB.First(&formaPago, *req.FormaPagoID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Forma de pago no encontrada"})
			return
		}
		venta.FormaPagoID = *req.FormaPagoID

		// Recalcular descuento si cambió la forma de pago
		if formaPago.Nombre == "Transferencia Financiera" {
			venta.UsaFinanciera = true
			venta.Descuento = venta.Saldo * 0.03
		} else {
			venta.UsaFinanciera = false
			venta.Descuento = 0
		}
		venta.TotalFinal = venta.Total - venta.Descuento
	}

	if req.Sena != nil {
		venta.Sena = *req.Sena
		venta.Saldo = venta.Total - venta.Sena

		// Recalcular descuento con el nuevo saldo
		if venta.UsaFinanciera {
			venta.Descuento = venta.Saldo * 0.03
		}
		venta.TotalFinal = venta.Total - venta.Descuento
	}

	if req.Observaciones != nil {
		venta.Observaciones = req.Observaciones
	}

	// Guardar cambios
	if err := config.DB.Save(&venta).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar venta"})
		return
	}

	// Cargar la venta con todas sus relaciones
	config.DB.
		Preload("Usuario").
		Preload("Cliente").
		Preload("FormaPago").
		Preload("Detalles").
		Preload("Detalles.Producto").
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

	// Iniciar transacción
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Restaurar stock de cada detalle
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

	// Eliminar comprobante si existe
	if venta.ComprobanteURL != nil && *venta.ComprobanteURL != "" {
		os.Remove(*venta.ComprobanteURL)
	}

	// Eliminar pedido asociado
	if err := tx.Where("venta_id = ?", venta.ID).Delete(&models.Pedido{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar pedido"})
		return
	}

	// Eliminar comisiones asociadas
	if err := tx.Where("venta_id = ?", venta.ID).Delete(&models.Comision{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar comisiones"})
		return
	}

	// Eliminar detalles de la venta
	if err := tx.Where("venta_id = ?", venta.ID).Delete(&models.VentaDetalle{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar detalles de venta"})
		return
	}

	// Eliminar la venta
	if err := tx.Delete(&venta).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar venta"})
		return
	}

	// Commit de la transacción
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
		Preload("Detalles").
		Preload("Detalles.Producto").
		First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	c.JSON(http.StatusOK, venta)
}

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

	c.JSON(http.StatusOK, formasPago)
}
