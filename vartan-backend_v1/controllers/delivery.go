package controllers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"
	"vartan-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CrearDelivery crea un nuevo delivery
func CrearDelivery(c *gin.Context) {
	var input models.DeliveryInput
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	clienteID, ok := getClienteID(c)
	if !ok {
		return
	}
	
	// Generar número de orden si no viene
	numeroOrden := input.NumeroOrden
	if numeroOrden == "" {
		numeroOrden = fmt.Sprintf("DEL-%d", time.Now().Unix())
	}
	
	// Parsear fecha de entrega si viene
	var fechaEntrega *time.Time
	if input.FechaEntrega != "" {
		fecha, err := time.Parse("2006-01-02", input.FechaEntrega)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Fecha de entrega invalida"})
			return
		}
		fechaEntrega = &fecha
	}
	
	// Crear delivery
	delivery := models.Delivery{
		NombreCompleto: input.NombreCompleto,
		DNI:            input.DNI,
		Telefono:       input.Telefono,
		Email:          input.Email,
		Calle:          input.Calle,
		Numero:         input.Numero,
		Piso:           input.Piso,
		Departamento:   input.Departamento,
		CodigoPostal:   input.CodigoPostal,
		Ciudad:         input.Ciudad,
		Provincia:      input.Provincia,
		PaisString:     input.Pais,
		EntreCalles:    input.EntreCalles,
		Referencias:    input.Referencias,
		VentaID:        input.VentaID,
		NumeroOrden:    numeroOrden,
		FechaEntrega:   fechaEntrega,
		HorarioEntrega: input.HorarioEntrega,
		Estado:         "Pendiente",
		Productos:      input.Productos,
		CantidadItems:  input.CantidadItems,
		MontoTotal:     input.MontoTotal,
		NotasInternas:  input.NotasInternas,
		ClienteID:      clienteID,
	}
	
	if err := config.DB.Create(&delivery).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear delivery"})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{
		"message":  "Delivery creado exitosamente",
		"delivery": delivery,
	})
}

// ListarDeliveries lista todos los deliveries
func ListarDeliveries(c *gin.Context) {
	clienteID, ok := getClienteID(c)
	if !ok {
		return
	}
	
	// Filtros
	estado := c.Query("estado")
	ciudad := c.Query("ciudad")
	fechaDesde := c.Query("fecha_desde")
	fechaHasta := c.Query("fecha_hasta")
	
	// Paginación
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}
	offset := (page - 1) * limit
	
	query := config.DB.Where("cliente_id = ?", clienteID)
	
	if estado != "" {
		query = query.Where("estado = ?", estado)
	}
	
	if ciudad != "" {
		query = query.Where("ciudad ILIKE ?", "%"+ciudad+"%")
	}
	
	if fechaDesde != "" {
		query = query.Where("fecha_entrega >= ?", fechaDesde)
	}
	
	if fechaHasta != "" {
		query = query.Where("fecha_entrega <= ?", fechaHasta)
	}
	
	var total int64
	query.Model(&models.Delivery{}).Count(&total)
	
	var deliveries []models.Delivery
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&deliveries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener deliveries"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"deliveries": deliveries,
		"total":      total,
		"page":       page,
		"limit":      limit,
	})
}

// ObtenerDelivery obtiene un delivery por ID
func ObtenerDelivery(c *gin.Context) {
	clienteID, ok := getClienteID(c)
	if !ok {
		return
	}
	deliveryID := c.Param("id")
	
	var delivery models.Delivery
	if err := config.DB.Where("id = ? AND cliente_id = ?", deliveryID, clienteID).First(&delivery).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Delivery no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener delivery"})
		return
	}
	
	c.JSON(http.StatusOK, delivery)
}

