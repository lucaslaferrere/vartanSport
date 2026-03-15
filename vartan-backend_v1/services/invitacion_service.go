package services

import (
	"errors"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrTokenInvalido = errors.New("token inválido o no encontrado")
	ErrTokenExpirado = errors.New("el token ha expirado")
	ErrTokenUsado    = errors.New("el token ya fue utilizado")
)

// CrearInvitacion genera un token UUID único con 24hs de vigencia asociado al empleado que lo crea.
func CrearInvitacion(usuarioID int) (models.InvitacionCliente, error) {
	inv := models.InvitacionCliente{
		Token:     uuid.NewString(),
		UsuarioID: usuarioID,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	if err := config.DB.Create(&inv).Error; err != nil {
		return models.InvitacionCliente{}, err
	}
	return inv, nil
}

// RegistrarClienteConInvitacion valida el token, crea el cliente y marca el token como usado,
// todo dentro de una única transacción atómica para evitar condiciones de carrera.
// Si la creación del cliente falla, el token NO queda consumido.
func RegistrarClienteConInvitacion(token string, req models.ClienteCreateRequest) (*models.Cliente, error) {
	var cliente models.Cliente

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var inv models.InvitacionCliente

		if err := tx.Where("token = ? AND used = false", token).First(&inv).Error; err != nil {
			return ErrTokenInvalido
		}

		if time.Now().After(inv.ExpiresAt) {
			return ErrTokenExpirado
		}

		if err := tx.Model(&inv).Update("used", true).Error; err != nil {
			return err
		}

		cliente = models.Cliente{
			UsuarioID:    inv.UsuarioID,
			Nombre:       req.Nombre,
			DNI:          req.DNI,
			Telefono:     req.Telefono,
			Email:        req.Email,
			Direccion:    req.Direccion,
			Ciudad:       req.Ciudad,
			Provincia:    req.Provincia,
			CodigoPostal: req.CodigoPostal,
			Pais:         req.Pais,
		}

		return tx.Create(&cliente).Error
	})

	if err != nil {
		return nil, err
	}
	return &cliente, nil
}
