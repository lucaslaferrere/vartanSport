package controllers

import (
	"net/http"
	"strconv"
	"strings"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
)

func isOwnerRole(raw string) bool {
	role := strings.TrimSpace(strings.ToLower(raw))
	role = strings.NewReplacer(
		"á", "a",
		"ñ", "n",
		"Ã¡", "a",
		"Ã±", "n",
		"Ã£Â±", "n",
	).Replace(role)
	return role == "dueno" || role == "owner" || role == "admin"
}

func getStockPorTalle(productoID int) ([]models.StockPorTalleItem, int, error) {
	var stockPorTalle []models.StockPorTalleItem
	if err := config.DB.Model(&models.ProductoStock{}).
		Select("talle, COALESCE(SUM(cantidad), 0) as cantidad").
		Where("producto_id = ?", productoID).
		Group("talle").
		Order("talle").
		Scan(&stockPorTalle).Error; err != nil {
		return nil, 0, err
	}

	stockTotal := 0
	for _, item := range stockPorTalle {
		stockTotal += item.Cantidad
	}

	return stockPorTalle, stockTotal, nil
}

func buildProductoResponse(producto models.Producto, includeCost bool) (models.ProductoResponse, error) {
	stockPorTalle, stockTotal, err := getStockPorTalle(producto.ID)
	if err != nil {
		return models.ProductoResponse{}, err
	}

	var costo *float64
	if includeCost {
		costo = &producto.CostoUnitario
	}

	return models.ProductoResponse{
		ID:                producto.ID,
		Nombre:            producto.Nombre,
		CostoUnitario:     costo,
		Activo:            producto.Activo,
		FechaCreacion:     producto.FechaCreacion,
		TallesDisponibles: producto.TallesDisponibles,
		StockTotal:        stockTotal,
		StockPorTalle:     stockPorTalle,
	}, nil
}

// GetProductos godoc
// @Summary Listar productos
// @Description Obtiene todos los productos activos con stock total
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.ProductoResponse
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/productos [get]
func GetProductos(c *gin.Context) {
	var productos []models.Producto

	query := config.DB.Model(&models.Producto{})
	if c.Query("include_inactive") != "true" {
		query = query.Where("activo = ?", true)
	}
	if err := query.Find(&productos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener productos"})
		return
	}

	includeCost := isOwnerRole(c.GetString("rol"))
	var response []models.ProductoResponse
	for _, p := range productos {
		item, err := buildProductoResponse(p, includeCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular stock"})
			return
		}
		response = append(response, item)
	}

	c.JSON(http.StatusOK, response)
}

// GetProducto godoc
// @Summary Obtener producto por ID
// @Description Obtiene un producto específico por su ID
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Success 200 {object} models.ProductoResponse
// @Failure 404 {object} map[string]string "Producto no encontrado"
// @Router /api/productos/{id} [get]
func GetProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	response, err := buildProductoResponse(producto, isOwnerRole(c.GetString("rol")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al calcular stock"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// CreateProducto godoc
// @Summary Crear producto
// @Description Crea un nuevo producto con talles y colores (solo dueño)
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.ProductoCreateRequest true "Datos del producto"
// @Success 201 {object} models.Producto
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/productos [post]
func CreateProducto(c *gin.Context) {
	var req models.ProductoCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Validar talles
	for _, talle := range req.Talles {
		if !models.TallesValidos[talle] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Talle inválido: " + string(talle)})
			return
		}
	}

	// Validar colores
	for _, color := range req.Colores {
		if !models.ColoresValidos[color] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Color inválido: " + string(color)})
			return
		}
	}

	producto := models.Producto{
		Nombre:             req.Nombre,
		CostoUnitario:      req.CostoUnitario,
		Activo:             true,
		TallesDisponibles:  models.TalleArray(req.Talles),
		ColoresDisponibles: models.ColorArray(req.Colores),
		TipoProductoID:     req.TipoProductoID,
		EquipoID:           req.EquipoID,
	}

	if err := config.DB.Create(&producto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear producto"})
		return
	}

	// Precargar relaciones para la respuesta
	config.DB.Preload("TipoProducto").Preload("Equipo").First(&producto, producto.ID)

	c.JSON(http.StatusCreated, producto)
}

