package models

import "time"

// PagoVenta representa un pago parcial de una venta. Una venta puede
// tener N pagos, cada uno con su propio comprobante y forma de pago.
type PagoVenta struct {
	ID             uint       `json:"id" gorm:"primaryKey;autoIncrement;type:integer"`
	VentaID        uint       `json:"venta_id" gorm:"not null;type:integer;index"`
	Monto          float64    `json:"monto" gorm:"type:numeric(12,2);not null"`
	FormaPagoID    *uint      `json:"forma_pago_id" gorm:"type:integer"`
	FormaPago      *FormaPago `json:"forma_pago,omitempty" gorm:"foreignKey:FormaPagoID"`
	ComprobanteURL *string    `json:"comprobante_url" gorm:"type:varchar(500)"`
	Revisado       bool       `json:"revisado" gorm:"not null;default:false"`
	RevisadoAt     *time.Time `json:"revisado_at"`
	CreatedAt      time.Time  `json:"created_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt      time.Time  `json:"updated_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
}

func (PagoVenta) TableName() string {
	return "pago_venta"
}
