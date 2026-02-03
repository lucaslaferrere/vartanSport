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

// CrearGasto crea un nuevo gasto
func CrearGasto(c *gin.Context) {
	var input models.GastoInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Obtener cliente_id del contexto (del middleware de autenticación)
	clienteID, exists := c.Get("cliente_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Cliente no autenticado"})
		return
	}

	// Obtener usuario_id (opcional)
	usuarioID, _ := c.Get("usuario_id")

	// Parsear fecha
	fecha, err := time.Parse("2006-01-02", input.Fecha)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de fecha inválido. Use YYYY-MM-DD"})
		return
	}

	// Crear gasto
	gasto := models.Gasto{
		Descripcion: input.Descripcion,
		Monto:       input.Monto,
		Fecha:       fecha,
		Categoria:   input.Categoria,
		Proveedor:   input.Proveedor,
		MetodoPago:  input.MetodoPago,
		Comprobante: input.Comprobante,
		Notas:       input.Notas,
		ClienteID:   clienteID.(uint),
		UsuarioID:   usuarioID.(uint),
	}

	if err := config.DB.Create(&gasto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear gasto"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Gasto creado exitosamente",
		"gasto":   gasto,
	})
}

// ListarGastos lista todos los gastos con filtros opcionales
func ListarGastos(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")

	// Parámetros de consulta opcionales
	categoria := c.Query("categoria")
	fechaDesde := c.Query("fecha_desde") // YYYY-MM-DD
	fechaHasta := c.Query("fecha_hasta") // YYYY-MM-DD
	proveedor := c.Query("proveedor")

	// Paginación
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	// Construir query
	query := config.DB.Where("cliente_id = ?", clienteID)

	// Aplicar filtros
	if categoria != "" {
		query = query.Where("categoria = ?", categoria)
	}

	if fechaDesde != "" {
		query = query.Where("fecha >= ?", fechaDesde)
	}

	if fechaHasta != "" {
		query = query.Where("fecha <= ?", fechaHasta)
	}

	if proveedor != "" {
		query = query.Where("proveedor ILIKE ?", "%"+proveedor+"%")
	}

	// Contar total
	var total int64
	query.Model(&models.Gasto{}).Count(&total)

	// Obtener gastos
	var gastos []models.Gasto
	if err := query.Order("fecha DESC").Limit(limit).Offset(offset).Find(&gastos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener gastos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"gastos": gastos,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// ObtenerGasto obtiene un gasto por ID
func ObtenerGasto(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")
	gastoID := c.Param("id")

	var gasto models.Gasto
	if err := config.DB.Where("id = ? AND cliente_id = ?", gastoID, clienteID).First(&gasto).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gasto no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener gasto"})
		return
	}

	c.JSON(http.StatusOK, gasto)
}

// ActualizarGasto actualiza un gasto existente
func ActualizarGasto(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")
	gastoID := c.Param("id")

	// Verificar que el gasto existe y pertenece al cliente
	var gasto models.Gasto
	if err := config.DB.Where("id = ? AND cliente_id = ?", gastoID, clienteID).First(&gasto).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gasto no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar gasto"})
		return
	}

	// Obtener datos de entrada
	var input models.GastoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parsear fecha
	fecha, err := time.Parse("2006-01-02", input.Fecha)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de fecha inválido"})
		return
	}

	// Actualizar campos
	gasto.Descripcion = input.Descripcion
	gasto.Monto = input.Monto
	gasto.Fecha = fecha
	gasto.Categoria = input.Categoria
	gasto.Proveedor = input.Proveedor
	gasto.MetodoPago = input.MetodoPago
	gasto.Comprobante = input.Comprobante
	gasto.Notas = input.Notas

	if err := config.DB.Save(&gasto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar gasto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Gasto actualizado exitosamente",
		"gasto":   gasto,
	})
}

// EliminarGasto elimina un gasto
func EliminarGasto(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")
	gastoID := c.Param("id")

	// Verificar que existe y pertenece al cliente
	var gasto models.Gasto
	if err := config.DB.Where("id = ? AND cliente_id = ?", gastoID, clienteID).First(&gasto).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gasto no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar gasto"})
		return
	}

	// Eliminar
	if err := config.DB.Delete(&gasto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar gasto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Gasto eliminado exitosamente"})
}

// ObtenerResumenGastos obtiene un resumen de gastos por categoría
func ObtenerResumenGastos(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")

	// Parámetros opcionales
	fechaDesde := c.Query("fecha_desde")
	fechaHasta := c.Query("fecha_hasta")

	query := config.DB.Model(&models.Gasto{}).Where("cliente_id = ?", clienteID)

	if fechaDesde != "" {
		query = query.Where("fecha >= ?", fechaDesde)
	}

	if fechaHasta != "" {
		query = query.Where("fecha <= ?", fechaHasta)
	}

	// Resumen por categoría
	var resumenCategoria []models.GastoResumen
	if err := query.Select("categoria, SUM(monto) as total, COUNT(*) as cantidad").
		Group("categoria").
		Order("total DESC").
		Scan(&resumenCategoria).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener resumen por categoría"})
		return
	}

	// Total general
	var totalGeneral float64
	var cantidadTotal int64
	if err := query.Select("SUM(monto) as total, COUNT(*) as cantidad").
		Row().
		Scan(&totalGeneral, &cantidadTotal); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener total de gastos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total":         totalGeneral,
		"cantidad":      cantidadTotal,
		"por_categoria": resumenCategoria,
		"fecha_desde":   fechaDesde,
		"fecha_hasta":   fechaHasta,
	})
}

// ObtenerGastosPorMes obtiene gastos agrupados por mes
func ObtenerGastosPorMes(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")

	// Año a consultar (por defecto año actual)
	anio := c.DefaultQuery("anio", strconv.Itoa(time.Now().Year()))

	type GastoPorMes struct {
		Mes      int     `json:"mes"`
		Total    float64 `json:"total"`
		Cantidad int64   `json:"cantidad"`
	}

	var gastosPorMes []GastoPorMes
	if err := config.DB.Model(&models.Gasto{}).
		Select("EXTRACT(MONTH FROM fecha) as mes, SUM(monto) as total, COUNT(*) as cantidad").
		Where("cliente_id = ? AND EXTRACT(YEAR FROM fecha) = ?", clienteID, anio).
		Group("mes").
		Order("mes").
		Scan(&gastosPorMes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener gastos por mes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"anio":  anio,
		"meses": gastosPorMes,
	})
}

// ListarProveedores lista todos los proveedores únicos
func ListarProveedores(c *gin.Context) {
	clienteID, _ := c.Get("cliente_id")

	var proveedores []string
	if err := config.DB.Model(&models.Gasto{}).
		Where("cliente_id = ? AND proveedor != ''", clienteID).
		Distinct("proveedor").
		Order("proveedor").
		Pluck("proveedor", &proveedores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener proveedores"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"proveedores": proveedores})
}
