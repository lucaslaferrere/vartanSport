//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Usuario struct {
	ID           int    `gorm:"primaryKey;autoIncrement"`
	Nombre       string `gorm:"type:varchar(100);not null"`
	Email        string `gorm:"type:varchar(100);unique;not null"`
	PasswordHash string `gorm:"column:password_hash;type:varchar(255);not null"`
	Rol          string `gorm:"type:varchar(20);not null"`
	Activo       bool   `gorm:"default:true"`
}

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=vartan_sports port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Error conectando a la base de datos:", err)
	}

	password := "demo1234"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Error generando hash:", err)
	}

	// Actualizar usuario existente
	result := db.Model(&Usuario{}).Where("email = ?", "demo@vartan.com").Update("password_hash", string(hashedPassword))
	if result.Error != nil {
		log.Fatal("Error actualizando usuario:", result.Error)
	}

	if result.RowsAffected == 0 {
		// Si no existe, crearlo
		user := Usuario{
			Nombre:       "Demo User",
			Email:        "demo@vartan.com",
			PasswordHash: string(hashedPassword),
			Rol:          "dueño",
			Activo:       true,
		}
		if err := db.Create(&user).Error; err != nil {
			log.Fatal("Error creando usuario:", err)
		}
		fmt.Println("✅ Usuario creado exitosamente!")
	} else {
		fmt.Println("✅ Contraseña actualizada exitosamente!")
	}

	fmt.Println("Email: demo@vartan.com")
	fmt.Println("Password: demo1234")
}