// UpdateProducto godoc
// @Summary Actualizar producto
// @Description Actualiza un producto existente con talles, colores y estado (solo dueño)
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Param request body models.ProductoUpdateRequest true "Datos actualizados"
// @Success 200 {object} models.Producto
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Producto no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/productos/{id} [put]
func UpdateProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	var req models.ProductoUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Actualizar nombre si se proporciona
	if req.Nombre != "" {
		producto.Nombre = req.Nombre
	}

	// Actualizar costo si se proporciona
	if req.CostoUnitario > 0 {
		producto.CostoUnitario = req.CostoUnitario
	}

	// Actualizar talles si se proporcionan
	if req.Talles != nil {
		for _, talle := range req.Talles {
			if !models.TallesValidos[talle] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Talle inválido: " + string(talle)})
				return
			}
		}
		producto.TallesDisponibles = models.TalleArray(req.Talles)
	}

	// Actualizar colores si se proporcionan
	if req.Colores != nil {
		for _, color := range req.Colores {
			if !models.ColoresValidos[color] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Color inválido: " + string(color)})
				return
			}
		}
		producto.ColoresDisponibles = models.ColorArray(req.Colores)
	}

	// Actualizar estado activo si se proporciona
	if req.Activo != nil {
		producto.Activo = *req.Activo
	}

	// Actualizar tipo de producto si se proporciona
	if req.TipoProductoID != nil {
		producto.TipoProductoID = req.TipoProductoID
	}

	// Actualizar equipo si se proporciona
	if req.EquipoID != nil {
		producto.EquipoID = req.EquipoID
	}

	if err := config.DB.Save(&producto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar producto"})
		return
	}

	// Precargar relaciones para la respuesta
	config.DB.Preload("TipoProducto").Preload("Equipo").First(&producto, producto.ID)

	c.JSON(http.StatusOK, producto)
}

// DeleteProducto godoc
// @Summary Eliminar producto
// @Description Desactiva un producto (solo dueño)
// @Tags Productos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Success 200 {object} map[string]string "Producto eliminado exitosamente"
// @Failure 404 {object} map[string]string "Producto no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/productos/{id} [delete]
func DeleteProducto(c *gin.Context) {
	id := c.Param("id")

	var producto models.Producto
	if err := config.DB.First(&producto, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	producto.Activo = false

	if err := config.DB.Save(&producto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar producto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Producto eliminado exitosamente"})
}

// GetStock godoc
// @Summary Listar stock
// @Description Obtiene el stock de todos los productos con talles
// @Tags Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.ProductoStock
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/stock [get]
func GetStock(c *gin.Context) {
	var stock []models.ProductoStock

	query := config.DB
	if isOwnerRole(c.GetString("rol")) {
		query = query.Preload("Producto")
	}

	if err := query.Find(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener stock"})
		return
	}

	c.JSON(http.StatusOK, stock)
}

func GetStockPorTalle(c *gin.Context) {
	productoID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}

	var producto models.Producto
	if err := config.DB.First(&producto, productoID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	stockPorTalle, stockTotal, err := getStockPorTalle(productoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener stock por talle"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"producto_id":     producto.ID,
		"producto_nombre": producto.Nombre,
		"stock_total":     stockTotal,
		"stock_por_talle": stockPorTalle,
	})
}

// GetStockByProducto godoc
// @Summary Obtener stock por producto
// @Description Obtiene el stock de un producto específico
// @Tags Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del producto"
// @Success 200 {array} models.ProductoStock
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/stock/producto/{id} [get]
func GetStockByProducto(c *gin.Context) {
	productoID := c.Param("id")

	var stock []models.ProductoStock
	if err := config.DB.Where("producto_id = ?", productoID).Find(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener stock"})
		return
	}

	c.JSON(http.StatusOK, stock)
}

// AddStock godoc
// @Summary Agregar stock
// @Description Agrega stock a un producto creando registros por cada combinación talle/color (solo dueño)
// @Tags Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.StockCreateRequest true "Datos del stock"
// @Success 201 {object} models.StockCreateResponse
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/stock [post]
func AddStock(c *gin.Context) {
	var req models.StockCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Verificar que el producto exista
	var producto models.Producto
	if err := config.DB.First(&producto, req.ProductoID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	// Validar talles
	for _, talle := range req.Talles {
		if !models.TallesValidos[talle] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Talle inválido: " + string(talle)})
			return
		}
	}

	// Validar colores
	for _, color := range req.Colores {
		if !models.ColoresValidos[color] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Color inválido: " + string(color)})
			return
		}
	}

	// Crear registros por cada combinación talle + color
	var stocksCreados []models.ProductoStock

	for _, talle := range req.Talles {
		for _, color := range req.Colores {
			// Buscar si ya existe stock para esa combinación
			var stock models.ProductoStock
			result := config.DB.Where("producto_id = ? AND talle = ? AND color = ?", req.ProductoID, talle, color).First(&stock)

			if result.Error != nil {
				// No existe, crear nuevo
				stock = models.ProductoStock{
					ProductoID: req.ProductoID,
					Talle:      talle,
					Color:      color,
					Cantidad:   req.Cantidad,
				}
				if err := config.DB.Create(&stock).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear stock"})
					return
				}
			} else {
				// Ya existe, sumar cantidad
				stock.Cantidad += req.Cantidad
				if err := config.DB.Save(&stock).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar stock"})
					return
				}
			}
			stocksCreados = append(stocksCreados, stock)
		}
	}

	response := models.StockCreateResponse{
		Message:       "Stock creado/actualizado exitosamente",
		StocksCreados: len(stocksCreados),
		Stocks:        stocksCreados,
	}

	c.JSON(http.StatusCreated, response)
}

