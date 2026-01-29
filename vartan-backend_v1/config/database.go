package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	var err error
	var dsn string

	// Verificar si hay DATABASE_URL directa
	dsn = os.Getenv("DATABASE_URL")

	if dsn == "" {
		// Construir DSN desde variables individuales
		host := os.Getenv("DB_HOST")
		port := os.Getenv("DB_PORT")
		dbName := os.Getenv("DB_NAME")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")

		if host == "" {
			host = "localhost"
		}
		if port == "" {
			port = "1433"
		}

		// Si no hay usuario/password, usar Windows Authentication
		if user == "" || password == "" {
			// Formato para Windows Authentication (Trusted Connection)
			dsn = fmt.Sprintf("sqlserver://%s:%s?database=%s&trusted_connection=yes&encrypt=disable",
				host, port, dbName)
			log.Println("🔐 Usando Windows Authentication")
		} else {
			// Formato con usuario y contraseña SQL Server Authentication
			dsn = fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=%s&encrypt=disable",
				user, password, host, port, dbName)
			log.Println("🔐 Usando SQL Server Authentication")
		}
	}

	log.Printf("📡 Conectando a: %s:%s/%s", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_NAME"))

	DB, err = gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Error al conectar a la base de datos:", err)
	}

	log.Println("✅ Conexión exitosa a SQL Server")
}
