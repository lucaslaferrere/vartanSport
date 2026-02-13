package main

import (
	"fmt"
	"log"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

type Empleado struct {
	Nombre   string
	Email    string
	Password string
}

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No se encontró archivo .env")
	}

	// Conectar a la base de datos
	config.ConnectDatabase()

	// Lista de empleados a registrar
	empleados := []Empleado{
		{Nombre: "Santino M", Email: "santinom@vartan.com", Password: "SANTINOM1234"},
		{Nombre: "Choco", Email: "choco@vartan.com", Password: "CHOCO1234"},
		{Nombre: "Nico", Email: "nico@vartan.com", Password: "NICO1234"},
		{Nombre: "Thiago", Email: "thiago@vartan.com", Password: "THIAGO1234"},
		{Nombre: "Santino P", Email: "santinop@vartan.com", Password: "SANTINOP1234"},
		{Nombre: "Gaspi", Email: "gaspi@vartan.com", Password: "GASPI1234"},
		{Nombre: "Male", Email: "male@vartan.com", Password: "MALE1234"},
		{Nombre: "Franco", Email: "franco@vartan.com", Password: "FRANCO1234"},
		{Nombre: "Juana", Email: "juana@vartan.com", Password: "JUANA1234"},
	}

	fmt.Println("========================================")
	fmt.Println("  REGISTRO DE EMPLEADOS VENDEDORES")
	fmt.Println("========================================")
	fmt.Println()

	exitosos := 0
	yaExisten := 0
	fallidos := 0

	for _, emp := range empleados {
		fmt.Printf("📝 Registrando: %s...\n", emp.Nombre)

		// Verificar si ya existe
		var existente models.Usuario
		result := config.DB.Where("email = ?", emp.Email).First(&existente)

		if result.Error == nil {
			fmt.Printf("   ℹ️  %s ya existe en la base de datos\n", emp.Nombre)
			fmt.Printf("      Email: %s\n", emp.Email)
			yaExisten++
			fmt.Println()
			continue
		}

		// Hashear la contraseña
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(emp.Password), bcrypt.DefaultCost)
		if err != nil {
			fmt.Printf("   ❌ Error al hashear contraseña: %v\n", err)
			fallidos++
			fmt.Println()
			continue
		}

		// Crear el usuario
		usuario := models.Usuario{
			Nombre:             emp.Nombre,
			Email:              emp.Email,
			PasswordHash:       string(hashedPassword),
			Rol:                "empleado",
			Activo:             true,
			PorcentajeComision: 10.0,
			GastoPublicitario:  0.0,
		}

		if err := config.DB.Create(&usuario).Error; err != nil {
			fmt.Printf("   ❌ Error al registrar: %v\n", err)
			fallidos++
		} else {
			fmt.Printf("   ✅ %s registrado exitosamente\n", emp.Nombre)
			fmt.Printf("      Email: %s\n", emp.Email)
			fmt.Printf("      Password: %s\n", emp.Password)
			fmt.Printf("      ID: %d\n", usuario.ID)
			exitosos++
		}
		fmt.Println()
	}

	fmt.Println("========================================")
	fmt.Println("  RESUMEN")
	fmt.Println("========================================")
	fmt.Println()
	fmt.Printf("Total empleados: %d\n", len(empleados))
	fmt.Printf("✅ Registrados exitosamente: %d\n", exitosos)
	fmt.Printf("ℹ️  Ya existían: %d\n", yaExisten)
	fmt.Printf("❌ Fallidos: %d\n", fallidos)
	fmt.Println()

	if exitosos > 0 || yaExisten > 0 {
		fmt.Println("========================================")
		fmt.Println("  CREDENCIALES DE ACCESO")
		fmt.Println("========================================")
		fmt.Println()
		for _, emp := range empleados {
			fmt.Printf("%-15s | Email: %-25s | Password: %s\n", emp.Nombre, emp.Email, emp.Password)
		}
		fmt.Println()
	}

	fmt.Println("✅ Proceso completado")
}
