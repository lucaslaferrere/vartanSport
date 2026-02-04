// controllers/gasto_recurrente_controller.go
package controllers

import (
	"net/http"
	"strconv"
	"time"
	"vartan-backend/database"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==================== CRUD GASTOS RECURRENTES ====================

// CrearGastoRecurrente crea un nuevo gasto recurrente
func CrearGastoRecurrente(c *gin.Context) {
	var input models.GastoRecurrenteInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clienteID, exists := c.Get("cliente_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Cliente no autenticado"})
		return
	}

	usuarioID, _ := c.Get("usuario_id")

	// Parsear fecha inicio
	fechaInicio, err := time.Parse("2006-01-02", input.FechaInicio)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de fecha_inicio inválido. Use YYYY-MM-DD"})
		return
	}

	// Parsear fecha fin (opcional)
	var fechaFin *time.Time
	if input.FechaFin != "" {
		ff, err := time.Parse("2006-01-02", input.FechaFin)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de fecha_fin inválido. Use YYYY-MM-DD"})
			return
		}
		fechaFin = &ff
	}

	// Calcular próxima fecha
	proximaFecha := calcularProximaFecha(fechaInicio, input.DiaDelMes)

	gastoRecurrente := models.GastoRecurrente{
		Descripcion:  input.Descripcion,
		Monto:        input.Monto,
		Categoria:    input.Categoria,
		Cuenta:       input.Cuenta,
		Proveedor:    input.Proveedor,
		Notas:        input.Notas,
		DiaDelMes:    input.DiaDelMes,
		Activo:       true,
		FechaInicio:  fechaInicio,
		FechaFin:     fechaFin,
		ProximaFecha: proximaFecha,
		ClienteID:    clienteID.(uint),
	}

	if usuarioID != nil {
		gastoRecurrente.UsuarioID = usuarioID.(uint)
	}

	if err := database.DB.Create(&gastoRecurrente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear gasto recurrente"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":          "Gasto recurrente creado exitosamente",
		"gasto_recurrente": gastoRecurrente,
	})
}

// ListarGastosRecurrentes lista todos los gastos recurrentes
func ListarGastosRecurrentes(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")

	// Filtro opcional por estado activo
	activo := c.Query("activo")

	query := database.DB.Where("cliente_id = ?", clienteID)

	if activo == "true" {
		query = query.Where("activo = ?", true)
	} else if activo == "false" {
		query = query.Where("activo = ?", false)
	}

	var gastosRecurrentes []models.GastoRecurrente
	if err := query.Order("dia_del_mes ASC").Find(&gastosRecurrentes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener gastos recurrentes"})
		return
	}

	// Calcular total mensual de gastos recurrentes activos
	var totalMensual float64
	for _, gr := range gastosRecurrentes {
		if gr.Activo {
			totalMensual += gr.Monto
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"gastos_recurrentes": gastosRecurrentes,
		"total":              len(gastosRecurrentes),
		"total_mensual":      totalMensual,
	})
}

// ObtenerGastoRecurrente obtiene un gasto recurrente por ID
func ObtenerGastoRecurrente(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")
	id := c.Param("id")

	var gastoRecurrente models.GastoRecurrente
	if err := database.DB.Where("id = ? AND cliente_id = ?", id, clienteID).First(&gastoRecurrente).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gasto recurrente no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener gasto recurrente"})
		return
	}

	c.JSON(http.StatusOK, gastoRecurrente)
}

// ActualizarGastoRecurrente actualiza un gasto recurrente
func ActualizarGastoRecurrente(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")
	id := c.Param("id")

	var gastoRecurrente models.GastoRecurrente
	if err := database.DB.Where("id = ? AND cliente_id = ?", id, clienteID).First(&gastoRecurrente).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gasto recurrente no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar gasto recurrente"})
		return
	}

	var input models.GastoRecurrenteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parsear fecha inicio
	fechaInicio, err := time.Parse("2006-01-02", input.FechaInicio)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de fecha_inicio inválido"})
		return
	}

	// Parsear fecha fin (opcional)
	var fechaFin *time.Time
	if input.FechaFin != "" {
		ff, err := time.Parse("2006-01-02", input.FechaFin)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de fecha_fin inválido"})
			return
		}
		fechaFin = &ff
	}

	// Actualizar campos
	gastoRecurrente.Descripcion = input.Descripcion
	gastoRecurrente.Monto = input.Monto
	gastoRecurrente.Categoria = input.Categoria
	gastoRecurrente.Cuenta = input.Cuenta
	gastoRecurrente.Proveedor = input.Proveedor
	gastoRecurrente.Notas = input.Notas
	gastoRecurrente.DiaDelMes = input.DiaDelMes
	gastoRecurrente.FechaInicio = fechaInicio
	gastoRecurrente.FechaFin = fechaFin

	// Recalcular próxima fecha
	gastoRecurrente.ProximaFecha = calcularProximaFecha(time.Now(), input.DiaDelMes)

	if err := database.DB.Save(&gastoRecurrente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar gasto recurrente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Gasto recurrente actualizado exitosamente",
		"gasto_recurrente": gastoRecurrente,
	})
}

// ActivarDesactivarGastoRecurrente activa o desactiva un gasto recurrente
func ActivarDesactivarGastoRecurrente(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")
	id := c.Param("id")

	var gastoRecurrente models.GastoRecurrente
	if err := database.DB.Where("id = ? AND cliente_id = ?", id, clienteID).First(&gastoRecurrente).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gasto recurrente no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar gasto recurrente"})
		return
	}

	// Toggle activo
	gastoRecurrente.Activo = !gastoRecurrente.Activo

	if err := database.DB.Save(&gastoRecurrente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar gasto recurrente"})
		return
	}

	estado := "desactivado"
	if gastoRecurrente.Activo {
		estado = "activado"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Gasto recurrente " + estado,
		"gasto_recurrente": gastoRecurrente,
	})
}

