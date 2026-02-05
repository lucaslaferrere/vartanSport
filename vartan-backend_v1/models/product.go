package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// TalleEnum - Enum de talles disponibles
type TalleEnum string

const (
	TalleS   TalleEnum = "S"
	TalleM   TalleEnum = "M"
	TalleL   TalleEnum = "L"
	TalleXL  TalleEnum = "XL"
	TalleXXL TalleEnum = "XXL"
)

// Talles válidos para validación
var TallesValidos = map[TalleEnum]bool{
	TalleS:   true,
	TalleM:   true,
	TalleL:   true,
	TalleXL:  true,
	TalleXXL: true,
}

// ColorEnum - Enum de colores disponibles
type ColorEnum string

const (
	ColorBlanco   ColorEnum = "Blanco"
	ColorNegro    ColorEnum = "Negro"
	ColorAzul     ColorEnum = "Azul"
	ColorRojo     ColorEnum = "Rojo"
	ColorVerde    ColorEnum = "Verde"
	ColorAmarillo ColorEnum = "Amarillo"
	ColorGris     ColorEnum = "Gris"
	ColorRosa     ColorEnum = "Rosa"
	ColorMorado   ColorEnum = "Morado"
	ColorNaranja  ColorEnum = "Naranja"
)

// Colores válidos para validación
var ColoresValidos = map[ColorEnum]bool{
	ColorBlanco:   true,
	ColorNegro:    true,
	ColorAzul:     true,
	ColorRojo:     true,
	ColorVerde:    true,
	ColorAmarillo: true,
	ColorGris:     true,
	ColorRosa:     true,
	ColorMorado:   true,
	ColorNaranja:  true,
}

// TalleArray - Tipo para array de talles (para GORM)
type TalleArray []TalleEnum

func (t TalleArray) Value() (driver.Value, error) {
	return json.Marshal(t)
}

func (t *TalleArray) Scan(value interface{}) error {
	if value == nil {
		*t = TalleArray{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, t)
}

// ColorArray - Tipo para array de colores (para GORM)
type ColorArray []ColorEnum

func (c ColorArray) Value() (driver.Value, error) {
	return json.Marshal(c)
}

func (c *ColorArray) Scan(value interface{}) error {
	if value == nil {
		*c = ColorArray{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, c)
}

type Producto struct {
	ID                 int           `gorm:"primaryKey;autoIncrement" json:"id"`
	Nombre             string        `gorm:"type:varchar(100);not null" json:"nombre"`
	CostoUnitario      float64       `gorm:"type:decimal(10,2);not null" json:"costo_unitario"`
	Activo             bool          `gorm:"default:true" json:"activo"`
	FechaCreacion      time.Time     `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
	TallesDisponibles  TalleArray    `gorm:"type:json" json:"talles_disponibles"`
	ColoresDisponibles ColorArray    `gorm:"type:json" json:"colores_disponibles"`
	TipoProductoID     *int          `gorm:"index" json:"tipo_producto_id"`
	TipoProducto       *TipoProducto `gorm:"foreignKey:TipoProductoID" json:"tipo_producto,omitempty"`
	EquipoID           *int          `gorm:"index" json:"equipo_id"`
	Equipo             *Equipo       `gorm:"foreignKey:EquipoID" json:"equipo,omitempty"`
}

// ProductoResponse - Response con stock total calculado
type ProductoResponse struct {
	ID                 int           `json:"id"`
	Nombre             string        `json:"nombre"`
	CostoUnitario      float64       `json:"costo_unitario"`
	Activo             bool          `json:"activo"`
	FechaCreacion      time.Time     `json:"fecha_creacion"`
	TallesDisponibles  TalleArray    `json:"talles_disponibles"`
	ColoresDisponibles ColorArray    `json:"colores_disponibles"`
	StockTotal         int           `json:"stock_total"`
	TipoProductoID     *int          `json:"tipo_producto_id"`
	TipoProducto       *TipoProducto `json:"tipo_producto,omitempty"`
	EquipoID           *int          `json:"equipo_id"`
	Equipo             *Equipo       `json:"equipo,omitempty"`
}

// tabla productos_stock (stock por talle y color)
type ProductoStock struct {
	ID         int       `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductoID int       `gorm:"not null" json:"producto_id"`
	Producto   Producto  `gorm:"foreignKey:ProductoID" json:"producto,omitempty"`
	Talle      TalleEnum `gorm:"type:varchar(10);not null" json:"talle"`
	Color      ColorEnum `gorm:"type:varchar(20);not null" json:"color"`
	Cantidad   int       `gorm:"default:0" json:"cantidad"`
}

// creo producto nuevo
type ProductoCreateRequest struct {
	Nombre         string      `json:"nombre" binding:"required"`
	CostoUnitario  float64     `json:"costo_unitario" binding:"required"`
	Talles         []TalleEnum `json:"talles"`
	Colores        []ColorEnum `json:"colores"`
	TipoProductoID *int        `json:"tipo_producto_id"`
	EquipoID       *int        `json:"equipo_id"`
}

// actualizar producto
type ProductoUpdateRequest struct {
	Nombre         string      `json:"nombre"`
	CostoUnitario  float64     `json:"costo_unitario"`
	Talles         []TalleEnum `json:"talles"`
	Colores        []ColorEnum `json:"colores"`
	Activo         *bool       `json:"activo"`
	TipoProductoID *int        `json:"tipo_producto_id"`
	EquipoID       *int        `json:"equipo_id"`
}

// agregar stock a un producto (nuevo: múltiples registros)
type StockCreateRequest struct {
	ProductoID int         `json:"producto_id" binding:"required"`
	Talles     []TalleEnum `json:"talles" binding:"required"`
	Colores    []ColorEnum `json:"colores" binding:"required"`
	Cantidad   int         `json:"cantidad" binding:"required"`
}

// StockCreateResponse - Response al crear múltiples stocks
type StockCreateResponse struct {
	Message       string          `json:"message"`
	StocksCreados int             `json:"stocks_creados"`
	Stocks        []ProductoStock `json:"stocks"`
}
