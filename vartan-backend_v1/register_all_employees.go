package main

import (
	"fmt"
	"log"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ No se encontró archivo .env")
	}

	config.ConnectDatabase()

	empleados := []struct {
		Nombre string
		Email  string
	}{
		{"SANTINO M", "santinom@vartan.com"},
		{"CHOCO", "choco@vartan.com"},
		{"NICO", "nico@vartan.com"},
		{"THIAGO", "thiago@vartan.com"},
		{"SANTINO P", "santinop@vartan.com"},
		{"GASPI", "gaspi@vartan.com"},
		{"MALE", "male@vartan.com"},
		{"FRANCO", "franco@vartan.com"},
		{"JUANA", "juana@vartan.com"},
	}

	fmt.Println("🔄 Registrando empleados...")
	fmt.Println()

	for _, emp := range empleados {
		// Verificar si ya existe
		var existente models.Usuario
		result := config.DB.Where("email = ?", emp.Email).First(&existente)

		if result.Error == nil {
			fmt.Printf("⏭️  %s ya está registrado (ID: %d)\n", emp.Nombre, existente.ID)
			continue
		}

		// Crear contraseña: nombre en minúsculas sin espacios + 1234
		nombreLimpio := ""
		for _, char := range emp.Nombre {
			if char != ' ' {
				nombreLimpio += string(char)
			}
		}
		password := fmt.Sprintf("%s1234", nombreLimpio)

		// Hash de la contraseña
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("❌ Error al hashear contraseña para %s: %v\n", emp.Nombre, err)
			continue
		}

		// Crear el usuario
		nuevoUsuario := models.Usuario{
			Nombre:              emp.Nombre,
			Email:               emp.Email,
			PasswordHash:        string(hashedPassword),
			Rol:                 "empleado",
			Activo:              true,
			PorcentajeComision:  10.0,
			GastoPublicitario:   0.0,
			Sueldo:              0.0,
			ObservacionesConfig: "",
		}

		if err := config.DB.Create(&nuevoUsuario).Error; err != nil {
			log.Printf("❌ Error al crear usuario %s: %v\n", emp.Nombre, err)
		} else {
			fmt.Printf("✅ %s registrado exitosamente\n", emp.Nombre)
			fmt.Printf("   📧 Email: %s\n", emp.Email)
			fmt.Printf("   🔑 Contraseña: %s\n", password)
			fmt.Printf("   🆔 ID: %d\n\n", nuevoUsuario.ID)
		}
	}

	fmt.Println("✅ Proceso completado")
	fmt.Println()
	fmt.Println("📋 Resumen de credenciales:")
	fmt.Println("─────────────────────────────────────────")

	for _, emp := range empleados {
		nombreLimpio := ""
		for _, char := range emp.Nombre {
			if char != ' ' {
				nombreLimpio += string(char)
			}
		}
		password := fmt.Sprintf("%s1234", nombreLimpio)
		fmt.Printf("Usuario: %-12s | Email: %-25s | Contraseña: %s\n", emp.Nombre, emp.Email, password)
	}
}
