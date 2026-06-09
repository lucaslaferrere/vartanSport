package controllers

import (
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

// ── Helpers ───────────────────────────────────────────────────────────────────

func buildCatalogoProductoResponse(p models.Producto, variantes []models.ProductoStock) models.CatalogoProductoResponse {
	vars := make([]models.CatalogoVarianteStock, 0, len(variantes))
	for _, v := range variantes {
		if v.Cantidad > 0 {
			vars = append(vars, models.CatalogoVarianteStock{
				Talle:    string(v.Talle),
				Color:    string(v.Color),
				Cantidad: v.Cantidad,
			})
		}
	}
	return models.CatalogoProductoResponse{
		ID:              p.ID,
		Nombre:          p.Nombre,
		Descripcion:     p.Descripcion,
		Imagenes:        p.Imagenes,
		PrecioMayorista: p.PrecioMayorista,
		TipoProducto:    p.TipoProducto,
		Equipo:          p.Equipo,
		Variantes:       vars,
	}
}

// ── Endpoints públicos ────────────────────────────────────────────────────────

// GetCatalogoProductos godoc
// @Summary Listar productos del catálogo
// @Description Productos con visible_catalogo=true, con stock por variante
// @Tags Catálogo
// @Produce json
// @Success 200 {array} models.CatalogoProductoResponse
// @Router /api/catalogo/productos [get]
func GetCatalogoProductos(c *gin.Context) {
	var productos []models.Producto
	goresult := config.DB.Debug().
		Where("visible_catalogo = ? AND activo = ?", true, true).
		Preload("TipoProducto").
		Preload("Equipo").
		Find(&productos)
	if goresult.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener productos"})
		return
	}

	log.Printf("Query resultado: %d productos, error: %v", len(productos), goresult.Error)
	for _, p := range productos {
		log.Printf("  - ID:%d Nombre:%s Activo:%v VisibleCatalogo:%v", p.ID, p.Nombre, p.Activo, p.VisibleCatalogo)
	}

	productoIDs := make([]int, 0, len(productos))
	for _, p := range productos {
		productoIDs = append(productoIDs, p.ID)
	}

	var stocks []models.ProductoStock
	if len(productoIDs) > 0 {
		if err := config.DB.Where("producto_id IN ?", productoIDs).Find(&stocks).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener stock"})
			return
		}
	}

	stockMap := make(map[int][]models.ProductoStock)
	for _, s := range stocks {
		stockMap[s.ProductoID] = append(stockMap[s.ProductoID], s)
	}

	result := make([]models.CatalogoProductoResponse, 0, len(productos))
	for _, p := range productos {
		result = append(result, buildCatalogoProductoResponse(p, stockMap[p.ID]))
	}

	c.JSON(http.StatusOK, result)
}

// GetCatalogoProducto godoc
// @Summary Detalle de producto del catálogo
// @Description Producto con todas las variantes y stock
// @Tags Catálogo
// @Produce json
// @Param id path int true "ID del producto"
// @Success 200 {object} models.CatalogoProductoResponse
// @Failure 404 {object} map[string]string
// @Router /api/catalogo/productos/{id} [get]
func GetCatalogoProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.
		Where("id = ? AND visible_catalogo = ? AND activo = ?", id, true, true).
		Preload("TipoProducto").
		Preload("Equipo").
		First(&producto).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	var stocks []models.ProductoStock
	config.DB.Where("producto_id = ?", producto.ID).Find(&stocks)

	c.JSON(http.StatusOK, buildCatalogoProductoResponse(producto, stocks))
}

// CreateCatalogoOrden godoc
// @Summary Crear orden del catálogo
// @Description Crea una orden nueva sin validar stock (se valida al confirmar)
// @Tags Catálogo
// @Accept json
// @Produce json
// @Param request body models.CatalogoOrdenCreateRequest true "Datos de la orden"
// @Success 201 {object} models.CatalogoOrden
// @Failure 400 {object} map[string]string
// @Router /api/catalogo/ordenes [post]
func CreateCatalogoOrden(c *gin.Context) {
	var req models.CatalogoOrdenCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orden := models.CatalogoOrden{
		ClienteNombre:   req.ClienteNombre,
		ClienteWhatsapp: req.ClienteWhatsapp,
		Estado:          models.EstadoPendiente,
		Observaciones:   req.Observaciones,
	}

	if err := config.DB.Create(&orden).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear la orden"})
		return
	}

	items := make([]models.CatalogoOrdenItem, 0, len(req.Items))
	for _, it := range req.Items {
		items = append(items, models.CatalogoOrdenItem{
			OrdenID:        orden.ID,
			ProductoID:     it.ProductoID,
			Talle:          it.Talle,
			Color:          it.Color,
			Cantidad:       it.Cantidad,
			PrecioUnitario: it.PrecioUnitario,
		})
	}

	if err := config.DB.Create(&items).Error; err != nil {
		config.DB.Delete(&orden)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear los items de la orden"})
		return
	}

	orden.Items = items
	c.JSON(http.StatusCreated, orden)
}

