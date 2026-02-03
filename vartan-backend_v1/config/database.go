package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
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
			port = "5432"
		}
		if user == "" {
			user = "postgres"
		}
		if password == "" {
			password = "postgres"
		}

		// Formato DSN para PostgreSQL
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=America/Argentina/Buenos_Aires",
			host, user, password, dbName, port)
	}

	log.Printf("📡 Conectando a PostgreSQL: %s:%s/%s", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_NAME"))

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Error al conectar a la base de datos:", err)
	}

	log.Println("✅ Conexión exitosa a PostgreSQL")
}

func AutoMigrate(models ...interface{}) {
	log.Println("🔄 Ejecutando migraciones...")
	err := DB.AutoMigrate(models...)
	if err != nil {
		log.Fatal("❌ Error en migración:", err)
	}
	log.Println("✅ Migraciones completadas")
}
