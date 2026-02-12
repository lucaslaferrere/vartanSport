package controllers

import (
	"net/http"
	"strconv"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

// GetTareas godoc
// @Summary Listar tareas
// @Description Lista las tareas según el rol del usuario. Dueño ve todas, vendedor solo las suyas.
// @Tags Tareas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param completada query bool false "Filtrar por estado completada"
// @Param empleado_id query int false "Filtrar por empleado (solo dueño)"
// @Param limit query int false "Límite de resultados"
// @Param offset query int false "Offset para paginación"
// @Success 200 {array} models.TareaResponse
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/tareas [get]
func GetTareas(c *gin.Context) {
	userID := c.GetInt("user_id")
	userRol := c.GetString("rol")

	var tareas []models.Tarea
	query := config.DB.Preload("Empleado").Preload("Creador")

	// Si es vendedor/empleado, solo ver sus propias tareas
	if userRol == "empleado" {
		query = query.Where("empleado_id = ?", userID)
	}

	// Filtro por completada
	if completadaStr := c.Query("completada"); completadaStr != "" {
		completada := completadaStr == "true"
		query = query.Where("completada = ?", completada)
	}

	// Filtro por empleado_id (solo dueño puede filtrar por otros empleados)
	if empleadoIDStr := c.Query("empleado_id"); empleadoIDStr != "" && userRol == "dueño" {
		empleadoID, err := strconv.Atoi(empleadoIDStr)
		if err == nil {
			query = query.Where("empleado_id = ?", empleadoID)
		}
	}

	// Paginación
	limit := 50 // default
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	offset := 0
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Ejecutar query
	if err := query.
		Order("creada_en DESC").
		Limit(limit).
		Offset(offset).
		Find(&tareas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener tareas"})
		return
	}

	// Convertir a response con nombre de empleado
	var response []models.TareaResponse
	for _, t := range tareas {
		response = append(response, models.TareaResponse{
			ID:             t.ID,
			Titulo:         t.Titulo,
			Descripcion:    t.Descripcion,
			Completada:     t.Completada,
			EmpleadoID:     t.EmpleadoID,
			EmpleadoNombre: t.Empleado.Nombre,
			CreadoPor:      t.CreadoPor,
			CreadaEn:       t.CreadaEn,
			ActualizadaEn:  t.ActualizadaEn,
		})
	}

	c.JSON(http.StatusOK, response)
}

// GetTarea godoc
// @Summary Obtener tarea específica
// @Description Obtiene una tarea por su ID
// @Tags Tareas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la tarea"
// @Success 200 {object} models.TareaResponse
// @Failure 403 {object} map[string]string "Sin permisos"
// @Failure 404 {object} map[string]string "Tarea no encontrada"
// @Router /api/tareas/{id} [get]
func GetTarea(c *gin.Context) {
	userID := c.GetInt("user_id")
	userRol := c.GetString("rol")
	tareaID := c.Param("id")

	var tarea models.Tarea
	if err := config.DB.Preload("Empleado").Preload("Creador").First(&tarea, tareaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tarea no encontrada"})
		return
	}

	// Verificar permisos: vendedor solo puede ver sus propias tareas
	if userRol == "empleado" && tarea.EmpleadoID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permiso para ver esta tarea"})
		return
	}

	response := models.TareaResponse{
		ID:             tarea.ID,
		Titulo:         tarea.Titulo,
		Descripcion:    tarea.Descripcion,
		Completada:     tarea.Completada,
		EmpleadoID:     tarea.EmpleadoID,
		EmpleadoNombre: tarea.Empleado.Nombre,
		CreadoPor:      tarea.CreadoPor,
		CreadaEn:       tarea.CreadaEn,
		ActualizadaEn:  tarea.ActualizadaEn,
	}

	c.JSON(http.StatusOK, response)
}

