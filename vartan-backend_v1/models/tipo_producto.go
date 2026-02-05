package models

import "time"

// TipoProducto - Tipos de producto (Camiseta, Buzo, Short, etc.)
type TipoProducto struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Nombre        string    `gorm:"type:varchar(255);not null;unique" json:"nombre"`
	Activo        bool      `gorm:"default:true" json:"activo"`
	FechaCreacion time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
}

// TipoProductoCreateRequest - Request para crear tipo de producto
type TipoProductoCreateRequest struct {
	Nombre string `json:"nombre" binding:"required"`
}

// TipoProductoUpdateRequest - Request para actualizar tipo de producto
type TipoProductoUpdateRequest struct {
	Nombre *string `json:"nombre"`
	Activo *bool   `json:"activo"`
}
