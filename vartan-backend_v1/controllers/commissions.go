package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// getGastoPublicitarioMensual looks up the advertising commission value for a given
// employee+month+year. Returns 0 if the owner has not set it explicitly for that period.
func getGastoPublicitarioMensual(empleadoID, mes, anio int) float64 {
	var rec models.ComisionPublicitariaMensual
	if err := config.DB.Where("empleado_id = ? AND mes = ? AND anio = ?", empleadoID, mes, anio).
		First(&rec).Error; err != nil {
		return 0
	}
	return rec.ValorComision
}

func periodIsFuture(mes int, anio int, now time.Time) bool {
	currentYear := now.Year()
	currentMonth := int(now.Month())
	return anio > currentYear || (anio == currentYear && mes > currentMonth)
}

func monthRange(mes int, anio int, loc *time.Location) (time.Time, time.Time) {
	start := time.Date(anio, time.Month(mes), 1, 0, 0, 0, 0, loc)
	end := start.AddDate(0, 1, 0)
	return start, end
}

// GetMisComisiones godoc
// @Summary Obtener mis comisiones
// @Description Obtiene las comisiones del usuario autenticado
// @Tags Comisiones
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Comision
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/mis-comisiones [get]
func GetMisComisiones(c *gin.Context) {
	userID := c.GetInt("user_id")
	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()

	var comisiones []models.Comision
	if err := config.DB.
		Where("usuario_id = ?", userID).
		Where("(anio < ?) OR (anio = ? AND mes <= ?)", currentYear, currentYear, currentMonth).
		Order("anio DESC, mes DESC").
		Find(&comisiones).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comisiones"})
		return
	}

	c.JSON(http.StatusOK, comisiones)
}

// GetComisionesByUsuario godoc
// @Summary Obtener comisiones por usuario
// @Description Obtiene las comisiones de un empleado específico (solo dueño)
// @Tags Comisiones
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del usuario"
// @Success 200 {array} models.Comision
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comisiones/usuario/{id} [get]
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

// GetAllComisiones godoc
// @Summary Listar todas las comisiones
// @Description Obtiene todas las comisiones (solo dueño)
// @Tags Comisiones
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Comision
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comisiones [get]
func GetAllComisiones(c *gin.Context) {
	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()

	var comisiones []models.Comision

	if err := config.DB.
		Where("(anio < ?) OR (anio = ? AND mes <= ?)", currentYear, currentYear, currentMonth).
		Preload("Usuario").
		Order("anio DESC, mes DESC").
		Find(&comisiones).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comisiones"})
		return
	}

	c.JSON(http.StatusOK, comisiones)
}

