package main

import (
	"fmt"
	"log"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/joho/godotenv"
)

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No se encontró archivo .env")
	}

	// Conectar a la base de datos
	config.ConnectDatabase()

	fmt.Println("========================================")
	fmt.Println("  VERIFICANDO EMPLEADOS EN BASE DE DATOS")
	fmt.Println("========================================")
	fmt.Println()

	// Obtener todos los usuarios con rol empleado
	var usuarios []models.Usuario
	config.DB.Where("rol = ?", "empleado").Find(&usuarios)

	fmt.Printf("Total empleados encontrados: %d\n\n", len(usuarios))

	if len(usuarios) > 0 {
		fmt.Println("Lista de empleados:")
		fmt.Println("========================================")
		for _, user := range usuarios {
			fmt.Printf("ID: %-3d | %-15s | %s | Activo: %v | Comisión: %.1f%%\n",
				user.ID,
				user.Nombre,
				user.Email,
				user.Activo,
				user.PorcentajeComision)
		}
	}

	fmt.Println()
	fmt.Println("✅ Verificación completada")
}
