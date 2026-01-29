package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetClientes - Obtener todos los clientes
func GetClientes(c *gin.Context) {
	var clientes []models.Cliente

	if err := config.DB.Order("nombre ASC").Find(&clientes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener clientes"})
		return
	}

	c.JSON(http.StatusOK, clientes)
}

// GetCliente - Obtener un cliente por ID
func GetCliente(c *gin.Context) {
	id := c.Param("id")

	var cliente models.Cliente
	if err := config.DB.First(&cliente, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cliente no encontrado"})
		return
	}

	c.JSON(http.StatusOK, cliente)
}

// CreateCliente - Crear un cliente nuevo
func CreateCliente(c *gin.Context) {
	var req models.ClienteCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	cliente := models.Cliente{
		Nombre:   req.Nombre,
		Telefono: req.Telefono,
		Email:    req.Email,
	}

	if err := config.DB.Create(&cliente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear cliente"})
		return
	}

	c.JSON(http.StatusCreated, cliente)
}

// UpdateCliente - Actualizar un cliente
func UpdateCliente(c *gin.Context) {
	id := c.Param("id")

	var cliente models.Cliente
	if err := config.DB.First(&cliente, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cliente no encontrado"})
		return
	}

	var req models.ClienteCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	cliente.Nombre = req.Nombre
	cliente.Telefono = req.Telefono
	cliente.Email = req.Email

	if err := config.DB.Save(&cliente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar cliente"})
		return
	}

	c.JSON(http.StatusOK, cliente)
}

// DeleteCliente - Eliminar un cliente
func DeleteCliente(c *gin.Context) {
	id := c.Param("id")

	if err := config.DB.Delete(&models.Cliente{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar cliente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cliente eliminado exitosamente"})
}
