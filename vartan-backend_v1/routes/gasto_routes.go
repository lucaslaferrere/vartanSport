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
		// Reportes y resúmenes (PRIMERO para evitar conflictos con /:id)
		gastos.GET("/resumen", controllers.ObtenerResumenGastos)        // Resumen por categoría
		gastos.GET("/resumen/mensual", controllers.ObtenerGastosPorMes) // Gastos por mes
		gastos.GET("/proveedores", controllers.ListarProveedores)       // Lista de proveedores únicos

		// CRUD básico
		gastos.POST("", controllers.CrearGasto)          // Crear gasto
		gastos.GET("", controllers.ListarGastos)         // Listar gastos (con filtros)
		gastos.GET("/:id", controllers.ObtenerGasto)     // Obtener gasto específico
		gastos.PUT("/:id", controllers.ActualizarGasto)  // Actualizar gasto
		gastos.DELETE("/:id", controllers.EliminarGasto) // Eliminar gasto
	}
}