func AddStockPorTalle(c *gin.Context) {
	var req models.StockCreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	var producto models.Producto
	if err := config.DB.First(&producto, req.ProductoID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producto no encontrado"})
		return
	}

	var stocksCreados []models.ProductoStock
	if len(req.CantidadesPorTalle) > 0 {
		for _, item := range req.CantidadesPorTalle {
			stock, err := guardarStockPorTalle(req.ProductoID, item.Talle, item.Cantidad)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			stocksCreados = append(stocksCreados, stock)
		}
	} else {
		if req.Cantidad <= 0 || len(req.Talles) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Debe enviar cantidades_por_talle o talles con cantidad"})
			return
		}
		for _, talle := range req.Talles {
			stock, err := guardarStockPorTalle(req.ProductoID, talle, req.Cantidad)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			stocksCreados = append(stocksCreados, stock)
		}
	}

	response := models.StockCreateResponse{
		Message:       "Stock creado/actualizado exitosamente",
		StocksCreados: len(stocksCreados),
		Stocks:        stocksCreados,
	}

	c.JSON(http.StatusCreated, response)
}

func guardarStockPorTalle(productoID int, talle models.TalleEnum, cantidad int) (models.ProductoStock, error) {
	if !models.TallesValidos[talle] {
		return models.ProductoStock{}, &stockValidationError{"Talle inválido: " + string(talle)}
	}
	if cantidad <= 0 {
		return models.ProductoStock{}, &stockValidationError{"La cantidad debe ser mayor a 0"}
	}

	var stock models.ProductoStock
	result := config.DB.Where("producto_id = ? AND talle = ?", productoID, talle).First(&stock)
	if result.Error != nil {
		stock = models.ProductoStock{
			ProductoID: productoID,
			Talle:      talle,
			Color:      "",
			Cantidad:   cantidad,
		}
		if err := config.DB.Create(&stock).Error; err != nil {
			return models.ProductoStock{}, &stockValidationError{"Error al crear stock"}
		}
		return stock, nil
	}

	stock.Cantidad += cantidad
	if err := config.DB.Save(&stock).Error; err != nil {
		return models.ProductoStock{}, &stockValidationError{"Error al actualizar stock"}
	}
	return stock, nil
}

type stockValidationError struct {
	message string
}

func (e *stockValidationError) Error() string {
	return e.message
}

// UpdateStock godoc
// @Summary Actualizar stock
// @Description Actualiza la cantidad de stock (solo dueño)
// @Tags Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del stock"
// @Param request body object true "Cantidad de stock" example({"cantidad": 10})
// @Success 200 {object} models.ProductoStock
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 404 {object} map[string]string "Stock no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/stock/{id} [put]
func UpdateStock(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var stock models.ProductoStock
	if err := config.DB.First(&stock, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stock no encontrado"})
		return
	}

	var req struct {
		Cantidad int `json:"cantidad" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	stock.Cantidad = req.Cantidad

	if err := config.DB.Save(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar stock"})
		return
	}

	c.JSON(http.StatusOK, stock)
}
