package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetEquipos godoc
// @Summary Listar equipos
// @Description Obtiene todos los equipos activos
// @Tags Equipos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Equipo
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/equipos [get]
func GetEquipos(c *gin.Context) {
	var equipos []models.Equipo

	if err := config.DB.Where("activo = ?", true).Find(&equipos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener equipos"})
		return
	}

	c.JSON(http.StatusOK, equipos)
}

// GetEquipo godoc
// @Summary Obtener equipo por ID
// @Description Obtiene un equipo específico por su ID
// @Tags Equipos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del equipo"
// @Success 200 {object} models.Equipo
// @Failure 404 {object} map[string]string "Equipo no encontrado"
// @Router /api/equipos/{id} [get]
func GetEquipo(c *gin.Context) {
	id := c.Param("id")

	var equipo models.Equipo
	if err := config.DB.First(&equipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Equipo no encontrado"})
		return
	}

	c.JSON(http.StatusOK, equipo)
}

// CreateEquipo godoc
// @Summary Crear equipo
// @Description Crea un nuevo equipo (solo dueño)
// @Tags Equipos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.EquipoCreateRequest true "Datos del equipo"
// @Success 201 {object} models.Equipo
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/equipos [post]
func CreateEquipo(c *gin.Context) {
	var req models.EquipoCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	equipo := models.Equipo{
		Nombre: req.Nombre,
		Activo: true,
	}

	if err := config.DB.Create(&equipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear equipo. Es posible que ya exista."})
		return
	}

	c.JSON(http.StatusCreated, equipo)
}

// UpdateEquipo godoc
// @Summary Actualizar equipo
// @Description Actualiza un equipo existente (solo dueño)
// @Tags Equipos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del equipo"
// @Param request body models.EquipoUpdateRequest true "Datos actualizados"
// @Success 200 {object} models.Equipo
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Equipo no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/equipos/{id} [put]
func UpdateEquipo(c *gin.Context) {
	id := c.Param("id")

	var equipo models.Equipo
	if err := config.DB.First(&equipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Equipo no encontrado"})
		return
	}

	var req models.EquipoUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if req.Nombre != nil {
		equipo.Nombre = *req.Nombre
	}
	if req.Activo != nil {
		equipo.Activo = *req.Activo
	}

	if err := config.DB.Save(&equipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar equipo"})
		return
	}

	c.JSON(http.StatusOK, equipo)
}

// DeleteEquipo godoc
// @Summary Eliminar equipo
// @Description Desactiva un equipo (solo dueño)
// @Tags Equipos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del equipo"
// @Success 200 {object} map[string]string "Equipo eliminado exitosamente"
// @Failure 404 {object} map[string]string "Equipo no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/equipos/{id} [delete]
func DeleteEquipo(c *gin.Context) {
	id := c.Param("id")

	var equipo models.Equipo
	if err := config.DB.First(&equipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Equipo no encontrado"})
		return
	}

	equipo.Activo = false

	if err := config.DB.Save(&equipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar equipo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Equipo eliminado exitosamente"})
}
