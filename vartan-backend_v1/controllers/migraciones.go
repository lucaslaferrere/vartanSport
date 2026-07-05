package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RecalcularCostos recorre todas las ventas y recalcula costo y ganancia
// usando el costo_unitario snapshoteado en venta_detalles (no el precio actual del producto).
// Solo ejecutable por el dueño.
func RecalcularCostos(c *gin.Context) {
	var ventas []models.Venta
	if err := config.DB.
		Preload("Detalles").
		Preload("FormaPago").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas"})
		return
	}

	actualizadas := 0
	errores := 0

	for _, venta := range ventas {
		var costo float64
		for _, detalle := range venta.Detalles {
			costo += detalle.CostoUnitario * float64(detalle.Cantidad)
		}

		esFinanciera := venta.FormaPago.Nombre == "Financiera"
		var descuento float64
		if esFinanciera {
			descuento = venta.PrecioVenta * financieraRate
		}

		ganancia := venta.PrecioVenta - costo - descuento

		if err := config.DB.Model(&models.Venta{}).
			Where("id = ?", venta.ID).
			Updates(map[string]interface{}{
				"costo":          costo,
				"ganancia":       ganancia,
				"descuento":      descuento,
				"usa_financiera": esFinanciera,
			}).Error; err != nil {
			errores++
		} else {
			actualizadas++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje":      "Recalculo completado",
		"actualizadas": actualizadas,
		"errores":      errores,
		"total":        len(ventas),
	})
}

// BackfillCostoDetalles rellena costo_unitario en venta_detalles históricos (donde es 0)
// usando el costo_unitario actual del producto. Ejecutar una sola vez después de agregar la columna.
func BackfillCostoDetalles(c *gin.Context) {
	var detalles []models.VentaDetalle
	if err := config.DB.
		Preload("Producto").
		Where("costo_unitario = 0").
		Find(&detalles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener detalles"})
		return
	}

	actualizados := 0
	errores := 0

	for _, detalle := range detalles {
		costo := detalle.Producto.CostoUnitario
		if err := config.DB.Model(&models.VentaDetalle{}).
			Where("id = ?", detalle.ID).
			Update("costo_unitario", costo).Error; err != nil {
			errores++
		} else {
			actualizados++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje":     "Backfill de costos completado",
		"actualizados": actualizados,
		"errores":     errores,
		"total":       len(detalles),
	})
}

// BackfillSueldos godoc
// @Summary Backfill sueldos mensuales desde comisiones históricas
// @Description Para cada fila en comisiones, inserta el sueldo en comisiones_publicitarias_mensuales si no existe ya un registro para ese empleado+mes+año.
// @Tags Migraciones
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/migraciones/backfill-sueldos [get]
func BackfillSueldos(c *gin.Context) {
	var comisiones []models.Comision
	if err := config.DB.Find(&comisiones).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener comisiones"})
		return
	}

	insertados := 0
	omitidos := 0

	for _, com := range comisiones {
		var count int64
		config.DB.Model(&models.ComisionPublicitariaMensual{}).
			Where("empleado_id = ? AND mes = ? AND anio = ?", com.UsuarioID, com.Mes, com.Anio).
			Count(&count)
		if count > 0 {
			omitidos++
			continue
		}
		rec := models.ComisionPublicitariaMensual{
			EmpleadoID: com.UsuarioID,
			Mes:        com.Mes,
			Anio:       com.Anio,
			Sueldo:     com.Sueldo,
		}
		if err := config.DB.Session(&gorm.Session{}).Create(&rec).Error; err != nil {
			continue
		}
		insertados++
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje":    "Backfill de sueldos completado",
		"insertados": insertados,
		"omitidos":   omitidos,
		"total":      len(comisiones),
	})
}

// BackfillPagosFromVentas godoc
// @Summary Backfill pagos_venta desde venta.comprobante_url
// @Description Para cada venta con comprobante_url y sin filas en pagos_venta, inserta el pago inicial
// @Tags Migraciones
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/migraciones/backfill-pagos [get]
func BackfillPagosFromVentas(c *gin.Context) {
	var ventas []models.Venta
	if err := config.DB.
		Where("comprobante_url IS NOT NULL AND comprobante_url <> ''").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas"})
		return
	}

	insertados := 0
	omitidos := 0

	for _, venta := range ventas {
		var count int64
		config.DB.Model(&models.PagoVenta{}).Where("venta_id = ?", venta.ID).Count(&count)
		if count > 0 {
			omitidos++
			continue
		}

		fpID := uint(venta.FormaPagoID)
		monto := venta.SenaInicial
		if monto == 0 {
			monto = venta.TotalFinal
		}
		pago := models.PagoVenta{
			VentaID:        uint(venta.ID),
			Monto:          monto,
			FormaPagoID:    &fpID,
			ComprobanteURL: venta.ComprobanteURL,
			CreatedAt:      venta.FechaVenta,
		}
		if err := config.DB.Session(&gorm.Session{}).Create(&pago).Error; err != nil {
			continue
		}
		insertados++
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje":    "Backfill completado",
		"insertados": insertados,
		"omitidos":   omitidos,
		"total":      len(ventas),
	})
}
