package controllers

import (
	"net/http"
	"strconv"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DashboardMensualResponse struct {
	Mes                int     `json:"mes"`
	Anio               int     `json:"anio"`
	CantidadVentas     int64   `json:"cantidad_ventas"`
	Facturacion        float64 `json:"facturacion"`
	GananciaReal       float64 `json:"ganancia_real"`
	CostoProductos     float64 `json:"costo_productos"`
	Publicidad         float64 `json:"publicidad"`
	ComisionVendedores float64 `json:"comision_vendedores"`
	GastosFijos        float64 `json:"gastos_fijos"`
	GananciaNeta       float64 `json:"ganancia_neta"`
	Margen             float64 `json:"margen"`
	MargenPorcentaje   float64 `json:"margen_porcentaje"`
	FechaInicio        string  `json:"fecha_inicio"`
	FechaFin           string  `json:"fecha_fin"`
}

// GetDashboardMensual godoc
// @Summary Obtener dashboard mensual
// @Description Devuelve KPIs financieros del dashboard para un mes y año específicos (solo dueño)
// @Tags Dashboard
// @Produce json
// @Security BearerAuth
// @Param mes query int false "Mes (1-12, default: mes actual)"
// @Param anio query int false "Año (default: año actual)"
// @Success 200 {object} DashboardMensualResponse
// @Failure 400 {object} map[string]string "Periodo inválido"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/dashboard [get]
func GetDashboardMensual(c *gin.Context) {
	now := time.Now()
	mes := int(now.Month())
	anio := now.Year()

	if rawMes := c.Query("mes"); rawMes != "" {
		parsedMes, err := strconv.Atoi(rawMes)
		if err != nil || parsedMes < 1 || parsedMes > 12 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mes inválido. Debe estar entre 1 y 12"})
			return
		}
		mes = parsedMes
	}

	if rawAnio := c.Query("anio"); rawAnio != "" {
		parsedAnio, err := strconv.Atoi(rawAnio)
		if err != nil || parsedAnio < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Año inválido"})
			return
		}
		anio = parsedAnio
	}

	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cargar zona horaria"})
		return
	}
	fechaInicio, fechaFin := monthRange(mes, anio, loc)

	var cantidadVentas int64
	var facturacion float64
	var costoProductos float64

	ventasQuery := config.DB.Model(&models.Venta{}).
		Where("fecha_venta >= ? AND fecha_venta < ?", fechaInicio, fechaFin)

	if err := ventasQuery.Session(&gorm.Session{}).Count(&cantidadVentas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al contar ventas"})
		return
	}

	if err := ventasQuery.Session(&gorm.Session{}).Select("COALESCE(SUM(total_final), 0)").Scan(&facturacion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular facturación"})
		return
	}

	// Costo calculado desde venta_detalles × costo_unitario del producto (correcto para ventas viejas y nuevas)
	if err := config.DB.Table("venta_detalles").
		Joins("JOIN venta ON venta.id = venta_detalles.venta_id").
		Joins("JOIN productos ON productos.id = venta_detalles.producto_id").
		Where("venta.fecha_venta >= ? AND venta.fecha_venta < ?", fechaInicio, fechaFin).
		Select("COALESCE(SUM(venta_detalles.cantidad * productos.costo_unitario), 0)").
		Scan(&costoProductos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular costo de productos"})
		return
	}

	gananciaReal := facturacion - costoProductos

	var publicidad float64
	if err := config.DB.Model(&models.Comision{}).
		Where("mes = ? AND anio = ?", mes, anio).
		Select("COALESCE(SUM(gasto_publicitario), 0)").
		Scan(&publicidad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular publicidad"})
		return
	}

	var comisionVendedores float64
	if err := config.DB.Model(&models.Comision{}).
		Where("mes = ? AND anio = ?", mes, anio).
		Select("COALESCE(SUM(total_comision), 0)").
		Scan(&comisionVendedores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular comisión de vendedores"})
		return
	}

	var gastosFijos float64
	if err := config.DB.Model(&models.Gasto{}).
		Where("fecha >= ? AND fecha < ?", fechaInicio, fechaFin).
		Select("COALESCE(SUM(monto), 0)").
		Scan(&gastosFijos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular gastos fijos"})
		return
	}

	gananciaNeta := facturacion - costoProductos - publicidad - comisionVendedores - gastosFijos
	margen := 0.0
	if facturacion != 0 {
		margen = gananciaNeta / facturacion
	}

	c.JSON(http.StatusOK, DashboardMensualResponse{
		Mes:                mes,
		Anio:               anio,
		CantidadVentas:     cantidadVentas,
		Facturacion:        facturacion,
		GananciaReal:       gananciaReal,
		CostoProductos:     costoProductos,
		Publicidad:         publicidad,
		ComisionVendedores: comisionVendedores,
		GastosFijos:        gastosFijos,
		GananciaNeta:       gananciaNeta,
		Margen:             margen,
		MargenPorcentaje:   margen * 100,
		FechaInicio:        fechaInicio.Format("2006-01-02"),
		FechaFin:           fechaFin.AddDate(0, 0, -1).Format("2006-01-02"),
	})
}
