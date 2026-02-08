package models

import "time"

// Tarea representa una tarea asignada a un empleado
type Tarea struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Titulo        string    `gorm:"type:varchar(200);not null" json:"titulo"`
	Descripcion   *string   `gorm:"type:text" json:"descripcion,omitempty"`
	Completada    bool      `gorm:"default:false" json:"completada"`
	EmpleadoID    int       `gorm:"not null" json:"empleado_id"`
	CreadoPor     int       `gorm:"not null" json:"creado_por"`
	CreadaEn      time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"creada_en"`
	ActualizadaEn time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"actualizada_en"`

	// Relaciones
	Empleado Usuario `gorm:"foreignKey:EmpleadoID" json:"empleado,omitempty"`
	Creador  Usuario `gorm:"foreignKey:CreadoPor" json:"creador,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Tarea) TableName() string {
	return "tareas"
}

// CrearTareaRequest datos para crear una tarea
type CrearTareaRequest struct {
	Titulo      string  `json:"titulo" binding:"required,max=200"`
	Descripcion *string `json:"descripcion,omitempty" binding:"omitempty,max=1000"`
	EmpleadoID  int     `json:"empleado_id" binding:"required"`
}

// ActualizarTareaRequest datos para actualizar una tarea
type ActualizarTareaRequest struct {
	Titulo      *string `json:"titulo,omitempty" binding:"omitempty,max=200"`
	Descripcion *string `json:"descripcion,omitempty" binding:"omitempty,max=1000"`
	Completada  *bool   `json:"completada,omitempty"`
}

// TareaResponse respuesta de tarea con datos del empleado
type TareaResponse struct {
	ID             int       `json:"id"`
	Titulo         string    `json:"titulo"`
	Descripcion    *string   `json:"descripcion,omitempty"`
	Completada     bool      `json:"completada"`
	EmpleadoID     int       `json:"empleado_id"`
	EmpleadoNombre string    `json:"empleado_nombre"`
	CreadoPor      int       `json:"creado_por"`
	CreadaEn       time.Time `json:"creada_en"`
	ActualizadaEn  time.Time `json:"actualizada_en"`
}
