package controllers

import (
	"math"
	"net/http"
	"strconv"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// dashboardTZ drives the day bucketing of the daily series. It must match the
// zone the dashboard is read in, or sales near midnight land on the wrong day.
const dashboardTZ = "America/Argentina/Buenos_Aires"

type DashboardDiaItem struct {
	Dia      string  `json:"dia"`
	Actual   float64 `json:"actual"`
	Anterior float64 `json:"anterior"`
}

type DashboardProductoItem struct {
	Nombre         string  `json:"nombre"`
	Cantidad       int     `json:"cantidad"`
	Facturacion    float64 `json:"facturacion"`
	PrecioPromedio int     `json:"precio_promedio"`
}

type DashboardMetodoPagoItem struct {
	Nombre     string  `json:"nombre"`
	Cantidad   int     `json:"cantidad"`
	Monto      float64 `json:"monto"`
	Porcentaje int     `json:"porcentaje"`
}

type DashboardVendedorItem struct {
	Nombre      string  `json:"nombre"`
	Ventas      int     `json:"ventas"`
	Facturacion float64 `json:"facturacion"`
}

type DashboardVentaReciente struct {
	ID             int       `json:"id"`
	FechaVenta     time.Time `json:"fecha_venta"`
	Cliente        string    `json:"cliente"`
	PrimerProducto string    `json:"primer_producto"`
	CantidadItems  int       `json:"cantidad_items"`
	FormaPago      string    `json:"forma_pago"`
	Total          float64   `json:"total"`
	Saldo          float64   `json:"saldo"`
}

type DashboardPrevMetrics struct {
	CantidadVentas int64   `json:"cantidad_ventas"`
	Facturacion    float64 `json:"facturacion"`
	TicketPromedio float64 `json:"ticket_promedio"`
}

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

	Daily           []DashboardDiaItem        `json:"daily"`
	TopProductos    []DashboardProductoItem   `json:"top_productos"`
	MetodosPago     []DashboardMetodoPagoItem `json:"metodos_pago"`
	Vendedores      []DashboardVendedorItem   `json:"vendedores"`
	VentasRecientes []DashboardVentaReciente  `json:"ventas_recientes"`
	PrevMetrics     DashboardPrevMetrics      `json:"prev_metrics"`
}

// ventasPorDia buckets a period's sales by day-of-month, keyed for direct lookup.
func ventasPorDia(inicio, fin time.Time) (map[int]float64, error) {
	var rows []struct {
		Dia   int
		Total float64
	}
	err := config.DB.Model(&models.Venta{}).
		Select("EXTRACT(DAY FROM fecha_venta AT TIME ZONE ?)::int AS dia, COALESCE(SUM(total), 0) AS total", dashboardTZ).
		Where("fecha_venta >= ? AND fecha_venta < ?", inicio, fin).
		Group("dia").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	porDia := make(map[int]float64, len(rows))
	for _, r := range rows {
		porDia[r.Dia] = r.Total
	}
	return porDia, nil
}

