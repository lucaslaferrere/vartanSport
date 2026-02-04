# 📚 Documentación API Vartan Backend - Guía para Frontend

## 🔐 Configuración Base

```typescript
// config/api.ts
const API_BASE_URL = "http://localhost:8080";

// Headers por defecto para requests autenticados
const getAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
});
```

---

## 🔑 AUTENTICACIÓN

### POST `/auth/login` - Iniciar Sesión

**Request:**
```typescript
interface LoginRequest {
  email: string;    // required
  password: string; // required
}

// Ejemplo
const loginData: LoginRequest = {
  email: "usuario@email.com",
  password: "miPassword123"
};

// Fetch
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(loginData)
});
```

**Response (200 OK):**
```typescript
interface LoginResponse {
  token: string;
  usuario: Usuario;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;        // "dueño" | "vendedor"
  activo: boolean;
  fecha_creacion: string; // ISO date
}
```

---

### POST `/auth/register` - Registrar Usuario

**Request:**
```typescript
interface RegistroRequest {
  nombre: string;   // required
  email: string;    // required
  password: string; // required
  rol: string;      // required: "dueño" | "vendedor"
}

// Ejemplo
const registerData: RegistroRequest = {
  nombre: "Juan Pérez",
  email: "juan@email.com",
  password: "password123",
  rol: "vendedor"
};
```

**Response (201 Created):**
```typescript
interface RegistroResponse {
  message: string;
  usuario: Usuario;
}
```

---

## 👤 PERFIL

### GET `/api/profile` - Obtener Perfil del Usuario Autenticado

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_creacion: string;
}
```

---

## 📦 PRODUCTOS

### GET `/api/productos` - Listar Todos los Productos

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
interface Producto {
  id: number;
  nombre: string;
  costo_unitario: number;
  activo: boolean;
  fecha_creacion: string;
}

// La respuesta es un array
type ProductosResponse = Producto[];
```

---

### GET `/api/productos/:id` - Obtener Producto por ID

**Headers:** Requiere `Authorization: Bearer {token}`

**Parámetros URL:**
- `id` (number): ID del producto

**Response (200 OK):**
```typescript
interface Producto {
  id: number;
  nombre: string;
  costo_unitario: number;
  activo: boolean;
  fecha_creacion: string;
}
```

---

### POST `/api/owner/productos` - Crear Producto (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Request:**
```typescript
interface ProductoCreateRequest {
  nombre: string;        // required
  costo_unitario: number; // required
}

// Ejemplo
const nuevoProducto: ProductoCreateRequest = {
  nombre: "Remera Nike Dri-Fit",
  costo_unitario: 15000.50
};
```

**Response (201 Created):**
```typescript
interface Producto {
  id: number;
  nombre: string;
  costo_unitario: number;
  activo: boolean;
  fecha_creacion: string;
}
```

---

### PUT `/api/owner/productos/:id` - Actualizar Producto (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Request:**
```typescript
interface ProductoUpdateRequest {
  nombre?: string;
  costo_unitario?: number;
  activo?: boolean;
}
```

---

### DELETE `/api/owner/productos/:id` - Eliminar Producto (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Response (200 OK):**
```typescript
{ message: string }
```

---

## 📊 STOCK

### GET `/api/stock` - Listar Todo el Stock

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
interface ProductoStock {
  id: number;
  producto_id: number;
  producto: Producto;
  talle: string;
  cantidad: number;
}

type StockResponse = ProductoStock[];
```

---

### GET `/api/stock/producto/:id` - Stock por Producto

**Headers:** Requiere `Authorization: Bearer {token}`

**Parámetros URL:**
- `id` (number): ID del producto

**Response (200 OK):**
```typescript
type StockByProductoResponse = ProductoStock[];
```

---

### POST `/api/owner/stock` - Agregar Stock (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Request:**
```typescript
interface StockCreateRequest {
  producto_id: number; // required
  talle: string;       // required, ej: "S", "M", "L", "XL", "42", etc.
  cantidad: number;    // required
}

