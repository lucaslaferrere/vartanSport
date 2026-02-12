# Script para probar el endpoint de pedidos

Write-Host "Probando endpoint /api/owner/pedidos" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Login
Write-Host "1. Haciendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = "demo@vartan.com"
    password = "demo1234"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login exitoso" -ForegroundColor Green
    Write-Host "   Usuario: $($loginResponse.usuario.nombre)" -ForegroundColor Gray
    Write-Host "   Rol: $($loginResponse.usuario.rol)" -ForegroundColor Gray
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Error en login: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifica que exista un usuario con email 'demo@vartan.com' y password 'demo1234'" -ForegroundColor Yellow
    Write-Host "   O modifica este script con tus credenciales correctas" -ForegroundColor Yellow
    exit 1
}

# Paso 2: Obtener pedidos
Write-Host "2. Obteniendo pedidos..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $pedidos = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/pedidos" -Method GET -Headers $headers
    Write-Host "Pedidos obtenidos exitosamente" -ForegroundColor Green
    Write-Host "   Total de pedidos: $($pedidos.Count)" -ForegroundColor Gray
    Write-Host ""

    if ($pedidos.Count -gt 0) {
        Write-Host "Primeros 3 pedidos:" -ForegroundColor Cyan
        $pedidos | Select-Object -First 3 | ForEach-Object {
            Write-Host "   ID: $($_.id) | Estado: $($_.estado) | Venta ID: $($_.venta_id)" -ForegroundColor Gray
        }
    } else {
        Write-Host "No hay pedidos registrados" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Test exitoso - El backend esta funcionando correctamente" -ForegroundColor Green

} catch {
    Write-Host "Error al obtener pedidos" -ForegroundColor Red
    Write-Host "   Codigo de estado: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
    Write-Host "   Mensaje: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""

    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "Error 401 - Token invalido" -ForegroundColor Red
        Write-Host "   Posibles causas:" -ForegroundColor Yellow
        Write-Host "   1. El JWT_SECRET del backend es diferente" -ForegroundColor Yellow
        Write-Host "   2. El token expiro" -ForegroundColor Yellow
        Write-Host "   3. El middleware de autenticacion fallo" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solucion: Verifica que el JWT_SECRET en .env sea correcto" -ForegroundColor Cyan
    }
    exit 1
}