// CreateTarea godoc
// @Summary Crear nueva tarea
// @Description Crea una nueva tarea. Dueño puede crear para cualquier empleado, vendedor solo para sí mismo.
// @Tags Tareas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CrearTareaRequest true "Datos de la tarea"
// @Success 201 {object} models.TareaResponse
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 403 {object} map[string]string "Sin permisos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/tareas [post]
func CreateTarea(c *gin.Context) {
	userID := c.GetInt("user_id")
	userRol := c.GetString("rol")

	var req models.CrearTareaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	// Validar que el título no esté vacío
	if req.Titulo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El título es requerido"})
		return
	}

	// Si es vendedor/empleado, solo puede crear tareas para sí mismo
	if (userRol == "vendedor" || userRol == "empleado") && req.EmpleadoID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo puedes crear tareas para ti mismo"})
		return
	}

	// Verificar que el empleado existe
	var empleado models.Usuario
	if err := config.DB.First(&empleado, req.EmpleadoID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El empleado especificado no existe"})
		return
	}

	// Crear la tarea
	now := time.Now()
	tarea := models.Tarea{
		Titulo:        req.Titulo,
		Descripcion:   req.Descripcion,
		Completada:    false,
		EmpleadoID:    req.EmpleadoID,
		CreadoPor:     userID,
		CreadaEn:      now,
		ActualizadaEn: now,
	}

	if err := config.DB.Create(&tarea).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear tarea"})
		return
	}

	// Cargar relaciones
	config.DB.Preload("Empleado").First(&tarea, tarea.ID)

	response := models.TareaResponse{
		ID:             tarea.ID,
		Titulo:         tarea.Titulo,
		Descripcion:    tarea.Descripcion,
		Completada:     tarea.Completada,
		EmpleadoID:     tarea.EmpleadoID,
		EmpleadoNombre: tarea.Empleado.Nombre,
		CreadoPor:      tarea.CreadoPor,
		CreadaEn:       tarea.CreadaEn,
		ActualizadaEn:  tarea.ActualizadaEn,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateTarea godoc
// @Summary Actualizar tarea
// @Description Actualiza una tarea. Dueño puede actualizar cualquiera, vendedor solo las suyas.
// @Tags Tareas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la tarea"
// @Param request body models.ActualizarTareaRequest true "Datos a actualizar"
// @Success 200 {object} models.TareaResponse
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 403 {object} map[string]string "Sin permisos"
// @Failure 404 {object} map[string]string "Tarea no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/tareas/{id} [patch]
func UpdateTarea(c *gin.Context) {
	userID := c.GetInt("user_id")
	userRol := c.GetString("rol")
	tareaID := c.Param("id")

	var tarea models.Tarea
	if err := config.DB.First(&tarea, tareaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tarea no encontrada"})
		return
	}

	// Verificar permisos: vendedor solo puede actualizar sus propias tareas
	if userRol == "empleado" && tarea.EmpleadoID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permiso para actualizar esta tarea"})
		return
	}

	var req models.ActualizarTareaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	// Actualizar campos si fueron proporcionados
	if req.Titulo != nil {
		if *req.Titulo == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "El título no puede estar vacío"})
			return
		}
		tarea.Titulo = *req.Titulo
	}

	if req.Descripcion != nil {
		tarea.Descripcion = req.Descripcion
	}

	if req.Completada != nil {
		tarea.Completada = *req.Completada
	}

	tarea.ActualizadaEn = time.Now()

	if err := config.DB.Save(&tarea).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar tarea"})
		return
	}

	// Cargar relaciones
	config.DB.Preload("Empleado").First(&tarea, tarea.ID)

	response := models.TareaResponse{
		ID:             tarea.ID,
		Titulo:         tarea.Titulo,
		Descripcion:    tarea.Descripcion,
		Completada:     tarea.Completada,
		EmpleadoID:     tarea.EmpleadoID,
		EmpleadoNombre: tarea.Empleado.Nombre,
		CreadoPor:      tarea.CreadoPor,
		CreadaEn:       tarea.CreadaEn,
		ActualizadaEn:  tarea.ActualizadaEn,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteTarea godoc
// @Summary Eliminar tarea
// @Description Elimina una tarea. Dueño puede eliminar cualquiera, vendedor solo las suyas.
// @Tags Tareas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la tarea"
// @Success 200 {object} map[string]string "Tarea eliminada"
// @Failure 403 {object} map[string]string "Sin permisos"
// @Failure 404 {object} map[string]string "Tarea no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/tareas/{id} [delete]
func DeleteTarea(c *gin.Context) {
	userID := c.GetInt("user_id")
	userRol := c.GetString("rol")
	tareaID := c.Param("id")

	var tarea models.Tarea
	if err := config.DB.First(&tarea, tareaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tarea no encontrada"})
		return
	}

	// Verificar permisos: vendedor solo puede eliminar sus propias tareas
	if userRol == "empleado" && tarea.EmpleadoID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permiso para eliminar esta tarea"})
		return
	}

	if err := config.DB.Delete(&tarea).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar tarea"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tarea eliminada exitosamente"})
}

// GetEmpleadosConTareas godoc
// @Summary Listar empleados con contador de tareas
// @Description Lista todos los empleados con el contador de tareas pendientes (solo dueño)
// @Tags Tareas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} object
// @Failure 403 {object} map[string]string "Sin permisos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/empleados [get]
func GetEmpleadosConTareas(c *gin.Context) {
	userRol := c.GetString("rol")

	// Solo el dueño puede ver la lista de empleados
	if userRol != "dueño" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo el dueño puede ver la lista de empleados"})
		return
	}

	// Obtener empleados con contador de tareas pendientes
	type EmpleadoConTareas struct {
		ID               int    `json:"id"`
		Nombre           string `json:"nombre"`
		Email            string `json:"email"`
		TareasPendientes int64  `json:"tareas_pendientes"`
		TareasTotal      int64  `json:"tareas_total"`
	}

	var empleados []models.Usuario
	// Buscar tanto "vendedor" como "empleado" para compatibilidad
	if err := config.DB.Where("rol IN (?)", []string{"vendedor", "empleado"}).Find(&empleados).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener empleados"})
		return
	}

	var response []EmpleadoConTareas
	for _, emp := range empleados {
		var pendientes int64
		var total int64

		config.DB.Model(&models.Tarea{}).
			Where("empleado_id = ? AND completada = ?", emp.ID, false).
			Count(&pendientes)

		config.DB.Model(&models.Tarea{}).
			Where("empleado_id = ?", emp.ID).
			Count(&total)

		response = append(response, EmpleadoConTareas{
			ID:               emp.ID,
			Nombre:           emp.Nombre,
			Email:            emp.Email,
			TareasPendientes: pendientes,
			TareasTotal:      total,
		})
	}

	c.JSON(http.StatusOK, response)
}