// Ejemplo
const nuevoStock: StockCreateRequest = {
  producto_id: 1,
  talle: "M",
  cantidad: 50
};
```

---

### PUT `/api/owner/stock/:id` - Actualizar Stock (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Request:**
```typescript
interface StockUpdateRequest {
  cantidad: number;
}
```

---

## 👥 CLIENTES

### GET `/api/clientes` - Listar Clientes

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  fecha_creacion: string;
}

type ClientesResponse = Cliente[];
```

---

### GET `/api/clientes/:id` - Obtener Cliente por ID

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  fecha_creacion: string;
}
```

---

### POST `/api/clientes` - Crear Cliente

**Headers:** Requiere `Authorization: Bearer {token}`

**Request:**
```typescript
interface ClienteCreateRequest {
  nombre: string;   // required
  email?: string;   // optional
  telefono?: string; // optional
}

// Ejemplo
const nuevoCliente: ClienteCreateRequest = {
  nombre: "María García",
  email: "maria@email.com",
  telefono: "+54 11 1234-5678"
};
```

**Response (201 Created):**
```typescript
interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  fecha_creacion: string;
}
```

---

### PUT `/api/clientes/:id` - Actualizar Cliente

**Headers:** Requiere `Authorization: Bearer {token}`

**Request:**
```typescript
interface ClienteUpdateRequest {
  nombre?: string;
  email?: string;
  telefono?: string;
}
```

---

### DELETE `/api/owner/clientes/:id` - Eliminar Cliente (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Response (200 OK):**
```typescript
{ message: string }
```

---

## 💰 VENTAS

### GET `/api/mis-ventas` - Mis Ventas (Usuario Autenticado)

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
interface FormaPago {
  id: number;
  nombre: string;
}

interface VentaDetalle {
  id: number;
  venta_id: number;
  producto_id: number;
  producto: Producto;
  talle: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Venta {
  id: number;
  usuario_id: number;
  usuario: Usuario;
  cliente_id: number;
  cliente: Cliente;
  forma_pago_id: number;
  forma_pago: FormaPago;
  fecha_venta: string;
  total: number;        // Total de productos
  descuento: number;    // 3% si es financiera
  total_final: number;  // Total - Descuento
  sena: number;         // Seña abonada
  saldo: number;        // Lo que resta pagar
  detalles: VentaDetalle[];
}

type MisVentasResponse = Venta[];
```

---

### POST `/api/ventas` - Crear Venta

**Headers:** Requiere `Authorization: Bearer {token}`

**Request:**
```typescript
interface VentaDetalleCreateRequest {
  producto_id: number;    // required
  talle: string;          // required
  cantidad: number;       // required
  precio_unitario: number; // required
}

interface VentaCreateRequest {
  cliente_id: number;                    // required
  forma_pago_id: number;                 // required: 1=Transf Financiera, 2=Transf a Cero, 3=Transf Bancaria, 4=Efectivo
  sena: number;                          // required: seña inicial
  detalles: VentaDetalleCreateRequest[]; // required: al menos 1 item
}

// Ejemplo
const nuevaVenta: VentaCreateRequest = {
  cliente_id: 1,
  forma_pago_id: 1, // Transferencia Financiera (aplica 3% descuento)
  sena: 5000,
  detalles: [
    {
      producto_id: 1,
      talle: "M",
      cantidad: 2,
      precio_unitario: 15000
    },
    {
      producto_id: 2,
      talle: "L",
      cantidad: 1,
      precio_unitario: 20000
    }
  ]
};
```

**Response (201 Created):**
```typescript
interface VentaResponse {
  message: string;
  venta: Venta;
}
```

**Formas de Pago disponibles:**
| ID | Nombre | Descuento |
|----|--------|-----------|
| 1 | Transferencia Financiera | 3% |
| 2 | Transferencia a Cero | 0% |
| 3 | Transferencia Bancaria | 0% |
| 4 | Efectivo | 0% |

---

