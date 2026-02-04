# 📚 DOCUMENTACIÓN API - MÓDULO DE GASTOS

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer <tu_token_jwt>
```

---

## 📝 ENDPOINTS

### 1. Crear Gasto

**POST** `/api/gastos`

**Body:**
```json
{
  "descripcion": "Pago alquiler febrero",
  "monto": 50000,
  "fecha": "2025-02-01",
  "categoria": "Alquiler",
  "proveedor": "Inmobiliaria XYZ",
  "metodo_pago": "Transferencia",
  "comprobante": "FACT-001234",
  "notas": "Incluye expensas"
}
```

**Categorías válidas:**
- `Proveedor` (compra de ropa a proveedor)
- `Alquiler` (alquiler del local)
- `Mercadería` (compra de stock)
- `Servicios` (luz, agua, internet, etc)
- `Otros` (otros gastos)

**Métodos de pago válidos:**
- `Efectivo`
- `Transferencia`
- `Tarjeta`

**Response (201 Created):**
```json
{
  "message": "Gasto creado exitosamente",
  "gasto": {
    "id": 1,
    "descripcion": "Pago alquiler febrero",
    "monto": 50000,
    "fecha": "2025-02-01T00:00:00Z",
    "categoria": "Alquiler",
    "proveedor": "Inmobiliaria XYZ",
    "metodo_pago": "Transferencia",
    "comprobante": "FACT-001234",
    "notas": "Incluye expensas",
    "cliente_id": 1,
    "usuario_id": 1,
    "created_at": "2025-02-02T15:30:00Z",
    "updated_at": "2025-02-02T15:30:00Z"
  }
}
```

---

### 2. Listar Gastos

**GET** `/api/gastos`

**Query Parameters (opcionales):**
- `categoria` - Filtrar por categoría (ej: `Alquiler`)
- `fecha_desde` - Fecha desde (YYYY-MM-DD)
- `fecha_hasta` - Fecha hasta (YYYY-MM-DD)
- `proveedor` - Buscar por proveedor (búsqueda parcial)
- `page` - Número de página (default: 1)
- `limit` - Items por página (default: 50)

**Ejemplos:**

```bash
# Todos los gastos
GET /api/gastos

# Gastos de una categoría
GET /api/gastos?categoria=Alquiler

# Gastos de un período
GET /api/gastos?fecha_desde=2025-01-01&fecha_hasta=2025-01-31

# Gastos de un proveedor
GET /api/gastos?proveedor=Inmobiliaria