func mesAnterior(mes, anio int) (int, int) {
	if mes == 1 {
		return 12, anio - 1
	}
	return mes - 1, anio
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

	if err := config.DB.Table("venta_detalles").
		Joins("JOIN venta ON venta.id = venta_detalles.venta_id").
		Where("venta.fecha_venta >= ? AND venta.fecha_venta < ?", fechaInicio, fechaFin).
		Select("COALESCE(SUM(venta_detalles.cantidad * venta_detalles.costo_unitario), 0)").
		Scan(&costoProductos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular costo de productos"})
		return
	}

	var comisionFinanciera float64
	if err := ventasQuery.Session(&gorm.Session{}).Select("COALESCE(SUM(descuento), 0)").Scan(&comisionFinanciera).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular comisión de financiera"})
		return
	}

	gananciaReal := facturacion - costoProductos - comisionFinanciera

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

	gananciaNeta := gananciaReal - publicidad - comisionVendedores - gastosFijos
	margen := 0.0
	if facturacion != 0 {
		margen = gananciaNeta / facturacion
	}

	// The breakdowns below used to be computed in the browser, which had to pull
	// every sale ever recorded on each dashboard load. They are aggregated here so
	// the page's cost stops growing with historical volume.
	prevMes, prevAnio := mesAnterior(mes, anio)
	prevInicio, prevFin := monthRange(prevMes, prevAnio, loc)

	actualPorDia, err := ventasPorDia(fechaInicio, fechaFin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular ventas por día"})
		return
	}
	prevPorDia, err := ventasPorDia(prevInicio, prevFin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular ventas por día"})
		return
	}

	diasEnMes := fechaFin.AddDate(0, 0, -1).Day()
	daily := make([]DashboardDiaItem, 0, diasEnMes)
	for d := 1; d <= diasEnMes; d++ {
		daily = append(daily, DashboardDiaItem{
			Dia:      strconv.Itoa(d),
			Actual:   actualPorDia[d],
			Anterior: prevPorDia[d],
		})
	}

	topProductos := []DashboardProductoItem{}
	if err := config.DB.Table("venta_detalles").
		Select("COALESCE(productos.nombre, 'Desconocido') AS nombre, COALESCE(SUM(venta_detalles.cantidad), 0) AS cantidad, COALESCE(SUM(venta_detalles.subtotal), 0) AS facturacion").
		Joins("JOIN venta ON venta.id = venta_detalles.venta_id").
		Joins("LEFT JOIN productos ON productos.id = venta_detalles.producto_id").
		Where("venta.fecha_venta >= ? AND venta.fecha_venta < ?", fechaInicio, fechaFin).
		Group("nombre").
		Order("cantidad DESC").
		Limit(10).
		Scan(&topProductos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular productos más vendidos"})
		return
	}
	for i := range topProductos {
		if topProductos[i].Cantidad > 0 {
			topProductos[i].PrecioPromedio = int(math.Round(topProductos[i].Facturacion / float64(topProductos[i].Cantidad)))
		}
	}

	metodosPago := []DashboardMetodoPagoItem{}
	if err := config.DB.Table("venta").
		Select("COALESCE(forma_pagos.nombre, 'Otro') AS nombre, COUNT(*) AS cantidad, COALESCE(SUM(venta.total), 0) AS monto").
		Joins("LEFT JOIN forma_pagos ON forma_pagos.id = venta.forma_pago_id").
		Where("venta.fecha_venta >= ? AND venta.fecha_venta < ?", fechaInicio, fechaFin).
		Group("nombre").
		Scan(&metodosPago).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular métodos de pago"})
		return
	}
	totalMetodos := 0
	for _, m := range metodosPago {
		totalMetodos += m.Cantidad
	}
	for i := range metodosPago {
		if totalMetodos > 0 {
			metodosPago[i].Porcentaje = int(math.Round(float64(metodosPago[i].Cantidad) / float64(totalMetodos) * 100))
		}
	}

	vendedores := []DashboardVendedorItem{}
	if err := config.DB.Table("venta").
		Select("COALESCE(usuarios.nombre, 'Sin asignar') AS nombre, COUNT(*) AS ventas, COALESCE(SUM(venta.total), 0) AS facturacion").
		Joins("LEFT JOIN usuarios ON usuarios.id = venta.usuario_id").
		Where("venta.fecha_venta >= ? AND venta.fecha_venta < ?", fechaInicio, fechaFin).
		Group("nombre").
		Order("facturacion DESC").
		Scan(&vendedores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular ventas por vendedor"})
		return
	}

	ventasRecientes := []DashboardVentaReciente{}
	if err := config.DB.Table("venta").
		Select(`venta.id AS id,
			venta.fecha_venta AS fecha_venta,
			COALESCE(clientes.nombre, '') AS cliente,
			COALESCE(forma_pagos.nombre, '') AS forma_pago,
			venta.total AS total,
			venta.saldo AS saldo,
			(SELECT COUNT(*) FROM venta_detalles vd WHERE vd.venta_id = venta.id) AS cantidad_items,
			COALESCE((SELECT p.nombre FROM venta_detalles vd
				JOIN productos p ON p.id = vd.producto_id
				WHERE vd.venta_id = venta.id ORDER BY vd.id LIMIT 1), '') AS primer_producto`).
		Joins("LEFT JOIN clientes ON clientes.id = venta.cliente_id").
		Joins("LEFT JOIN forma_pagos ON forma_pagos.id = venta.forma_pago_id").
		Where("venta.fecha_venta >= ? AND venta.fecha_venta < ?", fechaInicio, fechaFin).
		Order("venta.fecha_venta DESC").
		Limit(15).
		Scan(&ventasRecientes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas recientes"})
		return
	}

	prevQuery := config.DB.Model(&models.Venta{}).
		Where("fecha_venta >= ? AND fecha_venta < ?", prevInicio, prevFin)

	var prevCantidad int64
	if err := prevQuery.Session(&gorm.Session{}).Count(&prevCantidad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular el mes anterior"})
		return
	}
	var prevFacturacion float64
	if err := prevQuery.Session(&gorm.Session{}).Select("COALESCE(SUM(total), 0)").Scan(&prevFacturacion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular el mes anterior"})
		return
	}
	prevTicket := 0.0
	if prevCantidad > 0 {
		prevTicket = prevFacturacion / float64(prevCantidad)
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

		Daily:           daily,
		TopProductos:    topProductos,
		MetodosPago:     metodosPago,
		Vendedores:      vendedores,
		VentasRecientes: ventasRecientes,
		PrevMetrics: DashboardPrevMetrics{
			CantidadVentas: prevCantidad,
			Facturacion:    prevFacturacion,
			TicketPromedio: prevTicket,
		},
	})
}
