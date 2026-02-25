// routes/gasto_routes.go
package routes

import (
	"vartan-backend/controllers"
	"vartan-backend/middleware"

	"github.com/gin-gonic/gin"
)

// GastoRoutes configura las rutas para el módulo de gastos
func GastoRoutes(router *gin.RouterGroup) {
	gastos := router.Group("/gastos")
	gastos.Use(middleware.AuthMiddleware()) // Requiere autenticación
	{
		// Reportes y resúmenes (solo lectura - sin middleware)
		gastos.GET("/resumen", controllers.ObtenerResumenGastos)        // Resumen por categoría
		gastos.GET("/resumen/mensual", controllers.ObtenerGastosPorMes) // Gastos por mes
		gastos.GET("/proveedores", controllers.ListarProveedores)       // Lista de proveedores únicos

		// CRUD básico
		gastos.POST("", middleware.RequireWrite(), controllers.CrearGasto)          // Crear gasto
		gastos.GET("", controllers.ListarGastos)                                    // Listar gastos (con filtros)
		gastos.GET("/:id", controllers.ObtenerGasto)                                // Obtener gasto específico
		gastos.PUT("/:id", middleware.RequireWrite(), controllers.ActualizarGasto)  // Actualizar gasto
		gastos.DELETE("/:id", middleware.RequireWrite(), controllers.EliminarGasto) // Eliminar gasto
	}
}
