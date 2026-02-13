# 🔍 Debug - Página Mi Comisión

## ✅ PROBLEMA RESUELTO

El problema era que el menú mostraba ambas opciones ("Comisiones" y "Mi Comisión") a todos los usuarios, independientemente de su rol.

## 🔧 Solución Implementada

He actualizado el sistema de navegación para que:

1. **Usuarios con rol "dueño":**
   - ✅ Ven la opción "Comisiones" (gestión completa)
   - ❌ NO ven "Mi Comisión"

2. **Usuarios con rol "vendedor":**
   - ❌ NO ven "Comisiones"
   - ✅ Ven la opción "Mi Comisión" (solo lectura de su propia información)

### Cambios Aplicados

#### 1. **`src/routes/getMenuItems.ts`**
- Actualizado para recibir el `userRole` como parámetro
- Usa conditional rendering para mostrar opciones según el rol
- Dueños ven "Comisiones", vendedores ven "Mi Comisión"

#### 2. **`src/components/Layouts/.../Navigation/index.tsx`**
- Importa `useUserPermissions` para obtener el rol del usuario
- Pasa el `userRole` a `GetMenuItems(userRole)`

## 🧪 Prueba con Usuario Vendedor

### Credenciales de Santino M (Vendedor)
```
Email: santinom@vartan.com
Password: SANTINOM1234
Rol: vendedor
```

### Datos que Recibirá
```json
{
  "usuario": {
    "email": "santinom@vartan.com",
    "id": 7,
    "nombre": "Santino M",
    "rol": "vendedor"
  },
  "configuracion": {
    "porcentaje_comision": 20,
    "gasto_publicitario": 47,
    "sueldo_base": 800000,
    "observaciones": "dddd"
  },
  "mes_actual": {
    "total_ventas": 0,
    "cantidad_ventas": 0,
    "comision_neta": 0,
    "sueldo_base": 800000,
    "total_a_cobrar": 800000
  },
  "historial": []
}
```

## ✅ Logs de Debug Activados

He activado logs detallados en:

1. ✅ **Página Mi Comisión** (`app/mi-comision/page.tsx`)
2. ✅ **Servicio de Comisiones** (`src/services/comision.service.ts`)

## 🔍 Cómo Verificar

### Paso 1: Abre la Consola del Navegador

1. Presiona `F12` en tu navegador
2. Ve a la pestaña "Console"

### Paso 2: Navega a la Página

1. Inicia sesión en la aplicación
2. Ve al menú lateral
3. Click en "Mi Comisión"

### Paso 3: Revisa los Logs

Deberías ver logs como estos en orden:

```
=== 🔍 LLAMANDO A getMiResumen ===
URL del endpoint: /api/mi-resumen-comision
Token presente: true

📡 comisionService.getMiResumen() - Iniciando petición
📍 Endpoint: /api/mi-resumen-comision

🔑 Request a: /api/mi-resumen-comision - Token presente: true
📦 Request data: undefined
📋 Request headers: { Authorization: "Bearer ...", ... }

✅ Response OK: /api/mi-resumen-comision - Status: 200
📦 Response data: { usuario: {...}, configuracion: {...}, ... }

✅ comisionService.getMiResumen() - Respuesta: {...}
✅ Respuesta recibida: {...}
=== ✅ fetchResumen completado ===
```

## 🔴 Si Hay Error

Si ves un error, los logs te dirán exactamente qué está pasando:

### Error 404 - Endpoint No Encontrado

```
❌ Error en API: {
  url: "/api/mi-resumen-comision",
  status: 404,
  message: "Not Found"
}
```

**Solución:** El backend no tiene implementado el endpoint `/api/mi-resumen-comision`

### Error 401 - No Autorizado

```
❌ Error en API: {
  url: "/api/mi-resumen-comision",
  status: 401,
  message: "Token inválido o expirado"
}
```

**Solución:** El token JWT no es válido o expiró. Vuelve a hacer login.

### Error 500 - Error del Servidor

```
❌ Error en API: {
  url: "/api/mi-resumen-comision",
  status: 500,
  message: "Error interno del servidor"
}
```

**Solución:** Hay un error en el backend. Revisa los logs del backend.

### Network Error - Backend No Disponible

```
❌ Error al obtener resumen: Error: Network Error
Error message: Network Error
```

**Solución:** El backend no está corriendo. Ejecuta `go run main.go` en la carpeta del backend.

## 🧪 Prueba Manual del Endpoint

Puedes probar el endpoint manualmente con curl:

```bash
# 1. Login para obtener token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@vartan.com","password":"demo1234"}'

# Copiar el token de la respuesta

# 2. Probar el endpoint
curl http://localhost:8080/api/mi-resumen-comision \
  -H "Authorization: Bearer {TOKEN_AQUI}"
```

**Respuesta esperada (200 OK):**
```json
{
  "usuario": {
    "id": 5,
    "nombre": "SANTINO M",
    "email": "santinom@vartan.com",
    "rol": "vendedor"
  },
  "configuracion": {
    "porcentaje_comision": 10,
    "gasto_publicitario": 5000,
    "sueldo_base": 150000,
    "observaciones": "..."
  },
  "mes_actual": {
    "mes": 2,
    "anio": 2026,
    "total_ventas": 250000,
    "cantidad_ventas": 15,
    "comision_bruta": 25000,
    "gasto_publicitario": 5000,
    "comision_neta": 20000,
    "sueldo_base": 150000,
    "total_a_cobrar": 170000,
    "comision_registrada": true,
    "observaciones_comision": "Excelente mes"
  },
  "historial": [...]
}
```

## 📊 Verificación del Flujo Completo

### 1. Verificar que el endpoint existe en el backend

Busca en tu backend de Go:

```go
// Debe existir algo como:
router.GET("/api/mi-resumen-comision", middlewares.AuthRequired(), controllers.ObtenerMiResumenComision)
```

### 2. Verificar que el middleware JWT funciona

El endpoint requiere autenticación. El middleware debe extraer el `user_id` del token.

### 3. Verificar que la función del controlador existe

```go
func ObtenerMiResumenComision(c *gin.Context) {
    userID := c.GetInt("user_id")
    // ... lógica del endpoint
}
```

## 🎯 Checklist de Diagnóstico

- [ ] El backend está corriendo en puerto 8080
- [ ] El endpoint `/api/mi-resumen-comision` existe en el backend
- [ ] El middleware de autenticación está configurado
- [ ] El usuario tiene un token válido (ver console logs)
- [ ] La petición se está haciendo al endpoint correcto
- [ ] El backend devuelve status 200

## 🔧 Para Desactivar los Logs Después

Una vez resuelto el problema, comenta estas líneas:

**En `app/mi-comision/page.tsx`:**
```typescript
// Comentar las líneas de console.log dentro de fetchResumen
```

**En `src/services/comision.service.ts`:**
```typescript
// Comentar las líneas de console.log en getMiResumen
```

## 📝 Información Importante

### Endpoint que DEBE llamar el frontend:
```
GET /api/mi-resumen-comision
```

### Headers requeridos:
```
Authorization: Bearer {token}
```

### Respuesta esperada:
- Status: 200 OK
- Body: JSON con estructura IMiResumenComision

---

**Fecha:** 2026-02-12  
**Logs activados:** ✅  
**Estado:** Esperando logs de la consola del navegador para diagnóstico

