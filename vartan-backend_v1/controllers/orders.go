package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetPedidos - Obtener todos los pedidos
func GetPedidos(c *gin.Context) {
	var pedidos []models.Pedido

	if err := config.DB.
		Preload("Venta").
		Preload("Venta.Cliente").
		Preload("Venta.Usuario").
		Order("fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// GetPedidosByEstado - Obtener pedidos filtrados por estado
func GetPedidosByEstado(c *gin.Context) {
	estado := c.Param("estado")

	// Validar que el estado sea válido
	if estado != "pendiente" && estado != "despachado" && estado != "cancelado" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado inválido"})
		return
	}

	var pedidos []models.Pedido
	if err := config.DB.
		Where("estado = ?", estado).
		Preload("Venta").
		Preload("Venta.Cliente").
		Preload("Venta.Usuario").
		Order("fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// GetMisPedidos - Obtener pedidos del usuario autenticado
func GetMisPedidos(c *gin.Context) {
	userID := c.GetInt("user_id")

	var pedidos []models.Pedido
	if err := config.DB.
		Joins("JOIN ventas ON ventas.id = pedidos.venta_id").
		Where("ventas.usuario_id = ?", userID).
		Preload("Venta").
		Preload("Venta.Cliente").
		Order("pedidos.fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// UpdatePedidoEstado - Actualizar el estado de un pedido
func UpdatePedidoEstado(c *gin.Context) {
	id := c.Param("id")

	var pedido models.Pedido
	if err := config.DB.First(&pedido, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}

	var req models.PedidoUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Validar estado
	if req.Estado != "pendiente" && req.Estado != "despachado" && req.Estado != "cancelado" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado inválido"})
		return
	}

	pedido.Estado = req.Estado

	if err := config.DB.Save(&pedido).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar pedido"})
		return
	}

	c.JSON(http.StatusOK, pedido)
}
