# 💰 Implementación de Costo, Precio de Venta y Ganancia

## 📊 Cambios Realizados

### 1. Modelo de Datos (`models/sale.go`)

**Campos agregados a `Venta`:**
```go
Costo       float64  // Suma de precio_unitario * cantidad (costo real de productos)
PrecioVenta float64  // Precio que cobra al cliente (ingresado por usuario)
Ganancia    float64  // PrecioVenta - Costo (calculado automáticamente)
Total       float64  // Igual a PrecioVenta (para compatibilidad)
```

**Request actualizado:**
```go
type VentaCreateRequest struct {
    UsuarioID              *int
    ClienteID              int
    FormaPagoID            int
    PrecioVenta            float64  // ← NUEVO: Campo requerido
    Sena                   float64
    UsaDescuentoFinanciera bool     // ← NUEVO: Controla si se aplica el 3% de descuento
    Observaciones          string
    Detalles               []VentaDetalleCreateRequest
}
```

---

### 2. Lógica de Negocio (`controllers/sales.go`)

**Cálculo automático:**
```go
// 1. Calcular costo (suma de precio_unitario de productos)
costo = Σ (precio_unitario * cantidad)

// 2. Precio de venta (ingresado por usuario)
precioVenta = valor del frontend

// 3. Ganancia (calculada automáticamente)
ganancia = precioVenta - costo

// 4. Descuento (solo si usuario marca checkbox Y forma pago es Transferencia Financiera)
if (usaDescuentoFinanciera && formaPago == "Transferencia Financiera") {
    descuento = saldo * 0.03
}
```

**Ejemplo:**
```
Productos vendidos:
- Remera S: 2 x $5,000 = $10,000
- Pantalón M: 1 x $8,000 = $8,000
Costo total: $18,000

Usuario ingresa:
- Precio de venta: $25,000

Sistema calcula:
- Ganancia: $25,000 - $18,000 = $7,000
```

---

### 3. Migración de Base de Datos

**Script SQL:** `sql/add_precio_venta_ganancia.sql`

```sql
-- 1. Renombrar total a costo
ALTER TABLE ventas RENAME COLUMN total TO costo;

-- 2. Agregar precio_venta
ALTER TABLE ventas ADD COLUMN precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 3. Agregar ganancia
ALTER TABLE ventas ADD COLUMN ganancia DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 4. Agregar total (compatibilidad)
ALTER TABLE ventas ADD COLUMN total DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 5. Actualizar datos existentes
UPDATE ventas SET precio_venta = costo WHERE precio_venta = 0;
UPDATE ventas SET total = precio_venta;
UPDATE ventas SET ganancia = precio_venta - costo;
```

---

## 🚀 Cómo Aplicar

### Paso 1: Ejecutar Migración SQL

**En local:**
```bash
docker exec -it vartan_postgres psql -U postgres -d vartan_sports -f /sql/add_precio_venta_ganancia.sql
```

**En producción (Digital Ocean):**
```bash
# Conectar a la base de datos
psql -h <host> -U <usuario> -d vartan_sports

# Ejecutar el script
\i sql/add_precio_venta_ganancia.sql
```

### Paso 2: Verificar Estructura

```sql
\d ventas
```

**Columnas esperadas:**
- `costo` (DECIMAL 10,2)
- `precio_venta` (DECIMAL 10,2)
- `ganancia` (DECIMAL 10,2)
- `total` (DECIMAL 10,2)

### Paso 3: Reiniciar Backend

```bash
# En local
go run main.go

# En producción (Coolify)
# Se reiniciará automáticamente al hacer push
```

---

## 📱 Cambios Requeridos en Frontend

### Request de Creación de Venta

**ANTES:**
```typescript
interface IVentaCreateRequest {
  cliente_id: number;
  forma_pago_id: number;
  sena: number;
  observaciones?: string;
  detalles: IVentaDetalleCreateRequest[];
}
```

**DESPUÉS:**
```typescript
interface IVentaCreateRequest {
  cliente_id: number;
  forma_pago_id: number;
  precio_venta: number;                 // ← NUEVO: Campo requerido
  sena: number;
  usa_descuento_financiera?: boolean;   // ← NUEVO: Controla descuento 3%
  observaciones?: string;
  detalles: IVentaDetalleCreateRequest[];
}
```

### Response de Venta

```typescript
interface IVenta {
  id: number;
  usuario_id: number;
  cliente_id: number;
  forma_pago_id: number;
  costo: number;          // ← NUEVO: Costo de productos
  precio_venta: number;   // ← NUEVO: Precio cobrado al cliente
  ganancia: number;       // ← NUEVO: Ganancia = precio_venta - costo
  total: number;          // Igual a precio_venta
  sena: number;
  saldo: number;
  descuento: number;
  total_final: number;
  // ...resto de campos
}
```

