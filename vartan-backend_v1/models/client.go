package models

import "time"

type Cliente struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Nombre        string    `gorm:"type:varchar(100);not null" json:"nombre"`
	Telefono      string    `gorm:"type:varchar(20)" json:"telefono"`
	Email         string    `gorm:"type:varchar(100)" json:"email"`
	Direccion     string    `gorm:"type:varchar(255)" json:"direccion"`
	Ciudad        string    `gorm:"type:varchar(100)" json:"ciudad"`
	Provincia     string    `gorm:"type:varchar(100)" json:"provincia"`
	Pais          string    `gorm:"type:varchar(100)" json:"pais"`
	FechaCreacion time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
}

// Para crear un cliente nuevo
type ClienteCreateRequest struct {
	Nombre    string `json:"nombre" binding:"required"`
	Telefono  string `json:"telefono"`
	Email     string `json:"email"`
	Direccion string `json:"direccion"`
	Ciudad    string `json:"ciudad"`
	Provincia string `json:"provincia"`
	Pais      string `json:"pais"`
}