### GET `/api/owner/ventas` - Todas las Ventas (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Response (200 OK):**
```typescript
type VentasResponse = Venta[];
```

---

### GET `/api/owner/ventas/usuario/:id` - Ventas por Usuario (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Parámetros URL:**
- `id` (number): ID del usuario/vendedor

---

## 📋 PEDIDOS

### GET `/api/mis-pedidos` - Mis Pedidos

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
interface Pedido {
  id: number;
  venta_id: number;
  venta: Venta;
  estado: string; // "pendiente" | "despachado" | "cancelado"
  fecha_creacion: string;
  fecha_actualizacion: string;
}

type MisPedidosResponse = Pedido[];
```

---

### PUT `/api/pedidos/:id` - Actualizar Estado del Pedido

**Headers:** Requiere `Authorization: Bearer {token}`

**Request:**
```typescript
interface PedidoUpdateRequest {
  estado: string; // required: "pendiente" | "despachado" | "cancelado"
}

// Ejemplo
const actualizarPedido: PedidoUpdateRequest = {
  estado: "despachado"
};
```

---

### GET `/api/owner/pedidos` - Todos los Pedidos (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

---

### GET `/api/owner/pedidos/estado/:estado` - Pedidos por Estado (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Parámetros URL:**
- `estado` (string): "pendiente" | "despachado" | "cancelado"

---

## 💵 COMISIONES

### GET `/api/mis-comisiones` - Mis Comisiones

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
interface Comision {
  id: number;
  usuario_id: number;
  usuario: Usuario;
  mes: number;        // 1-12
  anio: number;       // ej: 2026
  total_ventas: number;
  total_comision: number;
  observaciones: string;
}

type MisComisionesResponse = Comision[];
```

---

### GET `/api/owner/comisiones` - Todas las Comisiones (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

---

### GET `/api/owner/comisiones/usuario/:id` - Comisiones por Usuario (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

---

### POST `/api/owner/comisiones/calcular` - Calcular Comisiones del Mes (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Response (200 OK):**
```typescript
interface CalcularComisionesResponse {
  message: string;
  comisiones: Comision[];
}
```

---

### PUT `/api/owner/comisiones/:id/observaciones` - Actualizar Observaciones (Solo Dueño)

**Headers:** Requiere `Authorization: Bearer {token}` (usuario con rol "dueño")

**Request:**
```typescript
interface ObservacionesUpdateRequest {
  observaciones: string;
}
```

---

## 💸 GASTOS

### GET `/api/gastos` - Listar Gastos

**Headers:** Requiere `Authorization: Bearer {token}`

**Query Parameters (opcionales):**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| categoria | string | Filtrar por categoría |
| fecha_desde | string | Fecha inicio (YYYY-MM-DD) |
| fecha_hasta | string | Fecha fin (YYYY-MM-DD) |
| proveedor | string | Filtrar por proveedor |
| page | number | Número de página (default: 1) |
| limit | number | Items por página (default: 50) |

**Ejemplo de uso:**
```typescript
// Fetch con filtros
const params = new URLSearchParams({
  categoria: "Mercadería",
  fecha_desde: "2026-01-01",
  fecha_hasta: "2026-01-31",
  page: "1",
  limit: "20"
});

const response = await fetch(`${API_BASE_URL}/api/gastos?${params}`, {
  headers: getAuthHeaders(token)
});
```

**Response (200 OK):**
```typescript
interface Gasto {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;           // ISO date
  categoria: string;       // "Proveedor" | "Alquiler" | "Mercadería" | "Servicios" | "Otros"
  proveedor: string;       // nombre del proveedor (opcional)
  metodo_pago: string;     // "Efectivo" | "Transferencia" | "Tarjeta"
  comprobante: string;     // número de factura/recibo
  notas: string;
  cliente_id: number;
  usuario_id: number;
  created_at: string;
  updated_at: string;
}

interface ListarGastosResponse {
  gastos: Gasto[];
  total: number;  // total de registros
  page: number;   // página actual
  limit: number;  // items por página
}
```

