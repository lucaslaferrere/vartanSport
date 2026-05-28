package controllers

import (
	"net/http"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
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
