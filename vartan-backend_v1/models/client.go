package models

import "time"

type Cliente struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Nombre        string    `gorm:"type:varchar(100);not null" json:"nombre"`
	Telefono      string    `gorm:"type:varchar(20)" json:"telefono"`
	Email         string    `gorm:"type:varchar(100)" json:"email"`
	FechaCreacion time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
}

// Para crear un cliente nuevo
type ClienteCreateRequest struct {
	Nombre   string `json:"nombre" binding:"required"`
	Telefono string `json:"telefono"`
	Email    string `json:"email"`
}
