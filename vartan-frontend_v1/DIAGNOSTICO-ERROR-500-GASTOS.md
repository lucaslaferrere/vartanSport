# 🔍 Diagnóstico - Error 500 al Crear Gasto

## 🚨 Error Actual

```
Error: Request failed with status code 500
POST /api/gastos
```

## 📊 Logs Activados

He activado logs detallados en:
1. ✅ Modal de gastos (`AgregarGastoModal.tsx`)
2. ✅ Interceptor de axios (`api.ts`)

## 🔍 Cómo Diagnosticar

### Paso 1: Abre la Consola del Navegador (F12)

Ve a la pestaña "Console"

### Paso 2: Intenta Crear un Gasto

Llena el formulario y haz click en "Guardar Gasto"

### Paso 3: Busca Estos Logs

Deberías ver algo como:

```
=== DEBUG GASTO ===
Datos a enviar: { descripcion: "...", monto: 1000, fecha: "2026-02-12", ... }
Tipos:
  descripcion: string = ...
  monto: number = 1000
  fecha: string = 2026-02-12
  categoria: string = Alquiler
  proveedor: string = undefined
  metodo_pago: string = undefined
==================

🔑 Request a: /api/gastos - Token presente: true
📦 Request data: { descripcion: "...", ... }
📋 Request headers: { Authorization: "Bearer ...", ... }

❌ Error en API: {
  url: "/api/gastos",
  method: "post",
  status: 500,
  statusText: "Internal Server Error",
  message: "...",  ← 🔥 ESTE ES EL MENSAJE DE ERROR DEL BACKEND
  data: { error: "..." }
}
```

### Paso 4: Identifica el Problema

El log `message` y `data.error` te dirán exactamente qué está mal.

## 🐛 Problemas Comunes

### 1. Campo `usuario_id` Faltante

**Error Backend:**
```json
{"error": "usuario_id is required"}
```

**Causa:** El token JWT no contiene el `user_id` o el middleware no lo está extrayendo correctamente.

**Solución:**
- Verificar que el token sea válido
- Verificar que el middleware JWT esté configurado correctamente
- El `user_id` debe extraerse automáticamente del token

### 2. Formato de Fecha Incorrecto

**Error Backend:**
```json
{"error": "Formato de fecha inválido. Use YYYY-MM-DD"}
```

**Causa:** La fecha no está en el formato correcto.

**Solución Frontend:**
```typescript
// ✅ Correcto (ya implementado)
const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
// Resultado: "2026-02-12"
```

### 3. Categoría Inválida

**Error Backend:**
```json
{"error": "Categoría inválida"}
```

**Categorías válidas:**
- `Proveedor`
- `Alquiler`
- `Mercadería`
- `Servicios`
- `Otros`

**Solución:** Ya implementado correctamente con el enum `CategoriaGasto`.

### 4. Monto Inválido

**Error Backend:**
```json
{"error": "El monto debe ser mayor a 0"}
```

**Solución:** Ya validado en el frontend:
```typescript
if (!monto || parseFloat(monto) <= 0) {
  setError('El monto debe ser mayor a 0');
  return;
}
```

### 5. Base de Datos - Tabla No Existe

**Error Backend:**
```json
{"error": "relation \"gastos\" does not exist"}
```

**Solución:**
```sql
-- Ejecutar en PostgreSQL
CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    proveedor VARCHAR(255),
    metodo_pago VARCHAR(50),
    comprobante VARCHAR(100),
    notas TEXT,
    usuario_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Constraint Violation

**Error Backend:**
```json
{"error": "pq: null value in column \"usuario_id\" violates not-null constraint"}
```

**Causa:** El `usuario_id` no se está enviando o el middleware no lo extrae del token.

**Solución Backend (en Go):**
```go
func CrearGasto(c *gin.Context) {
    // ✅ Obtener usuario_id del contexto (del middleware JWT)
    userID := c.GetInt("user_id")
    
    if userID == 0 {
        c.JSON(400, gin.H{"error": "Usuario no autenticado"})
        return
    }
    
    // ... resto del código
    gasto.UsuarioID = userID
}
```

## 🔧 Verificación del Backend

### Opción 1: Probar con curl

```bash
# 1. Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@vartan.com","password":"demo1234"}'

# Copiar el token de la respuesta

# 2. Crear gasto
curl -X POST http://localhost:8080/api/gastos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_AQUI}" \
  -d '{
    "descripcion": "Prueba desde curl",
    "monto": 1000,
    "fecha": "2026-02-12",
    "categoria": "Otros"
  }'
```

### Opción 2: Revisar Logs del Backend

En la terminal donde corre el backend (`go run main.go`), busca:
- Errores SQL
- Errores de validación
- Stack traces

## 📋 Checklist de Verificación

- [ ] Backend está corriendo en puerto 8080
- [ ] Token JWT es válido
- [ ] Middleware JWT extrae `user_id` correctamente
- [ ] Tabla `gastos` existe en la base de datos
- [ ] Columna `usuario_id` es NOT NULL
- [ ] Formato de fecha es "YYYY-MM-DD"
- [ ] Categoría es una de las válidas
- [ ] Monto es mayor a 0

## 🎯 Próximos Pasos

1. **Copia los logs de la consola** (todo el objeto de error)
2. **Busca el campo `message` o `data.error`**
3. **Compara con la lista de problemas comunes arriba**
4. **Aplica la solución correspondiente**

Si el error no está en la lista, **comparte el log completo** para analizarlo.

---

**Última actualización:** 2026-02-12  
**Logs activados:** ✅  
**Estado:** Esperando logs del navegador para diagnóstico

