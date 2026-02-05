package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getClienteID(c *gin.Context) (uint, bool) {
	value, ok := c.Get("cliente_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Cliente no autenticado"})
		return 0, false
	}
	clienteID, ok := value.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Cliente no autenticado"})
		return 0, false
	}
	return clienteID, true
}
