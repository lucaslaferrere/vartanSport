// utils/pdf_generator.go
package utils

import (
	"fmt"
	"time"
	"vartan-backend/models"
	
	"github.com/jung-kurt/gofpdf"
)

// GenerarPDFDelivery genera un PDF con los datos de delivery
func GenerarPDFDelivery(delivery *models.Delivery, nombreNegocio string) (string, error) {
	// Crear PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	
	// === ENCABEZADO ===
	
	// Logo o nombre del negocio (grande)
	pdf.SetFont("Arial", "B", 20)
	pdf.Cell(0, 15, nombreNegocio)
	pdf.Ln(10)
	
	// Título del documento
	pdf.SetFont("Arial", "B", 16)
	pdf.SetTextColor(100, 100, 100)
	pdf.Cell(0, 10, "DATOS DE ENTREGA / DELIVERY")
	pdf.Ln(12)
	
	// Línea separadora
	pdf.SetDrawColor(200, 200, 200)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(8)
	
	// === INFORMACIÓN DEL PEDIDO ===
	
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(0, 0, 0)
	pdf.Cell(0, 8, "INFORMACION DEL PEDIDO")
	pdf.Ln(8)
	
	pdf.SetFont("Arial", "", 10)
	
	// Número de orden
	if delivery.NumeroOrden != "" {
		pdf.Cell(50, 6, "Numero de Orden:")
		pdf.SetFont("Arial", "B", 10)
		pdf.Cell(0, 6, delivery.NumeroOrden)
		pdf.Ln(6)
		pdf.SetFont("Arial", "", 10)
	}
	
	// Fecha de entrega
	if delivery.FechaEntrega != nil {
		pdf.Cell(50, 6, "Fecha de Entrega:")
		pdf.SetFont("Arial", "B", 10)
		pdf.Cell(0, 6, delivery.FechaEntrega.Format("02/01/2006"))
		pdf.Ln(6)
		pdf.SetFont("Arial", "", 10)
	}
	
	// Horario de entrega
	if delivery.HorarioEntrega != "" {
		pdf.Cell(50, 6, "Horario:")
		pdf.SetFont("Arial", "B", 10)
		pdf.Cell(0, 6, delivery.HorarioEntrega)
		pdf.Ln(6)
		pdf.SetFont("Arial", "", 10)
	}
	
	// Estado
	pdf.Cell(50, 6, "Estado:")
	pdf.SetFont("Arial", "B", 10)
	
	// Color según estado
	switch delivery.Estado {
	case "Pendiente":
		pdf.SetTextColor(255, 165, 0) // Naranja
	case "En camino":
		pdf.SetTextColor(0, 0, 255) // Azul
	case "Entregado":
		pdf.SetTextColor(0, 128, 0) // Verde
	case "Cancelado":
		pdf.SetTextColor(255, 0, 0) // Rojo
	}
	
	pdf.Cell(0, 6, delivery.Estado)
	pdf.SetTextColor(0, 0, 0)
	pdf.Ln(10)
	
	// Línea separadora
	pdf.SetDrawColor(200, 200, 200)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(8)
	
	// === DATOS DEL COMPRADOR ===
	
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "DATOS DEL COMPRADOR")
	pdf.Ln(8)
	
	pdf.SetFont("Arial", "", 10)
	
	// Nombre completo
	pdf.Cell(50, 6, "Nombre Completo:")
	pdf.SetFont("Arial", "B", 11)
	pdf.Cell(0, 6, delivery.NombreCompleto)
	pdf.Ln(6)
	pdf.SetFont("Arial", "", 10)
	
	// DNI
	if delivery.DNI != "" {
		pdf.Cell(50, 6, "DNI:")
		pdf.Cell(0, 6, delivery.DNI)
		pdf.Ln(6)
	}
	
	// Teléfono
	pdf.Cell(50, 6, "Telefono:")
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(0, 6, delivery.Telefono)
	pdf.Ln(6)
	pdf.SetFont("Arial", "", 10)
	
	// Email
	if delivery.Email != "" {
		pdf.Cell(50, 6, "Email:")
		pdf.Cell(0, 6, delivery.Email)
		pdf.Ln(10)
	} else {
		pdf.Ln(4)
	}
	
	// Línea separadora
	pdf.SetDrawColor(200, 200, 200)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(8)
	
	// === DIRECCIÓN DE ENTREGA ===
	
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "DIRECCION DE ENTREGA")
	pdf.Ln(8)
	
	pdf.SetFont("Arial", "", 10)
	
	// Calle y número
	direccionCompleta := fmt.Sprintf("%s %s", delivery.Calle, delivery.Numero)
	
	// Piso y departamento
	if delivery.Piso != "" || delivery.Departamento != "" {
		if delivery.Piso != "" && delivery.Departamento != "" {
			direccionCompleta += fmt.Sprintf(", Piso %s Dto. %s", delivery.Piso, delivery.Departamento)
		} else if delivery.Piso != "" {
			direccionCompleta += fmt.Sprintf(", Piso %s", delivery.Piso)
		} else {
			direccionCompleta += fmt.Sprintf(", Dto. %s", delivery.Departamento)
		}
	}
	
	pdf.Cell(50, 6, "Direccion:")
	pdf.SetFont("Arial", "B", 11)
	pdf.MultiCell(0, 6, direccionCompleta, "", "", false)
	pdf.SetFont("Arial", "", 10)
	
	// Ciudad, Provincia, CP
	ubicacion := delivery.Ciudad
	if delivery.Provincia != "" {
		ubicacion += ", " + delivery.Provincia
	}
	if delivery.CodigoPostal != "" {
		ubicacion += " (CP: " + delivery.CodigoPostal + ")"
	}
	
	pdf.Cell(50, 6, "Localidad:")
	pdf.Cell(0, 6, ubicacion)
	pdf.Ln(6)
	
	// País
	if delivery.PaisString != "" {
		pdf.Cell(50, 6, "Pais:")
		pdf.Cell(0, 6, delivery.PaisString)
		pdf.Ln(6)
	}
	
	pdf.Ln(4)
	
	// Entre calles
	if delivery.EntreCalles != "" {
		pdf.SetFont("Arial", "I", 9)
		pdf.SetTextColor(100, 100, 100)
		pdf.Cell(50, 5, "Entre calles:")
		pdf.Cell(0, 5, delivery.EntreCalles)
		pdf.Ln(5)
		pdf.SetTextColor(0, 0, 0)
		pdf.SetFont("Arial", "", 10)
	}
	
	// Referencias
	if delivery.Referencias != "" {
		pdf.SetFont("Arial", "I", 9)
		pdf.SetTextColor(100, 100, 100)
		pdf.Cell(50, 5, "Referencias:")
		pdf.MultiCell(0, 5, delivery.Referencias, "", "", false)
		pdf.SetTextColor(0, 0, 0)
		pdf.SetFont("Arial", "", 10)
	}
	
	pdf.Ln(6)
	
	// Línea separadora
	pdf.SetDrawColor(200, 200, 200)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(8)
	
	// === DETALLE DEL PEDIDO ===
	
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "DETALLE DEL PEDIDO")
	pdf.Ln(8)
	
	pdf.SetFont("Arial", "", 10)
	
	// Productos
	if delivery.Productos != "" {
		pdf.Cell(50, 6, "Productos:")
		pdf.MultiCell(0, 6, delivery.Productos, "", "", false)
	}
	
	// Cantidad de items
	if delivery.CantidadItems > 0 {
		pdf.Cell(50, 6, "Cantidad de Items:")
		pdf.Cell(0, 6, fmt.Sprintf("%d", delivery.CantidadItems))
		pdf.Ln(6)
	}
	
	// Monto total
	if delivery.MontoTotal > 0 {
		pdf.Cell(50, 6, "Monto Total:")
		pdf.SetFont("Arial", "B", 11)
		pdf.Cell(0, 6, fmt.Sprintf("$ %.2f", delivery.MontoTotal))
		pdf.Ln(10)
		pdf.SetFont("Arial", "", 10)
	}
	
	// Notas internas (si existen)
	if delivery.NotasInternas != "" {
		pdf.SetDrawColor(200, 200, 200)
		pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
		pdf.Ln(8)
		
		pdf.SetFont("Arial", "B", 10)
		pdf.Cell(0, 6, "NOTAS INTERNAS:")
		pdf.Ln(6)
		
		pdf.SetFont("Arial", "I", 9)
		pdf.SetTextColor(100, 100, 100)
		pdf.MultiCell(0, 5, delivery.NotasInternas, "", "", false)
		pdf.SetTextColor(0, 0, 0)
	}
	
	// === PIE DE PÁGINA ===
	
	// Ir al final de la página
	pdf.SetY(-30)
	
	pdf.SetDrawColor(200, 200, 200)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(5)
	
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(150, 150, 150)
	pdf.Cell(0, 5, fmt.Sprintf("Documento generado el %s", time.Now().Format("02/01/2006 15:04")))
	pdf.Ln(4)
	pdf.Cell(0, 5, fmt.Sprintf("Orden #%s", delivery.NumeroOrden))
	
	// Guardar PDF
	filename := fmt.Sprintf("delivery_%s_%d.pdf", delivery.NumeroOrden, time.Now().Unix())
	filepath := fmt.Sprintf("/tmp/%s", filename)
	
	err := pdf.OutputFileAndClose(filepath)
	if err != nil {
		return "", err
	}
	
	return filepath, nil
}