# Combinado con paginación
GET /api/gastos?categoria=Mercadería&fecha_desde=2025-02-01&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "gastos": [
    {
      "id": 5,
      "descripcion": "Compra remeras",
      "monto": 15000,
      "fecha": "2025-02-02T00:00:00Z",
      "categoria": "Mercadería",
      "proveedor": "Proveedor ABC",
      "metodo_pago": "Efectivo",
      "comprobante": "",
      "notas": "",
      "cliente_id": 1,
      "usuario_id": 1,
      "created_at": "2025-02-02T10:00:00Z",
      "updated_at": "2025-02-02T10:00:00Z"
    },
    {
      "id": 4,
      "descripcion": "Pago luz",
      "monto": 3500,
      "fecha": "2025-02-01T00:00:00Z",
      "categoria": "Servicios",
      "proveedor": "Edesur",
      "metodo_pago": "Transferencia",
      "comprobante": "FACT-7890",
      "notas": "",
      "cliente_id": 1,
      "usuario_id": 1,
      "created_at": "2025-02-01T14:00:00Z",
      "updated_at": "2025-02-01T14:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 50
}
```

---

### 3. Obtener Gasto Específico

**GET** `/api/gastos/:id`

**Response (200 OK):**
```json
{
  "id": 1,
  "descripcion": "Pago alquiler febrero",
  "monto": 50000,
  "fecha": "2025-02-01T00:00:00Z",
  "categoria": "Alquiler",
  "proveedor": "Inmobiliaria XYZ",
  "metodo_pago": "Transferencia",
  "comprobante": "FACT-001234",
  "notas": "Incluye expensas",
  "cliente_id": 1,
  "usuario_id": 1,
  "created_at": "2025-02-02T15:30:00Z",
  "updated_at": "2025-02-02T15:30:00Z"
}
```

**Error (404 Not Found):**
```json
{
  "error": "Gasto no encontrado"
}
```

---

### 4. Actualizar Gasto

**PUT** `/api/gastos/:id`

**Body:**
```json
{
  "descripcion": "Pago alquiler febrero (actualizado)",
  "monto": 52000,
  "fecha": "2025-02-01",
  "categoria": "Alquiler",
  "proveedor": "Inmobiliaria XYZ",
  "metodo_pago": "Transferencia",
  "comprobante": "FACT-001234-MOD",
  "notas": "Incluye expensas + ajuste"
}
```

**Response (200 OK):**
```json
{
  "message": "Gasto actualizado exitosamente",
  "gasto": {
    "id": 1,
    "descripcion": "Pago alquiler febrero (actualizado)",
    "monto": 52000,
    "fecha": "2025-02-01T00:00:00Z",
    "categoria": "Alquiler",
    "proveedor": "Inmobiliaria XYZ",
    "metodo_pago": "Transferencia",
    "comprobante": "FACT-001234-MOD",
    "notas": "Incluye expensas + ajuste",
    "cliente_id": 1,
    "usuario_id": 1,
    "created_at": "2025-02-02T15:30:00Z",
    "updated_at": "2025-02-02T16:45:00Z"
  }
}
```

---

### 5. Eliminar Gasto

**DELETE** `/api/gastos/:id`

**Response (200 OK):**
```json
{
  "message": "Gasto eliminado exitosamente"
}
```

---

### 6. Resumen de Gastos por Categoría

**GET** `/api/gastos/resumen/general`

**Query Parameters (opcionales):**
- `fecha_desde` - Fecha desde (YYYY-MM-DD)
- `fecha_hasta` - Fecha hasta (YYYY-MM-DD)

**Ejemplo:**
```bash
# Resumen del mes actual
GET /api/gastos/resumen/general?fecha_desde=2025-02-01&fecha_hasta=2025-02-28
```

**Response (200 OK):**
```json
{
  "total": 123500,
  "cantidad": 15,
  "por_categoria": [
    {
      "categoria": "Alquiler",
      "total": 50000,
      "cantidad": 1
    },
    {
      "categoria": "Mercadería",
      "total": 45000,
      "cantidad": 8
    },
    {
      "categoria": "Servicios",
      "total": 18500,
      "cantidad": 4
    },
    {
      "categoria": "Otros",
      "total": 10000,
      "cantidad": 2
    }
  ],
  "fecha_desde": "2025-02-01",
  "fecha_hasta": "2025-02-28"
}
```

---

### 7. Gastos por Mes

**GET** `/api/gastos/resumen/mensual`

**Query Parameters:**
- `anio` - Año a consultar (default: año actual)

**Ejemplo:**
```bash
GET /api/gastos/resumen/mensual?anio=2025
```

**Response (200 OK):**
```json
{
  "anio": "2025",
  "meses": [
    {
      "mes": 1,
      "total": 85000,
      "cantidad": 12
    },
    {
      "mes": 2,
      "total": 123500,
      "cantidad": 15
    }
  ]
}
```

---

### 8. Listar Proveedores

**GET** `/api/gastos/proveedores/listar`

Devuelve lista de proveedores únicos (sin duplicados).

**Response (200 OK):**
```json
{
  "proveedores": [
    "Edesur",
    "Inmobiliaria XYZ",
    "Proveedor ABC",
    "Proveedor DEF",
    "Telecom"
  ]
}
```

---

## 🧪 EJEMPLOS DE USO COMPLETO

### Ejemplo 1: Registrar gastos mensuales

```bash
# 1. Alquiler
POST /api/gastos
{
  "descripcion": "Alquiler local febrero",
  "monto": 50000,
  "fecha": "2025-02-01",
  "categoria": "Alquiler",
  "proveedor": "Inmobiliaria Centro",
  "metodo_pago": "Transferencia"
}

# 2. Luz
POST /api/gastos
{
  "descripcion": "Factura luz febrero",
  "monto": 3500,
  "fecha": "2025-02-05",
  "categoria": "Servicios",
  "proveedor": "Edesur",
  "metodo_pago": "Transferencia",
  "comprobante": "FACT-123456"
}

# 3. Compra mercadería
POST /api/gastos
{
  "descripcion": "Compra remeras y buzos",
  "monto": 25000,
  "fecha": "2025-02-10",
  "categoria": "Mercadería",
  "proveedor": "Textil San Martín",
  "metodo_pago": "Efectivo",
  "notas": "10 remeras + 5 buzos"
}
```

### Ejemplo 2: Ver gastos del mes

```bash
GET /api/gastos?fecha_desde=2025-02-01&fecha_hasta=2025-02-28
```

### Ejemplo 3: Ver cuánto gasté en mercadería

```bash
GET /api/gastos/resumen/general?fecha_desde=2025-02-01&fecha_hasta=2025-02-28
```

Buscar en la respuesta la categoría "Mercadería".

### Ejemplo 4: Corregir un gasto mal cargado

```bash
# 1. Buscar el gasto
GET /api/gastos?descripcion=remeras

# 2. Actualizar
PUT /api/gastos/3
{
  "descripcion": "Compra remeras y buzos (corregido)",
  "monto": 27000,  # Monto corregido
  "fecha": "2025-02-10",
  "categoria": "Mercadería",
  "proveedor": "Textil San Martín",
  "metodo_pago": "Efectivo",
  "notas": "12 remeras + 5 buzos"
}
```

---

## ⚠️ VALIDACIONES Y ERRORES

### Errores Comunes:

**400 Bad Request - Campo requerido faltante:**
```json
{
  "error": "Key: 'GastoInput.Descripcion' Error:Field validation for 'Descripcion' failed on the 'required' tag"
}
```

**400 Bad Request - Monto inválido:**
```json
{
  "error": "Key: 'GastoInput.Monto' Error:Field validation for 'Monto' failed on the 'gt' tag"
}
```
> El monto debe ser mayor a 0

**400 Bad Request - Categoría inválida:**
```json
{
  "error": "Key: 'GastoInput.Categoria' Error:Field validation for 'Categoria' failed on the 'oneof' tag"
}
```
> Las categorías válidas son: Proveedor, Alquiler, Mercadería, Servicios, Otros

**400 Bad Request - Fecha inválida:**
```json
{
  "error": "Formato de fecha inválido. Use YYYY-MM-DD"
}
```

**401 Unauthorized - Sin autenticación:**
```json
{
  "error": "Cliente no autenticado"
}
```

**404 Not Found - Gasto no existe:**
```json
{
  "error": "Gasto no encontrado"
}
```

---

## 📊 CASOS DE USO TÍPICOS

### 1. Registrar gasto diario
```
POST /api/gastos
```

### 2. Ver todos los gastos de hoy
```
GET /api/gastos?fecha_desde=2025-02-02&fecha_hasta=2025-02-02
```

### 3. Ver gastos del mes
```
GET /api/gastos?fecha_desde=2025-02-01&fecha_hasta=2025-02-28
```

### 4. Ver solo gastos de alquiler
```
GET /api/gastos?categoria=Alquiler
```

### 5. Ver todos los gastos de un proveedor
```
GET /api/gastos?proveedor=Textil
```

### 6. Ver resumen del mes (cuánto gasté en total)
```
GET /api/gastos/resumen/general?fecha_desde=2025-02-01&fecha_hasta=2025-02-28
```

### 7. Comparar gastos de este mes vs mes pasado
```
# Mes actual
GET /api/gastos/resumen/general?fecha_desde=2025-02-01&fecha_hasta=2025-02-28

# Mes anterior
GET /api/gastos/resumen/general?fecha_desde=2025-01-01&fecha_hasta=2025-01-31
```

### 8. Ver evolución anual de gastos
```
GET /api/gastos/resumen/mensual?anio=2025
```

---

## 🔧 TESTING CON POSTMAN/INSOMNIA

### Colección de Tests:

1. **Setup**: Obtener token de autenticación
2. **Test 1**: Crear gasto ✅
3. **Test 2**: Listar gastos ✅
4. **Test 3**: Obtener gasto por ID ✅
5. **Test 4**: Actualizar gasto ✅
6. **Test 5**: Eliminar gasto ✅
7. **Test 6**: Resumen por categoría ✅
8. **Test 7**: Gastos por mes ✅
9. **Test 8**: Lista de proveedores ✅

---

## 📝 NOTAS IMPORTANTES

1. **Todas las fechas** se envían en formato `YYYY-MM-DD`
2. **Todas las respuestas con fechas** vienen en formato ISO 8601 con timezone
3. **Categorías** son case-sensitive (usar exactamente como se documenta)
4. **Monto** debe ser mayor a 0 (validación en backend)
5. **Cliente_id** se obtiene automáticamente del token JWT
6. **Paginación** por defecto: 50 items por página
7. **Ordenamiento** por defecto: fecha descendente (más recientes primero)
