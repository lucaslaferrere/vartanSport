package controllers

import (
	"fmt"
	"io"
	"vartan-backend/sse"

	"github.com/gin-gonic/gin"
)

// StreamClientes godoc
// @Summary Stream de nuevos clientes (SSE)
// @Description Abre una conexión SSE que emite el evento "new_client" cada vez que un cliente se registra vía magic link. Autenticación mediante query param ?token=JWT (EventSource no admite headers).
// @Tags Clientes
// @Produce text/event-stream
// @Param token query string true "JWT del empleado autenticado"
// @Success 200 {string} string "Flujo de eventos SSE"
// @Router /api/clientes/stream [get]
func StreamClientes(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // Disable Nginx buffering if behind a proxy

	client := sse.ClientesBroker.Subscribe()
	defer sse.ClientesBroker.Unsubscribe(client)

	ctx := c.Request.Context()

	c.Stream(func(w io.Writer) bool {
		select {
		case msg, ok := <-client.Channel():
			if !ok {
				return false
			}
			fmt.Fprint(w, msg)
			return true
		case <-ctx.Done():
			return false
		}
	})
}
