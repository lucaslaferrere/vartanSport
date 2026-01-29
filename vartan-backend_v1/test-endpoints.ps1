# Script de Test para Endpoints - Vartan Backend
# Uso: .\test-endpoints.ps1

$BaseUrl = "http://localhost:8080"

Write-Host "=== TEST DE ENDPOINTS VARTAN BACKEND ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "📋 Test 1: Health Check (Público)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    Write-Host "✅ ÉXITO:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
}
Write-Host ""

# Test 2: Login
Write-Host "📋 Test 2: Login (Público)" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@vartan.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "✅ ÉXITO: Login exitoso" -ForegroundColor Green
    $token = $loginResponse.token
    Write-Host "Token obtenido: $($token.Substring(0, 20))..." -ForegroundColor Green
    Write-Host "Usuario: $($loginResponse.usuario.nombre) - Rol: $($loginResponse.usuario.rol)"
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
    }
    Write-Host ""
    Write-Host "⚠️  NOTA: Asegúrate de tener un usuario en la base de datos" -ForegroundColor Yellow
    Write-Host "   Email: admin@vartan.com" -ForegroundColor Yellow
    Write-Host "   Password: admin123" -ForegroundColor Yellow
    $token = $null
}
Write-Host ""

# Si el login funcionó, continuar con tests protegidos
if ($token) {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    # Test 3: Profile
    Write-Host "📋 Test 3: Obtener Profile (Protegido)" -ForegroundColor Yellow
    try {
        $profile = Invoke-RestMethod -Uri "$BaseUrl/api/profile" -Method Get -Headers $headers
        Write-Host "✅ ÉXITO:" -ForegroundColor Green
        Write-Host "Usuario: $($profile.nombre)"
        Write-Host "Email: $($profile.email)"
        Write-Host "Rol: $($profile.rol)"
    } catch {
        Write-Host "❌ ERROR:" -ForegroundColor Red
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
        }
    }
    Write-Host ""

    # Test 4: Listar Clientes
    Write-Host "📋 Test 4: Listar Clientes (Protegido)" -ForegroundColor Yellow
    try {
        $clientes = Invoke-RestMethod -Uri "$BaseUrl/api/clientes" -Method Get -Headers $headers
        Write-Host "✅ ÉXITO: $($clientes.Count) clientes encontrados" -ForegroundColor Green
        if ($clientes.Count -gt 0) {
            $clientes[0] | ConvertTo-Json
        }
    } catch {
        Write-Host "❌ ERROR:" -ForegroundColor Red
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
        }
    }
    Write-Host ""

    # Test 5: Crear Cliente
    Write-Host "📋 Test 5: Crear Cliente (Protegido - POST)" -ForegroundColor Yellow
    $clienteBody = @{
        nombre = "Cliente Test PowerShell"
        telefono = "1234567890"
        email = "test@powershell.com"
    } | ConvertTo-Json

    try {
        $nuevoCliente = Invoke-RestMethod -Uri "$BaseUrl/api/clientes" -Method Post -Body $clienteBody -Headers $headers
        Write-Host "✅ ÉXITO: Cliente creado" -ForegroundColor Green
        $nuevoCliente | ConvertTo-Json
    } catch {
        Write-Host "❌ ERROR:" -ForegroundColor Red
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
            Write-Host "Respuesta:" $_.ErrorDetails.Message
        }
    }
    Write-Host ""

    # Test 6: Listar Productos
    Write-Host "📋 Test 6: Listar Productos (Protegido)" -ForegroundColor Yellow
    try {
        $productos = Invoke-RestMethod -Uri "$BaseUrl/api/productos" -Method Get -Headers $headers
        Write-Host "✅ ÉXITO: $($productos.Count) productos encontrados" -ForegroundColor Green
    } catch {
        Write-Host "❌ ERROR:" -ForegroundColor Red
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
        }
    }
    Write-Host ""

} else {
    Write-Host "⚠️  No se pudo obtener token, saltando tests protegidos" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Si todos los tests pasaron, el backend está funcionando correctamente ✅" -ForegroundColor Green
Write-Host ""
Write-Host "Si algún test falló:" -ForegroundColor Yellow
Write-Host "- Error 404: La ruta no existe o el servidor no está corriendo" -ForegroundColor Yellow
Write-Host "- Error 401: Problema con autenticación (token inválido)" -ForegroundColor Yellow
Write-Host "- Error 500: Error interno del servidor (revisar logs)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para ver los logs del servidor, revisa la consola donde ejecutaste 'go run main.go'" -ForegroundColor Cyan
