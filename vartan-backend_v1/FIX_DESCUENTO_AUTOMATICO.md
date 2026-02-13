# 🔧 Fix - Descuento Automático del 3%

## 🚨 Problema Original

El descuento del 3% se aplicaba **automáticamente** cada vez que:
- La forma de pago era "Transferencia Financiera"

Esto ocurría **sin importar** si el usuario quería aplicar el descuento o no.

---

## ✅ Solución Implementada

Ahora el descuento del 3% **solo se aplica** si:
1. ✅ El usuario **marca un checkbox** en el frontend (`usa_descuento_financiera = true`)
2. ✅ **Y** la forma de pago es "Transferencia Financiera"

---

## 📝 Cambios Realizados

### 1. Modelo (`models/sale.go`)

**Campo agregado:**
```go
type VentaCreateRequest struct {
    // ...campos existentes...
    UsaDescuentoFinanciera bool  `json:"usa_descuento_financiera"`
}

type VentaCreateFormRequest struct {
    // ...campos existentes...
    UsaDescuentoFinanciera string `form:"usa_descuento_financiera"`
}
```

### 2. Controlador (`controllers/sales.go`)

**Lógica actualizada:**

**ANTES:**
```go
// ❌ Se aplicaba automáticamente
if formaPago.Nombre == "Transferencia Financiera" {
    descuento = saldo * 0.03
    usaFinanciera = true
}
```

**DESPUÉS:**
```go
// ✅ Solo si el usuario lo activa
if usaDescuentoFinanciera && formaPago.Nombre == "Transferencia Financiera" {
    descuento = saldo * 0.03
    usaFinanciera = true
}
```

---

## 🎨 Frontend - Implementación

### 1. Agregar Checkbox al Formulario

```tsx
const [aplicarDescuento, setAplicarDescuento] = useState(false);

<Checkbox
  checked={aplicarDescuento}
  onCheckedChange={(checked) => setAplicarDescuento(checked as boolean)}
  id="descuento-financiera"
/>
<Label htmlFor="descuento-financiera">
  Aplicar descuento del 3% (Transferencia Financiera)
</Label>
```

### 2. Enviar en el Request

```typescript
const venta = await ventaService.create({
  cliente_id: 1,
  forma_pago_id: 1,
  precio_venta: 25000,
  sena: 5000,
  usa_descuento_financiera: aplicarDescuento, // ← Nuevo campo
  detalles: [...]
});
```

### 3. Mostrar/Ocultar Checkbox según Forma de Pago

```typescript
const mostrarCheckboxDescuento = formaPagoId === 1; // 1 = Transferencia Financiera

{mostrarCheckboxDescuento && (
  <div className="flex items-center space-x-2">
    <Checkbox
      checked={aplicarDescuento}
      onCheckedChange={(checked) => setAplicarDescuento(checked as boolean)}
      id="descuento-financiera"
    />
    <Label htmlFor="descuento-financiera">
      Aplicar descuento del 3%
    </Label>
  </div>
)}
```

---

## 🧪 Testing

### Caso 1: Checkbox Marcado + Transferencia Financiera
```json
{
  "forma_pago_id": 1,
  "usa_descuento_financiera": true,
  "saldo": 20000
}
```
**Resultado:** ✅ Descuento = $600 (3% de $20,000)

### Caso 2: Checkbox NO Marcado + Transferencia Financiera
```json
{
  "forma_pago_id": 1,
  "usa_descuento_financiera": false,
  "saldo": 20000
}
```
**Resultado:** ✅ Descuento = $0

### Caso 3: Checkbox Marcado + Otra Forma de Pago
```json
{
  "forma_pago_id": 2,
  "usa_descuento_financiera": true,
  "saldo": 20000
}
```
**Resultado:** ✅ Descuento = $0

### Caso 4: Checkbox NO Marcado + Otra Forma de Pago
```json
{
  "forma_pago_id": 2,
  "usa_descuento_financiera": false,
  "saldo": 20000
}
```
**Resultado:** ✅ Descuento = $0

---

## 📊 Matriz de Descuento

| Forma de Pago | Checkbox Marcado | ¿Aplica Descuento? |
|--------------|------------------|-------------------|
| Transf. Financiera | ✅ Sí | ✅ **SÍ (3%)** |
| Transf. Financiera | ❌ No | ❌ NO |
| Otra forma | ✅ Sí | ❌ NO |
| Otra forma | ❌ No | ❌ NO |

---

## ✅ Checklist

### Backend
- [x] Agregar campo `usa_descuento_financiera` a modelos
- [x] Modificar lógica de descuento
- [x] Actualizar firma de `processVenta`
- [x] Actualizar llamadas en JSON
- [x] Actualizar llamadas en FormData
- [x] Actualizar documentación

### Frontend
- [ ] Agregar checkbox al formulario
- [ ] Conectar estado del checkbox
- [ ] Enviar `usa_descuento_financiera` en request
- [ ] Mostrar/ocultar según forma de pago
- [ ] Probar todos los casos

---

## 🚀 Para Aplicar

1. **Backend ya está actualizado** ✅
2. **Frontend debe agregar:**
   - Checkbox en formulario de venta
   - Campo `usa_descuento_financiera` en el request

3. **No requiere migración de BD** (solo cambio de lógica)

---

**Fecha:** 2026-02-13  
**Archivos modificados:**
- `models/sale.go`
- `controllers/sales.go`
- `PRECIO_VENTA_GANANCIA.md` (documentación actualizada)

**Estado:** ✅ Backend completado - Pendiente frontend
