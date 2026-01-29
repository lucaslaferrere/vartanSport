package models

import "time"

type Pedido struct {
	ID                 int       `gorm:"primaryKey;autoIncrement" json:"id"`
	VentaID            int       `gorm:"not null" json:"venta_id"`
	Estado             string    `gorm:"type:varchar(20);not null" json:"estado"` // pendiente, despachado, cancelado
	FechaCreacion      time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
	FechaActualizacion time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_actualizacion"`

	Venta Venta `gorm:"foreignKey:VentaID" json:"venta,omitempty"`
}

// actualizar el estado de un pedido
type PedidoUpdateRequest struct {
	Estado string `json:"estado" binding:"required"`
}