### Ejemplo de Uso en Frontend

```typescript
// En el formulario de nueva venta
const crearVenta = async () => {
  // 1. Calcular costo automáticamente (mostrar al usuario)
  const costoCalculado = detalles.reduce((sum, d) => 
    sum + (d.precio_unitario * d.cantidad), 0
  );

  // 2. Usuario ingresa precio de venta
  const precioVenta = 25000; // Input del usuario

  // 3. Mostrar ganancia estimada antes de crear
  const gananciaEstimada = precioVenta - costoCalculado;
  
  console.log(`Costo: $${costoCalculado}`);
  console.log(`Precio venta: $${precioVenta}`);
  console.log(`Ganancia: $${gananciaEstimada}`);

  // 4. Usuario marca/desmarca checkbox de descuento financiera
  const aplicarDescuento = true; // Estado del checkbox

  // 5. Crear venta
  const venta = await ventaService.create({
    cliente_id: 1,
    forma_pago_id: 1,
    precio_venta: precioVenta,
    sena: 5000,
    usa_descuento_financiera: aplicarDescuento, // ← Nuevo campo
    detalles: [
      { producto_id: 1, talle: "M", cantidad: 2, precio_unitario: 10000 },
      { producto_id: 2, talle: "L", cantidad: 1, precio_unitario: 5000 }
    ]
  });
};
```

---

## 🧪 Testing

### Test Manual

```bash
# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@vartan.com","password":"demo1234"}'

# Crear venta con nuevo campo precio_venta
curl -X POST http://localhost:8080/api/ventas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "cliente_id": 1,
    "forma_pago_id": 1,
    "precio_venta": 25000,
    "sena": 5000,
    "usa_descuento_financiera": true,
    "detalles": [
      {
        "producto_id": 1,
        "talle": "M",
        "cantidad": 2,
        "precio_unitario": 10000
      }
    ]
  }'
```

**Respuesta esperada:**
```json
{
  "id": 123,
  "costo": 20000,
  "precio_venta": 25000,
  "ganancia": 5000,
  "total": 25000,
  "sena": 5000,
  "saldo": 20000,
  "total_final": 24400
}
```

---

## 📊 Reportes y Análisis

Con estos nuevos campos puedes generar reportes de:

1. **Ganancia por venta**
   ```sql
   SELECT id, fecha_venta, costo, precio_venta, ganancia 
   FROM ventas 
   ORDER BY fecha_venta DESC;
   ```

2. **Ganancia total del mes**
   ```sql
   SELECT SUM(ganancia) as ganancia_total 
   FROM ventas 
   WHERE DATE_TRUNC('month', fecha_venta) = DATE_TRUNC('month', CURRENT_DATE);
   ```

3. **Margen de ganancia por venta**
   ```sql
   SELECT id, 
          ROUND((ganancia / NULLIF(costo, 0)) * 100, 2) as margen_porcentaje
   FROM ventas;
   ```

4. **Top productos más rentables**
   ```sql
   SELECT p.nombre, 
          SUM(v.ganancia) as ganancia_total,
          COUNT(v.id) as ventas_count
   FROM ventas v
   JOIN ventas_detalle vd ON v.id = vd.venta_id
   JOIN productos p ON vd.producto_id = p.id
   GROUP BY p.id, p.nombre
   ORDER BY ganancia_total DESC;
   ```

---

## ✅ Checklist de Implementación

### Backend
- [x] Agregar campos a modelo `Venta`
- [x] Agregar `precio_venta` a requests
- [x] Modificar lógica de `processVenta`
- [x] Calcular automáticamente `ganancia`
- [x] Actualizar llamadas a `processVenta`
- [x] Crear script de migración SQL

### Base de Datos
- [ ] Ejecutar migración en local
- [ ] Verificar estructura de tabla
- [ ] Ejecutar migración en producción

### Frontend
- [ ] Agregar campo `precio_venta` al formulario
- [ ] Mostrar costo calculado al usuario
- [ ] Mostrar ganancia estimada
- [ ] Actualizar interface `IVentaCreateRequest`
- [ ] Actualizar interface `IVenta`
- [ ] Probar creación de venta

### Testing
- [ ] Probar creación de venta en local
- [ ] Verificar cálculo de ganancia
- [ ] Probar con diferentes escenarios
- [ ] Verificar en producción

---

**Fecha:** 2026-02-13  
**Archivos modificados:**
- `models/sale.go`
- `controllers/sales.go`
- `sql/add_precio_venta_ganancia.sql`

**Estado:** ✅ Backend completado - Pendiente frontend y migración DB