// ── Endpoints admin ───────────────────────────────────────────────────────────

// AdminGetCatalogoProductos godoc
// @Summary [Admin] Listar todos los productos del catálogo
// @Tags Catálogo Admin
// @Security BearerAuth
// @Produce json
// @Success 200 {array} models.Producto
// @Router /api/admin/catalogo/productos [get]
func AdminGetCatalogoProductos(c *gin.Context) {
	var productos []models.Producto
	if err := config.DB.
		Preload("TipoProducto").
		Preload("Equipo").
		Find(&productos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener productos"})
		return
	}
	c.JSON(http.StatusOK, productos)
}

// AdminCreateCatalogoProducto godoc
// @Summary [Admin] Crear producto para el catálogo
// @Tags Catálogo Admin
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 201 {object} models.Producto
// @Router /api/admin/catalogo/productos [post]
func AdminCreateCatalogoProducto(c *gin.Context) {
	var req struct {
		Nombre          string  `json:"nombre" binding:"required"`
		Descripcion     string  `json:"descripcion"`
		PrecioMayorista float64 `json:"precio_mayorista"`
		CostoUnitario   float64 `json:"costo_unitario"`
		VisibleCatalogo bool    `json:"visible_catalogo"`
		TipoProductoID  *int    `json:"tipo_producto_id"`
		EquipoID        *int    `json:"equipo_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	producto := models.Producto{
		Nombre:          req.Nombre,
		Descripcion:     req.Descripcion,
		PrecioMayorista: req.PrecioMayorista,
		CostoUnitario:   req.CostoUnitario,
		VisibleCatalogo: req.VisibleCatalogo,
		TipoProductoID:  req.TipoProductoID,
		EquipoID:        req.EquipoID,
		Imagenes:        models.ImagenArray{},
	}

	if err := config.DB.Create(&producto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear producto"})
		return
	}

	c.JSON(http.StatusCreated, producto)
}

// AdminUpdateCatalogoProducto godoc
// @Summary [Admin] Actualizar producto del catálogo
// @Tags Catálogo Admin
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID del producto"
// @Success 200 {object} models.Producto
// @Router /api/admin/catalogo/productos/{id} [put]
func AdminUpdateCatalogoProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	var req struct {
		Nombre          *string  `json:"nombre"`
		Descripcion     *string  `json:"descripcion"`
		PrecioMayorista *float64 `json:"precio_mayorista"`
		CostoUnitario   *float64 `json:"costo_unitario"`
		VisibleCatalogo *bool    `json:"visible_catalogo"`
		TipoProductoID  *int     `json:"tipo_producto_id"`
		EquipoID        *int     `json:"equipo_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Nombre != nil {
		updates["nombre"] = *req.Nombre
	}
	if req.Descripcion != nil {
		updates["descripcion"] = *req.Descripcion
	}
	if req.PrecioMayorista != nil {
		updates["precio_mayorista"] = *req.PrecioMayorista
	}
	if req.CostoUnitario != nil {
		updates["costo_unitario"] = *req.CostoUnitario
	}
	if req.VisibleCatalogo != nil {
		updates["visible_catalogo"] = *req.VisibleCatalogo
	}
	if req.TipoProductoID != nil {
		updates["tipo_producto_id"] = *req.TipoProductoID
	}
	if req.EquipoID != nil {
		updates["equipo_id"] = *req.EquipoID
	}

	if err := config.DB.Model(&producto).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar producto"})
		return
	}

	config.DB.Preload("TipoProducto").Preload("Equipo").First(&producto, id)
	c.JSON(http.StatusOK, producto)
}

// AdminDeleteCatalogoProducto godoc
// @Summary [Admin] Eliminar producto del catálogo
// @Tags Catálogo Admin
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Success 200 {object} map[string]string
// @Router /api/admin/catalogo/productos/{id} [delete]
func AdminDeleteCatalogoProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	if err := config.DB.Model(&producto).Update("activo", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar producto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Producto eliminado"})
}

