package models

import "time"

// estructura  tabla usuarios en la base de datos
type Usuario struct {
	ID                  int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Nombre              string    `gorm:"type:varchar(100);not null" json:"nombre"`
	Email               string    `gorm:"type:varchar(100);unique;not null" json:"email"`
	PasswordHash        string    `gorm:"type:varchar(255);not null" json:"-"` // el "-" hace que no se devuelva en JSON
	Rol                 string    `gorm:"type:varchar(20);not null" json:"rol"`
	Activo              bool      `gorm:"default:true" json:"activo"`
	PorcentajeComision  float64   `gorm:"type:decimal(5,2);default:10" json:"porcentaje_comision"` // % de comisión (ej: 10 = 10%)
	GastoPublicitario   float64   `gorm:"type:decimal(10,2);default:0" json:"gasto_publicitario"`  // Gasto publicitario mensual
	Sueldo              float64   `gorm:"type:decimal(10,2);default:0" json:"sueldo"`              // Sueldo mensual del empleado
	ObservacionesConfig string    `gorm:"type:text" json:"observaciones_config"`                   // Observaciones de configuración
	FechaCreacion       time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
}

// # para recibir datos del login
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// # devolver la respuesta del login
type LoginResponse struct {
	Token   string  `json:"token"`
	Usuario Usuario `json:"usuario"`
}

// # registrar un usuario nuevo
type RegistroRequest struct {
	Nombre   string `json:"nombre" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Rol      string `json:"rol" binding:"required"`
}

// # actualizar configuración de comisión de un usuario
type UsuarioComisionConfigRequest struct {
	PorcentajeComision float64 `json:"porcentaje_comision" binding:"required"`
	GastoPublicitario  float64 `json:"gasto_publicitario"`
	Sueldo             float64 `json:"sueldo"`
	Observaciones      string  `json:"observaciones"`
}