// CalcularComisionesMesActual godoc
// @Summary Calcular comisiones del mes
// @Description Calcula las comisiones del mes actual para todos los empleados (solo dueño)
// @Tags Comisiones
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string "Comisiones calculadas"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comisiones/calcular [post]
func CalcularComisionesMesActual(c *gin.Context) {
	var body struct {
		Mes  int `json:"mes"`
		Anio int `json:"anio"`
	}
	_ = c.ShouldBindJSON(&body)

	now := time.Now()
	mes := body.Mes
	anio := body.Anio
	if mes == 0 {
		mes = int(now.Month())
	}
	if anio == 0 {
		anio = now.Year()
	}
	if mes < 1 || mes > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mes inválido. Debe estar entre 1 y 12"})
		return
	}
	if periodIsFuture(mes, anio, now) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se pueden calcular comisiones para meses futuros"})
		return
	}

	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar zona horaria"})
		return
	}
	mesInicio, mesFin := monthRange(mes, anio, loc)

	// Obtener todos los empleados
	var usuarios []models.Usuario
	if err := config.DB.Where("rol IN (?, ?, ?) AND activo = ?", "empleado", "vendedor", "dueño", true).Find(&usuarios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener empleados"})
		return
	}

	for _, usuario := range usuarios {
		// Calcular ventas del mes (sintaxis PostgreSQL)
		var totalVentas float64
		config.DB.Model(&models.Venta{}).
			Where("usuario_id = ? AND fecha_venta >= ? AND fecha_venta < ?", usuario.ID, mesInicio, mesFin).
			Select("COALESCE(SUM(total_final), 0)").
			Scan(&totalVentas)

		// Calcular base de comisión con la ganancia real (incluye descuento financiera).
		var totalGanancia float64
		config.DB.Model(&models.Venta{}).
			Where("usuario_id = ? AND fecha_venta >= ? AND fecha_venta < ?", usuario.ID, mesInicio, mesFin).
			Select("COALESCE(SUM(ganancia), 0)").
			Scan(&totalGanancia)

		// Buscar si ya existe comisión para este mes
		var comisionExistente models.Comision
		result := config.DB.Where("usuario_id = ? AND mes = ? AND anio = ?", usuario.ID, mes, anio).First(&comisionExistente)

		// Determinar el gasto publicitario a usar:
		// 1. Buscar en la tabla comisiones_publicitarias_mensuales (seteo explícito del dueño); si no existe → 0
		// 2. Si el registro de comisión mensual ya tiene un override explícito (no nil), respetarlo
		gastoPublicitario := getGastoPublicitarioMensual(usuario.ID, mes, anio)
		if result.Error == nil && comisionExistente.GastoPublicitario != nil {
			gastoPublicitario = *comisionExistente.GastoPublicitario
		}

		// Usar el porcentaje del registro si ya existe (snapshot histórico), si no el actual del usuario
		porcentajeComision := usuario.PorcentajeComision
		if result.Error == nil && comisionExistente.PorcentajeComision > 0 {
			porcentajeComision = comisionExistente.PorcentajeComision
		}

		// Calcular comisión con gasto descontado antes de aplicar porcentaje.
		porcentaje := porcentajeComision / 100.0
		gananciaNeta := totalGanancia - gastoPublicitario
		if gananciaNeta < 0 {
			gananciaNeta = 0
		}
		comisionNeta := gananciaNeta * porcentaje

		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// No existe, crear nueva — snapshot de sueldo, porcentaje y gasto del mes actual
			gastoSnapshot := gastoPublicitario
			nuevaComision := models.Comision{
				UsuarioID:          usuario.ID,
				Mes:                mes,
				Anio:               anio,
				TotalVentas:        totalVentas,
				TotalComision:      comisionNeta,
				Sueldo:             usuario.Sueldo,
				PorcentajeComision: usuario.PorcentajeComision,
				GastoPublicitario:  &gastoSnapshot,
			}
			config.DB.Create(&nuevaComision)
		} else if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al verificar comisión existente"})
			return
		} else {
			// Ya existe, actualizar totales (no tocar gasto_publicitario)
			comisionExistente.TotalVentas = totalVentas
			comisionExistente.TotalComision = comisionNeta
			if comisionExistente.PorcentajeComision == 0 {
				comisionExistente.PorcentajeComision = usuario.PorcentajeComision
			}
			config.DB.Model(&comisionExistente).Omit("gasto_publicitario").Updates(&comisionExistente)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comisiones calculadas exitosamente"})
}

// UpdateObservaciones godoc
// @Summary Actualizar observaciones de comisión
// @Description Agrega o actualiza observaciones a una comisión (solo dueño)
// @Tags Comisiones
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la comisión"
// @Param request body object true "Observaciones" example({"observaciones": "Buen desempeño"})
// @Success 200 {object} models.Comision
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Comisión no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comisiones/{id}/observaciones [put]
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

