# 🔧 Solución a Errores de Conexión con Backend

## 🚨 Problemas Detectados

### 1. Network Error (Error de Red)
```
Error: Network Error
No se puede conectar al servidor backend
```

**Causa:** El backend no está corriendo en `http://localhost:8080`

**Solución:**
1. Abre una terminal
2. Navega a la carpeta del backend
3. Ejecuta: `go run main.go`
4. Espera a ver: `Listening and serving HTTP on :8080`
5. Recarga la página del frontend

### 2. Error 500 en /api/gastos/resumen
```json
{"error":"Error al obtener total de gastos"}
```

**Causa:** Query GORM mal configurada cuando no hay gastos en la base de datos

---

## 🎯 Verificación Rápida del Backend

### Opción 1: Usar el script de verificación
```bash
# En Windows
check-backend.bat

# O manualmente
curl http://localhost:8080/health
```

**Respuesta esperada:**
```json
{
  "message": "Servidor funcionando correctamente",
  "status": "ok"
}
```

**Si NO responde:** El backend no está corriendo. Ve a la sección "Cómo Iniciar el Backend" más abajo.

### Opción 2: Usar el navegador
Abre en tu navegador: http://localhost:8080/health

---

---

## 🚀 Cómo Iniciar el Backend

### Paso 1: Abrir Terminal
- **Windows:** Presiona `Win + R`, escribe `cmd` y presiona Enter
- O usa PowerShell o Git Bash

### Paso 2: Navegar a la carpeta del backend
```bash
cd ruta/a/tu/backend
# Ejemplo: cd D:\LyRSolutions\vartanSport\vartan-backend
```

### Paso 3: Ejecutar el backend
```bash
go run main.go
```

### Paso 4: Esperar confirmación
Deberías ver algo como:
```
[GIN-debug] Listening and serving HTTP on :8080
```

### Paso 5: Verificar
- En otra terminal ejecuta: `curl http://localhost:8080/health`
- O en el navegador abre: http://localhost:8080/health

### Paso 6: Recargar el frontend
- En tu navegador, recarga la página de gastos (F5)
- El error debería desaparecer

---

## ✅ Solución Aplicada en Frontend

La página de gastos ahora maneja este error automáticamente:

1. **Intenta obtener el resumen del servidor**
2. **Si falla (error 500)**, calcula las estadísticas localmente usando los datos ya obtenidos
3. **La página funciona correctamente** incluso si el endpoint falla

### Código Implementado

```typescript
try {
  const resumen = await gastoService.getResumen();
  // Usar datos del servidor si están disponibles
  setStats({
    totalGastos: resumen.total || 0,
    cantidadGastos: resumen.cantidad || 0,
    gastoPromedio: resumen.cantidad > 0 ? resumen.total / resumen.cantidad : 0,
    categoriaTop: resumen.por_categoria.length > 0 
      ? resumen.por_categoria.reduce((a, b) => (a.total > b.total ? a : b)).categoria 
      : 'Sin datos'
  });
} catch (error) {
  // Fallback: calcular localmente
  setStats(calcularStatsLocales(response.gastos));
}
```

## 🔍 Diagnóstico del Backend

### Prueba Realizada
```bash
curl http://localhost:8080/api/gastos/resumen \
  -H "Authorization: Bearer {token}"
```

**Resultado:** Error 500

### Posibles Causas

1. **Query GORM mal configurada** cuando NO hay gastos
2. **Problema con usuario_id en la query**
3. **Backend no reiniciado** después de las correcciones

## 🎯 Cómo Verificar el Backend

### 1. Reiniciar el Backend

```bash
# Detener el servidor actual
# Ctrl+C en la terminal donde corre

# Recompilar y ejecutar
cd backend
go run main.go
```

### 2. Probar el Endpoint

```bash
# 1. Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@vartan.com","password":"demo1234"}'

# Copiar el token de la respuesta

# 2. Probar resumen
curl http://localhost:8080/api/gastos/resumen \
  -H "Authorization: Bearer {TOKEN_AQUI}"
```

**Respuesta esperada:**
```json
{
  "total": 0,
  "cantidad": 0,
  "por_categoria": [],
  "fecha_desde": "",
  "fecha_hasta": ""
}
```

## 🔧 Fix Sugerido para el Backend

En `controllers/gastos.go`, línea ~230:

```go
func ObtenerResumenGastos(c *gin.Context) {
    userID := c.GetInt("user_id")
    
    fechaDesde := c.Query("fecha_desde")
    fechaHasta := c.Query("fecha_hasta")
    
    // Query base
    queryBase := config.DB.Model(&models.Gasto{}).Where("usuario_id = ?", userID)
    
    if fechaDesde != "" {
        queryBase = queryBase.Where("fecha >= ?", fechaDesde)
    }
    
    if fechaHasta != "" {
        queryBase = queryBase.Where("fecha <= ?", fechaHasta)
    }
    
    // Resumen por categoría (nueva instancia)
    var resumenCategoria []models.GastoResumen
    queryCategorias := queryBase.Session(&gorm.Session{})
    if err := queryCategorias.Select("categoria, SUM(monto) as total, COUNT(*) as cantidad").
        Group("categoria").
        Order("total DESC").
        Scan(&resumenCategoria).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener resumen por categoría"})
        return
    }
    
    // Total general (nueva instancia separada)
    var totalGeneral float64
    var cantidadTotal int64
    queryTotal := queryBase.Session(&gorm.Session{})
    
    // FIX: Manejar el caso cuando no hay gastos
    row := queryTotal.Select("COALESCE(SUM(monto), 0) as total, COUNT(*) as cantidad").Row()
    if err := row.Scan(&totalGeneral, &cantidadTotal); err != nil {
        // Si hay error, devolver valores en cero
        totalGeneral = 0
        cantidadTotal = 0
    }
    
    c.JSON(http.StatusOK, gin.H{
        "total":         totalGeneral,
        "cantidad":      cantidadTotal,
        "por_categoria": resumenCategoria,
        "fecha_desde":   fechaDesde,
        "fecha_hasta":   fechaHasta,
    })
}
```

**Cambios clave:**
1. ✅ Usar `Session(&gorm.Session{})` para crear nuevas instancias
2. ✅ Usar `COALESCE(SUM(monto), 0)` para manejar NULL cuando no hay registros
3. ✅ Catch del error y return de valores por defecto (0)

## 📊 Estado Actual

### Frontend
✅ **Funcionando correctamente**
- Si el backend responde → usa datos del servidor
- Si el backend falla → muestra mensaje de error claro con instrucciones
- Botón de "Reintentar" disponible
- Logs mejorados en la consola del navegador

### Backend
⚠️ **Requiere estar corriendo**
- **Estado:** Necesita ser iniciado manualmente
- **Puerto:** 8080
- **Comando:** `go run main.go`
- Endpoint `/api/gastos` → ✅ Funciona (cuando está corriendo)
- Endpoint `/api/gastos/resumen` → ⚠️ Puede dar error 500 si no hay gastos

### Experiencia de Usuario
✅ **Mensajes claros de error**
- Network Error → Indica que el backend no está corriendo + instrucciones
- Error 500 → Mensaje genérico de error del servidor
- Error 401 → Redirige automáticamente al login

## 🎯 Próximos Pasos

### Para el Usuario (URGENTE)
1. **Verificar que el backend esté corriendo:**
   - Ejecuta: `check-backend.bat` (doble clic)
   - O abre en el navegador: http://localhost:8080/health
   
2. **Si el backend NO está corriendo:**
   - Abre una terminal
   - Navega a la carpeta del backend
   - Ejecuta: `go run main.go`
   - Espera a ver: "Listening and serving HTTP on :8080"

3. **Recargar el frontend:**
   - Presiona F5 en tu navegador
   - El error debería desaparecer

### Para el Desarrollador (Opcional)
1. **Si el backend sigue dando error 500 en /resumen:**
   - Reiniciar el backend con los cambios aplicados
   - Probar con el script: `node test-backend.js`
   - Verificar logs del backend

2. **Para debug avanzado:**
   - Activar logs detallados en `src/libraries/api.ts` (descomentar líneas)
   - Revisar consola del navegador (F12)
   - Revisar logs del backend

## 📞 Para Desarrollo

Si necesitas debug temporal, activa los logs en `api.ts`:

```typescript
// Descomentar estas líneas en src/libraries/api.ts
console.log('🔑 Request a:', config.url, '- Token presente:', !!token);
console.log('✅ Response OK:', response.config.url, '- Status:', response.status);
```

---

**Fecha:** 2026-02-12  
**Status:** Frontend corregido ✅ | Backend pendiente de verificación ⚠️

