# 📚 Documentación API de Gastos - Guía para Frontend

## 🎯 Descripción General

El módulo de **Gastos** permite registrar, consultar, actualizar y eliminar gastos del negocio, además de obtener reportes y resúmenes.

**Base URL:** `http://localhost:8080/api`

**Autenticación:** Todos los endpoints requieren **Bearer Token** en el header `Authorization`.

---

## 📋 Tabla de Contenidos

1. [Modelo de Datos](#modelo-de-datos)
2. [Endpoints CRUD](#endpoints-crud)
3. [Endpoints de Reportes](#endpoints-de-reportes)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Interfaces TypeScript](#interfaces-typescript)

---

## 🗂️ Modelo de Datos

### Gasto (Response)

```typescript
interface IGasto {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;                    // ISO 8601: "2024-02-12T00:00:00Z"
  categoria: 'Proveedor' | 'Alquiler' | 'Mercadería' | 'Servicios' | 'Otros';
  proveedor?: string;               // Opcional
  metodo_pago?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | '';
  comprobante?: string;             // Número de factura/recibo
  notas?: string;
  cliente_id: number;
  usuario_id: number;
  created_at: string;               // ISO 8601
  updated_at: string;               // ISO 8601
}
```

### Gasto (Request - Create/Update)

```typescript
interface IGastoInput {
  descripcion: string;              // Requerido
  monto: number;                    // Requerido (debe ser > 0)
  fecha: string;                    // Requerido - Formato: "YYYY-MM-DD" (ej: "2024-02-12")
  categoria: 'Proveedor' | 'Alquiler' | 'Mercadería' | 'Servicios' | 'Otros'; // Requerido
  proveedor?: string;               // Opcional
  metodo_pago?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | ''; // Opcional
  comprobante?: string;             // Opcional
  notas?: string;                   // Opcional
}
```

### Categorías Válidas

```typescript
type CategoriaGasto = 
  | 'Proveedor'     // Pago a proveedores
  | 'Alquiler'      // Alquiler de local
  | 'Mercadería'    // Compra de productos para vender
  | 'Servicios'     // Luz, agua, internet, etc.
  | 'Otros';        // Otros gastos
```

### Métodos de Pago Válidos

```typescript
type MetodoPago = 
  | 'Efectivo'
  | 'Transferencia'
  | 'Tarjeta'
  | '';  // Vacío si no se especifica
```

---

## 🔧 Endpoints CRUD

### 1. Crear Gasto

**POST** `/api/gastos`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "descripcion": "Pago de alquiler Febrero 2024",
  "monto": 50000,
  "fecha": "2024-02-01",
  "categoria": "Alquiler",
  "proveedor": "Inmobiliaria ABC",
  "metodo_pago": "Transferencia",
  "comprobante": "FACT-001-2024",
  "notas": "Pago puntual"
}
```

**Response (201 Created):**
```json
{
  "message": "Gasto creado exitosamente",
  "gasto": {
    "id": 1,
    "descripcion": "Pago de alquiler Febrero 2024",
    "monto": 50000,
    "fecha": "2024-02-01T00:00:00Z",
    "categoria": "Alquiler",
    "proveedor": "Inmobiliaria ABC",
    "metodo_pago": "Transferencia",
    "comprobante": "FACT-001-2024",
    "notas": "Pago puntual",
    "cliente_id": 1,
    "usuario_id": 1,
    "created_at": "2024-02-12T10:30:00Z",
    "updated_at": "2024-02-12T10:30:00Z"
  }
}
```

**Errores:**
- `400` - Datos inválidos (monto <= 0, fecha inválida, categoría incorrecta)
- `401` - No autenticado
- `500` - Error interno del servidor

---

### 2. Listar Gastos (con filtros y paginación)

**GET** `/api/gastos`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (todos opcionales):**
```
?categoria=Alquiler          // Filtrar por categoría
&fecha_desde=2024-01-01      // Fecha desde (YYYY-MM-DD)
&fecha_hasta=2024-12-31      // Fecha hasta (YYYY-MM-DD)
&proveedor=ABC               // Buscar en proveedor (case insensitive)
&page=1                      // Número de página (default: 1)
&limit=50                    // Resultados por página (default: 50)
```

**Ejemplos:**
```
GET /api/gastos
GET /api/gastos?categoria=Alquiler
GET /api/gastos?fecha_desde=2024-01-01&fecha_hasta=2024-01-31
GET /api/gastos?proveedor=ABC&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "gastos": [
    {
      "id": 1,
      "descripcion": "Pago de alquiler",
      "monto": 50000,
      "fecha": "2024-02-01T00:00:00Z",
      "categoria": "Alquiler",
      "proveedor": "Inmobiliaria ABC",
      "metodo_pago": "Transferencia",
      "comprobante": "FACT-001",
      "notas": "",
      "cliente_id": 1,
      "usuario_id": 1,
      "created_at": "2024-02-12T10:30:00Z",
      "updated_at": "2024-02-12T10:30:00Z"
    }
    // ... más gastos
  ],
  "total": 150,      // Total de registros (sin paginar)
  "page": 1,         // Página actual
  "limit": 50        // Límite por página
}
```

---

### 3. Obtener Gasto por ID

**GET** `/api/gastos/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:**
```
GET /api/gastos/5
```

**Response (200 OK):**
```json
{
  "id": 5,
  "descripcion": "Pago de luz",
  "monto": 5000,
  "fecha": "2024-02-10T00:00:00Z",
  "categoria": "Servicios",
  "proveedor": "Edenor",
  "metodo_pago": "Transferencia",
  "comprobante": "FACTURA-12345",
  "notas": "Consumo enero 2024",
  "cliente_id": 1,
  "usuario_id": 1,
  "created_at": "2024-02-12T10:30:00Z",
  "updated_at": "2024-02-12T10:30:00Z"
}
```

**Errores:**
- `404` - Gasto no encontrado
- `401` - No autenticado
- `500` - Error interno

---

### 4. Actualizar Gasto

**PUT** `/api/gastos/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:** (igual que POST - todos los campos requeridos)
```json
{
  "descripcion": "Pago de alquiler Febrero 2024 - Actualizado",
  "monto": 55000,
  "fecha": "2024-02-01",
  "categoria": "Alquiler",
  "proveedor": "Inmobiliaria ABC",
  "metodo_pago": "Transferencia",
  "comprobante": "FACT-001-2024-CORR",
  "notas": "Pago con ajuste por inflación"
}
```

**Response (200 OK):**
```json
{
  "message": "Gasto actualizado exitosamente",
  "gasto": {
    "id": 1,
    "descripcion": "Pago de alquiler Febrero 2024 - Actualizado",
    "monto": 55000,
    // ... resto de campos actualizados
  }
}
```

**Errores:**
- `404` - Gasto no encontrado
- `400` - Datos inválidos
- `401` - No autenticado
- `500` - Error interno

---

### 5. Eliminar Gasto

**DELETE** `/api/gastos/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:**
```
DELETE /api/gastos/5
```

**Response (200 OK):**
```json
{
  "message": "Gasto eliminado exitosamente"
}
```

**Errores:**
- `404` - Gasto no encontrado
- `401` - No autenticado
- `500` - Error interno

---

## 📊 Endpoints de Reportes

### 6. Obtener Resumen General de Gastos

**GET** `/api/gastos/resumen`

Devuelve un resumen de gastos agrupados por categoría en un período de tiempo.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
```
?fecha_desde=2024-01-01      // Fecha desde
&fecha_hasta=2024-12-31      // Fecha hasta
```

**Ejemplos:**
```
GET /api/gastos/resumen
GET /api/gastos/resumen?fecha_desde=2024-01-01&fecha_hasta=2024-01-31
```

**Response (200 OK):**
```json
{
  "total": 125000.50,           // Total general de gastos
  "cantidad": 15,               // Cantidad total de gastos
  "por_categoria": [
    {
      "categoria": "Alquiler",
      "total": 50000,
      "cantidad": 1
    },
    {
      "categoria": "Servicios",
      "total": 35000,
      "cantidad": 7
    },
    {
      "categoria": "Mercadería",
      "total": 30000.50,
      "cantidad": 5
    },
    {
      "categoria": "Otros",
      "total": 10000,
      "cantidad": 2
    }
  ],
  "fecha_desde": "2024-01-01",
  "fecha_hasta": "2024-01-31"
}
```

**Uso:** Perfecto para mostrar gráficos de torta o barras por categoría.

---

### 7. Obtener Gastos por Mes

**GET** `/api/gastos/por-mes`

Devuelve gastos agrupados por mes en un año específico.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcional):**
```
?anio=2024     // Año a consultar (default: año actual)
```

