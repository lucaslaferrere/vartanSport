package controllers

import (
	"net/http"
	"strconv"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetProductos godoc
// @Summary Listar productos
// @Description Obtiene todos los productos activos
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Producto
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/productos [get]
func GetProductos(c *gin.Context) {
	var productos []models.Producto

	if err := config.DB.Where("activo = ?", true).Find(&productos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener productos"})
		return
	}

	c.JSON(http.StatusOK, productos)
}

// GetProducto godoc
// @Summary Obtener producto por ID
// @Description Obtiene un producto específico por su ID
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Success 200 {object} models.Producto
// @Failure 404 {object} map[string]string "Producto no encontrado"
// @Router /api/productos/{id} [get]
func GetProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	c.JSON(http.StatusOK, producto)
}

// CreateProducto godoc
// @Summary Crear producto
// @Description Crea un nuevo producto (solo dueño)
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.ProductoCreateRequest true "Datos del producto"
// @Success 201 {object} models.Producto
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/productos [post]
func CreateProducto(c *gin.Context) {
	var req models.ProductoCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	producto := models.Producto{
		Nombre:        req.Nombre,
		CostoUnitario: req.CostoUnitario,
		Activo:        true,
	}

	if err := config.DB.Create(&producto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear producto"})
		return
	}

	c.JSON(http.StatusCreated, producto)
}

// UpdateProducto godoc
// @Summary Actualizar producto
// @Description Actualiza un producto existente (solo dueño)
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Param request body models.ProductoCreateRequest true "Datos actualizados"
// @Success 200 {object} models.Producto
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Producto no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/productos/{id} [put]
func UpdateProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	var req models.ProductoCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	producto.Nombre = req.Nombre
	producto.CostoUnitario = req.CostoUnitario

	if err := config.DB.Save(&producto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar producto"})
		return
	}

	c.JSON(http.StatusOK, producto)
}

// DeleteProducto godoc
// @Summary Eliminar producto
// @Description Desactiva un producto (solo dueño)
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Success 200 {object} map[string]string "Producto eliminado exitosamente"
// @Failure 404 {object} map[string]string "Producto no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/productos/{id} [delete]
func DeleteProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	producto.Activo = false

	if err := config.DB.Save(&producto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar producto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Producto eliminado exitosamente"})
}

// GetStock godoc
// @Summary Listar stock
// @Description Obtiene el stock de todos los productos con talles
// @Tags Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.ProductoStock
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/stock [get]
func GetStock(c *gin.Context) {
	var stock []models.ProductoStock

	if err := config.DB.Preload("Producto").Find(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener stock"})
		return
	}

	c.JSON(http.StatusOK, stock)
}

// GetStockByProducto godoc
// @Summary Obtener stock por producto
// @Description Obtiene el stock de un producto específico
// @Tags Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Success 200 {array} models.ProductoStock
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/stock/producto/{id} [get]
func GetStockByProducto(c *gin.Context) {
	productoID := c.Param("id")

	var stock []models.ProductoStock
	if err := config.DB.Where("producto_id = ?", productoID).Find(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener stock"})
		return
	}

	c.JSON(http.StatusOK, stock)
}

// AddStock godoc
// @Summary Agregar stock
// @Description Agrega stock a un producto (solo dueño)
// @Tags Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.StockCreateRequest true "Datos del stock"
// @Success 201 {object} models.ProductoStock
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/stock [post]
func AddStock(c *gin.Context) {
	var req models.StockCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Verificar que el producto exista
	var producto models.Producto
	if err := config.DB.First(&producto, req.ProductoID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	// Buscar si ya existe stock para ese producto y talle
	var stock models.ProductoStock
	result := config.DB.Where("producto_id = ? AND talle = ?", req.ProductoID, req.Talle).First(&stock)

	if result.Error != nil {
		// No existe, crear nuevo
		stock = models.ProductoStock{
			ProductoID: req.ProductoID,
			Talle:      req.Talle,
			Cantidad:   req.Cantidad,
		}
		if err := config.DB.Create(&stock).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear stock"})
			return
		}
	} else {
		// Ya existe, sumar cantidad
		stock.Cantidad += req.Cantidad
		if err := config.DB.Save(&stock).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar stock"})
			return
		}
	}

	c.JSON(http.StatusOK, stock)
}

// UpdateStock godoc
// @Summary Actualizar stock
// @Description Actualiza la cantidad de stock (solo dueño)
// @Tags Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del stock"
// @Param request body object true "Cantidad de stock" example({"cantidad": 10})
// @Success 200 {object} models.ProductoStock
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Stock no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/stock/{id} [put]
func UpdateStock(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var stock models.ProductoStock
	if err := config.DB.First(&stock, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stock no encontrado"})
		return
	}

	var req struct {
		Cantidad int `json:"cantidad" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	stock.Cantidad = req.Cantidad

	if err := config.DB.Save(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar stock"})
		return
	}

	c.JSON(http.StatusOK, stock)
}
