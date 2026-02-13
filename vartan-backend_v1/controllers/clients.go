package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetClientes godoc
// @Summary Listar clientes
// @Description Obtiene todos los clientes ordenados por nombre
// @Tags Clientes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Cliente
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/clientes [get]
func GetClientes(c *gin.Context) {
	var clientes []models.Cliente

	if err := config.DB.Order("nombre ASC").Find(&clientes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener clientes"})
		return
	}

	c.JSON(http.StatusOK, clientes)
}

// GetCliente godoc
// @Summary Obtener cliente por ID
// @Description Obtiene un cliente específico por su ID
// @Tags Clientes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del cliente"
// @Success 200 {object} models.Cliente
// @Failure 404 {object} map[string]string "Cliente no encontrado"
// @Router /api/clientes/{id} [get]
func GetCliente(c *gin.Context) {
	id := c.Param("id")

	var cliente models.Cliente
	if err := config.DB.First(&cliente, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cliente no encontrado"})
		return
	}

	c.JSON(http.StatusOK, cliente)
}

// CreateCliente godoc
// @Summary Crear cliente
// @Description Crea un nuevo cliente
// @Tags Clientes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.ClienteCreateRequest true "Datos del cliente"
// @Success 201 {object} models.Cliente
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/clientes [post]
func CreateCliente(c *gin.Context) {
	var req models.ClienteCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	cliente := models.Cliente{
		Nombre:    req.Nombre,
		Telefono:  req.Telefono,
		Email:     req.Email,
		Direccion: req.Direccion,
		Ciudad:    req.Ciudad,
		Provincia: req.Provincia,
		Pais:      req.Pais,
	}

	if err := config.DB.Create(&cliente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear cliente"})
		return
	}

	c.JSON(http.StatusCreated, cliente)
}

// UpdateCliente godoc
// @Summary Actualizar cliente
// @Description Actualiza los datos de un cliente existente
// @Tags Clientes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del cliente"
// @Param request body models.ClienteCreateRequest true "Datos actualizados"
// @Success 200 {object} models.Cliente
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Cliente no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/clientes/{id} [put]
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
	cliente.Direccion = req.Direccion
	cliente.Ciudad = req.Ciudad
	cliente.Provincia = req.Provincia
	cliente.Pais = req.Pais

	if err := config.DB.Save(&cliente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar cliente"})
		return
	}

	c.JSON(http.StatusOK, cliente)
}

// DeleteCliente godoc
// @Summary Eliminar cliente
// @Description Elimina un cliente (solo dueño). No se puede eliminar si tiene ventas o pedidos asociados.
// @Tags Clientes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del cliente"
// @Success 200 {object} map[string]string "Cliente eliminado exitosamente"
// @Failure 400 {object} map[string]string "Cliente tiene ventas o pedidos asociados"
// @Failure 403 {object} map[string]string "Sin permisos"
// @Failure 404 {object} map[string]string "Cliente no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/clientes/{id} [delete]
func DeleteCliente(c *gin.Context) {
	userRole := c.GetString("rol")
	if userRole != "dueño" {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para eliminar clientes"})
		return
	}

	id := c.Param("id")

	var cliente models.Cliente
	if err := config.DB.First(&cliente, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cliente no encontrado"})
		return
	}

	var ventasCount int64
	config.DB.Model(&models.Venta{}).Where("cliente_id = ?", id).Count(&ventasCount)

	if ventasCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "No se puede eliminar el cliente porque tiene ventas asociadas",
			"detalle": "Este cliente tiene ventas registradas. Para eliminarlo, primero debe eliminar todas sus ventas.",
			"ventas":  ventasCount,
		})
		return
	}

	var pedidosCount int64
	config.DB.Model(&models.Pedido{}).
		Joins("JOIN ventas ON pedidos.venta_id = ventas.id").
		Where("ventas.cliente_id = ?", id).
		Count(&pedidosCount)

	if pedidosCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "No se puede eliminar el cliente porque tiene pedidos asociados",
			"detalle": "Este cliente tiene pedidos registrados. Para eliminarlo, primero debe eliminar todos sus pedidos.",
			"pedidos": pedidosCount,
		})
		return
	}

	if err := config.DB.Delete(&cliente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar cliente: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cliente eliminado exitosamente"})
}
