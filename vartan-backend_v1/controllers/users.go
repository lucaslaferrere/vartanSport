package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetMe godoc
// @Summary Obtener mi información
// @Description Obtiene la información del usuario autenticado
// @Tags Usuarios
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.Usuario
// @Failure 404 {object} map[string]string "Usuario no encontrado"
// @Router /api/me [get]
func GetMe(c *gin.Context) {
	userID := c.GetInt("user_id")

	var usuario models.Usuario
	if err := config.DB.First(&usuario, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	c.JSON(http.StatusOK, usuario)
}

// GetVendedores godoc
// @Summary Obtener todos los vendedores
// @Description Obtiene la lista de todos los usuarios con rol de empleado (solo dueño)
// @Tags Usuarios
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Usuario
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/usuarios/vendedores [get]
func GetVendedores(c *gin.Context) {
	var usuarios []models.Usuario

	if err := config.DB.Where("rol = ?", "empleado").Find(&usuarios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener vendedores"})
		return
	}

	c.JSON(http.StatusOK, usuarios)
}

// UpdateComisionConfig godoc
// @Summary Actualizar configuración de comisión
// @Description Actualiza la configuración de comisión de un vendedor (solo dueño)
// @Tags Usuarios
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del usuario"
// @Param request body models.UsuarioComisionConfigRequest true "Configuración de comisión"
// @Success 200 {object} models.Usuario
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Usuario no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/usuarios/{id}/comision-config [put]
func UpdateComisionConfig(c *gin.Context) {
	id := c.Param("id")

	var usuario models.Usuario
	if err := config.DB.First(&usuario, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	var req models.UsuarioComisionConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Actualizar configuración
	usuario.PorcentajeComision = req.PorcentajeComision
	usuario.GastoPublicitario = req.GastoPublicitario
	usuario.Sueldo = req.Sueldo
	usuario.ObservacionesConfig = req.Observaciones

	if err := config.DB.Save(&usuario).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar configuración"})
		return
	}

	c.JSON(http.StatusOK, usuario)
}
