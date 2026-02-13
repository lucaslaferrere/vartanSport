# Test del campo sueldo en comisiones

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA DE CAMPO SUELDO" -ForegroundColor Cyan
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
    Write-Host ""
} catch {
    Write-Host "   ❌ Error en login: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# 2. Obtener vendedores
Write-Host "2. Obteniendo lista de vendedores..." -ForegroundColor Yellow
try {
    $vendedores = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/usuarios/vendedores" -Method GET -Headers $headers
    Write-Host "   ✅ Vendedores obtenidos: $($vendedores.Count)" -ForegroundColor Green

    # Seleccionar el primer vendedor para prueba
    $vendedor = $vendedores[0]
    Write-Host "   Vendedor seleccionado: $($vendedor.nombre) (ID: $($vendedor.id))" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "   ❌ Error al obtener vendedores: $_" -ForegroundColor Red
    exit 1
}

# 3. Actualizar configuración de comisión con sueldo
Write-Host "3. Actualizando configuración con sueldo..." -ForegroundColor Yellow
$configBody = @{
    porcentaje_comision = 15.0
    gasto_publicitario = 5000.0
    sueldo = 350000.0
    observaciones = "Prueba de sueldo mensual"
} | ConvertTo-Json

try {
    $updated = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/usuarios/$($vendedor.id)/comision-config" -Method PUT -Body $configBody -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Configuración actualizada" -ForegroundColor Green
    Write-Host "   - Comisión: $($updated.porcentaje_comision)%" -ForegroundColor White
    Write-Host "   - Gasto Publicitario: `$$($updated.gasto_publicitario)" -ForegroundColor White
    Write-Host "   - Sueldo: `$$($updated.sueldo)" -ForegroundColor White
    Write-Host "   - Observaciones: $($updated.observaciones_config)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "   ❌ Error al actualizar: $_" -ForegroundColor Red
    exit 1
}

# 4. Verificar vendedores actualizados
Write-Host "4. Verificando vendedores con sueldo..." -ForegroundColor Yellow
try {
    $vendedores = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/usuarios/vendedores" -Method GET -Headers $headers
    Write-Host "   ✅ Vendedores verificados" -ForegroundColor Green
    Write-Host ""

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  VENDEDORES CON SUELDO" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    foreach ($v in $vendedores) {
        Write-Host "ID: $($v.id) | $($v.nombre)" -ForegroundColor White
        Write-Host "  Email: $($v.email)" -ForegroundColor Gray
        Write-Host "  Comisión: $($v.porcentaje_comision)% | Gasto Pub: `$$($v.gasto_publicitario) | Sueldo: `$$($v.sueldo)" -ForegroundColor Cyan
        Write-Host ""
    }

} catch {
    Write-Host "   ❌ Error al verificar: $_" -ForegroundColor Red
    exit 1
}

# 5. Calcular comisiones (para que se guarde el sueldo)
Write-Host "5. Calculando comisiones del mes..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/comisiones/calcular" -Method POST -Headers $headers
    Write-Host "   ✅ $($result.message)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error al calcular comisiones: $_" -ForegroundColor Red
    exit 1
}

# 6. Ver comisiones con sueldo
Write-Host "6. Obteniendo comisiones con sueldo..." -ForegroundColor Yellow
try {
    $comisiones = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/comisiones" -Method GET -Headers $headers
    Write-Host "   ✅ Comisiones obtenidas: $($comisiones.Count)" -ForegroundColor Green
    Write-Host ""

    if ($comisiones.Count -gt 0) {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  COMISIONES CON SUELDO" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        foreach ($c in $comisiones | Select-Object -First 5) {
            Write-Host "Usuario: $($c.usuario.nombre) | Mes: $($c.mes)/$($c.anio)" -ForegroundColor White
            Write-Host "  Ventas: `$$($c.total_ventas) | Comisión: `$$($c.total_comision) | Sueldo: `$$($c.sueldo)" -ForegroundColor Cyan
            Write-Host ""
        }
    }

} catch {
    Write-Host "   ❌ Error al obtener comisiones: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Todas las pruebas completadas exitosamente" -ForegroundColor Green
