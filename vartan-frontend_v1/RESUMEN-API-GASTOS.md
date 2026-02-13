# 📋 Resumen Rápido - API de Gastos

## 🎯 Endpoints Disponibles

**Base:** `http://localhost:8080/api/gastos`

**Auth:** Todos requieren `Authorization: Bearer {token}`

### CRUD
```
POST   /api/gastos           → Crear gasto
GET    /api/gastos           → Listar (con filtros)
GET    /api/gastos/:id       → Obtener por ID
PUT    /api/gastos/:id       → Actualizar
DELETE /api/gastos/:id       → Eliminar
```

### Reportes
```
GET /api/gastos/resumen      → Resumen por categoría
GET /api/gastos/por-mes      → Gastos mensuales
GET /api/gastos/proveedores  → Lista de proveedores
```

---

## 📦 Modelo de Datos

### Request (Crear/Actualizar)
```typescript
{
  descripcion: string;      // ✅ Requerido
  monto: number;            // ✅ Requerido (> 0)
  fecha: string;            // ✅ Requerido "YYYY-MM-DD"
  categoria: string;        // ✅ Requerido
  proveedor?: string;       // Opcional
  metodo_pago?: string;     // Opcional
  comprobante?: string;     // Opcional
  notas?: string;           // Opcional
}
```

### Categorías Válidas
```
"Proveedor" | "Alquiler" | "Mercadería" | "Servicios" | "Otros"
```

### Métodos de Pago Válidos
```
"Efectivo" | "Transferencia" | "Tarjeta" | ""
```

---

## 🔧 Ejemplos Rápidos

### 1. Crear Gasto
```typescript
POST /api/gastos
{
  "descripcion": "Pago de luz",
  "monto": 5000,
  "fecha": "2024-02-12",
  "categoria": "Servicios",
  "proveedor": "Edenor",
  "metodo_pago": "Transferencia"
}
```

### 2. Listar con Filtros
```typescript
GET /api/gastos?categoria=Alquiler&fecha_desde=2024-01-01&fecha_hasta=2024-01-31&page=1&limit=50

Response:
{
  "gastos": [...],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

### 3. Resumen por Categoría
```typescript
GET /api/gastos/resumen?fecha_desde=2024-01-01&fecha_hasta=2024-12-31

Response:
{
  "total": 125000,
  "cantidad": 15,
  "por_categoria": [
    { "categoria": "Alquiler", "total": 50000, "cantidad": 1 },
    { "categoria": "Servicios", "total": 35000, "cantidad": 7 }
  ]
}
```

### 4. Gastos por Mes
```typescript
GET /api/gastos/por-mes?anio=2024

Response:
{
  "anio": "2024",
  "meses": [
    { "mes": 1, "total": 45000, "cantidad": 8 },
    { "mes": 2, "total": 52000, "cantidad": 10 }
  ]
}
```

---

## 💻 Service TypeScript (Copy-Paste)

```typescript
// services/gasto.service.ts
import { api } from '@libraries/api';

export interface IGasto {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: 'Proveedor' | 'Alquiler' | 'Mercadería' | 'Servicios' | 'Otros';
  proveedor?: string;
  metodo_pago?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | '';
  comprobante?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface IGastoInput {
  descripcion: string;
  monto: number;
  fecha: string;  // "YYYY-MM-DD"
  categoria: 'Proveedor' | 'Alquiler' | 'Mercadería' | 'Servicios' | 'Otros';
  proveedor?: string;
  metodo_pago?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | '';
  comprobante?: string;
  notas?: string;
}

export const gastoService = {
  create: async (data: IGastoInput) => {
    const response = await api.post('/api/gastos', data);
    return response.data;
  },

  getAll: async (params?: {
    categoria?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    proveedor?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/api/gastos', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/api/gastos/${id}`);
    return response.data;
  },

  update: async (id: number, data: IGastoInput) => {
    const response = await api.put(`/api/gastos/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/api/gastos/${id}`);
    return response.data;
  },

  getResumen: async (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) => {
    const response = await api.get('/api/gastos/resumen', { params });
    return response.data;
  },

  getPorMes: async (anio?: number) => {
    const params = anio ? { anio } : {};
    const response = await api.get('/api/gastos/por-mes', { params });
    return response.data;
  },

  getProveedores: async () => {
    const response = await api.get('/api/gastos/proveedores');
    return response.data;
  },
};
```

---

## ⚠️ Importante

### Fechas
- **Request:** `"YYYY-MM-DD"` (ej: `"2024-02-12"`)
- **Response:** ISO 8601 (`"2024-02-12T10:30:00Z"`)

### Validaciones Backend
- ✅ Monto debe ser > 0
- ✅ Descripción requerida
- ✅ Fecha requerida y válida
- ✅ Categoría debe ser válida
- ✅ Método de pago debe ser válido

### Multi-Tenant
El `cliente_id` se obtiene del token automáticamente. **NO enviarlo** en el request.

---

## 📄 Documentación Completa

Ver archivo completo: `DOCUMENTACION-API-GASTOS-FRONTEND.md`

---

## ✅ Checklist

- [ ] Crear interfaces TypeScript
- [ ] Implementar service
- [ ] Página de lista con filtros
- [ ] Formulario crear/editar
- [ ] Dashboard con resúmenes
- [ ] Validaciones y manejo de errores

---

**Puerto:** 8080  
**Auth:** ✅ Requerida  
**Docs completas:** ✅ Disponibles
