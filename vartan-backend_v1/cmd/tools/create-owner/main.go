package main

import (
	"flag"
	"fmt"
	"log"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	nombre := flag.String("nombre", "", "Nombre del dueño (requerido)")
	email := flag.String("email", "", "Email del dueño (requerido)")
	password := flag.String("password", "admin123", "Password inicial (cambiarla después del primer login)")
	flag.Parse()

	if *nombre == "" || *email == "" {
		log.Fatal("❌ -nombre y -email son requeridos. Uso: create-owner -nombre \"Juan Perez\" -email juan@ejemplo.com [-password miClave]")
	}

	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No se encontró archivo .env")
	}

	config.ConnectDatabase()

	fmt.Println("========================================")
	fmt.Println("  CREANDO USUARIO DUEÑO")
	fmt.Println("========================================")
	fmt.Println()

	var existente models.Usuario
	result := config.DB.Where("rol = ?", "dueño").First(&existente)

	if result.Error == nil {
		fmt.Printf("✅ Ya existe un usuario dueño:\n")
		fmt.Printf("   Nombre: %s\n", existente.Nombre)
		fmt.Printf("   Email: %s\n", existente.Email)
		fmt.Printf("   ID: %d\n", existente.ID)
		fmt.Println()
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("❌ Error al hashear contraseña: %v\n", err)
		return
	}

	usuario := models.Usuario{
		Nombre:             *nombre,
		Email:              *email,
		PasswordHash:       string(hashedPassword),
		Rol:                "dueño",
		Activo:             true,
		PorcentajeComision: 0.0,
		GastoPublicitario:  0.0,
	}

	if err := config.DB.Create(&usuario).Error; err != nil {
		fmt.Printf("❌ Error al crear usuario: %v\n", err)
		return
	}

	fmt.Println("✅ Usuario dueño creado exitosamente")
	fmt.Printf("   Nombre: %s\n", usuario.Nombre)
	fmt.Printf("   Email: %s\n", usuario.Email)
	fmt.Printf("   Password: %s\n", *password)
	fmt.Printf("   ID: %d\n", usuario.ID)
	fmt.Println()
}