// AdminUploadCatalogoImagen godoc
// @Summary [Admin] Subir imagen de producto
// @Tags Catálogo Admin
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param id path int true "ID del producto"
// @Param imagen formData file true "Imagen del producto"
// @Success 200 {object} map[string]string
// @Router /api/admin/catalogo/productos/{id}/imagen [post]
func AdminUploadCatalogoImagen(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	file, err := c.FormFile("imagen")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se recibió ninguna imagen"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se permiten archivos JPG, JPEG, PNG y WEBP"})
		return
	}
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La imagen no puede superar los 5MB"})
		return
	}

	uploadDir := "uploads/products"
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error preparando directorio de imágenes"})
		return
	}

	filename := fmt.Sprintf("product_%d_%d%s", producto.ID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, filename)

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error abriendo imagen"})
		return
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error guardando imagen"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error guardando imagen"})
		return
	}

	url := "/uploads/products/" + filename
	imagenes := append(producto.Imagenes, url)

	if err := config.DB.Model(&producto).Update("imagenes", imagenes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando imágenes del producto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url, "imagenes": imagenes})
}

// ── Órdenes admin ─────────────────────────────────────────────────────────────

// AdminGetCatalogoOrdenes godoc
// @Summary [Admin] Listar órdenes del catálogo
// @Tags Catálogo Admin
// @Security BearerAuth
// @Produce json
// @Success 200 {array} models.CatalogoOrden
// @Router /api/admin/catalogo/ordenes [get]
func AdminGetCatalogoOrdenes(c *gin.Context) {
	var ordenes []models.CatalogoOrden
	if err := config.DB.
		Preload("Items.Producto").
		Preload("FormaPago").
		Order("created_at DESC").
		Find(&ordenes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener órdenes"})
		return
	}
	c.JSON(http.StatusOK, ordenes)
}

// AdminGetCatalogoOrden godoc
// @Summary [Admin] Detalle de orden del catálogo
// @Tags Catálogo Admin
// @Security BearerAuth
// @Param id path int true "ID de la orden"
// @Success 200 {object} models.CatalogoOrden
// @Failure 404 {object} map[string]string
// @Router /api/admin/catalogo/ordenes/{id} [get]
func AdminGetCatalogoOrden(c *gin.Context) {
	id := c.Param("id")

	var orden models.CatalogoOrden
	if err := config.DB.
		Preload("Items.Producto").
		Preload("FormaPago").
		Preload("Venta").
		First(&orden, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Orden no encontrada"})
		return
	}
	c.JSON(http.StatusOK, orden)
}

// AdminUpdateCatalogoOrden godoc
// @Summary [Admin] Editar precio, seña y forma de pago de una orden
// @Tags Catálogo Admin
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID de la orden"
// @Success 200 {object} models.CatalogoOrden
// @Router /api/admin/catalogo/ordenes/{id} [put]
func AdminUpdateCatalogoOrden(c *gin.Context) {
	id := c.Param("id")

	var orden models.CatalogoOrden
	if err := config.DB.First(&orden, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Orden no encontrada"})
		return
	}

	if orden.Estado == models.EstadoConfirmada {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se puede editar una orden ya confirmada"})
		return
	}

	var req models.CatalogoOrdenUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.PrecioFinalVenta != nil {
		updates["precio_final_venta"] = *req.PrecioFinalVenta
	}
	if req.Sena != nil {
		updates["sena"] = *req.Sena
	}
	if req.FormaPagoID != nil {
		updates["forma_pago_id"] = *req.FormaPagoID
	}
	if req.Observaciones != nil {
		updates["observaciones"] = *req.Observaciones
	}

	if err := config.DB.Model(&orden).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar la orden"})
		return
	}

	config.DB.Preload("Items.Producto").Preload("FormaPago").First(&orden, id)
	c.JSON(http.StatusOK, orden)
}

