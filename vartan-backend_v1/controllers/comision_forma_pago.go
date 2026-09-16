package controllers

import (
	"errors"
	"math"
)

var errComisionPorcentajeFueraDeRango = errors.New("comision_porcentaje debe estar entre 0 y 100")

func calcularComisionFormaPago(precio, porcentaje float64) (float64, error) {
	if porcentaje < 0 || porcentaje > 100 {
		return 0, errComisionPorcentajeFueraDeRango
	}

	return math.Round(precio*porcentaje) / 100, nil
}
