package models

type Comision struct {
	ID                 int      `gorm:"primaryKey;autoIncrement" json:"id"`
	UsuarioID          int      `gorm:"not null" json:"usuario_id"`
	Mes                int      `gorm:"not null" json:"mes"`
	Anio               int      `gorm:"not null" json:"anio"`
	TotalVentas        float64  `gorm:"type:decimal(10,2);not null;default:0" json:"total_ventas"`
	TotalComision      float64  `gorm:"type:decimal(10,2);not null;default:0" json:"total_comision"`
	Sueldo             float64  `gorm:"type:decimal(10,2);default:0" json:"sueldo"`                         // Sueldo mensual del empleado (snapshot histórico)
	PorcentajeComision float64  `gorm:"type:decimal(5,2);default:0" json:"porcentaje_comision"`             // Porcentaje al momento del cálculo (snapshot histórico)
	GastoPublicitario  *float64 `gorm:"type:decimal(10,2);default:null" json:"gasto_publicitario"`          // NULL = usar gasto del usuario; 0.0 = explícitamente cero
	Observaciones      string   `gorm:"type:text" json:"observaciones"`

	// Relación
	Usuario Usuario `gorm:"foreignKey:UsuarioID" json:"usuario,omitempty"`
}
