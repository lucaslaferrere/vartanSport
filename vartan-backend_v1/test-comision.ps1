# Script para probar el endpoint de mi-resumen-comision
Write-Host "=== TEST MI RESUMEN COMISION ===" -ForegroundColor Cyan

# 1. Login como Santino M
Write-Host "`n1. Haciendo login como Santino M..." -ForegroundColor Yellow
$loginBody = @{
    email = "santinom@vartan.com"
    password = "SANTINOM1234"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "✅ Login exitoso!" -ForegroundColor Green
    Write-Host "   Nombre: $($loginResponse.usuario.nombre)"
    Write-Host "   Rol: $($loginResponse.usuario.rol)"
    Write-Host "   Token obtenido: SI"

    $token = $loginResponse.token

    # 2. Obtener mi resumen de comision
    Write-Host "`n2. Obteniendo mi resumen de comision..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    $resumen = Invoke-RestMethod -Uri "http://localhost:8080/api/mi-resumen-comision" -Method GET -Headers $headers

    Write-Host "✅ Resumen obtenido!" -ForegroundColor Green
    Write-Host "`n=== USUARIO ===" -ForegroundColor Magenta
    Write-Host "   ID: $($resumen.usuario.id)"
    Write-Host "   Nombre: $($resumen.usuario.nombre)"
    Write-Host "   Rol: $($resumen.usuario.rol)"

    Write-Host "`n=== CONFIGURACION ===" -ForegroundColor Magenta
    Write-Host "   Porcentaje comision: $($resumen.configuracion.porcentaje_comision)%"
    Write-Host "   Gasto publicitario: $($resumen.configuracion.gasto_publicitario)"
    Write-Host "   Sueldo base: $($resumen.configuracion.sueldo_base)"
    Write-Host "   Observaciones: $($resumen.configuracion.observaciones)"

    Write-Host "`n=== MES ACTUAL ===" -ForegroundColor Magenta
    Write-Host "   Mes/Año: $($resumen.mes_actual.mes)/$($resumen.mes_actual.anio)"
    Write-Host "   Total ventas: $($resumen.mes_actual.total_ventas)"
    Write-Host "   Cantidad ventas: $($resumen.mes_actual.cantidad_ventas)"
    Write-Host "   Comision bruta: $($resumen.mes_actual.comision_bruta)"
    Write-Host "   Comision neta: $($resumen.mes_actual.comision_neta)"
    Write-Host "   Total a cobrar: $($resumen.mes_actual.total_a_cobrar)"

    Write-Host "`n=== HISTORIAL ($($resumen.historial.Count) registros) ===" -ForegroundColor Magenta
    foreach ($h in $resumen.historial) {
        Write-Host "   - $($h.mes)/$($h.anio): Ventas=$($h.total_ventas), Comision=$($h.total_comision)"
    }

    Write-Host "`n✅ TEST COMPLETADO EXITOSAMENTE" -ForegroundColor Green

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}
