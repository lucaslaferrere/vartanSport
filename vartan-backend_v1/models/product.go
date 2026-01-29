package models

import "time"

type Producto struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Nombre        string    `gorm:"type:varchar(100);not null" json:"nombre"`
	CostoUnitario float64   `gorm:"type:decimal(10,2);not null" json:"costo_unitario"`
	Activo        bool      `gorm:"default:true" json:"activo"`
	FechaCreacion time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
}

// tabla productos_stock (stock por talle)
type ProductoStock struct {
	ID         int      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductoID int      `gorm:"not null" json:"producto_id"`
	Producto   Producto `gorm:"foreignKey:ProductoID" json:"producto,omitempty"`
	Talle      string   `gorm:"type:varchar(10);not null" json:"talle"`
	Cantidad   int      `gorm:"default:0" json:"cantidad"`
}

// creo  producto nuevo
type ProductoCreateRequest struct {
	Nombre        string  `json:"nombre" binding:"required"`
	CostoUnitario float64 `json:"costo_unitario" binding:"required"`
}

// agregar stock a un producto
type StockCreateRequest struct {
	ProductoID int    `json:"producto_id" binding:"required"`
	Talle      string `json:"talle" binding:"required"`
	Cantidad   int    `json:"cantidad" binding:"required"`
}