// GetMiResumenComision godoc
// @Summary Obtener mi resumen de comisión (para empleado/vendedor)
// @Description Obtiene el resumen completo de comisiones del usuario autenticado (solo lectura)
// @Tags Comisiones
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "Resumen de comisión"
// @Failure 401 {object} map[string]string "No autenticado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/mi-resumen-comision [get]
func GetMiResumenComision(c *gin.Context) {
	userID := c.GetInt("user_id")

	// Obtener información del usuario
	var usuario models.Usuario
	if err := config.DB.First(&usuario, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	// Obtener mes y año actual
	now := time.Now()
	mesActual := int(now.Month())
	anioActual := now.Year()

	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar zona horaria"})
		return
	}
	mesInicio, mesFin := monthRange(mesActual, anioActual, loc)

	// Calcular ventas del mes actual
	var totalVentasMesActual float64
	config.DB.Model(&models.Venta{}).
		Where("usuario_id = ? AND fecha_venta >= ? AND fecha_venta < ?",
			userID, mesInicio, mesFin).
		Select("COALESCE(SUM(total_final), 0)").
		Scan(&totalVentasMesActual)

	// Calcular ganancia del mes actual para usarla como base de comisión.
	var totalGananciaMesActual float64
	config.DB.Model(&models.Venta{}).
		Where("usuario_id = ? AND fecha_venta >= ? AND fecha_venta < ?",
			userID, mesInicio, mesFin).
		Select("COALESCE(SUM(ganancia), 0)").
		Scan(&totalGananciaMesActual)

	// Contar cantidad de ventas del mes
	var cantidadVentasMes int64
	config.DB.Model(&models.Venta{}).
		Where("usuario_id = ? AND fecha_venta >= ? AND fecha_venta < ?",
			userID, mesInicio, mesFin).
		Count(&cantidadVentasMes)

	// Obtener comisión registrada del mes actual (si existe)
	var comisionMesActual models.Comision
	comisionRegistrada := false
	if err := config.DB.Where("usuario_id = ? AND mes = ? AND anio = ?", userID, mesActual, anioActual).
		First(&comisionMesActual).Error; err == nil {
		comisionRegistrada = true
	}

	// Gasto publicitario del mes: leer de la tabla mensual (default 0 si el dueño no lo seteó).
	// Si existe un override explícito en el registro de comisión, respetarlo.
	gastoPublicitarioMes := getGastoPublicitarioMensual(userID, mesActual, anioActual)
	if comisionRegistrada && comisionMesActual.GastoPublicitario != nil {
		gastoPublicitarioMes = *comisionMesActual.GastoPublicitario
	}

	// Usar el porcentaje del snapshot mensual si existe, si no el actual del usuario
	porcentajeParaCalculo := usuario.PorcentajeComision
	if comisionRegistrada && comisionMesActual.PorcentajeComision > 0 {
		porcentajeParaCalculo = comisionMesActual.PorcentajeComision
	}

	// Calcular comisión estimada del mes con el gasto correcto descontado antes del porcentaje.
	porcentaje := porcentajeParaCalculo / 100.0
	gananciaNeta := totalGananciaMesActual - gastoPublicitarioMes
	if gananciaNeta < 0 {
		gananciaNeta = 0
	}
	comisionNeta := gananciaNeta * porcentaje
	totalACobrar := usuario.Sueldo + comisionNeta

	// Obtener historial de comisiones (últimos 6 meses)
	nowFilter := time.Now()
	currentMonth := int(nowFilter.Month())
	currentYear := nowFilter.Year()
	var historialComisiones []models.Comision
	config.DB.Where("usuario_id = ?", userID).
		Where("(anio < ?) OR (anio = ? AND mes <= ?)", currentYear, currentYear, currentMonth).
		Order("anio DESC, mes DESC").
		Limit(6).
		Find(&historialComisiones)

	// Respuesta
	c.JSON(http.StatusOK, gin.H{
		// Información del usuario
		"usuario": gin.H{
			"id":     usuario.ID,
			"nombre": usuario.Nombre,
			"email":  usuario.Email,
			"rol":    usuario.Rol,
		},
		// Configuración de comisión (establecida por el dueño)
		"configuracion": gin.H{
			"porcentaje_comision": usuario.PorcentajeComision,
			"gasto_publicitario":  usuario.GastoPublicitario,
			"sueldo_base":         usuario.Sueldo,
			"observaciones":       usuario.ObservacionesConfig,
		},
		// Resumen del mes actual
		"mes_actual": gin.H{
			"mes":                    mesActual,
			"anio":                   anioActual,
			"total_ventas":           totalVentasMesActual,
			"total_ganancia":         totalGananciaMesActual,
			"cantidad_ventas":        cantidadVentasMes,
			"comision_bruta":         gananciaNeta,
			"gasto_publicitario":     gastoPublicitarioMes,
			"comision_neta":          comisionNeta,
			"sueldo_base":            usuario.Sueldo,
			"total_a_cobrar":         totalACobrar,
			"comision_registrada":    comisionRegistrada,
			"observaciones_comision": comisionMesActual.Observaciones,
		},
		// Historial de comisiones
		"historial": historialComisiones,
	})
}

