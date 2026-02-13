# Test del endpoint de vendedores

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROBANDO ENDPOINT DE VENDEDORES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "1. Haciendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@vartan.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✅ Login exitoso" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   ❌ Error en login: $_" -ForegroundColor Red
    exit 1
}

# 2. Obtener vendedores
Write-Host "2. Obteniendo lista de vendedores..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $vendedores = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/usuarios/vendedores" -Method GET -Headers $headers
    Write-Host "   ✅ Vendedores obtenidos exitosamente" -ForegroundColor Green
    Write-Host "   Total vendedores: $($vendedores.Count)" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  LISTA DE VENDEDORES" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    foreach ($v in $vendedores) {
        Write-Host "ID: $($v.id) | $($v.nombre) | $($v.email) | Comisión: $($v.porcentaje_comision)%" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "✅ Test completado exitosamente" -ForegroundColor Green

} catch {
    Write-Host "   ❌ Error al obtener vendedores: $_" -ForegroundColor Red
    Write-Host "   Respuesta: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}
