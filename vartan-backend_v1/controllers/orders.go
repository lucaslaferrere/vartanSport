package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func normalizePedidoRole(raw string) string {
	role := strings.TrimSpace(strings.ToLower(raw))
	role = strings.NewReplacer(
		"á", "a",
		"é", "e",
		"í", "i",
		"ó", "o",
		"ú", "u",
		"ñ", "n",
		"ÃƒÂ¡", "a",
		"ÃƒÂ©", "e",
		"ÃƒÂ­", "i",
		"ÃƒÂ³", "o",
		"ÃƒÂº", "u",
		"ÃƒÂ±", "n",
		"ÃƒÂ£Ã‚Â±", "n",
		"Ã¡", "a",
		"Ã©", "e",
		"Ã­", "i",
		"Ã³", "o",
		"Ãº", "u",
		"Ã±", "n",
		"Ã£Â±", "n",
	).Replace(role)

	switch role {
	case "dueno", "owner", "admin":
		return "dueno"
	case "repositor", "repositores":
		return "repositor"
	default:
		return role
	}
}

func pedidosPreload() *gorm.DB {
	return config.DB.
		Preload("Venta").
		Preload("Venta.Cliente").
		Preload("Venta.Usuario").
		Preload("Venta.Detalles").
		Preload("Venta.Detalles.Producto")
}

// GetPedidos godoc
// @Summary Listar todos los pedidos
// @Description Obtiene todos los pedidos (solo duenio)
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Pedido
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/pedidos [get]
func GetPedidos(c *gin.Context) {
	var pedidos []models.Pedido

	if err := pedidosPreload().
		Order("pedidos.fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// GetPedidosByEstado godoc
// @Summary Obtener pedidos por estado
// @Description Obtiene pedidos filtrados por estado (solo duenio)
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param estado path string true "Estado del pedido" Enums(pendiente, despachado, cancelado)
// @Success 200 {array} models.Pedido
// @Failure 400 {object} map[string]string "Estado invalido"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/owner/pedidos/estado/{estado} [get]
func GetPedidosByEstado(c *gin.Context) {
	estado := c.Param("estado")

	if estado != "pendiente" && estado != "despachado" && estado != "cancelado" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado invalido"})
		return
	}

	var pedidos []models.Pedido
	if err := pedidosPreload().
		Where("pedidos.estado = ?", estado).
		Order("pedidos.fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// GetMisPedidos godoc
// @Summary Obtener mis pedidos
// @Description Obtiene los pedidos del usuario autenticado
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Pedido
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/mis-pedidos [get]
func GetMisPedidos(c *gin.Context) {
	userID := c.GetInt("user_id")
	userRol := strings.TrimSpace(strings.ToLower(c.GetString("rol")))
	userRol = strings.NewReplacer(
		"Ã¡", "a",
		"Ã©", "e",
		"Ã­", "i",
		"Ã³", "o",
		"Ãº", "u",
		"Ã±", "n",
		"Ã£Â±", "n",
	).Replace(userRol)
	userRol = normalizePedidoRole(c.GetString("rol"))

	var pedidos []models.Pedido

	baseQuery := pedidosPreload()

	// Filtrar por usuario si no es dueño
	if userRol != "dueno" && userRol != "repositor" {
		baseQuery = baseQuery.Where("venta_id IN (SELECT id FROM venta WHERE usuario_id = ?)", userID)
	}

	if err := baseQuery.
		Order("pedidos.fecha_creacion DESC").
		Find(&pedidos).Error; err != nil {

		fmt.Println("Error en GetMisPedidos:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener pedidos"})
		return
	}

	c.JSON(http.StatusOK, pedidos)
}

// GetPedido godoc
// @Summary Obtener detalle de pedido
// @Description Obtiene un pedido por ID con el detalle de la venta
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del pedido"
// @Success 200 {object} models.Pedido
// @Failure 403 {object} map[string]string "Sin permisos"
// @Failure 404 {object} map[string]string "Pedido no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/pedidos/{id} [get]
func GetPedido(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetInt("user_id")
	userRol := normalizePedidoRole(c.GetString("rol"))

	var pedido models.Pedido
	if err := pedidosPreload().First(&pedido, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}

	if userRol != "dueno" && userRol != "repositor" && pedido.Venta.UsuarioID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tenes permisos para ver este pedido"})
		return
	}

	c.JSON(http.StatusOK, pedido)
}

// UpdatePedidoEstado godoc
// @Summary Actualizar estado de pedido
// @Description Actualiza el estado de un pedido
// @Tags Pedidos
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID del pedido"
// @Param request body models.PedidoUpdateRequest true "Nuevo estado"
// @Success 200 {object} models.Pedido
// @Failure 400 {object} map[string]string "Estado invalido"
// @Failure 404 {object} map[string]string "Pedido no encontrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /api/pedidos/{id} [put]
func UpdatePedidoEstado(c *gin.Context) {
	id := c.Param("id")

	var pedido models.Pedido
	if err := config.DB.First(&pedido, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pedido no encontrado"})
		return
	}

	var req models.PedidoUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos invalidos"})
		return
	}

	if req.Estado != "pendiente" && req.Estado != "despachado" && req.Estado != "cancelado" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Estado invalido"})
		return
	}

	pedido.Estado = req.Estado
	pedido.FechaActualizacion = time.Now()

	if err := config.DB.Save(&pedido).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar pedido"})
		return
	}

	c.JSON(http.StatusOK, pedido)
}