---

### POST `/api/gastos` - Crear Gasto

**Headers:** Requiere `Authorization: Bearer {token}`

**Request:**
```typescript
interface GastoInput {
  descripcion: string;  // required
  monto: number;        // required, debe ser > 0
  fecha: string;        // required, formato "YYYY-MM-DD"
  categoria: string;    // required: "Proveedor" | "Alquiler" | "Mercadería" | "Servicios" | "Otros"
  proveedor?: string;   // optional
  metodo_pago?: string; // optional: "Efectivo" | "Transferencia" | "Tarjeta" | ""
  comprobante?: string; // optional: número de factura
  notas?: string;       // optional
}

// Ejemplo
const nuevoGasto: GastoInput = {
  descripcion: "Compra de remeras al por mayor",
  monto: 150000.00,
  fecha: "2026-02-03",
  categoria: "Mercadería",
  proveedor: "Distribuidora Textil SA",
  metodo_pago: "Transferencia",
  comprobante: "FAC-001234",
  notas: "Pedido mensual de febrero"
};

// Fetch
const response = await fetch(`${API_BASE_URL}/api/gastos`, {
  method: "POST",
  headers: getAuthHeaders(token),
  body: JSON.stringify(nuevoGasto)
});
```

**Response (201 Created):**
```typescript
interface CrearGastoResponse {
  message: string;
  gasto: Gasto;
}
```

**Categorías válidas:**
| Categoría | Descripción |
|-----------|-------------|
| Proveedor | Pagos a proveedores |
| Alquiler | Alquiler del local |
| Mercadería | Compra de mercadería |
| Servicios | Luz, agua, internet, etc. |
| Otros | Gastos varios |

---

### GET `/api/gastos/:id` - Obtener Gasto por ID

**Headers:** Requiere `Authorization: Bearer {token}`

**Parámetros URL:**
- `id` (number): ID del gasto

**Response (200 OK):**
```typescript
interface Gasto {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: string;
  proveedor: string;
  metodo_pago: string;
  comprobante: string;
  notas: string;
  cliente_id: number;
  usuario_id: number;
  created_at: string;
  updated_at: string;
}
```

---

### PUT `/api/gastos/:id` - Actualizar Gasto

**Headers:** Requiere `Authorization: Bearer {token}`

**Parámetros URL:**
- `id` (number): ID del gasto

**Request:**
```typescript
interface GastoInput {
  descripcion: string;  // required
  monto: number;        // required
  fecha: string;        // required, formato "YYYY-MM-DD"
  categoria: string;    // required
  proveedor?: string;
  metodo_pago?: string;
  comprobante?: string;
  notas?: string;
}

// Ejemplo
const gastoActualizado: GastoInput = {
  descripcion: "Compra de remeras - Actualizado",
  monto: 155000.00,
  fecha: "2026-02-03",
  categoria: "Mercadería",
  proveedor: "Distribuidora Textil SA",
  metodo_pago: "Transferencia",
  comprobante: "FAC-001234-B",
  notas: "Pedido con items adicionales"
};

// Fetch
const response = await fetch(`${API_BASE_URL}/api/gastos/1`, {
  method: "PUT",
  headers: getAuthHeaders(token),
  body: JSON.stringify(gastoActualizado)
});
```

**Response (200 OK):**
```typescript
interface ActualizarGastoResponse {
  message: string;
  gasto: Gasto;
}
```

---

### DELETE `/api/gastos/:id` - Eliminar Gasto

**Headers:** Requiere `Authorization: Bearer {token}`

**Parámetros URL:**
- `id` (number): ID del gasto

**Response (200 OK):**
```typescript
interface EliminarGastoResponse {
  message: string;
}
```

---

### GET `/api/gastos/resumen` - Resumen de Gastos por Categoría

**Headers:** Requiere `Authorization: Bearer {token}`

