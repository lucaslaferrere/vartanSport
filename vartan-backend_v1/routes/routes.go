package routes

import (
	"vartan-backend/controllers"
	"vartan-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Servidor funcionando correctamente"})
	})

	auth := router.Group("/auth")
	{
		auth.POST("/login", controllers.Login)
		auth.POST("/register", controllers.Register)
	}

	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/profile", controllers.GetProfile)
		api.GET("/me", controllers.GetMe)

		api.GET("/productos", controllers.GetProductos)
		api.GET("/productos/:id", controllers.GetProducto)
		api.GET("/stock", controllers.GetStock)
		api.GET("/stock/producto/:id", controllers.GetStockByProducto)

		// Tipos de producto
		api.GET("/tipos-producto", controllers.GetTiposProducto)
		api.GET("/tipos-producto/:id", controllers.GetTipoProducto)

		// Equipos
		api.GET("/equipos", controllers.GetEquipos)
		api.GET("/equipos/:id", controllers.GetEquipo)

		api.GET("/clientes", controllers.GetClientes)
		api.GET("/clientes/:id", controllers.GetCliente)
		api.POST("/clientes", controllers.CreateCliente)
		api.PUT("/clientes/:id", controllers.UpdateCliente)
		api.DELETE("/clientes/:id", controllers.DeleteCliente)

		api.GET("/formas-pago", controllers.GetFormasPago)
		api.GET("/mis-ventas", controllers.GetMisVentas)
		api.POST("/ventas", controllers.CreateVenta)
		api.GET("/ventas/:id", controllers.GetVenta)
		api.PUT("/ventas/:id", controllers.UpdateVenta)
		api.PUT("/ventas/:id/pago", controllers.UpdateVentaPago)
		api.DELETE("/ventas/:id", controllers.DeleteVenta)
		api.GET("/ventas/:id/comprobante", controllers.GetVentaComprobante)
		api.DELETE("/ventas/:id/comprobante", controllers.DeleteVentaComprobante)

		api.GET("/mis-pedidos", controllers.GetMisPedidos)
		api.PUT("/pedidos/:id", controllers.UpdatePedidoEstado)

		api.GET("/mis-comisiones", controllers.GetMisComisiones)
		api.GET("/mi-resumen-comision", controllers.GetMiResumenComision) // Resumen completo para empleado/vendedor

		// Tareas
		api.GET("/tareas", controllers.GetTareas)
		api.POST("/tareas", controllers.CreateTarea)
		api.GET("/tareas/:id", controllers.GetTarea)
		api.PATCH("/tareas/:id", controllers.UpdateTarea)
		api.DELETE("/tareas/:id", controllers.DeleteTarea)
		api.GET("/empleados", controllers.GetEmpleadosConTareas)
	}

	// Rutas modulares de gastos
	GastoRoutes(api)

	owner := router.Group("/api/owner")
	owner.Use(middleware.AuthMiddleware(), middleware.RequireDueño())
	{
		// Usuarios
		owner.GET("/usuarios/vendedores", controllers.GetVendedores)
		owner.PUT("/usuarios/:id/comision-config", controllers.UpdateComisionConfig)

		// Productos
		owner.POST("/productos", controllers.CreateProducto)
		owner.PUT("/productos/:id", controllers.UpdateProducto)
		owner.DELETE("/productos/:id", controllers.DeleteProducto)

		// Stock
		owner.POST("/stock", controllers.AddStock)
		owner.PUT("/stock/:id", controllers.UpdateStock)

		// Tipos de producto
		owner.POST("/tipos-producto", controllers.CreateTipoProducto)
		owner.PUT("/tipos-producto/:id", controllers.UpdateTipoProducto)
		owner.DELETE("/tipos-producto/:id", controllers.DeleteTipoProducto)

		// Equipos
		owner.POST("/equipos", controllers.CreateEquipo)
		owner.PUT("/equipos/:id", controllers.UpdateEquipo)
		owner.DELETE("/equipos/:id", controllers.DeleteEquipo)

		// Clientes (dueño puede eliminar)
		owner.DELETE("/clientes/:id", controllers.DeleteCliente)

		// Ventas (ver todas)
		owner.GET("/ventas", controllers.GetVentas)
		owner.GET("/ventas/usuario/:id", controllers.GetVentasByUsuario)

		// Pedidos (ver todos)
		owner.GET("/pedidos", controllers.GetPedidos)
		owner.GET("/pedidos/estado/:estado", controllers.GetPedidosByEstado)

		// Comisiones
		owner.GET("/comisiones", controllers.GetAllComisiones)
		owner.GET("/comisiones/usuario/:id", controllers.GetComisionesByUsuario)
		owner.POST("/comisiones/calcular", controllers.CalcularComisionesMesActual)
		owner.PUT("/comisiones/:id/observaciones", controllers.UpdateObservaciones)
	}
}
