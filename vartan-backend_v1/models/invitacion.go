package models

import "time"

// InvitacionCliente representa un token de invitación de un solo uso para el auto-registro de clientes.
type InvitacionCliente struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Token     string    `gorm:"type:varchar(36);uniqueIndex;not null;default:''" json:"token"`
	UsuarioID int       `gorm:"not null;default:0" json:"usuario_id"`
	ExpiresAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"expires_at"`
	Used      bool      `gorm:"default:false" json:"used"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	Usuario Usuario `gorm:"foreignKey:UsuarioID" json:"usuario,omitempty"`
}

func (InvitacionCliente) TableName() string {
	return "invitaciones_cliente"
}

// InvitacionResponse es la respuesta al generar una invitación.
type InvitacionResponse struct {
	URL string `json:"url"`
}