**Query Parameters (opcionales):**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| fecha_desde | string | Fecha inicio (YYYY-MM-DD) |
| fecha_hasta | string | Fecha fin (YYYY-MM-DD) |

**Ejemplo:**
```typescript
const params = new URLSearchParams({
  fecha_desde: "2026-01-01",
  fecha_hasta: "2026-01-31"
});

const response = await fetch(`${API_BASE_URL}/api/gastos/resumen?${params}`, {
  headers: getAuthHeaders(token)
});
```

**Response (200 OK):**
```typescript
interface GastoResumen {
  categoria: string;
  total: number;
  cantidad: number;
}

type ResumenGastosResponse = GastoResumen[];

// Ejemplo de respuesta
[
  { categoria: "Mercadería", total: 500000, cantidad: 15 },
  { categoria: "Alquiler", total: 80000, cantidad: 1 },
  { categoria: "Servicios", total: 25000, cantidad: 4 },
  { categoria: "Proveedor", total: 120000, cantidad: 8 },
  { categoria: "Otros", total: 15000, cantidad: 3 }
]
```

---

### GET `/api/gastos/por-mes` - Gastos Agrupados por Mes

**Headers:** Requiere `Authorization: Bearer {token}`

**Query Parameters (opcionales):**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| anio | number | Año a consultar (default: año actual) |

**Ejemplo:**
```typescript
const response = await fetch(`${API_BASE_URL}/api/gastos/por-mes?anio=2026`, {
  headers: getAuthHeaders(token)
});
```

**Response (200 OK):**
```typescript
interface GastoPorMes {
  mes: number;
  anio: number;
  total: number;
  cantidad: number;
}

type GastosPorMesResponse = GastoPorMes[];

// Ejemplo de respuesta
[
  { mes: 1, anio: 2026, total: 450000, cantidad: 25 },
  { mes: 2, anio: 2026, total: 380000, cantidad: 18 }
]
```

---

### GET `/api/gastos/proveedores` - Listar Proveedores

**Headers:** Requiere `Authorization: Bearer {token}`

**Response (200 OK):**
```typescript
type ProveedoresResponse = string[];

// Ejemplo de respuesta
[
  "Distribuidora Textil SA",
  "Nike Argentina",
  "Adidas Wholesale",
  "Proveedor Local"
]
```

---

## 🏥 HEALTH CHECK

### GET `/health` - Estado del Servidor

**No requiere autenticación**

**Response (200 OK):**
```typescript
interface HealthResponse {
  status: string;
  message: string;
}

// Ejemplo
{ status: "ok", message: "Servidor funcionando correctamente" }
```

---

## 📖 SWAGGER UI

### GET `/swagger/index.html` - Documentación Interactiva

Accede a `http://localhost:8080/swagger/index.html` para ver la documentación interactiva de Swagger UI.

---

## 🛠️ INTERFACES TYPESCRIPT COMPLETAS