// EliminarGastoRecurrente elimina un gasto recurrente
func EliminarGastoRecurrente(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")
	id := c.Param("id")

	var gastoRecurrente models.GastoRecurrente
	if err := database.DB.Where("id = ? AND cliente_id = ?", id, clienteID).First(&gastoRecurrente).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gasto recurrente no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar gasto recurrente"})
		return
	}

	if err := database.DB.Delete(&gastoRecurrente).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar gasto recurrente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Gasto recurrente eliminado exitosamente"})
}

// ==================== GENERACIÓN AUTOMÁTICA ====================

// GenerarGastosDelMes genera los gastos pendientes de los gastos recurrentes
// Esta función debería ejecutarse mediante un cron job diariamente
func GenerarGastosDelMes(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")

	// Obtener todos los gastos recurrentes activos
	var gastosRecurrentes []models.GastoRecurrente
	if err := database.DB.Where("cliente_id = ? AND activo = ?", clienteID, true).Find(&gastosRecurrentes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener gastos recurrentes"})
		return
	}

	now := time.Now()
	gastosGenerados := 0

	for _, gr := range gastosRecurrentes {
		// Verificar si ya pasó la fecha de fin
		if gr.FechaFin != nil && now.After(*gr.FechaFin) {
			continue
		}

		// Verificar si la próxima fecha ya pasó o es hoy
		if !gr.ProximaFecha.After(now) {
			// Verificar que no exista ya un gasto para este mes de este recurrente
			var existente int64
			mesActual := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
			mesSiguiente := mesActual.AddDate(0, 1, 0)

			database.DB.Model(&models.Gasto{}).
				Where("cliente_id = ? AND gasto_recurrente_id = ? AND fecha >= ? AND fecha < ?",
					clienteID, gr.ID, mesActual, mesSiguiente).
				Count(&existente)

			if existente == 0 {
				// Crear el gasto como pendiente
				gasto := models.Gasto{
					Descripcion:       gr.Descripcion,
					Monto:             gr.Monto,
					Fecha:             gr.ProximaFecha,
					Categoria:         gr.Categoria,
					Cuenta:            gr.Cuenta,
					Estado:            "pendiente",
					Proveedor:         gr.Proveedor,
					Notas:             gr.Notas + " (Generado automáticamente)",
					GastoRecurrenteID: &gr.ID,
					ClienteID:         gr.ClienteID,
					UsuarioID:         gr.UsuarioID,
				}

				if err := database.DB.Create(&gasto).Error; err == nil {
					gastosGenerados++

					// Actualizar próxima fecha del recurrente
					gr.ProximaFecha = calcularProximaFecha(gr.ProximaFecha.AddDate(0, 1, 0), gr.DiaDelMes)
					database.DB.Save(&gr)
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Proceso completado",
		"gastos_generados": gastosGenerados,
	})
}

// GenerarGastoDesdeRecurrente genera manualmente un gasto desde un recurrente
func GenerarGastoDesdeRecurrente(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")
	id := c.Param("id")

	var gastoRecurrente models.GastoRecurrente
	if err := database.DB.Where("id = ? AND cliente_id = ?", id, clienteID).First(&gastoRecurrente).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gasto recurrente no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar gasto recurrente"})
		return
	}

	// Obtener fecha del body (opcional)
	var input struct {
		Fecha  string `json:"fecha"`
		Estado string `json:"estado"` // "pagado" o "pendiente"
	}
	c.ShouldBindJSON(&input)

	fecha := time.Now()
	if input.Fecha != "" {
		f, err := time.Parse("2006-01-02", input.Fecha)
		if err == nil {
			fecha = f
		}
	}

	estado := "pendiente"
	if input.Estado == "pagado" {
		estado = "pagado"
	}

	// Crear el gasto
	gasto := models.Gasto{
		Descripcion:       gastoRecurrente.Descripcion,
		Monto:             gastoRecurrente.Monto,
		Fecha:             fecha,
		Categoria:         gastoRecurrente.Categoria,
		Cuenta:            gastoRecurrente.Cuenta,
		Estado:            estado,
		Proveedor:         gastoRecurrente.Proveedor,
		Notas:             gastoRecurrente.Notas,
		GastoRecurrenteID: &gastoRecurrente.ID,
		ClienteID:         gastoRecurrente.ClienteID,
		UsuarioID:         gastoRecurrente.UsuarioID,
	}

	if err := database.DB.Create(&gasto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear gasto"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Gasto generado desde recurrente",
		"gasto":   gasto,
	})
}

// ==================== UTILIDADES ====================

// calcularProximaFecha calcula la próxima fecha de un gasto recurrente
func calcularProximaFecha(desde time.Time, diaDelMes int) time.Time {
	// Si el día actual es mayor al día del mes del recurrente, ir al mes siguiente
	if desde.Day() > diaDelMes {
		desde = desde.AddDate(0, 1, 0)
	}

	// Ajustar el día (considerando meses con menos días)
	year, month, _ := desde.Date()
	ultimoDiaDelMes := time.Date(year, month+1, 0, 0, 0, 0, 0, desde.Location()).Day()

	dia := diaDelMes
	if dia > ultimoDiaDelMes {
		dia = ultimoDiaDelMes
	}

	return time.Date(year, month, dia, 0, 0, 0, 0, desde.Location())
}
