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
		log.Println("⚠️  No se encontró archivo .env")
	}

	config.ConnectDatabase()

	config.AutoMigrate(
		&models.Usuario{},
		&models.Producto{},
		&models.ProductoStock{},
		&models.Cliente{},
		&models.FormaPago{},
		&models.Venta{},
		&models.VentaDetalle{},
		&models.Pedido{},
		&models.Comision{},
	)
	// migraciones
	MigrarGastos()

	// Activar modo debug para ver más detalles
	gin.SetMode(gin.DebugMode)

	// crear el servidor
	router := gin.Default()

	// Middleware para loguear todas las peticiones
	router.Use(func(c *gin.Context) {
		log.Printf("📥 %s %s", c.Request.Method, c.Request.URL.Path)
		c.Next()
		log.Printf("📤 %s %s - Status: %d", c.Request.Method, c.Request.URL.Path, c.Writer.Status())
	})

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Content-Length"},
		MaxAge:           12 * 3600,
	}))

	routes.SetupRoutes(router)

	// Swagger documentation route
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Println("\n📋 Rutas registradas:")
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

// MigrarGastos crea/actualiza la tabla de gastos.
func MigrarGastos() {
	if err := config.DB.AutoMigrate(&models.Gasto{}); err != nil {
		log.Fatal("Error al migrar tabla gastos:", err)
	}
	log.Println("✅ Tabla 'gastos' migrada exitosamente")
}
