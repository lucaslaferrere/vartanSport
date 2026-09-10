package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreatePagoVenta godoc
// @Summary Registrar un pago parcial de una venta
// @Description Crea un PagoVenta, descuenta el monto del saldo y opcionalmente adjunta un comprobante
// @Tags Ventas
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Param monto formData number true "Monto del pago"
// @Param forma_pago_id formData int false "ID de la forma de pago"
// @Param comprobante formData file false "Comprobante (PDF/JPG/JPEG/PNG, máx 5MB)"
// @Success 201 {object} models.PagoVenta
// @Failure 400 {object} map[string]string "Datos inválidos o monto excede saldo"
// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/ventas/{id}/pagos [post]
func CreatePagoVenta(c *gin.Context) {
	ventaIDParam := c.Param("id")
	ventaID, err := strconv.Atoi(ventaIDParam)
	if err != nil || ventaID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de venta inválido"})
		return
	}

	var venta models.Venta
	if err := config.DB.First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	if !puedeAccederVenta(c, &venta) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tenés permisos para registrar pagos en esta venta"})
		return
	}

	montoStr := strings.TrimSpace(c.PostForm("monto"))
	if montoStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El campo 'monto' es requerido"})
		return
	}
	monto, err := strconv.ParseFloat(montoStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Monto inválido"})
		return
	}
	if monto <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El monto debe ser mayor a cero"})
		return
	}

	if monto > venta.Saldo {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":        "El monto excede el saldo pendiente de la venta",
			"saldo_actual": venta.Saldo,
			"monto":        monto,
		})
		return
	}

	var formaPagoIDPtr *uint
	if formaPagoStr := strings.TrimSpace(c.PostForm("forma_pago_id")); formaPagoStr != "" {
		formaPagoID, err := strconv.Atoi(formaPagoStr)
		if err != nil || formaPagoID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "forma_pago_id inválido"})
			return
		}
		var formaPago models.FormaPago
		if err := config.DB.First(&formaPago, formaPagoID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Forma de pago no encontrada"})
			return
		}
		fpID := uint(formaPagoID)
		formaPagoIDPtr = &fpID
	}

	var comprobanteURL *string
	if file, err := c.FormFile("comprobante"); err == nil && file != nil {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		allowedExts := map[string]bool{".pdf": true, ".jpg": true, ".jpeg": true, ".png": true}
		if !allowedExts[ext] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se permiten archivos PDF, JPG, JPEG y PNG"})
			return
		}
		if file.Size > 5*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo no puede superar los 5MB"})
			return
		}

		uploadDir := "uploads/comprobantes"
		if err := os.MkdirAll(uploadDir, 0o755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error preparando directorio de comprobantes"})
			return
		}

		filename := fmt.Sprintf("pago_%d_%d%s", venta.ID, time.Now().UnixNano(), ext)
		filePath := filepath.Join(uploadDir, filename)

		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error abriendo comprobante"})
			return
		}
		defer src.Close()

		dst, err := os.Create(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando archivo"})
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, src); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar comprobante"})
			return
		}

		comprobanteURL = &filePath
	}

	pago := models.PagoVenta{
		VentaID:        uint(venta.ID),
		Monto:          monto,
		FormaPagoID:    formaPagoIDPtr,
		ComprobanteURL: comprobanteURL,
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&pago).Error; err != nil {
		tx.Rollback()
		if comprobanteURL != nil {
			os.Remove(*comprobanteURL)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar el pago"})
		return
	}

	// The saldo check above reads outside this transaction, so two concurrent
	// payments can both pass it. The WHERE clause makes the database the
	// arbiter: whichever payment loses the race updates zero rows.
	result := tx.Model(&models.Venta{}).
		Where("id = ? AND saldo >= ?", venta.ID, monto).
		UpdateColumn("saldo", gorm.Expr("saldo - ?", monto))
	if result.Error != nil {
		tx.Rollback()
		if comprobanteURL != nil {
			os.Remove(*comprobanteURL)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar saldo de la venta"})
		return
	}
	if result.RowsAffected == 0 {
		tx.Rollback()
		if comprobanteURL != nil {
			os.Remove(*comprobanteURL)
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "El monto excede el saldo pendiente de la venta"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		if comprobanteURL != nil {
			os.Remove(*comprobanteURL)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al confirmar el pago"})
		return
	}

	config.DB.Preload("FormaPago").First(&pago, pago.ID)
	c.JSON(http.StatusCreated, pago)
}

// GetPagosVenta godoc
// @Summary Listar pagos de una venta
// @Description Devuelve el historial de pagos parciales ordenado por fecha
// @Tags Ventas
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID de la venta"
// @Success 200 {array} models.PagoVenta
// @Failure 400 {object} map[string]string "ID inválido"
// @Failure 404 {object} map[string]string "Venta no encontrada"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/ventas/{id}/pagos [get]
func GetPagosVenta(c *gin.Context) {
	ventaIDParam := c.Param("id")
	ventaID, err := strconv.Atoi(ventaIDParam)
	if err != nil || ventaID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de venta inválido"})
		return
	}

	var venta models.Venta
	if err := config.DB.Select("id").First(&venta, ventaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venta no encontrada"})
		return
	}

	var pagos []models.PagoVenta
	if err := config.DB.
		Preload("FormaPago").
		Where("venta_id = ?", ventaID).
		Order("created_at ASC").
		Find(&pagos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pagos"})
		return
	}

	c.JSON(http.StatusOK, pagos)
}
