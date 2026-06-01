package models

import "time"

// ComisionPublicitariaMensual stores the advertising commission value
// that the owner sets explicitly for a given employee+month+year.
// If no record exists for a period, the system defaults to 0.
type ComisionPublicitariaMensual struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	EmpleadoID    int       `gorm:"not null" json:"empleado_id"`
	Mes           int       `gorm:"not null" json:"mes"`
	Anio          int       `gorm:"not null" json:"anio"`
	ValorComision float64   `gorm:"type:decimal(10,2);not null;default:0" json:"valor_comision"`
	Sueldo        float64   `gorm:"type:decimal(10,2);not null;default:0" json:"sueldo"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	Empleado Usuario `gorm:"foreignKey:EmpleadoID" json:"empleado,omitempty"`
}

func (ComisionPublicitariaMensual) TableName() string {
	return "comisiones_publicitarias_mensuales"
}
