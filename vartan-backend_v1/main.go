package main

import (
	"log"
	"os"
	"vartan-backend/config"
	"vartan-backend/models"
	"vartan-backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Cargar variables de entorno del archivo .env
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No se encontró archivo .env")
	}

	// tengo q conectar a la bd
	config.ConnectDatabase()

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

	//configuro el cross para q pueda recibir peticiones del front
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Content-Length"},
		MaxAge:           12 * 3600, // 12 horas
	}))

	// config rutas
	routes.SetupRoutes(router)

	// Listar todas las rutas registradas
	log.Println("\n📋 Rutas registradas:")
	for _, route := range router.Routes() {
		log.Printf("  %s %s", route.Method, route.Path)
	}

	//tnego el puerto o el 8
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	//iniciioooo
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
