package controllers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const comprobantesDir = "uploads/comprobantes"

// ServeComprobante godoc
// @Summary Descargar un comprobante
// @Description Sirve un comprobante de pago. Requiere un JWT válido en ?token=
// @Tags Ventas
// @Produce octet-stream
// @Param filename path string true "Nombre del archivo"
// @Param token query string true "JWT del usuario autenticado"
// @Success 200 {file} file
// @Failure 400 {object} map[string]string "Nombre de archivo inválido"
// @Failure 401 {object} map[string]string "Token inválido o ausente"
// @Failure 404 {object} map[string]string "Comprobante no encontrado"
// @Router /uploads/comprobantes/{filename} [get]
func ServeComprobante(c *gin.Context) {
	// The route param cannot span path separators, but a bare ".." would still
	// escape the directory, so collapse the name before joining.
	filename := filepath.Base(strings.TrimSpace(c.Param("filename")))
	if filename == "." || filename == ".." || filename == string(filepath.Separator) || filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nombre de archivo inválido"})
		return
	}

	fullPath := filepath.Join(comprobantesDir, filename)
	info, err := os.Stat(fullPath)
	if err != nil || info.IsDir() {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comprobante no encontrado"})
		return
	}

	c.File(fullPath)
}
