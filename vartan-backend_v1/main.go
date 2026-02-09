// @title Vartan Backend API
// @version 1.0
// @description API para la gestión de ventas, productos y clientes.
// @host localhost:8080
// @BasePath /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Ingrese el token JWT con el prefijo Bearer: "Bearer {token}"

package main

import (
	"log"
	"os"
	"vartan-backend/config"
	"vartan-backend/models"
	"vartan-backend/routes"

	_ "vartan-backend/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No se encontró archivo .env")
	}

	config.ConnectDatabase()

	config.AutoMigrate(
		&models.Usuario{},
		&models.TipoProducto{},
		&models.Equipo{},
		&models.Producto{},
		&models.ProductoStock{},
		&models.Cliente{},
		&models.FormaPago{},
		&models.Venta{},
		&models.VentaDetalle{},
		&models.Pedido{},
		&models.Comision{},
		&models.Tarea{},
	)
	MigrarGastos()

	SeedTiposProducto()
	SeedEquipos()
	SeedFormasPago()

	gin.SetMode(gin.DebugMode)

	router := gin.Default()

	router.Use(func(c *gin.Context) {
		log.Printf(" %s %s", c.Request.Method, c.Request.URL.Path)
		c.Next()
		log.Printf("%s %s - Status: %d", c.Request.Method, c.Request.URL.Path, c.Writer.Status())
	})

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:5174",
			"https://tu-dominio-frontend.coolify.io",
			"http://tu-dominio-frontend.coolify.io",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Content-Length"},
		MaxAge:           12 * 3600,
	}))

	routes.SetupRoutes(router)

	// Swagger documentation route
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Println("\nRutas registradas:")
	for _, route := range router.Routes() {
		log.Printf("  %s %s", route.Method, route.Path)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Servidor corriendo en http://localhost:%s", port)
	router.Run(":" + port)
}

func MigrarGastos() {
	if err := config.DB.AutoMigrate(&models.Gasto{}); err != nil {
		log.Fatal("Error al migrar tabla gastos:", err)
	}
	log.Println(" Tabla 'gastos' migrada exitosamente")
}

func SeedTiposProducto() {
	tiposIniciales := []string{"Camiseta", "Buzo", "Short", "Pantalón", "Remera"}

	for _, nombre := range tiposIniciales {
		var count int64
		config.DB.Model(&models.TipoProducto{}).Where("nombre = ?", nombre).Count(&count)
		if count == 0 {
			config.DB.Create(&models.TipoProducto{Nombre: nombre, Activo: true})
		}
	}
	log.Println(" Tipos de producto verificados/creados")
}

func SeedEquipos() {
	equiposIniciales := []string{"River", "Boca", "AFA", "San Lorenzo", "Racing"}

	for _, nombre := range equiposIniciales {
		var count int64
		config.DB.Model(&models.Equipo{}).Where("nombre = ?", nombre).Count(&count)
		if count == 0 {
			config.DB.Create(&models.Equipo{Nombre: nombre, Activo: true})
		}
	}
	log.Println("Equipos verificados/creados")
}

func SeedFormasPago() {
	formasPago := []string{
		"Transferencia Financiera", // ID 1 - Aplica 3% descuento
		"Transferencia a Cero",     // ID 2
		"Transferencia Bancaria",   // ID 3
		"Efectivo",                 // ID 4
	}

	for _, nombre := range formasPago {
		var count int64
		config.DB.Model(&models.FormaPago{}).Where("nombre = ?", nombre).Count(&count)
		if count == 0 {
			config.DB.Create(&models.FormaPago{Nombre: nombre})
		}
	}
	log.Println("Formas de pago verificadas/creadas")
}