// UpdateGastoPublicitarioMes godoc
// @Summary Actualizar gasto publicitario de un mes
// @Description Permite al dueño actualizar el gasto publicitario de una comisión mensual específica
// @Tags Comisiones
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la comisión"
// @Param request body object true "Gasto publicitario" example({"gasto_publicitario": 5000.00})
// @Success 200 {object} models.Comision
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Comisión no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/comisiones/{id}/gasto-publicitario [put]
func UpdateGastoPublicitarioMes(c *gin.Context) {
	id := c.Param("id")

	var comision models.Comision
	if err := config.DB.Preload("Usuario").First(&comision, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comisión no encontrada"})
		return
	}

	var req struct {
		GastoPublicitario *float64 `json:"gasto_publicitario" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if req.GastoPublicitario == nil || *req.GastoPublicitario < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El gasto publicitario no puede ser negativo"})
		return
	}

	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar zona horaria"})
		return
	}
	mesInicio, mesFin := monthRange(comision.Mes, comision.Anio, loc)

	var totalVentas float64
	config.DB.Model(&models.Venta{}).
		Where("usuario_id = ? AND fecha_venta >= ? AND fecha_venta < ?", comision.UsuarioID, mesInicio, mesFin).
		Select("COALESCE(SUM(total_final), 0)").
		Scan(&totalVentas)

	var totalGanancia float64
	config.DB.Model(&models.Venta{}).
		Where("usuario_id = ? AND fecha_venta >= ? AND fecha_venta < ?", comision.UsuarioID, mesInicio, mesFin).
		Select("COALESCE(SUM(ganancia), 0)").
		Scan(&totalGanancia)

	// Usar el porcentaje del snapshot histórico del registro, no el actual del usuario
	porcentaje := comision.PorcentajeComision / 100.0
	gananciaNeta := totalGanancia - *req.GastoPublicitario
	if gananciaNeta < 0 {
		gananciaNeta = 0
	}

	comision.GastoPublicitario = req.GastoPublicitario
	comision.TotalVentas = totalVentas
	comision.TotalComision = gananciaNeta * porcentaje

	if err := config.DB.Save(&comision).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar gasto publicitario"})
		return
	}

	c.JSON(http.StatusOK, comision)
}

// GetComisionPublicitariaDelMes godoc
// @Summary Obtener gasto publicitario mensual de un empleado
// @Description Devuelve el gasto publicitario seteado para el empleado en el mes/año indicado (solo dueño). Si no fue seteado, devuelve 0 con not_set=true.
// @Tags Comisiones
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del empleado"
// @Param mes query int false "Mes (1-12, default: mes actual)"
// @Param anio query int false "Año (default: año actual)"
// @Success 200 {object} map[string]interface{}
// @Router /api/owner/comisiones-publicitarias/usuario/{id} [get]
func GetComisionPublicitariaDelMes(c *gin.Context) {
	empleadoID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	now := time.Now()
	mes := int(now.Month())
	anio := now.Year()

	if m, err := strconv.Atoi(c.Query("mes")); err == nil && m >= 1 && m <= 12 {
		mes = m
	}
	if a, err := strconv.Atoi(c.Query("anio")); err == nil && a > 0 {
		anio = a
	}

	var rec models.ComisionPublicitariaMensual
	result := config.DB.Where("empleado_id = ? AND mes = ? AND anio = ?", empleadoID, mes, anio).First(&rec)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusOK, gin.H{
			"empleado_id":   empleadoID,
			"mes":           mes,
			"anio":          anio,
			"valor_comision": 0,
			"not_set":       true,
		})
		return
	}
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener gasto publicitario"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"empleado_id":   rec.EmpleadoID,
		"mes":           rec.Mes,
		"anio":          rec.Anio,
		"valor_comision": rec.ValorComision,
		"not_set":       false,
	})
}

// SetComisionPublicitariaDelMes godoc
// @Summary Setear gasto publicitario mensual de un empleado (solo dueño)
// @Description Crea o actualiza el gasto publicitario para el empleado en el mes/año indicado. Si no se llama este endpoint, el mes queda en 0.
// @Tags Comisiones
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del empleado"
// @Param request body object true "Datos" example({"mes":4,"anio":2026,"valor_comision":5000.00})
// @Success 200 {object} models.ComisionPublicitariaMensual
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/owner/comisiones-publicitarias/usuario/{id} [post]
func SetComisionPublicitariaDelMes(c *gin.Context) {
	empleadoID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Verificar que el empleado existe
	var empleado models.Usuario
	if err := config.DB.First(&empleado, empleadoID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Empleado no encontrado"})
		return
	}

	var req struct {
		Mes           int     `json:"mes" binding:"required,min=1,max=12"`
		Anio          int     `json:"anio" binding:"required"`
		ValorComision float64 `json:"valor_comision"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: se requieren mes, anio y valor_comision"})
		return
	}
	if req.ValorComision < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "valor_comision no puede ser negativo"})
		return
	}

	var rec models.ComisionPublicitariaMensual
	result := config.DB.Where("empleado_id = ? AND mes = ? AND anio = ?", empleadoID, req.Mes, req.Anio).First(&rec)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		rec = models.ComisionPublicitariaMensual{
			EmpleadoID:    empleadoID,
			Mes:           req.Mes,
			Anio:          req.Anio,
			ValorComision: req.ValorComision,
		}
		if err := config.DB.Create(&rec).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear gasto publicitario"})
			return
		}
	} else if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar registro existente"})
		return
	} else {
		rec.ValorComision = req.ValorComision
		if err := config.DB.Save(&rec).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar gasto publicitario"})
			return
		}
	}

	c.JSON(http.StatusOK, rec)
}
