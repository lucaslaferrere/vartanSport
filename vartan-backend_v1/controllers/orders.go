package controllers

import (
	"fmt"
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetPedidos godoc
// @Summary Listar todos los pedidos
// @Description Obtiene todos los pedidos (solo dueño)
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Pedido
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/pedidos [get]
func GetPedidos(c *gin.Context) {
	userID := c.GetInt("user_id")

	var pedidos []models.Pedido

	if err := config.DB.
		Joins("JOIN venta ON venta.id = pedidos.venta_id").
		Where("venta.usuario_id = ?", userID).
		Preload("Venta").
		Preload("Venta.Cliente").
		Preload("Venta.Detalles").
		Preload("Venta.Detalles.Producto").
		Order("pedidos.fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// GetPedidosByEstado godoc
// @Summary Obtener pedidos por estado
// @Description Obtiene pedidos filtrados por estado (solo dueño)
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param estado path string true "Estado del pedido" Enums(pendiente, despachado, cancelado)
// @Success 200 {array} models.Pedido
// @Failure 400 {object} map[string]string "Estado inválido"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/pedidos/estado/{estado} [get]
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
		Preload("Venta.Detalles").          // ✅ AGREGAR ESTO
		Preload("Venta.Detalles.Producto"). // ✅ AGREGAR ESTO (opcional pero útil)
		Order("fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// GetMisPedidos godoc
// @Summary Obtener mis pedidos
// @Description Obtiene los pedidos del usuario autenticado
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Pedido
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/mis-pedidos [get]
func GetMisPedidos(c *gin.Context) {
	userID := c.GetInt("user_id")

	var pedidos []models.Pedido
	if err := config.DB.
		Joins("JOIN venta ON venta.id = pedidos.venta_id").
		Where("venta.usuario_id = ?", userID).
		Preload("Venta").
		Preload("Venta.Cliente").
		Preload("Venta.Detalles").
		Preload("Venta.Detalles.Producto").
		Order("pedidos.fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {

		fmt.Println("Error en GetMisPedidos:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// UpdatePedidoEstado godoc
// @Summary Actualizar estado de pedido
// @Description Actualiza el estado de un pedido
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del pedido"
// @Param request body models.PedidoUpdateRequest true "Nuevo estado"
// @Success 200 {object} models.Pedido
// @Failure 400 {object} map[string]string "Estado inválido"
// @Failure 404 {object} map[string]string "Pedido no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/pedidos/{id} [put]
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
