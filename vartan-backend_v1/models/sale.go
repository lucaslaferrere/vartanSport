package models

import "time"

type FormaPago struct {
	ID     int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Nombre string `gorm:"type:varchar(50);not null" json:"nombre"`
}

type Venta struct {
	ID             int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UsuarioID      int       `gorm:"not null" json:"usuario_id"`
	ClienteID      int       `gorm:"not null" json:"cliente_id"`
	FormaPagoID    int       `gorm:"not null" json:"forma_pago_id"`
	FormaPagoSaldoID *int    `gorm:"default:null" json:"forma_pago_saldo_id,omitempty"`
	Transporte     string    `gorm:"type:varchar(50)" json:"transporte"`
	Costo          float64   `gorm:"type:decimal(10,2);not null;default:0" json:"costo"`
	PrecioVenta    float64   `gorm:"type:decimal(10,2);not null;default:0" json:"precio_venta"`
	Ganancia       float64   `gorm:"type:decimal(10,2);not null;default:0" json:"ganancia"`
	Total          float64   `gorm:"type:decimal(10,2);not null;default:0" json:"total"`
	Sena           *float64  `gorm:"type:decimal(10,2);" json:"sena,omitempty"`
	Saldo          float64   `gorm:"type:decimal(10,2);not null;default:0" json:"saldo"`
	Descuento      float64   `gorm:"type:decimal(10,2);default:0" json:"descuento"`
	TotalFinal     float64   `gorm:"type:decimal(10,2);not null;default:0" json:"total_final"`
	UsaFinanciera  bool      `gorm:"default:false" json:"usa_financiera"`
	ComprobanteURL *string   `gorm:"type:varchar(255)" json:"comprobante_url,omitempty"`
	ComprobanteRevisado   bool       `gorm:"default:false" json:"comprobante_revisado"`
	ComprobanteRevisadoAt *time.Time `json:"comprobante_revisado_at,omitempty"`
	Observaciones  *string   `gorm:"type:text" json:"observaciones"`
	FechaVenta     time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_venta"`

	Usuario   Usuario        `gorm:"foreignKey:UsuarioID" json:"usuario,omitempty"`
	Cliente   Cliente        `gorm:"foreignKey:ClienteID" json:"cliente,omitempty"`
	FormaPago FormaPago      `gorm:"foreignKey:FormaPagoID" json:"forma_pago,omitempty"`
	FormaPagoSaldo *FormaPago `gorm:"foreignKey:FormaPagoSaldoID" json:"forma_pago_saldo,omitempty"`
	Detalles  []VentaDetalle `gorm:"foreignKey:VentaID" json:"detalles,omitempty"`
}

func (Venta) TableName() string {
	return "venta"
}

type VentaDetalle struct {
	ID             int     `gorm:"primaryKey;autoIncrement" json:"id"`
	VentaID        int     `gorm:"not null" json:"venta_id"`
	ProductoID     int     `gorm:"not null" json:"producto_id"`
	Talle          string  `gorm:"type:varchar(10);not null" json:"talle"`
	Cantidad       int     `gorm:"not null" json:"cantidad"`
	PrecioUnitario float64 `gorm:"type:decimal(10,2);not null;default:0" json:"precio_unitario"`
	Subtotal       float64 `gorm:"type:decimal(10,2);not null;default:0" json:"subtotal"`

	Producto Producto `gorm:"foreignKey:ProductoID" json:"producto,omitempty"`
}

type VentaCreateRequest struct {
	UsuarioID              *int                        `json:"usuario_id" form:"usuario_id"`
	ClienteID              int                         `json:"cliente_id" form:"cliente_id" binding:"required"`
	FormaPagoID            int                         `json:"forma_pago_id" form:"forma_pago_id" binding:"required"`
	PrecioVenta            float64                     `json:"precio_venta" form:"precio_venta"`
	Transporte             string                      `json:"transporte" form:"transporte"`
	Sena                   float64                     `json:"sena" form:"sena"`
	UsaDescuentoFinanciera bool                        `json:"usa_descuento_financiera" form:"usa_descuento_financiera"`
	Observaciones          string                      `json:"observaciones" form:"observaciones"`
	Detalles               []VentaDetalleCreateRequest `json:"detalles" binding:"required"`
}

type VentaCreateFormRequest struct {
	UsuarioID              string `form:"usuario_id"`
	ClienteID              string `form:"cliente_id" binding:"required"`
	FormaPagoID            string `form:"forma_pago_id" binding:"required"`
	Transporte             string `form:"transporte"`
	PrecioVenta            string `form:"precio_venta"`
	Sena                   string `form:"sena"`
	UsaDescuentoFinanciera string `form:"usa_descuento_financiera"`
	Observaciones          string `form:"observaciones"`
	Detalles               string `form:"detalles" binding:"required"`
}

type VentaDetalleCreateRequest struct {
	ProductoID     int     `json:"producto_id" binding:"required"`
	Talle          string  `json:"talle" binding:"required"`
	Cantidad       int     `json:"cantidad" binding:"required"`
	PrecioUnitario float64 `json:"precio_unitario" binding:"required"`
}

type VentaUpdateRequest struct {
	UsuarioID              *int     `json:"usuario_id"`
	ClienteID              *int     `json:"cliente_id"`
	FormaPagoID            *int     `json:"forma_pago_id"`
	Transporte             *string  `json:"transporte"`
	PrecioVenta            *float64 `json:"precio_venta"`
	Sena                   *float64 `json:"sena"`
	UsaDescuentoFinanciera *bool    `json:"usa_descuento_financiera"`
	UsaFinanciera          *bool    `json:"usa_financiera"`
	Observaciones          *string  `json:"observaciones"`
}

type VentaUpdateDetallesRequest struct {
	PrecioVenta            float64                     `json:"precio_venta"`
	Transporte             string                      `json:"transporte"`
	Sena                   float64                     `json:"sena"`
	UsaDescuentoFinanciera bool                        `json:"usa_descuento_financiera"`
	Observaciones          string                      `json:"observaciones"`
	Detalles               []VentaDetalleCreateRequest `json:"detalles" binding:"required"`
}
