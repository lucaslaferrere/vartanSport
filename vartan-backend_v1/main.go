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
	"gorm.io/gorm"
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
		&models.PagoVenta{},
		&models.Pedido{},
		&models.Comision{},
		&models.ComisionPublicitariaMensual{},
		&models.Tarea{},
		&models.InvitacionCliente{},
		&models.MigracionAplicada{},
	)
	MigrarGastos()

	SeedTiposProducto()
	SeedEquipos()
	SeedFormasPago()
	if err := BackfillComisionFormaPago(); err != nil {
		log.Fatal("Error aplicando backfill de comisión por forma de pago:", err)
	}

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
			"http://45.55.194.246:3001", // Frontend en producción
			"http://45.55.194.246:8001", // Backend en producción
			"https://vartansports.lrsolutions.com.ar",
			"https://mayorea.lrsolutions.com.ar",
			"https://demo.lrsolutions.com.ar",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		AllowWildcard:    true,
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
	renombres := map[string]string{
		"Transferencia Financiera": "Financiera",
		"Transferencia a Cero":     "Cuenta 0",
		"Transferencia Bancaria":   "Valu Tahiel",
	}
	for anterior, nuevo := range renombres {
		var destinoCount int64
		config.DB.Model(&models.FormaPago{}).Where("nombre = ?", nuevo).Count(&destinoCount)
		if destinoCount == 0 {
			config.DB.Model(&models.FormaPago{}).Where("nombre = ?", anterior).Update("nombre", nuevo)
		}
	}

	formasPago := []models.FormaPago{
		{Nombre: "Señas", ComisionPorcentaje: 0},
		{Nombre: "Financiera", ComisionPorcentaje: 2.5},
		{Nombre: "Valu Tahiel", ComisionPorcentaje: 0},
		{Nombre: "Cuenta 0", ComisionPorcentaje: 0},
		{Nombre: "Efectivo", ComisionPorcentaje: 0},
	}

	for _, formaPago := range formasPago {
		var count int64
		config.DB.Model(&models.FormaPago{}).Where("nombre = ?", formaPago.Nombre).Count(&count)
		if count == 0 {
			config.DB.Create(&formaPago)
		}
	}
	log.Println("Formas de pago verificadas/creadas")
}

const migracionComisionFormaPago = "20260910_comision_forma_pago"

// BackfillComisionFormaPago congela la regla histórica una única vez. El seed
// nunca actualiza filas existentes, para que futuros cambios de tasa sobrevivan
// reinicios y deploys.
func BackfillComisionFormaPago() error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		var aplicada int64
		if err := tx.Model(&models.MigracionAplicada{}).
			Where("id = ?", migracionComisionFormaPago).
			Count(&aplicada).Error; err != nil {
			return err
		}
		if aplicada > 0 {
			return nil
		}

		if err := tx.Model(&models.FormaPago{}).
			Where("nombre = ?", "Financiera").
			Update("comision_porcentaje", 2.5).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.Venta{}).
			Where("usa_financiera = ?", true).
			Update("comision_porcentaje_aplicado", 2.5).Error; err != nil {
			return err
		}

		return tx.Create(&models.MigracionAplicada{ID: migracionComisionFormaPago}).Error
	})
}
