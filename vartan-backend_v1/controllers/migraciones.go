package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RecalcularCostos recorre todas las ventas y recalcula costo, ganancia y detalles
// usando el costo_unitario real de cada producto en la DB.
// Solo ejecutable por el dueño. Idem al proceso en processVenta.
func RecalcularCostos(c *gin.Context) {
	var ventas []models.Venta
	if err := config.DB.
		Preload("Detalles.Producto").
		Find(&ventas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ventas"})
		return
	}

	actualizadas := 0
	errores := 0

	for _, venta := range ventas {
		var costo float64
		for _, detalle := range venta.Detalles {
			costoUnitario := detalle.Producto.CostoUnitario
			subtotal := costoUnitario * float64(detalle.Cantidad)
			costo += subtotal

			// Actualizar detalle
			if err := config.DB.Model(&models.VentaDetalle{}).
				Where("id = ?", detalle.ID).
				Updates(map[string]interface{}{
					"precio_unitario": costoUnitario,
					"subtotal":        subtotal,
				}).Error; err != nil {
				errores++
			}
		}

		var descuento float64
		if venta.UsaFinanciera {
			descuento = venta.PrecioVenta * financieraRate
		}

		ganancia := venta.PrecioVenta - costo - descuento

		if err := config.DB.Model(&models.Venta{}).
			Where("id = ?", venta.ID).
			Updates(map[string]interface{}{
				"costo":    costo,
				"ganancia": ganancia,
				"descuento": descuento,
			}).Error; err != nil {
			errores++
		} else {
			actualizadas++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje":     "Recalculo completado",
		"actualizadas": actualizadas,
		"errores":     errores,
		"total":       len(ventas),
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
