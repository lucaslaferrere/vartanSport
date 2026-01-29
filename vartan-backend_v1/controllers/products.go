package controllers

import (
	"net/http"
	"strconv"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetProductos - Obtener todos los productos
func GetProductos(c *gin.Context) {
	var productos []models.Producto

	if err := config.DB.Where("activo = ?", true).Find(&productos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener productos"})
		return
	}

	c.JSON(http.StatusOK, productos)
}

// GetProducto - Obtener un producto por ID
func GetProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	c.JSON(http.StatusOK, producto)
}

// CreateProducto - Crear un producto nuevo (solo dueño)
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

// UpdateProducto - Actualizar un producto (solo dueño)
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

// DeleteProducto - Eliminar (desactivar) un producto (solo dueño)
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

// GetStock - Obtener stock de todos los productos con talles
func GetStock(c *gin.Context) {
	var stock []models.ProductoStock

	if err := config.DB.Preload("Producto").Find(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener stock"})
		return
	}

	c.JSON(http.StatusOK, stock)
}

// GetStockByProducto - Obtener stock de un producto específico
func GetStockByProducto(c *gin.Context) {
	productoID := c.Param("id")

	var stock []models.ProductoStock
	if err := config.DB.Where("producto_id = ?", productoID).Find(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener stock"})
		return
	}

	c.JSON(http.StatusOK, stock)
}

// AddStock - Agregar stock de un producto (solo dueño)
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

// UpdateStock - Actualizar cantidad de stock (solo dueño)
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
