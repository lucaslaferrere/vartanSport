# Debug de POST Endpoints - Vartan Backend
# Este script te ayuda a identificar por qué los POST dan 404

Write-Host "🔍 DIAGNÓSTICO DE POST ENDPOINTS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$BaseUrl = "http://localhost:8080"

# Función para probar un endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method,
        [string]$Description,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )

    Write-Host "📍 $Description" -ForegroundColor Yellow
    Write-Host "   URL: $Method $Url" -ForegroundColor Gray

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
        }

        if ($Headers.Count -gt 0) {
            $params['Headers'] = $Headers
        }

        if ($Body) {
            $params['Body'] = $Body
            $params['ContentType'] = 'application/json'
        }

        $response = Invoke-WebRequest @params
        Write-Host "   ✅ Status: $($response.StatusCode) - OK" -ForegroundColor Green
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ❌ Status: $statusCode" -ForegroundColor Red

        switch ($statusCode) {
            404 {
                Write-Host "   ⚠️  PROBLEMA: Ruta no encontrada" -ForegroundColor Yellow
                Write-Host "   Verifica:" -ForegroundColor Yellow
                Write-Host "   - ¿El servidor está corriendo?" -ForegroundColor Yellow
                Write-Host "   - ¿La URL es correcta?" -ForegroundColor Yellow
                Write-Host "   - ¿El método HTTP es correcto?" -ForegroundColor Yellow
            }
            401 {
                Write-Host "   ⚠️  PROBLEMA: No autorizado" -ForegroundColor Yellow
                Write-Host "   - Falta token o es inválido" -ForegroundColor Yellow
            }
            400 {
                Write-Host "   ⚠️  PROBLEMA: Datos inválidos" -ForegroundColor Yellow
                Write-Host "   - Verifica el formato del JSON" -ForegroundColor Yellow
            }
            500 {
                Write-Host "   ⚠️  PROBLEMA: Error interno del servidor" -ForegroundColor Yellow
                Write-Host "   - Revisa los logs del servidor" -ForegroundColor Yellow
            }
        }
        return $false
    }
    Write-Host ""
}

Write-Host "Paso 1: Verificando que el servidor esté corriendo..." -ForegroundColor Cyan
Write-Host ""

# Test Health
if (Test-Endpoint -Url "$BaseUrl/health" -Method "GET" -Description "Health Check") {
    Write-Host "   ✅ Servidor está corriendo" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ EL SERVIDOR NO ESTÁ CORRIENDO" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUCIÓN:" -ForegroundColor Yellow
    Write-Host "1. Abre otra terminal" -ForegroundColor Yellow
    Write-Host "2. Navega a: D:\L&R Solutions\vartan-backend_v1" -ForegroundColor Yellow
    Write-Host "3. Ejecuta: go run main.go" -ForegroundColor Yellow
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "Paso 2: Probando endpoints POST públicos..." -ForegroundColor Cyan
Write-Host ""

# Test POST Login
$loginBody = @{
    email = "test@test.com"
    password = "test123"
} | ConvertTo-Json

$loginOk = Test-Endpoint `
    -Url "$BaseUrl/auth/login" `
    -Method "POST" `
    -Description "POST /auth/login (Login)" `
    -Body $loginBody

Write-Host ""

# Test POST Register
$registerBody = @{
    nombre = "Test User"
    email = "newuser@test.com"
    password = "test123"
    rol = "vendedor"
} | ConvertTo-Json

Test-Endpoint `
    -Url "$BaseUrl/auth/register" `
    -Method "POST" `
    -Description "POST /auth/register (Registro)" `
    -Body $registerBody

Write-Host ""
Write-Host "Paso 3: Probando endpoints POST protegidos (requieren token)..." -ForegroundColor Cyan
Write-Host ""

# Intentar login para obtener token real
Write-Host "   Intentando obtener token real..." -ForegroundColor Gray
$loginBody2 = @{
    email = "admin@vartan.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody2 -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✅ Token obtenido" -ForegroundColor Green

    $headers = @{
        "Authorization" = "Bearer $token"
    }

    Write-Host ""

    # Test POST Cliente
    $clienteBody = @{
        nombre = "Cliente Debug"
        telefono = "123456"
        email = "debug@test.com"
    } | ConvertTo-Json

    Test-Endpoint `
        -Url "$BaseUrl/api/clientes" `
        -Method "POST" `
        -Description "POST /api/clientes (Crear Cliente)" `
        -Headers $headers `
        -Body $clienteBody

    Write-Host ""

    # Test POST Venta
    $ventaBody = @{
        cliente_id = 1
        forma_pago_id = 1
        sena = 1000
        detalles = @(
            @{
                producto_id = 1
                talle = "M"
                cantidad = 1
                precio_unitario = 1000
            }
        )
    } | ConvertTo-Json -Depth 10

    Test-Endpoint `
        -Url "$BaseUrl/api/ventas" `
        -Method "POST" `
        -Description "POST /api/ventas (Crear Venta)" `
        -Headers $headers `
        -Body $ventaBody

} catch {
    Write-Host "   ⚠️  No se pudo obtener token (credenciales incorrectas o usuario no existe)" -ForegroundColor Yellow
    Write-Host "   Probando POST sin token (debería dar 401)..." -ForegroundColor Gray
    Write-Host ""

    $clienteBody = @{
        nombre = "Cliente Test"
        telefono = "123"
        email = "test@test.com"
    } | ConvertTo-Json

    Test-Endpoint `
        -Url "$BaseUrl/api/clientes" `
        -Method "POST" `
        -Description "POST /api/clientes (Sin Token - debería dar 401)" `
        -Body $clienteBody
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DIAGNÓSTICO COMPLETO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Si viste errores 404:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verifica que uses la URL completa correcta:" -ForegroundColor White
Write-Host "   ✅ http://localhost:8080/auth/login" -ForegroundColor Green
Write-Host "   ❌ http://localhost:8080/login" -ForegroundColor Red
Write-Host ""
Write-Host "2. Para rutas protegidas, usa '/api/' al inicio:" -ForegroundColor White
Write-Host "   ✅ http://localhost:8080/api/clientes" -ForegroundColor Green
Write-Host "   ❌ http://localhost:8080/clientes" -ForegroundColor Red
Write-Host ""
Write-Host "3. Para rutas de dueño, usa '/api/owner/':" -ForegroundColor White
Write-Host "   ✅ http://localhost:8080/api/owner/productos" -ForegroundColor Green
Write-Host "   ❌ http://localhost:8080/owner/productos" -ForegroundColor Red
Write-Host ""

Write-Host "Si viste errores 401:" -ForegroundColor Yellow
Write-Host "   - Necesitas enviar el token en el header Authorization" -ForegroundColor White
Write-Host "   - Formato: 'Authorization: Bearer <token>'" -ForegroundColor White
Write-Host ""

Write-Host "Si todo funcionó:" -ForegroundColor Green
Write-Host "   ✅ Tu backend está correctamente configurado" -ForegroundColor Green
Write-Host ""