```typescript
// types/api.ts

// ============ AUTH ============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
  rol: "dueño" | "vendedor";
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

// ============ USUARIO ============
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "dueño" | "vendedor";
  activo: boolean;
  fecha_creacion: string;
}

// ============ PRODUCTO ============
export interface Producto {
  id: number;
  nombre: string;
  costo_unitario: number;
  activo: boolean;
  fecha_creacion: string;
}

export interface ProductoCreateRequest {
  nombre: string;
  costo_unitario: number;
}

export interface ProductoUpdateRequest {
  nombre?: string;
  costo_unitario?: number;
  activo?: boolean;
}

// ============ STOCK ============
export interface ProductoStock {
  id: number;
  producto_id: number;
  producto: Producto;
  talle: string;
  cantidad: number;
}

export interface StockCreateRequest {
  producto_id: number;
  talle: string;
  cantidad: number;
}

export interface StockUpdateRequest {
  cantidad: number;
}

// ============ CLIENTE ============
export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  fecha_creacion: string;
}

export interface ClienteCreateRequest {
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface ClienteUpdateRequest {
  nombre?: string;
  email?: string;
  telefono?: string;
}

// ============ FORMA DE PAGO ============
export interface FormaPago {
  id: number;
  nombre: string;
}

export type FormaPagoId = 1 | 2 | 3 | 4;
// 1 = Transferencia Financiera (3% descuento)
// 2 = Transferencia a Cero
// 3 = Transferencia Bancaria
// 4 = Efectivo

// ============ VENTA ============
export interface VentaDetalle {
  id: number;
  venta_id: number;
  producto_id: number;
  producto: Producto;
  talle: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  usuario_id: number;
  usuario: Usuario;
  cliente_id: number;
  cliente: Cliente;
  forma_pago_id: number;
  forma_pago: FormaPago;
  fecha_venta: string;
  total: number;
  descuento: number;
  total_final: number;
  sena: number;
  saldo: number;
  detalles: VentaDetalle[];
}

export interface VentaDetalleCreateRequest {
  producto_id: number;
  talle: string;
  cantidad: number;
  precio_unitario: number;
}

export interface VentaCreateRequest {
  cliente_id: number;
  forma_pago_id: FormaPagoId;
  sena: number;
  detalles: VentaDetalleCreateRequest[];
}

// ============ PEDIDO ============
export type EstadoPedido = "pendiente" | "despachado" | "cancelado";

export interface Pedido {
  id: number;
  venta_id: number;
  venta: Venta;
  estado: EstadoPedido;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface PedidoUpdateRequest {
  estado: EstadoPedido;
}

// ============ COMISION ============
export interface Comision {
  id: number;
  usuario_id: number;
  usuario: Usuario;
  mes: number;
  anio: number;
  total_ventas: number;
  total_comision: number;
  observaciones: string;
}

export interface ObservacionesUpdateRequest {
  observaciones: string;
}

// ============ GASTO ============
export type CategoriaGasto = "Proveedor" | "Alquiler" | "Mercadería" | "Servicios" | "Otros";
export type MetodoPagoGasto = "Efectivo" | "Transferencia" | "Tarjeta" | "";

export interface Gasto {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: CategoriaGasto;
  proveedor: string;
  metodo_pago: MetodoPagoGasto;
  comprobante: string;
  notas: string;
  cliente_id: number;
  usuario_id: number;
  created_at: string;
  updated_at: string;
}

export interface GastoInput {
  descripcion: string;
  monto: number;
  fecha: string; // "YYYY-MM-DD"
  categoria: CategoriaGasto;
  proveedor?: string;
  metodo_pago?: MetodoPagoGasto;
  comprobante?: string;
  notas?: string;
}

export interface ListarGastosResponse {
  gastos: Gasto[];
  total: number;
  page: number;
  limit: number;
}

export interface GastoResumen {
  categoria: string;
  total: number;
  cantidad: number;
}

export interface GastoPorMes {
  mes: number;
  anio: number;
  total: number;
  cantidad: number;
}

// ============ FILTROS DE GASTOS ============
export interface GastosFilters {
  categoria?: CategoriaGasto;
  fecha_desde?: string;
  fecha_hasta?: string;
  proveedor?: string;
  page?: number;
  limit?: number;
}

// ============ RESPUESTAS GENÉRICAS ============
export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}
```

---

## 🔧 EJEMPLO DE SERVICIO API EN REACT/NEXT.JS

