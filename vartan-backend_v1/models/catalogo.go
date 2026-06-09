package models

import "time"

type CatalogoOrdenEstado string

const (
	EstadoPendiente   CatalogoOrdenEstado = "pendiente"
	EstadoConfirmada  CatalogoOrdenEstado = "confirmada"
	EstadoCancelada   CatalogoOrdenEstado = "cancelada"
)

type CatalogoOrden struct {
	ID               int                 `gorm:"primaryKey;autoIncrement" json:"id"`
	ClienteNombre    string              `gorm:"type:varchar(100);not null" json:"cliente_nombre"`
	ClienteWhatsapp  string              `gorm:"type:varchar(20);not null" json:"cliente_whatsapp"`
	Estado           CatalogoOrdenEstado `gorm:"type:varchar(20);default:'pendiente'" json:"estado"`
	PrecioFinalVenta float64             `gorm:"type:decimal(10,2);default:0" json:"precio_final_venta"`
	Sena             float64             `gorm:"type:decimal(10,2);default:0" json:"sena"`
	FormaPagoID      *int                `gorm:"default:null" json:"forma_pago_id,omitempty"`
	Observaciones    *string             `gorm:"type:text" json:"observaciones,omitempty"`
	VentaID          *int                `gorm:"default:null" json:"venta_id,omitempty"`
	CreatedAt        time.Time           `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	FormaPago *FormaPago          `gorm:"foreignKey:FormaPagoID" json:"forma_pago,omitempty"`
	Venta     *Venta              `gorm:"foreignKey:VentaID" json:"venta,omitempty"`
	Items     []CatalogoOrdenItem `gorm:"foreignKey:OrdenID" json:"items,omitempty"`
}

func (CatalogoOrden) TableName() string {
	return "catalogo_ordenes"
}

type CatalogoOrdenItem struct {
	ID             int     `gorm:"primaryKey;autoIncrement" json:"id"`
	OrdenID        int     `gorm:"not null" json:"orden_id"`
	ProductoID     int     `gorm:"not null" json:"producto_id"`
	Talle          string  `gorm:"type:varchar(10);not null" json:"talle"`
	Color          string  `gorm:"type:varchar(20);not null" json:"color"`
	Cantidad       int     `gorm:"not null" json:"cantidad"`
	PrecioUnitario float64 `gorm:"type:decimal(10,2);not null;default:0" json:"precio_unitario"`

	Producto Producto `gorm:"foreignKey:ProductoID" json:"producto,omitempty"`
}

func (CatalogoOrdenItem) TableName() string {
	return "catalogo_orden_items"
}

// ── Request / Response structs ────────────────────────────────────────────────

type CatalogoOrdenItemRequest struct {
	ProductoID     int     `json:"producto_id" binding:"required"`
	Talle          string  `json:"talle" binding:"required"`
	Color          string  `json:"color" binding:"required"`
	Cantidad       int     `json:"cantidad" binding:"required,min=1"`
	PrecioUnitario float64 `json:"precio_unitario" binding:"required"`
}

type CatalogoOrdenCreateRequest struct {
	ClienteNombre   string                     `json:"cliente_nombre" binding:"required"`
	ClienteWhatsapp string                     `json:"cliente_whatsapp" binding:"required"`
	Observaciones   *string                    `json:"observaciones"`
	Items           []CatalogoOrdenItemRequest `json:"items" binding:"required,min=1"`
}

type CatalogoOrdenUpdateRequest struct {
	PrecioFinalVenta *float64 `json:"precio_final_venta"`
	Sena             *float64 `json:"sena"`
	FormaPagoID      *int     `json:"forma_pago_id"`
	Observaciones    *string  `json:"observaciones"`
}

// CatalogoProductoResponse — respuesta pública con stock por variante
type CatalogoVarianteStock struct {
	Talle    string `json:"talle"`
	Color    string `json:"color"`
	Cantidad int    `json:"cantidad"`
}

type CatalogoProductoResponse struct {
	ID               int                     `json:"id"`
	Nombre           string                  `json:"nombre"`
	Descripcion      string                  `json:"descripcion"`
	Imagenes         ImagenArray             `json:"imagenes"`
	PrecioMayorista  float64                 `json:"precio_mayorista"`
	TipoProducto     *TipoProducto           `json:"tipo_producto,omitempty"`
	Equipo           *Equipo                 `json:"equipo,omitempty"`
	Variantes        []CatalogoVarianteStock `json:"variantes"`
}