// GenerarEtiquetaDelivery genera una etiqueta pequeña para pegar en el paquete
func GenerarEtiquetaDelivery(delivery *models.Delivery) (string, error) {
	// PDF en formato más pequeño (etiqueta)
	pdf := gofpdf.New("P", "mm", "A6", "") // A6 = 105x148mm (aprox 10x15cm)
	pdf.AddPage()
	
	// Margen más pequeño
	pdf.SetMargins(5, 5, 5)
	
	// === ENCABEZADO COMPACTO ===
	pdf.SetFont("Arial", "B", 14)
	pdf.Cell(0, 8, "DELIVERY")
	pdf.Ln(6)
	
	// Orden
	pdf.SetFont("Arial", "", 9)
	pdf.Cell(0, 5, fmt.Sprintf("Orden: %s", delivery.NumeroOrden))
	pdf.Ln(5)
	
	// Línea
	pdf.Line(5, pdf.GetY(), 100, pdf.GetY())
	pdf.Ln(5)
	
	// === DESTINATARIO ===
	pdf.SetFont("Arial", "B", 11)
	pdf.MultiCell(0, 5, delivery.NombreCompleto, "", "", false)
	
	pdf.SetFont("Arial", "", 9)
	pdf.Cell(0, 5, delivery.Telefono)
	pdf.Ln(5)
	
	// === DIRECCIÓN ===
	pdf.SetFont("Arial", "B", 10)
	direccion := fmt.Sprintf("%s %s", delivery.Calle, delivery.Numero)
	if delivery.Piso != "" {
		direccion += fmt.Sprintf(" - Piso %s", delivery.Piso)
	}
	if delivery.Departamento != "" {
		direccion += fmt.Sprintf(" Dto. %s", delivery.Departamento)
	}
	pdf.MultiCell(0, 5, direccion, "", "", false)
	
	pdf.SetFont("Arial", "", 9)
	pdf.Cell(0, 5, fmt.Sprintf("%s, %s", delivery.Ciudad, delivery.Provincia))
	pdf.Ln(5)
	
	if delivery.CodigoPostal != "" {
		pdf.Cell(0, 5, fmt.Sprintf("CP: %s", delivery.CodigoPostal))
		pdf.Ln(5)
	}
	
	// Referencias
	if delivery.Referencias != "" {
		pdf.Ln(3)
		pdf.SetFont("Arial", "I", 8)
		pdf.SetTextColor(100, 100, 100)
		pdf.MultiCell(0, 4, delivery.Referencias, "", "", false)
		pdf.SetTextColor(0, 0, 0)
	}
	
	// Guardar
	filename := fmt.Sprintf("etiqueta_%s_%d.pdf", delivery.NumeroOrden, time.Now().Unix())
	filepath := fmt.Sprintf("/tmp/%s", filename)
	
	err := pdf.OutputFileAndClose(filepath)
	if err != nil {
		return "", err
	}
	
	return filepath, nil
}
