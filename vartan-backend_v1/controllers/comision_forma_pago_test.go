package controllers

import "testing"

func TestCalcularComisionFormaPago(t *testing.T) {
	tests := []struct {
		nombre     string
		precio     float64
		porcentaje float64
		esperado   float64
		conError   bool
	}{
		{nombre: "cero", precio: 1000, porcentaje: 0, esperado: 0},
		{nombre: "dos y medio", precio: 1000, porcentaje: 2.5, esperado: 25},
		{nombre: "cien", precio: 1000, porcentaje: 100, esperado: 1000},
		{nombre: "redondea a centavos", precio: 199.99, porcentaje: 2.5, esperado: 5},
		{nombre: "negativa", precio: 1000, porcentaje: -0.01, conError: true},
		{nombre: "mayor a cien", precio: 1000, porcentaje: 100.01, conError: true},
	}

	for _, tt := range tests {
		t.Run(tt.nombre, func(t *testing.T) {
			obtenido, err := calcularComisionFormaPago(tt.precio, tt.porcentaje)
			if tt.conError {
				if err == nil {
					t.Fatal("se esperaba error")
				}
				return
			}
			if err != nil {
				t.Fatalf("error inesperado: %v", err)
			}
			if obtenido != tt.esperado {
				t.Fatalf("esperado %.2f, obtenido %.2f", tt.esperado, obtenido)
			}
		})
	}
}
