# 📄 Crear Venta con Comprobante

## 🔸 Opción 1: Venta SIN comprobante (JSON)

Usa `Content-Type: application/json` cuando NO necesitas adjuntar un archivo.

```typescript
// TypeScript/JavaScript
const crearVentaSinComprobante = async (token: string) => {
  const ventaData = {
    cliente_id: 3,
    forma_pago_id: 1,
    sena: 10000,
    observaciones: "Venta de prueba",
    detalles: [
      {
        producto_id: 4,
        talle: "S",
        cantidad: 1,
        precio_unitario: 40000
      }
    ]
  };

  const response = await fetch("http://localhost:8080/api/ventas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(ventaData)
  });

  return await response.json();
};
```

---

## 🔸 Opción 2: Venta CON comprobante (FormData)

Usa `multipart/form-data` cuando necesitas adjuntar un archivo PDF, JPG o PNG.

```typescript
// TypeScript/JavaScript
const crearVentaConComprobante = async (token: string, archivoComprobante: File) => {
  const formData = new FormData();
  
  // Campos de la venta
  formData.append("cliente_id", "3");
  formData.append("forma_pago_id", "1");
  formData.append("sena", "10000");
  formData.append("observaciones", "Venta con comprobante");
  
  // Detalles como JSON string
  const detalles = [
    {
      producto_id: 4,
      talle: "S",
      cantidad: 1,
      precio_unitario: 40000
    }
  ];
  formData.append("detalles", JSON.stringify(detalles));
  
  // Archivo del comprobante (PDF, JPG, PNG)
  formData.append("comprobante", archivoComprobante);

  const response = await fetch("http://localhost:8080/api/ventas", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
      // NO incluyas "Content-Type" - FormData lo establece automáticamente
    },
    body: formData
  });

  return await response.json();
};
```

---

## 📤 React: Ejemplo completo con input de archivo

```tsx
import React, { useState } from 'react';

const CrearVentaForm = () => {
  const [comprobante, setComprobante] = useState<File | null>(null);
  const token = localStorage.getItem('token');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComprobante(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("cliente_id", "3");
    formData.append("forma_pago_id", "1");
    formData.append("sena", "10000");
    formData.append("observaciones", "Venta de prueba");
    
    const detalles = [
      {
        producto_id: 4,
        talle: "S",
        cantidad: 1,
        precio_unitario: 40000
      }
    ];
    formData.append("detalles", JSON.stringify(detalles));

    // Si hay comprobante, agregarlo
    if (comprobante) {
      formData.append("comprobante", comprobante);
    }

    try {
      const response = await fetch("http://localhost:8080/api/ventas", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log("✅ Venta creada:", data);
        alert("Venta creada exitosamente!");
      } else {
        console.error("❌ Error:", data);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Error de red:", error);
      alert("Error de conexión");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Crear Venta</h2>
      
      {/* Input para subir comprobante */}
      <div>
        <label>Comprobante (PDF, JPG, PNG - Opcional):</label>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
        {comprobante && <p>Archivo seleccionado: {comprobante.name}</p>}
      </div>

      <button type="submit">Crear Venta</button>
    </form>
  );
};

export default CrearVentaForm;
```

---

## 🔍 Ver/Descargar Comprobante

Una vez creada la venta con comprobante, puedes acceder al archivo:

```typescript
// Obtener la URL del comprobante
const verComprobante = (ventaId: number, token: string) => {
  const url = `http://localhost:8080/api/ventas/${ventaId}/comprobante`;
  
  // Opción 1: Abrir en nueva pestaña
  window.open(url, '_blank');
  
  // Opción 2: Descargar
  fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante_venta_${ventaId}.pdf`;
    a.click();
  });
};
```

```tsx
// React: Mostrar comprobante como imagen o enlace
const ComprobanteViewer = ({ ventaId, comprobanteUrl }: { ventaId: number, comprobanteUrl?: string }) => {
  const token = localStorage.getItem('token');

  if (!comprobanteUrl) {
    return <p>No hay comprobante adjunto</p>;
  }

  const url = `http://localhost:8080/api/ventas/${ventaId}/comprobante`;

  // Si es imagen
  if (comprobanteUrl.endsWith('.jpg') || comprobanteUrl.endsWith('.png')) {
    return (
      <div>
        <img 
          src={url} 
          alt="Comprobante" 
          style={{ maxWidth: '300px' }}
        />
        <a href={url} target="_blank">Ver en tamaño completo</a>
      </div>
    );
  }

  // Si es PDF
  return (
    <div>
      <a href={url} target="_blank" rel="noopener noreferrer">
        📄 Ver Comprobante (PDF)
      </a>
    </div>
  );
};
```

---

## ❌ Eliminar Comprobante

```typescript
const eliminarComprobante = async (ventaId: number, token: string) => {
  const response = await fetch(`http://localhost:8080/api/ventas/${ventaId}/comprobante`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log(data.message); // "Comprobante eliminado exitosamente"
};
```

---

## 📋 Resumen

| Acción | Método | Endpoint | Content-Type |
|--------|--------|----------|--------------|
| Crear venta SIN comprobante | POST | `/api/ventas` | `application/json` |
| Crear venta CON comprobante | POST | `/api/ventas` | `multipart/form-data` |
| Ver/Descargar comprobante | GET | `/api/ventas/:id/comprobante` | - |
| Eliminar comprobante | DELETE | `/api/ventas/:id/comprobante` | - |

---

## ⚠️ Validaciones

- **Extensiones permitidas**: `.pdf`, `.jpg`, `.jpeg`, `.png`
- **Tamaño máximo**: 5 MB
- **Campo opcional**: Puedes crear ventas sin comprobante
- **Autenticación requerida**: Todos los endpoints requieren token JWT

---

## 🐛 Errores Comunes

### 1. "Datos inválidos: EOF"
- **Causa**: Intentas enviar JSON vacío o FormData incorrecto
- **Solución**: Verifica que los campos requeridos estén presentes

### 2. "Solo se permiten archivos PDF, JPG, JPEG y PNG"
- **Causa**: El archivo tiene una extensión no permitida
- **Solución**: Convierte el archivo a un formato permitido

### 3. "El archivo no puede superar los 5MB"
- **Causa**: El comprobante es demasiado grande
- **Solución**: Comprime el archivo o reduce su calidad

### 4. "Forma de pago no encontrada"
- **Causa**: El `forma_pago_id` no existe en la base de datos
- **Solución**: Llama a `GET /api/formas-pago` para obtener los IDs válidos

```typescript
// Obtener formas de pago disponibles
const getFormasPago = async (token: string) => {
  const response = await fetch("http://localhost:8080/api/formas-pago", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  const formasPago = await response.json();
  console.log(formasPago);
  // [
  //   { id: 1, nombre: "Transferencia Financiera" },
  //   { id: 2, nombre: "Transferencia a Cero" },
  //   { id: 3, nombre: "Transferencia Bancaria" },
  //   { id: 4, nombre: "Efectivo" }
  // ]
};
```