```typescript
// services/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error en la petición");
    }

    return response.json();
  }

  // AUTH
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async register(data: RegistroRequest): Promise<{ message: string; usuario: Usuario }> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PERFIL
  async getProfile(): Promise<Usuario> {
    return this.request("/api/profile");
  }

  // PRODUCTOS
  async getProductos(): Promise<Producto[]> {
    return this.request("/api/productos");
  }

  async getProducto(id: number): Promise<Producto> {
    return this.request(`/api/productos/${id}`);
  }

  async createProducto(data: ProductoCreateRequest): Promise<Producto> {
    return this.request("/api/owner/productos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // STOCK
  async getStock(): Promise<ProductoStock[]> {
    return this.request("/api/stock");
  }

  async getStockByProducto(id: number): Promise<ProductoStock[]> {
    return this.request(`/api/stock/producto/${id}`);
  }

  // CLIENTES
  async getClientes(): Promise<Cliente[]> {
    return this.request("/api/clientes");
  }

  async getCliente(id: number): Promise<Cliente> {
    return this.request(`/api/clientes/${id}`);
  }

  async createCliente(data: ClienteCreateRequest): Promise<Cliente> {
    return this.request("/api/clientes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCliente(id: number, data: ClienteUpdateRequest): Promise<Cliente> {
    return this.request(`/api/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // VENTAS
  async getMisVentas(): Promise<Venta[]> {
    return this.request("/api/mis-ventas");
  }

  async createVenta(data: VentaCreateRequest): Promise<{ message: string; venta: Venta }> {
    return this.request("/api/ventas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PEDIDOS
  async getMisPedidos(): Promise<Pedido[]> {
    return this.request("/api/mis-pedidos");
  }

  async updatePedidoEstado(id: number, data: PedidoUpdateRequest): Promise<Pedido> {
    return this.request(`/api/pedidos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // COMISIONES
  async getMisComisiones(): Promise<Comision[]> {
    return this.request("/api/mis-comisiones");
  }

  // GASTOS
  async getGastos(filters?: GastosFilters): Promise<ListarGastosResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params}` : "";
    return this.request(`/api/gastos${query}`);
  }

  async getGasto(id: number): Promise<Gasto> {
    return this.request(`/api/gastos/${id}`);
  }

  async createGasto(data: GastoInput): Promise<{ message: string; gasto: Gasto }> {
    return this.request("/api/gastos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateGasto(id: number, data: GastoInput): Promise<{ message: string; gasto: Gasto }> {
    return this.request(`/api/gastos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteGasto(id: number): Promise<{ message: string }> {
    return this.request(`/api/gastos/${id}`, {
      method: "DELETE",
    });
  }

  async getGastosResumen(fechaDesde?: string, fechaHasta?: string): Promise<GastoResumen[]> {
    const params = new URLSearchParams();
    if (fechaDesde) params.append("fecha_desde", fechaDesde);
    if (fechaHasta) params.append("fecha_hasta", fechaHasta);
    const query = params.toString() ? `?${params}` : "";
    return this.request(`/api/gastos/resumen${query}`);
  }

  async getGastosPorMes(anio?: number): Promise<GastoPorMes[]> {
    const query = anio ? `?anio=${anio}` : "";
    return this.request(`/api/gastos/por-mes${query}`);
  }

  async getProveedores(): Promise<string[]> {
    return this.request("/api/gastos/proveedores");
  }
}

export const apiService = new ApiService();
export default apiService;
```

---

## ⚠️ MANEJO DE ERRORES

Todos los endpoints pueden devolver los siguientes errores:

```typescript
// 400 Bad Request - Datos inválidos
{ "error": "Descripción del error de validación" }

// 401 Unauthorized - No autenticado o token inválido
{ "error": "Token no proporcionado" }
{ "error": "Token inválido" }

// 403 Forbidden - Sin permisos (rutas de owner)
{ "error": "Acceso denegado" }

// 404 Not Found - Recurso no encontrado
{ "error": "Recurso no encontrado" }

// 500 Internal Server Error - Error del servidor
{ "error": "Error interno del servidor" }
```

---

## 📝 NOTAS IMPORTANTES

1. **Todas las rutas `/api/*`** requieren autenticación con token JWT.
2. **Las rutas `/api/owner/*`** solo están disponibles para usuarios con rol "dueño".
3. **Las fechas** se envían en formato `YYYY-MM-DD` y se reciben en formato ISO 8601.
4. **El token** debe incluirse en el header `Authorization` con el prefijo `Bearer `.
5. **Los montos** son números decimales (usar `number` en TypeScript).
6. **Paginación en gastos:** Por defecto devuelve 50 items por página.
