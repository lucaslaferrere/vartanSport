package controllers

import (
	"errors"
	"net/http"
	"os"
	"vartan-backend/models"
	"vartan-backend/services"
	"vartan-backend/sse"

	"github.com/gin-gonic/gin"
)

// GenerarInvitacionCliente godoc
// @Summary Generar link de invitación para registro de cliente
// @Description Genera un token UUID único con 24hs de vigencia. El empleado comparte el link resultante con el cliente para que complete su propio registro sin intervención manual.
// @Tags Clientes
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.InvitacionResponse
// @Failure 500 {object} map[string]string "Error interno al generar la invitación"
// @Router /api/clientes/invitacion [post]
func GenerarInvitacionCliente(c *gin.Context) {
	userID := c.GetInt("user_id")

	inv, err := services.CrearInvitacion(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al generar la invitación"})
		return
	}

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "https://mayorea.lrsolutions.com.ar"
	}

	c.JSON(http.StatusOK, models.InvitacionResponse{
		URL: baseURL + "/api/public/clientes/registro?token=" + inv.Token,
	})
}

// RegistroClientePublico godoc
// @Summary Registro de cliente mediante invitación
// @Description Endpoint público. Recibe el token de invitación por query param y los datos del cliente en el body. Crea el cliente y marca el token como usado de forma atómica. El token solo puede utilizarse una vez y expira a las 24hs.
// @Tags Público
// @Accept json
// @Produce json
// @Param token query string true "Token de invitación generado por el empleado"
// @Param request body models.ClienteCreateRequest true "Datos del cliente"
// @Success 201 {object} models.Cliente
// @Failure 400 {object} map[string]string "Token faltante o datos de entrada inválidos"
// @Failure 401 {object} map[string]string "Token inválido, expirado o ya utilizado"
// @Failure 500 {object} map[string]string "Error interno al crear el cliente"
// @Router /api/public/clientes/registro [post]
func RegistroClientePublico(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El parámetro 'token' es requerido"})
		return
	}

	var req models.ClienteCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	cliente, err := services.RegistrarClienteConInvitacion(token, req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrTokenInvalido):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido o no encontrado"})
		case errors.Is(err, services.ErrTokenExpirado):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "El token ha expirado"})
		case errors.Is(err, services.ErrTokenUsado):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "El token ya fue utilizado"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar el cliente"})
		}
		return
	}

	// Notify all connected employees in real-time via SSE.
	sse.ClientesBroker.Broadcast("new_client", cliente)

	c.JSON(http.StatusCreated, cliente)
}