**Ejemplos:**
```
GET /api/gastos/por-mes
GET /api/gastos/por-mes?anio=2023
```

**Response (200 OK):**
```json
{
  "anio": "2024",
  "meses": [
    {
      "mes": 1,              // Enero
      "total": 45000,
      "cantidad": 8
    },
    {
      "mes": 2,              // Febrero
      "total": 52000,
      "cantidad": 10
    },
    {
      "mes": 3,              // Marzo
      "total": 48500,
      "cantidad": 9
    }
    // ... resto de meses con datos
  ]
}
```

**Notas:**
- Solo devuelve meses que tienen gastos registrados
- Útil para gráficos de línea o barras mensuales

---

### 8. Listar Proveedores Únicos

**GET** `/api/gastos/proveedores`

Devuelve una lista de todos los proveedores únicos registrados en los gastos.

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:**
```
GET /api/gastos/proveedores
```

**Response (200 OK):**
```json
{
  "proveedores": [
    "Edenor",
    "Inmobiliaria ABC",
    "Mayorista XYZ",
    "Proveedor 123",
    "Telecom"
  ]
}
```

**Uso:** Útil para autocompletado en formularios o filtros.

---

## 💻 Ejemplos de Uso en Frontend

### Service en TypeScript

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
  cliente_id: number;
  usuario_id: number;
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