// ActualizarDelivery actualiza un delivery
func ActualizarDelivery(c *gin.Context) {
	clienteID, ok := getClienteID(c)
	if !ok {
		return
	}
	deliveryID := c.Param("id")
	
	var delivery models.Delivery
	if err := config.DB.Where("id = ? AND cliente_id = ?", deliveryID, clienteID).First(&delivery).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Delivery no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar delivery"})
		return
	}
	
	var input models.DeliveryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Parsear fecha
	var fechaEntrega *time.Time
	if input.FechaEntrega != "" {
		fecha, err := time.Parse("2006-01-02", input.FechaEntrega)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Fecha de entrega invalida"})
			return
		}
		fechaEntrega = &fecha
	}
	
	// Actualizar campos
	delivery.NombreCompleto = input.NombreCompleto
	delivery.DNI = input.DNI
	delivery.Telefono = input.Telefono
	delivery.Email = input.Email
	delivery.Calle = input.Calle
	delivery.Numero = input.Numero
	delivery.Piso = input.Piso
	delivery.Departamento = input.Departamento
	delivery.CodigoPostal = input.CodigoPostal
	delivery.Ciudad = input.Ciudad
	delivery.Provincia = input.Provincia
	delivery.PaisString = input.Pais
	delivery.EntreCalles = input.EntreCalles
	delivery.Referencias = input.Referencias
	if input.FechaEntrega != "" {
		delivery.FechaEntrega = fechaEntrega
	}
	delivery.HorarioEntrega = input.HorarioEntrega
	delivery.Productos = input.Productos
	delivery.CantidadItems = input.CantidadItems
	delivery.MontoTotal = input.MontoTotal
	delivery.NotasInternas = input.NotasInternas
	
	if err := config.DB.Save(&delivery).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar delivery"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message":  "Delivery actualizado exitosamente",
		"delivery": delivery,
	})
}

// CambiarEstadoDelivery cambia el estado de un delivery
func CambiarEstadoDelivery(c *gin.Context) {
	clienteID, ok := getClienteID(c)
	if !ok {
		return
	}
	deliveryID := c.Param("id")
	
	var input struct {
		Estado string `json:"estado" binding:"required,oneof=Pendiente 'En camino' Entregado Cancelado"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var delivery models.Delivery
	if err := config.DB.Where("id = ? AND cliente_id = ?", deliveryID, clienteID).First(&delivery).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Delivery no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar delivery"})
		return
	}
	
	delivery.Estado = input.Estado
	
	if err := config.DB.Save(&delivery).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cambiar estado"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message":  "Estado actualizado exitosamente",
		"delivery": delivery,
	})
}

// EliminarDelivery elimina un delivery
func EliminarDelivery(c *gin.Context) {
	clienteID, ok := getClienteID(c)
	if !ok {
		return
	}
	deliveryID := c.Param("id")
	
	var delivery models.Delivery
	if err := config.DB.Where("id = ? AND cliente_id = ?", deliveryID, clienteID).First(&delivery).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Delivery no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar delivery"})
		return
	}
	
	if err := config.DB.Delete(&delivery).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar delivery"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Delivery eliminado exitosamente"})
}

// GenerarPDFDelivery genera y descarga el PDF de un delivery
func GenerarPDFDelivery(c *gin.Context) {
	clienteID, ok := getClienteID(c)
	if !ok {
		return
	}
	deliveryID := c.Param("id")
	
	// Obtener delivery
	var delivery models.Delivery
	if err := config.DB.Where("id = ? AND cliente_id = ?", deliveryID, clienteID).First(&delivery).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Delivery no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar delivery"})
		return
	}
	
	// Obtener nombre del negocio (puedes sacarlo de la configuración del cliente)
	nombreNegocio := "Mi Negocio" // TODO: Obtener de la configuración
	
	// Generar PDF
	filepath, err := utils.GenerarPDFDelivery(&delivery, nombreNegocio)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al generar PDF"})
		return
	}
	
	// Descargar PDF
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=delivery_%s.pdf", delivery.NumeroOrden))
	c.Header("Content-Type", "application/pdf")
	c.File(filepath)
	
	// Limpiar archivo temporal después de un tiempo
	go func() {
		time.Sleep(10 * time.Second)
		_ = os.Remove(filepath)
	}()
}

// GenerarEtiquetaDelivery genera y descarga la etiqueta de un delivery
func GenerarEtiquetaDelivery(c *gin.Context) {
	clienteID, ok := getClienteID(c)
	if !ok {
		return
	}
	deliveryID := c.Param("id")
	
	var delivery models.Delivery
	if err := config.DB.Where("id = ? AND cliente_id = ?", deliveryID, clienteID).First(&delivery).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Delivery no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar delivery"})
		return
	}
	
	// Generar etiqueta
	filepath, err := utils.GenerarEtiquetaDelivery(&delivery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al generar etiqueta"})
		return
	}
	
	// Descargar etiqueta
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=etiqueta_%s.pdf", delivery.NumeroOrden))
	c.Header("Content-Type", "application/pdf")
	c.File(filepath)
	
	// Limpiar
	go func() {
		time.Sleep(10 * time.Second)
		_ = os.Remove(filepath)
	}()
}
