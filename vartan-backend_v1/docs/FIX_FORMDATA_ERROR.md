# 🐛 FIX: Error "cannot unmarshal string into Go struct"

## ❌ Problema Actual

```javascript
// Lo que está enviando tu frontend:
{
  cliente_id: "3",        // ← STRING (mal)
  forma_pago_id: "1",     // ← STRING (mal)
  sena: "0",              // ← STRING (mal)
  comprobante: {},        // ← OBJETO VACÍO (esto causa el problema)
  detalles: "[...]"       // ← STRING (mal)
}
```

El backend recibe esto como FormData, que convierte TODO a strings. Pero el backend Go espera números.

## ✅ Solución 1: Arreglar la validación del comprobante

El problema está en que `comprobante: {}` NO es `null` ni `undefined`, entonces el código piensa que hay un archivo.

**En tu archivo donde creas la venta (probablemente un componente React):**

```typescript
// ❌ MAL - Esto crea un objeto vacío
const [comprobante, setComprobante] = useState<File | null>({} as any);

// ✅ BIEN - Inicializar como null
const [comprobante, setComprobante] = useState<File | null>(null);
```

## ✅ Solución 2: Validación estricta en el servicio

**En tu `venta.service.ts` (o donde hagas el fetch):**

```typescript
export const ventaService = {
  create: async (data: IVentaCreateRequest) => {
    console.log('=== DEBUG SERVICIO ===');
    console.log('data.comprobante:', data.comprobante);
    console.log('tipo:', typeof data.comprobante);
    console.log('instanceof File:', data.comprobante instanceof File);
    console.log('is null:', data.comprobante === null);
    console.log('is undefined:', data.comprobante === undefined);
    console.log('=====================');

    // ✅ VALIDACIÓN CORRECTA
    const tieneComprobanteValido = 
      data.comprobante !== null && 
      data.comprobante !== undefined && 
      data.comprobante instanceof File;

    if (tieneComprobanteValido) {
      console.log('🔄 Enviando FormData (CON comprobante)');
      
      const formData = new FormData();
      formData.append('cliente_id', data.cliente_id.toString());
      formData.append('forma_pago_id', data.forma_pago_id.toString());
      formData.append('sena', data.sena.toString());
      formData.append('observaciones', data.observaciones || '');
      formData.append('detalles', JSON.stringify(data.detalles));
      formData.append('comprobante', data.comprobante);

      return apiClient.post<IVenta>('/ventas', formData, {
        headers: {
          // NO incluir Content-Type, FormData lo establece automático
        }
      });
    } else {
      console.log('📤 Enviando JSON (SIN comprobante)');
      
      // ✅ ENVIAR COMO JSON (números, no strings)
      const payload = {
        cliente_id: Number(data.cliente_id),        // ← Asegurar que sea número
        forma_pago_id: Number(data.forma_pago_id),  // ← Asegurar que sea número
        sena: Number(data.sena),                    // ← Asegurar que sea número
        observaciones: data.observaciones || '',
        detalles: data.detalles
        // NO incluir comprobante si es null
      };

      return apiClient.post<IVenta>('/ventas', payload);
    }
  }
};
```

## ✅ Solución 3: Limpiar el comprobante antes de enviar

**En tu componente donde preparas el ventaData:**

```typescript
const handleSubmit = async () => {
  const ventaData: IVentaCreateRequest = {
    cliente_id: Number(clienteId),        // ← Convertir a número
    forma_pago_id: Number(formaPagoId),   // ← Convertir a número
    sena: Number(sena),                   // ← Convertir a número
    observaciones: observaciones,
    detalles: detalles,
    // ✅ SOLO agregar comprobante si es un File válido
    ...(comprobante instanceof File && { comprobante })
  };

  console.log('=== VENTA DATA ANTES DE ENVIAR ===');
  console.log(ventaData);
  console.log('==================================');

  await ventaService.create(ventaData);
};
```

## ✅ Solución 4: NO agregar comprobante vacío

**Asegúrate de que tu estado se inicialice correctamente:**

```typescript
// En tu componente React
const [comprobante, setComprobante] = useState<File | null>(null); // ← null, NO {}

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  
  if (file) {
    // Validar tipo y tamaño
    const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!extensionesPermitidas.includes(extension)) {
      alert('Solo se permiten archivos PDF, JPG, JPEG y PNG');
      setComprobante(null); // ← Resetear a null
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede superar los 5MB');
      setComprobante(null); // ← Resetear a null
      return;
    }
    
    setComprobante(file);
  } else {
    setComprobante(null); // ← null cuando no hay archivo
  }
};

const handleRemoveFile = () => {
  setComprobante(null); // ← null, NO {}
  // Si tienes un input ref, limpiarlo también
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

## 🎯 Resumen del Fix

1. **Inicializar estado como `null`**, no como `{}`
2. **Validar que sea `instanceof File`** antes de usar FormData
3. **Convertir IDs a números** cuando uses JSON
4. **NO incluir el campo `comprobante`** en el JSON si no hay archivo

## 🧪 Cómo Probar

1. Abre la consola (F12)
2. Crea una venta SIN comprobante
3. Deberías ver:
   ```
   === DEBUG SERVICIO ===
   data.comprobante: null
   instanceof File: false
   📤 Enviando JSON (SIN comprobante)
   ```
4. Verifica que el payload NO tenga el campo `comprobante`
5. Los IDs deben ser números, no strings

## 📋 Checklist de Verificación

- [ ] `useState<File | null>(null)` - NO `{}`
- [ ] Validación: `comprobante instanceof File`
- [ ] IDs convertidos a números con `Number()`
- [ ] NO incluir `comprobante` en JSON si es null
- [ ] Logs de debugging activados
- [ ] Recargar página completamente (Ctrl+F5)

## 🔍 Si el Error Persiste

Envíame:
1. Los logs de la consola
2. El código de tu componente donde creas la venta
3. El código de tu servicio `venta.service.ts`
4. La pestaña Network del navegador mostrando el payload exacto

---

**Próximo paso:** Implementa estos cambios y prueba crear una venta sin comprobante. Debería enviar JSON con números.
