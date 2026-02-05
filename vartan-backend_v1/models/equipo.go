package models
import "time"
// Equipo - Equipos de futbol (River, Boca, AFA, etc.)
type Equipo struct {
ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
Nombre        string    `gorm:"type:varchar(255);not null;unique" json:"nombre"`
Activo        bool      `gorm:"default:true" json:"activo"`
FechaCreacion time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
}
// EquipoCreateRequest - Request para crear equipo
type EquipoCreateRequest struct {
Nombre string `json:"nombre" binding:"required"`
}
// EquipoUpdateRequest - Request para actualizar equipo
type EquipoUpdateRequest struct {
Nombre *string `json:"nombre"`
Activo *bool   `json:"activo"`
}
