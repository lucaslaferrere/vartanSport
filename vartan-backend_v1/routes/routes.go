package routes

import (
	"vartan-backend/controllers"
	"vartan-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Servidor funcionando correctamente"})
	})

	auth := router.Group("/auth")
	{
		auth.POST("/login", controllers.Login)
		auth.POST("/register", controllers.Register)
	}

	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware(), middleware.RestrictRepositorToPedidos())
	{
		api.GET("/profile", controllers.GetProfile)
		api.GET("/me", controllers.GetMe)

		api.GET("/productos", controllers.GetProductos)
		api.GET("/productos/:id", controllers.GetProducto)
		api.GET("/stock", controllers.GetStock)
		api.GET("/stock/producto/:id", controllers.GetStockByProducto)
		api.GET("/stock/producto/:id/talles", controllers.GetStockPorTalle)

		// Tipos de producto
		api.GET("/tipos-producto", controllers.GetTiposProducto)
		api.GET("/tipos-producto/:id", controllers.GetTipoProducto)

		// Equipos
		api.GET("/equipos", controllers.GetEquipos)
		api.GET("/equipos/:id", controllers.GetEquipo)

		api.GET("/clientes", controllers.GetClientes)
		api.GET("/clientes/:id", controllers.GetCliente)
		api.POST("/clientes", middleware.RequireWrite(), controllers.CreateCliente)
		api.POST("/clientes/invitacion", middleware.RequireWrite(), controllers.GenerarInvitacionCliente)
		api.PUT("/clientes/:id", middleware.RequireWrite(), controllers.UpdateCliente)
		api.DELETE("/clientes/:id", middleware.RequireWrite(), controllers.DeleteCliente)

		api.GET("/formas-pago", controllers.GetFormasPago)
		api.GET("/mis-ventas", controllers.GetMisVentas)
		api.POST("/ventas", middleware.RequireWrite(), controllers.CreateVenta)
		api.GET("/ventas/:id", controllers.GetVenta)
		api.PUT("/ventas/:id", middleware.RequireWrite(), controllers.UpdateVenta)
		api.PUT("/ventas/:id/pago", middleware.RequireWrite(), controllers.UpdateVentaPago)
		api.PUT("/ventas/:id/detalles", middleware.RequireWrite(), controllers.UpdateVentaDetalles)
		api.DELETE("/ventas/:id", middleware.RequireWrite(), controllers.DeleteVenta)
		api.GET("/ventas/:id/comprobante", controllers.GetVentaComprobante)
		api.GET("/ventas/:id/comprobante-saldo", controllers.GetVentaComprobanteSaldo)
		api.GET("/ventas/:id/comprobantes", controllers.GetVentaComprobantes)
		api.DELETE("/ventas/:id/comprobante", middleware.RequireWrite(), controllers.DeleteVentaComprobante)
		api.GET("/ventas/:id/pagos", controllers.GetPagosVenta)
		api.POST("/ventas/:id/pagos", middleware.RequireWrite(), controllers.CreatePagoVenta)
		api.GET("/ventas-pendientes", controllers.GetPagosPendientes)

		api.GET("/mis-pedidos", controllers.GetMisPedidos)
		api.GET("/pedidos", middleware.RequirePedidosRead(), controllers.GetPedidos)
		api.GET("/pedidos/:id", controllers.GetPedido)
		api.PUT("/pedidos/:id", controllers.UpdatePedidoEstado)

		api.GET("/mis-comisiones", controllers.GetMisComisiones)
		api.GET("/mi-resumen-comision", controllers.GetMiResumenComision) // Resumen completo para empleado/vendedor

		// Tareas
		api.GET("/tareas", controllers.GetTareas)
		api.POST("/tareas", middleware.RequireWrite(), controllers.CreateTarea)
		api.GET("/tareas/:id", controllers.GetTarea)
		api.PATCH("/tareas/:id", middleware.RequireWrite(), controllers.UpdateTarea)
		api.DELETE("/tareas/:id", middleware.RequireWrite(), controllers.DeleteTarea)
		api.GET("/empleados", controllers.GetEmpleadosConTareas)
	}

	// Rutas modulares de gastos
	GastoRoutes(api)

	// SSE — usa QueryTokenAuthMiddleware porque EventSource no admite headers.
	router.GET("/api/clientes/stream", middleware.QueryTokenAuthMiddleware(), controllers.StreamClientes)

	// Rutas públicas (sin autenticación)
	public := router.Group("/api/public")
	{
		public.POST("/clientes/registro", controllers.RegistroClientePublico)
	}

	// Catálogo mayorista — público, sin auth
	catalogo := router.Group("/api/catalogo")
	{
		catalogo.GET("/productos", controllers.GetCatalogoProductos)
		catalogo.GET("/productos/:id", controllers.GetCatalogoProducto)
		catalogo.POST("/ordenes", controllers.CreateCatalogoOrden)
	}

	// Catálogo mayorista — admin (solo dueño)
	adminCatalogo := router.Group("/api/admin/catalogo")
	adminCatalogo.Use(middleware.AuthMiddleware(), middleware.RequireDueno())
	{
		adminCatalogo.GET("/productos", controllers.AdminGetCatalogoProductos)
		adminCatalogo.POST("/productos", controllers.AdminCreateCatalogoProducto)
		adminCatalogo.PUT("/productos/:id", controllers.AdminUpdateCatalogoProducto)
		adminCatalogo.DELETE("/productos/:id", controllers.AdminDeleteCatalogoProducto)
		adminCatalogo.POST("/productos/:id/imagen", controllers.AdminUploadCatalogoImagen)

		adminCatalogo.GET("/ordenes", controllers.AdminGetCatalogoOrdenes)
		adminCatalogo.GET("/ordenes/:id", controllers.AdminGetCatalogoOrden)
		adminCatalogo.PUT("/ordenes/:id", controllers.AdminUpdateCatalogoOrden)
		adminCatalogo.POST("/ordenes/:id/confirmar", controllers.AdminConfirmarCatalogoOrden)
	}

	owner := router.Group("/api/owner")
	owner.Use(middleware.AuthMiddleware(), middleware.RequireDueno())
	{
		// Dashboard
		owner.GET("/dashboard", controllers.GetDashboardMensual)

		// Usuarios
		owner.GET("/usuarios/vendedores", controllers.GetVendedores)
		owner.PUT("/usuarios/:id/comision-config", controllers.UpdateComisionConfig)

		// Productos
		owner.POST("/productos", controllers.CreateProducto)
		owner.PUT("/productos/:id", controllers.UpdateProducto)
		owner.DELETE("/productos/:id", controllers.DeleteProducto)

		// Stock
		owner.POST("/stock", controllers.AddStockPorTalle)
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
		owner.GET("/venta/:id", controllers.GetVentaByID)
		owner.GET("/ventas/usuario/:id", controllers.GetVentasByUsuario)

		// Pedidos (ver todos)
		owner.GET("/pedidos", controllers.GetPedidos)
		owner.GET("/pedidos/estado/:estado", controllers.GetPedidosByEstado)

		// Comisiones
		owner.GET("/comisiones", controllers.GetAllComisiones)
		owner.GET("/comisiones/usuario/:id", controllers.GetComisionesByUsuario)
		owner.POST("/comisiones/calcular", controllers.CalcularComisionesMesActual)
		owner.PUT("/comisiones/:id/observaciones", controllers.UpdateObservaciones)
		owner.PUT("/comisiones/:id/gasto-publicitario", controllers.UpdateGastoPublicitarioMes)

		// Gasto publicitario mensual (nuevo: el dueño debe setearlo cada mes; default 0)
		owner.GET("/comisiones-publicitarias/usuario/:id", controllers.GetComisionPublicitariaDelMes)
		owner.POST("/comisiones-publicitarias/usuario/:id", controllers.SetComisionPublicitariaDelMes)

		// Migraciones
		owner.POST("/migraciones/recalcular-costos", controllers.RecalcularCostos)
		owner.POST("/migraciones/backfill-costo-detalles", controllers.BackfillCostoDetalles)
		owner.GET("/migraciones/backfill-pagos", controllers.BackfillPagosFromVentas)
		owner.GET("/migraciones/backfill-sueldos", controllers.BackfillSueldos)

		// Comprobantes
		owner.GET("/comprobantes", controllers.GetComprobantes)
		owner.PUT("/comprobantes/:venta_id/revisar", controllers.PutComprobanteRevisado)
		owner.PUT("/comprobantes/revisar-todos", controllers.PutComprobantesRevisarTodos)
		owner.GET("/comprobantes/descargar", controllers.GetComprobantesZip)
	}
}
