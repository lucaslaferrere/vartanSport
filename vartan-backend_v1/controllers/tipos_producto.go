package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetTiposProducto godoc
// @Summary Listar tipos de producto
// @Description Obtiene todos los tipos de producto activos
// @Tags TiposProducto
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.TipoProducto
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/tipos-producto [get]
func GetTiposProducto(c *gin.Context) {
	var tipos []models.TipoProducto

	if err := config.DB.Where("activo = ?", true).Find(&tipos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener tipos de producto"})
		return
	}

	c.JSON(http.StatusOK, tipos)
}

// GetTipoProducto godoc
// @Summary Obtener tipo de producto por ID
// @Description Obtiene un tipo de producto específico por su ID
// @Tags TiposProducto
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del tipo de producto"
// @Success 200 {object} models.TipoProducto
// @Failure 404 {object} map[string]string "Tipo de producto no encontrado"
// @Router /api/tipos-producto/{id} [get]
func GetTipoProducto(c *gin.Context) {
	id := c.Param("id")

	var tipo models.TipoProducto
	if err := config.DB.First(&tipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tipo de producto no encontrado"})
		return
	}

	c.JSON(http.StatusOK, tipo)
}

// CreateTipoProducto godoc
// @Summary Crear tipo de producto
// @Description Crea un nuevo tipo de producto (solo dueño)
// @Tags TiposProducto
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.TipoProductoCreateRequest true "Datos del tipo de producto"
// @Success 201 {object} models.TipoProducto
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/tipos-producto [post]
func CreateTipoProducto(c *gin.Context) {
	var req models.TipoProductoCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	tipo := models.TipoProducto{
		Nombre: req.Nombre,
		Activo: true,
	}

	if err := config.DB.Create(&tipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear tipo de producto. Es posible que ya exista."})
		return
	}

	c.JSON(http.StatusCreated, tipo)
}

// UpdateTipoProducto godoc
// @Summary Actualizar tipo de producto
// @Description Actualiza un tipo de producto existente (solo dueño)
// @Tags TiposProducto
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del tipo de producto"
// @Param request body models.TipoProductoUpdateRequest true "Datos actualizados"
// @Success 200 {object} models.TipoProducto
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Tipo de producto no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/tipos-producto/{id} [put]
func UpdateTipoProducto(c *gin.Context) {
	id := c.Param("id")

	var tipo models.TipoProducto
	if err := config.DB.First(&tipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tipo de producto no encontrado"})
		return
	}

	var req models.TipoProductoUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if req.Nombre != nil {
		tipo.Nombre = *req.Nombre
	}
	if req.Activo != nil {
		tipo.Activo = *req.Activo
	}

	if err := config.DB.Save(&tipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar tipo de producto"})
		return
	}

	c.JSON(http.StatusOK, tipo)
}

// DeleteTipoProducto godoc
// @Summary Eliminar tipo de producto
// @Description Desactiva un tipo de producto (solo dueño)
// @Tags TiposProducto
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del tipo de producto"
// @Success 200 {object} map[string]string "Tipo de producto eliminado exitosamente"
// @Failure 404 {object} map[string]string "Tipo de producto no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/tipos-producto/{id} [delete]
func DeleteTipoProducto(c *gin.Context) {
	id := c.Param("id")

	var tipo models.TipoProducto
	if err := config.DB.First(&tipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tipo de producto no encontrado"})
		return
	}

	tipo.Activo = false

	if err := config.DB.Save(&tipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar tipo de producto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tipo de producto eliminado exitosamente"})
}
