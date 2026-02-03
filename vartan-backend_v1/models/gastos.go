package models

import "time"

// Gasto representa un gasto del negocio
type Gasto struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Descripcion string    `json:"descripcion" gorm:"not null" binding:"required"`
	Monto       float64   `json:"monto" gorm:"not null" binding:"required,gt=0"`
	Fecha       time.Time `json:"fecha" gorm:"not null" binding:"required"`
	Categoria   string    `json:"categoria" gorm:"not null" binding:"required"` // Proveedor, Alquiler, Mercadería, Servicios, Otros
	Proveedor   string    `json:"proveedor" gorm:"type:varchar(200)"`           // Nombre del proveedor (opcional)
	MetodoPago  string    `json:"metodo_pago" gorm:"type:varchar(50)"`          // Efectivo, Transferencia, Tarjeta
	Comprobante string    `json:"comprobante" gorm:"type:varchar(100)"`         // Número de factura/recibo
	Notas       string    `json:"notas" gorm:"type:text"`                       // Notas adicionales

	// Relación con cliente (multi-tenant)
	ClienteID uint `json:"cliente_id" gorm:"not null;index"`

	// Auditoría
	UsuarioID uint      `json:"usuario_id" gorm:"index"` // Usuario que registró el gasto
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName especifica el nombre de la tabla
func (Gasto) TableName() string {
	return "gastos"
}

// GastoInput representa los datos de entrada para crear/actualizar un gasto
type GastoInput struct {
	Descripcion string  `json:"descripcion" binding:"required"`
	Monto       float64 `json:"monto" binding:"required,gt=0"`
	Fecha       string  `json:"fecha" binding:"required"` // "2025-02-02" formato YYYY-MM-DD
	Categoria   string  `json:"categoria" binding:"required,oneof=Proveedor Alquiler Mercadería Servicios Otros"`
	Proveedor   string  `json:"proveedor"`
	MetodoPago  string  `json:"metodo_pago" binding:"oneof=Efectivo Transferencia Tarjeta ''"`
	Comprobante string  `json:"comprobante"`
	Notas       string  `json:"notas"`
}

// GastoResumen representa un resumen de gastos por categoría
type GastoResumen struct {
	Categoria string  `json:"categoria"`
	Total     float64 `json:"total"`
	Cantidad  int64   `json:"cantidad"`
}

// GastosPorPeriodo representa gastos totales en un período
type GastosPorPeriodo struct {
	FechaInicio  time.Time      `json:"fecha_inicio"`
	FechaFin     time.Time      `json:"fecha_fin"`
	Total        float64        `json:"total"`
	Cantidad     int64          `json:"cantidad"`
	PorCategoria []GastoResumen `json:"por_categoria"`
}
