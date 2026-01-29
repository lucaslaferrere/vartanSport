package controllers

import (
	"net/http"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetMisComisiones - Obtener comisiones del usuario autenticado
func GetMisComisiones(c *gin.Context) {
	userID := c.GetInt("user_id")

	var comisiones []models.Comision
	if err := config.DB.
		Where("usuario_id = ?", userID).
		Order("anio DESC, mes DESC").
		Find(&comisiones).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comisiones"})
		return
	}

	c.JSON(http.StatusOK, comisiones)
}

// GetComisionesByUsuario - Obtener comisiones de un empleado (solo dueño)
func GetComisionesByUsuario(c *gin.Context) {
	usuarioID := c.Param("id")

	var comisiones []models.Comision
	if err := config.DB.
		Where("usuario_id = ?", usuarioID).
		Preload("Usuario").
		Order("anio DESC, mes DESC").
		Find(&comisiones).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comisiones"})
		return
	}

	c.JSON(http.StatusOK, comisiones)
}

// GetAllComisiones - Obtener todas las comisiones (solo dueño)
func GetAllComisiones(c *gin.Context) {
	var comisiones []models.Comision

	if err := config.DB.
		Preload("Usuario").
		Order("anio DESC, mes DESC").
		Find(&comisiones).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comisiones"})
		return
	}

	c.JSON(http.StatusOK, comisiones)
}

// CalcularComisionesMesActual - Calcular comisiones del mes actual para todos los empleados (solo dueño)
func CalcularComisionesMesActual(c *gin.Context) {
	now := time.Now()
	mes := int(now.Month())
	anio := now.Year()

	// Obtener todos los empleados
	var usuarios []models.Usuario
	if err := config.DB.Where("rol = ? AND activo = ?", "empleado", true).Find(&usuarios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener empleados"})
		return
	}

	for _, usuario := range usuarios {
		// Calcular ventas del mes
		var totalVentas float64
		config.DB.Model(&models.Venta{}).
			Where("usuario_id = ? AND MONTH(fecha_venta) = ? AND YEAR(fecha_venta) = ?", usuario.ID, mes, anio).
			Select("COALESCE(SUM(total_final), 0)").
			Scan(&totalVentas)

		// Calcular comisión (ejemplo: 10% de las ventas)
		comision := totalVentas * 0.10

		// Buscar si ya existe comisión para este mes
		var comisionExistente models.Comision
		result := config.DB.Where("usuario_id = ? AND mes = ? AND anio = ?", usuario.ID, mes, anio).First(&comisionExistente)

		if result.Error != nil {
			// No existe, crear nueva
			nuevaComision := models.Comision{
				UsuarioID:     usuario.ID,
				Mes:           mes,
				Anio:          anio,
				TotalVentas:   totalVentas,
				TotalComision: comision,
			}
			config.DB.Create(&nuevaComision)
		} else {
			// Ya existe, actualizar
			comisionExistente.TotalVentas = totalVentas
			comisionExistente.TotalComision = comision
			config.DB.Save(&comisionExistente)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comisiones calculadas exitosamente"})
}

// UpdateObservaciones - Agregar observaciones a una comisión (solo dueño)
func UpdateObservaciones(c *gin.Context) {
	id := c.Param("id")

	var comision models.Comision
	if err := config.DB.First(&comision, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comisión no encontrada"})
		return
	}

	var req struct {
		Observaciones string `json:"observaciones"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	comision.Observaciones = req.Observaciones

	if err := config.DB.Save(&comision).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar observaciones"})
		return
	}

	c.JSON(http.StatusOK, comision)
}