export interface IGastosListResponse {
  gastos: IGasto[];
  total: number;
  page: number;
  limit: number;
}

export interface IGastoResumen {
  categoria: string;
  total: number;
  cantidad: number;
}

export interface IResumenGastosResponse {
  total: number;
  cantidad: number;
  por_categoria: IGastoResumen[];
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface IGastoPorMes {
  mes: number;
  total: number;
  cantidad: number;
}

export interface IGastosPorMesResponse {
  anio: string;
  meses: IGastoPorMes[];
}

export const gastoService = {
  // Crear gasto
  create: async (data: IGastoInput): Promise<{ message: string; gasto: IGasto }> => {
    const response = await api.post('/api/gastos', data);
    return response.data;
  },

  // Listar gastos con filtros
  getAll: async (params?: {
    categoria?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    proveedor?: string;
    page?: number;
    limit?: number;
  }): Promise<IGastosListResponse> => {
    const response = await api.get('/api/gastos', { params });
    return response.data;
  },

  // Obtener gasto por ID
  getById: async (id: number): Promise<IGasto> => {
    const response = await api.get(`/api/gastos/${id}`);
    return response.data;
  },

  // Actualizar gasto
  update: async (id: number, data: IGastoInput): Promise<{ message: string; gasto: IGasto }> => {
    const response = await api.put(`/api/gastos/${id}`, data);
    return response.data;
  },

  // Eliminar gasto
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/gastos/${id}`);
    return response.data;
  },

  // Resumen de gastos
  getResumen: async (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<IResumenGastosResponse> => {
    const response = await api.get('/api/gastos/resumen', { params });
    return response.data;
  },

  // Gastos por mes
  getPorMes: async (anio?: number): Promise<IGastosPorMesResponse> => {
    const params = anio ? { anio } : {};
    const response = await api.get('/api/gastos/por-mes', { params });
    return response.data;
  },

  // Listar proveedores
  getProveedores: async (): Promise<{ proveedores: string[] }> => {
    const response = await api.get('/api/gastos/proveedores');
    return response.data;
  },
};
```

---

### Ejemplo de Uso en un Componente React

```typescript
// pages/GastosPage.tsx
import { useEffect, useState } from 'react';
import { gastoService, IGasto } from '@services/gasto.service';

export default function GastosPage() {
  const [gastos, setGastos] = useState<IGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchGastos();
  }, []);

  const fetchGastos = async () => {
    try {
      setLoading(true);
      const response = await gastoService.getAll({
        page: 1,
        limit: 50
      });
      setGastos(response.gastos);
      setTotal(response.total);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await gastoService.delete(id);
      fetchGastos(); // Recargar lista
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
    }
  };

  const handleCreate = async (data: IGastoInput) => {
    try {
      await gastoService.create(data);
      fetchGastos(); // Recargar lista
    } catch (error) {
      console.error('Error al crear gasto:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Gastos ({total})</h1>
      {/* Tabla o lista de gastos */}
    </div>
  );
}
```

---

### Ejemplo: Crear Gasto

```typescript
const nuevoGasto: IGastoInput = {
  descripcion: "Pago de luz",
  monto: 5000,
  fecha: "2024-02-12",
  categoria: "Servicios",
  proveedor: "Edenor",
  metodo_pago: "Transferencia",
  comprobante: "FACTURA-001",
  notas: "Consumo enero"
};

try {
  const result = await gastoService.create(nuevoGasto);
  console.log('Gasto creado:', result.gasto);
} catch (error) {
  console.error('Error:', error);
}
```

---

### Ejemplo: Filtrar Gastos

```typescript
// Gastos del mes actual
const hoy = new Date();
const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

const gastosMesActual = await gastoService.getAll({
  fecha_desde: primerDia.toISOString().split('T')[0],
  fecha_hasta: ultimoDia.toISOString().split('T')[0]
});

// Gastos de categoría específica
const gastosAlquiler = await gastoService.getAll({
  categoria: 'Alquiler'
});

// Buscar por proveedor
const gastosEdenor = await gastoService.getAll({
  proveedor: 'Edenor'
});
```

---

### Ejemplo: Obtener Resumen para Dashboard

```typescript
const resumen = await gastoService.getResumen({
  fecha_desde: "2024-01-01",
  fecha_hasta: "2024-12-31"
});

console.log('Total gastado:', resumen.total);
console.log('Por categoría:', resumen.por_categoria);

// Para gráfico de torta:
const dataGrafico = resumen.por_categoria.map(cat => ({
  name: cat.categoria,
  value: cat.total
}));
```

---

## ⚠️ Notas Importantes

### Formato de Fechas

- **Request:** Siempre usar formato `"YYYY-MM-DD"` (ej: `"2024-02-12"`)
- **Response:** Las fechas vienen en formato ISO 8601 (`"2024-02-12T10:30:00Z"`)

```typescript
// Para crear/actualizar:
const fecha = "2024-02-12";

// Para mostrar al usuario:
const fechaDisplay = new Date(gasto.fecha).toLocaleDateString('es-AR');
```

### Validaciones en el Backend

- `monto` debe ser mayor a 0
- `descripcion` es requerida
- `fecha` es requerida y debe ser válida
- `categoria` debe ser uno de: `Proveedor`, `Alquiler`, `Mercadería`, `Servicios`, `Otros`
- `metodo_pago` debe ser uno de: `Efectivo`, `Transferencia`, `Tarjeta`, o vacío

### Multi-Tenancy

El sistema es multi-tenant. El `cliente_id` se obtiene automáticamente del token de autenticación. **No es necesario enviarlo** en las peticiones.

### Paginación

La paginación por defecto es:
- **page:** 1
- **limit:** 50

Ajustar según necesidades de UI.

---

## 🧪 Testing con cURL

### Crear Gasto
```bash
curl -X POST http://localhost:8080/api/gastos \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Test gasto",
    "monto": 1000,
    "fecha": "2024-02-12",
    "categoria": "Otros"
  }'
```

### Listar Gastos
```bash
curl -X GET "http://localhost:8080/api/gastos?page=1&limit=10" \
  -H "Authorization: Bearer {TOKEN}"
```

### Obtener Resumen
```bash
curl -X GET "http://localhost:8080/api/gastos/resumen?fecha_desde=2024-01-01&fecha_hasta=2024-12-31" \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 📦 Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/gastos` | Crear gasto |
| GET | `/api/gastos` | Listar gastos (con filtros) |
| GET | `/api/gastos/:id` | Obtener gasto por ID |
| PUT | `/api/gastos/:id` | Actualizar gasto |
| DELETE | `/api/gastos/:id` | Eliminar gasto |
| GET | `/api/gastos/resumen` | Resumen por categoría |
| GET | `/api/gastos/por-mes` | Gastos por mes |
| GET | `/api/gastos/proveedores` | Lista de proveedores |

---

## ✅ Checklist de Implementación Frontend

- [ ] Crear interfaces TypeScript
- [ ] Implementar service con todos los métodos
- [ ] Página de lista de gastos
- [ ] Formulario crear/editar gasto
- [ ] Filtros por categoría, fecha, proveedor
- [ ] Paginación
- [ ] Modal de confirmación para eliminar
- [ ] Dashboard con resumen por categoría
- [ ] Gráfico de gastos mensuales
- [ ] Autocompletado de proveedores
- [ ] Validación de fechas en el formulario
- [ ] Manejo de errores y notificaciones

---

**Última actualización:** 2024-02-12  
**Versión Backend:** 1.0  
**Puerto:** 8080  
**Requiere autenticación:** ✅ Sí (Bearer Token)
