# 🔍 DEBUG URGENTE - Mi Comisión No Se Muestra

## ✅ Backend Verificado - Funciona Perfectamente

He probado el endpoint y el backend está funcionando correctamente:

```bash
node test-mi-comision-santino.js
```

**Resultado:** ✅ 200 OK con todos los datos correctos

### Datos que el Backend SÍ Envía:
```json
{
  "usuario": {
    "id": 7,
    "nombre": "Santino M",
    "email": "santinom@vartan.com",
    "rol": "vendedor"
  },
  "configuracion": {
    "porcentaje_comision": 20,
    "gasto_publicitario": 47,
    "sueldo_base": 800000,
    "observaciones": "dddd"
  },
  "mes_actual": {
    "mes": 2,                    // ✅ SÍ está presente
    "anio": 2026,                // ✅ SÍ está presente
    "total_ventas": 0,
    "cantidad_ventas": 0,
    "comision_bruta": 0,         // ✅ SÍ está presente
    "gasto_publicitario": 47,    // ✅ SÍ está presente
    "comision_neta": 0,
    "sueldo_base": 800000,
    "total_a_cobrar": 800000,
    "comision_registrada": false,
    "observaciones_comision": ""
  },
  "historial": []
}
```

## 🚨 El Problema Está en el Frontend

Si solo ves el título "Mi Comisión" pero no el contenido, hay varias posibilidades:

### 1. El Usuario No Tiene Token Válido
### 2. La Página Se Queda en Loading Infinito
### 3. Hay un Error Silencioso
### 4. El Rol del Usuario No Se Detecta Correctamente

## 📋 INSTRUCCIONES DE DEBUG

### Paso 1: Abre la Consola del Navegador

1. Presiona `F12`
2. Ve a la pestaña **Console**

### Paso 2: Limpia el Caché

```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Paso 3: Inicia Sesión con Santino

```
Email: santinom@vartan.com
Password: SANTINOM1234
```

### Paso 4: Ve a "Mi Comisión"

Busca en el menú lateral la opción **"Mi Comisión"** y haz click.

### Paso 5: REVISA LA CONSOLA

Deberías ver estos logs EN ORDEN:

```
🔵 useEffect ejecutado - mounted: true
🟢 Llamando a fetchResumen...
📊 Estado actual: {mounted: true, loading: true, error: false, resumen: false}
⏳ Mostrando estado de loading...

=== 🔍 LLAMANDO A getMiResumen ===
URL del endpoint: /api/mi-resumen-comision
Token presente: true

📡 comisionService.getMiResumen() - Iniciando petición
📍 Endpoint: /api/mi-resumen-comision

✅ Response OK: /api/mi-resumen-comision - Status: 200
✅ comisionService.getMiResumen() - Respuesta: {...}
✅ Respuesta recibida: {...}
=== ✅ fetchResumen completado ===

📊 Estado actual: {mounted: true, loading: false, error: false, resumen: true}
✅ Renderizando contenido completo
📦 Datos del resumen: {...}
```

## 🔴 Posibles Problemas y Soluciones

### Problema 1: "Token presente: false"

**Solución:**
1. Cierra sesión
2. Vuelve a iniciar sesión
3. Verifica que `localStorage.getItem('token')` tenga un valor

### Problema 2: Se Queda en "⏳ Mostrando estado de loading..."

**Posibles causas:**
- `loading` nunca se pone en `false`
- El `useEffect` no se ejecuta
- `mounted` es `false`

**Solución:**
- Busca en la consola: `🔵 useEffect ejecutado`
- Si NO aparece, el componente no se está montando correctamente

### Problema 3: Error 401 Unauthorized

**Solución:**
```javascript
// En la consola del navegador (F12):
localStorage.clear();
location.reload();
// Luego vuelve a iniciar sesión
```

### Problema 4: Error 404 Not Found

El endpoint no existe. Verifica que el backend esté corriendo.

### Problema 5: Network Error

```
❌ Error al obtener resumen: Error: Network Error
```

**Solución:**
- El backend no está corriendo
- Ejecuta: `go run main.go` en la carpeta del backend

### Problema 6: CORS Error

```
Access to fetch at 'http://localhost:8080/api/mi-resumen-comision' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solución:** El backend debe tener CORS configurado correctamente.

## 📝 Checklist de Verificación

Copia estos comandos en la consola del navegador (F12):

```javascript
// 1. Verificar token
console.log('Token:', localStorage.getItem('token') ? 'EXISTS' : 'NOT FOUND');

// 2. Verificar usuario
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));

// 3. Verificar rol
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Rol:', user.rol);

// 4. Test manual del endpoint
fetch('http://localhost:8080/api/mi-resumen-comision', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('✅ Datos:', data))
.catch(err => console.error('❌ Error:', err));
```

## 🎯 Qué Buscar en la Consola

### ✅ Si Todo Funciona Bien:

```
🔵 useEffect ejecutado - mounted: true
🟢 Llamando a fetchResumen...
=== 🔍 LLAMANDO A getMiResumen ===
✅ Response OK: /api/mi-resumen-comision - Status: 200
✅ Respuesta recibida: {usuario: {...}, configuracion: {...}, ...}
📊 Estado actual: {mounted: true, loading: false, error: false, resumen: true}
✅ Renderizando contenido completo
```

### ❌ Si Hay un Error:

Busca líneas que empiecen con `❌` y copia el mensaje completo.

## 🔧 Solución Rápida

Si nada funciona, ejecuta esto en la consola del navegador:

```javascript
// Limpiar todo y empezar de cero
localStorage.clear();
sessionStorage.clear();
location.href = '/login';
```

Luego:
1. Login con Santino
2. Ve a "Mi Comisión"
3. Revisa la consola

## 📞 Información para Reportar

Si sigue sin funcionar, copia y pega esto desde la consola:

1. **TODOS los logs** que aparezcan (desde que cargas la página)
2. El resultado de este comando:
```javascript
{
  token: !!localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || '{}'),
  url: window.location.href
}
```

---

**Próximo paso:** Ejecuta las instrucciones de debug y comparte los logs de la consola.

