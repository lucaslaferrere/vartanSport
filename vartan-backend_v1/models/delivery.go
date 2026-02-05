// models/delivery.go
package models

import "time"

// Delivery representa un envío/delivery
type Delivery struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	
	// Datos del comprador
	NombreCompleto string   `json:"nombre_completo" gorm:"not null"`
	DNI            string   `json:"dni" gorm:"type:varchar(20)"`
	Telefono       string   `json:"telefono" gorm:"type:varchar(50)"`
	Email          string   `json:"email" gorm:"type:varchar(100)"`
	
	// Dirección de entrega
	Calle          string   `json:"calle" gorm:"not null"`
	Numero         string   `json:"numero" gorm:"not null"`
	Piso           string   `json:"piso" gorm:"type:varchar(10)"`
	Departamento   string   `json:"departamento" gorm:"type:varchar(10)"`
	CodigoPostal   string   `json:"codigo_postal" gorm:"type:varchar(10)"`
	Ciudad         string   `json:"ciudad" gorm:"not null"`
	Provincia      string   `json:"provincia" gorm:"not null"`
	PaisString     string   `json:"pais" gorm:"type:varchar(50);default:'Argentina'"`
	
	// Referencias adicionales
	EntreCalles    string   `json:"entre_calles" gorm:"type:varchar(200)"`
	Referencias    string   `json:"referencias" gorm:"type:text"` // "Timbre 2B", "Portón azul", etc.
	
	// Datos del pedido
	VentaID        uint     `json:"venta_id" gorm:"index"` // Relación con venta
	NumeroOrden    string   `json:"numero_orden" gorm:"type:varchar(50);uniqueIndex"`
	FechaEntrega   *time.Time `json:"fecha_entrega"` // Fecha estimada de entrega
	HorarioEntrega string   `json:"horario_entrega" gorm:"type:varchar(50)"` // "9-13hs", "14-18hs"
	
	// Estado
	Estado         string   `json:"estado" gorm:"type:varchar(50);default:'Pendiente'"` // Pendiente, En camino, Entregado, Cancelado
	
	// Productos (resumen)
	Productos      string   `json:"productos" gorm:"type:text"` // JSON o texto con lista de productos
	CantidadItems  int      `json:"cantidad_items"`
	MontoTotal     float64  `json:"monto_total"`
	
	// Notas internas
	NotasInternas  string   `json:"notas_internas" gorm:"type:text"`
	
	// Multi-tenant
	ClienteID      uint     `json:"cliente_id" gorm:"not null;index"`
	
	// Auditoría
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// TableName especifica el nombre de la tabla
func (Delivery) TableName() string {
	return "deliveries"
}

// DeliveryInput representa los datos de entrada para crear un delivery
type DeliveryInput struct {
	// Comprador
	NombreCompleto string `json:"nombre_completo" binding:"required"`
	DNI            string `json:"dni"`
	Telefono       string `json:"telefono" binding:"required"`
	Email          string `json:"email"`
	
	// Dirección
	Calle          string `json:"calle" binding:"required"`
	Numero         string `json:"numero" binding:"required"`
	Piso           string `json:"piso"`
	Departamento   string `json:"departamento"`
	CodigoPostal   string `json:"codigo_postal"`
	Ciudad         string `json:"ciudad" binding:"required"`
	Provincia      string `json:"provincia" binding:"required"`
	Pais           string `json:"pais"`
	
	// Referencias
	EntreCalles    string `json:"entre_calles"`
	Referencias    string `json:"referencias"`
	
	// Pedido
	VentaID        uint   `json:"venta_id"`
	NumeroOrden    string `json:"numero_orden"`
	FechaEntrega   string `json:"fecha_entrega"` // "2025-02-05"
	HorarioEntrega string `json:"horario_entrega"`
	
	// Productos
	Productos      string  `json:"productos"`
	CantidadItems  int     `json:"cantidad_items"`
	MontoTotal     float64 `json:"monto_total"`
	
	// Notas
	NotasInternas  string `json:"notas_internas"`
}

// DeliveryResumen es para listar deliveries de forma resumida
type DeliveryResumen struct {
	ID             uint      `json:"id"`
	NombreCompleto string    `json:"nombre_completo"`
	NumeroOrden    string    `json:"numero_orden"`
	Ciudad         string    `json:"ciudad"`
	Estado         string    `json:"estado"`
	FechaEntrega   *time.Time `json:"fecha_entrega"`
	CreatedAt      time.Time `json:"created_at"`
}
