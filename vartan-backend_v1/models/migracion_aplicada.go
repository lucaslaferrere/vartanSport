package models

import "time"

type MigracionAplicada struct {
	ID        string    `gorm:"primaryKey;type:varchar(100)"`
	AppliedAt time.Time `gorm:"not null;autoCreateTime"`
}

func (MigracionAplicada) TableName() string {
	return "migraciones_aplicadas"
}