// AdminConfirmarCatalogoOrden godoc
// @Summary [Admin] Confirmar orden: crea venta, descuenta stock
// @Tags Catálogo Admin
// @Security BearerAuth
// @Param id path int true "ID de la orden"
// @Success 200 {object} models.CatalogoOrden
// @Failure 400 {object} map[string]interface{}
// @Router /api/admin/catalogo/ordenes/{id}/confirmar [post]
func AdminConfirmarCatalogoOrden(c *gin.Context) {
	idParam := c.Param("id")
	ordenID, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var orden models.CatalogoOrden
	if err := config.DB.Preload("Items.Producto").First(&orden, ordenID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Orden no encontrada"})
		return
	}

	if orden.Estado == models.EstadoConfirmada {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La orden ya fue confirmada"})
		return
	}
	if orden.FormaPagoID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La orden no tiene forma de pago asignada"})
		return
	}
	if orden.PrecioFinalVenta <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La orden no tiene precio final asignado"})
		return
	}

	var txErr error
	var ventaCreada models.Venta

	txErr = config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Validar stock antes de tocar nada
		for _, item := range orden.Items {
			var stock models.ProductoStock
			if err := tx.Where(
				"producto_id = ? AND talle = ? AND color = ?",
				item.ProductoID, item.Talle, item.Color,
			).First(&stock).Error; err != nil {
				return fmt.Errorf("STOCK_INSUFICIENTE|%s - %s - Talle %s: solicitado %d, disponible 0",
					item.Producto.Nombre, item.Color, item.Talle, item.Cantidad)
			}
			if stock.Cantidad < item.Cantidad {
				return fmt.Errorf("STOCK_INSUFICIENTE|%s - %s - Talle %s: solicitado %d, disponible %d",
					item.Producto.Nombre, item.Color, item.Talle, item.Cantidad, stock.Cantidad)
			}
		}

		// 2. Buscar o crear cliente por whatsapp
		var cliente models.Cliente
		result := tx.Where("telefono = ?", orden.ClienteWhatsapp).First(&cliente)
		if result.Error != nil {
			cliente = models.Cliente{
				Nombre:    orden.ClienteNombre,
				Telefono:  orden.ClienteWhatsapp,
				UsuarioID: 1,
			}
			if err := tx.Create(&cliente).Error; err != nil {
				return fmt.Errorf("error creando cliente: %w", err)
			}
		}

		// 3. Calcular totales
		var totalCosto float64
		for _, item := range orden.Items {
			totalCosto += item.Producto.CostoUnitario * float64(item.Cantidad)
		}
		saldo := orden.PrecioFinalVenta - orden.Sena
		ganancia := orden.PrecioFinalVenta - totalCosto

		// 4. Crear venta
		ventaCreada = models.Venta{
			UsuarioID:   1,
			ClienteID:   cliente.ID,
			FormaPagoID: *orden.FormaPagoID,
			PrecioVenta: orden.PrecioFinalVenta,
			SenaInicial: orden.Sena,
			Saldo:       saldo,
			TotalFinal:  orden.PrecioFinalVenta,
			Total:       orden.PrecioFinalVenta,
			Costo:       totalCosto,
			Ganancia:    ganancia,
			Observaciones: func() *string {
				s := fmt.Sprintf("Orden catálogo #%d - %s", orden.ID, orden.ClienteNombre)
				return &s
			}(),
		}
		if orden.Sena > 0 {
			ventaCreada.Sena = &orden.Sena
		}
		if err := tx.Create(&ventaCreada).Error; err != nil {
			return fmt.Errorf("error creando venta: %w", err)
		}

		// 5. Crear detalles de venta
		for _, item := range orden.Items {
			detalle := models.VentaDetalle{
				VentaID:        ventaCreada.ID,
				ProductoID:     item.ProductoID,
				Talle:          item.Talle,
				Cantidad:       item.Cantidad,
				PrecioUnitario: item.PrecioUnitario,
				Subtotal:       item.PrecioUnitario * float64(item.Cantidad),
			}
			if err := tx.Create(&detalle).Error; err != nil {
				return fmt.Errorf("error creando detalle de venta: %w", err)
			}
		}

		// 6. Descontar stock (condición cantidad >= solicitado protege contra race condition)
		for _, item := range orden.Items {
			result := tx.Model(&models.ProductoStock{}).
				Where("producto_id = ? AND talle = ? AND color = ? AND cantidad >= ?",
					item.ProductoID, item.Talle, item.Color, item.Cantidad).
				UpdateColumn("cantidad", gorm.Expr("cantidad - ?", item.Cantidad))
			if result.Error != nil {
				return fmt.Errorf("error descontando stock: %w", result.Error)
			}
			if result.RowsAffected == 0 {
				return fmt.Errorf("STOCK_INSUFICIENTE|%s - %s - Talle %s: stock insuficiente al momento de confirmar",
					item.Producto.Nombre, item.Color, item.Talle)
			}
		}

		// 7. Actualizar orden
		ventaID := ventaCreada.ID
		if err := tx.Model(&orden).Updates(map[string]interface{}{
			"estado":   models.EstadoConfirmada,
			"venta_id": ventaID,
		}).Error; err != nil {
			return fmt.Errorf("error actualizando orden: %w", err)
		}

		return nil
	})

	if txErr != nil {
		msg := txErr.Error()
		if strings.HasPrefix(msg, "STOCK_INSUFICIENTE|") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "stock insuficiente",
				"detalle": strings.TrimPrefix(msg, "STOCK_INSUFICIENTE|"),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": msg})
		return
	}

	config.DB.Preload("Items.Producto").Preload("FormaPago").Preload("Venta").First(&orden, ordenID)
	c.JSON(http.StatusOK, orden)
}
