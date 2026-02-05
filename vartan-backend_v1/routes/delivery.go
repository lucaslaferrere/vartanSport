// routes/delivery_routes.go
package routes

import (
	"vartan-backend/controllers"
	"vartan-backend/middleware"
	
	"github.com/gin-gonic/gin"
)

// DeliveryRoutes configura las rutas para el módulo de deliveries
func DeliveryRoutes(router *gin.RouterGroup) {
	deliveries := router.Group("/deliveries")
	deliveries.Use(middleware.AuthMiddleware())
	{
		// CRUD
		deliveries.POST("", controllers.CrearDelivery)                  // Crear delivery
		deliveries.GET("", controllers.ListarDeliveries)                // Listar deliveries
		deliveries.GET("/:id", controllers.ObtenerDelivery)             // Obtener delivery
		deliveries.PUT("/:id", controllers.ActualizarDelivery)          // Actualizar delivery
		deliveries.DELETE("/:id", controllers.EliminarDelivery)         // Eliminar delivery
		
		// Estado
		deliveries.PATCH("/:id/estado", controllers.CambiarEstadoDelivery) // Cambiar estado
		
		// Generar documentos PDF
		deliveries.GET("/:id/pdf", controllers.GenerarPDFDelivery)         // Descargar PDF completo
		deliveries.GET("/:id/etiqueta", controllers.GenerarEtiquetaDelivery) // Descargar etiqueta
	}
}
