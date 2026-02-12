# Script de diagnóstico completo del sistema

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO COMPLETO - VARTAN BACKEND" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar PostgreSQL
Write-Host "[1/5] Verificando PostgreSQL..." -ForegroundColor Yellow
$dockerStatus = docker ps --filter "name=vartan" --format "table {{.Names}}\t{{.Status}}" 2>$null

if ($dockerStatus) {
    Write-Host "  PostgreSQL: CORRIENDO" -ForegroundColor Green
    Write-Host $dockerStatus -ForegroundColor Gray
} else {
    Write-Host "  PostgreSQL: NO ENCONTRADO" -ForegroundColor Red
    Write-Host "  Ejecuta: docker-compose up -d" -ForegroundColor Yellow
}
Write-Host ""

# 2. Verificar puerto 8080
Write-Host "[2/5] Verificando puerto 8080..." -ForegroundColor Yellow
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue

if ($port8080) {
    Write-Host "  Puerto 8080: EN USO" -ForegroundColor Green
    $port8080 | ForEach-Object {
        Write-Host "    PID: $($_.OwningProcess)" -ForegroundColor Gray
    }
} else {
    Write-Host "  Puerto 8080: LIBRE (backend no esta corriendo)" -ForegroundColor Red
    Write-Host "  Ejecuta: go run main.go" -ForegroundColor Yellow
}
Write-Host ""

# 3. Verificar endpoint /health
Write-Host "[3/5] Verificando endpoint /health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  Backend: ACTIVO" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    Write-Host "  Message: $($health.message)" -ForegroundColor Gray
} catch {
    Write-Host "  Backend: NO RESPONDE" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# 4. Verificar archivo .env
Write-Host "[4/5] Verificando archivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  Archivo .env: ENCONTRADO" -ForegroundColor Green

    $envContent = Get-Content ".env"
    $jwtSecret = $envContent | Select-String "JWT_SECRET="
    $dbHost = $envContent | Select-String "DB_HOST="
    $port = $envContent | Select-String "PORT="

    if ($jwtSecret) {
        Write-Host "  JWT_SECRET: configurado" -ForegroundColor Gray
    } else {
        Write-Host "  JWT_SECRET: NO ENCONTRADO" -ForegroundColor Red
    }

    if ($dbHost) {
        Write-Host "  DB_HOST: $($dbHost.ToString().Split('=')[1])" -ForegroundColor Gray
    }

    if ($port) {
        Write-Host "  PORT: $($port.ToString().Split('=')[1])" -ForegroundColor Gray
    }
} else {
    Write-Host "  Archivo .env: NO ENCONTRADO" -ForegroundColor Red
}
Write-Host ""

# 5. Test de login
Write-Host "[5/5] Probando login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "demo@vartan.com"
        password = "demo1234"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "  Login: EXITOSO" -ForegroundColor Green
    Write-Host "  Usuario: $($loginResponse.usuario.nombre)" -ForegroundColor Gray
    Write-Host "  Rol: $($loginResponse.usuario.rol)" -ForegroundColor Gray
    Write-Host "  Token generado: Si" -ForegroundColor Gray

    # Probar endpoint protegido
    Write-Host ""
    Write-Host "  Probando endpoint protegido /api/owner/pedidos..." -ForegroundColor Cyan
    $headers = @{ Authorization = "Bearer $($loginResponse.token)" }

    try {
        $pedidos = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/pedidos" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "  Endpoint protegido: FUNCIONA" -ForegroundColor Green
        Write-Host "  Total pedidos: $($pedidos.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "  Endpoint protegido: FALLO" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    }

} catch {
    Write-Host "  Login: FALLO" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Posibles causas:" -ForegroundColor Yellow
    Write-Host "  - El usuario demo@vartan.com no existe" -ForegroundColor Gray
    Write-Host "  - La password es incorrecta" -ForegroundColor Gray
    Write-Host "  - La base de datos no tiene datos" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Solucion: Ejecuta 'go run create_user.go'" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO COMPLETO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Resumen final
Write-Host "RESUMEN:" -ForegroundColor White
Write-Host ""

$allGood = $true

if (-not $dockerStatus) {
    Write-Host "  [ ] PostgreSQL corriendo" -ForegroundColor Red
    $allGood = $false
} else {
    Write-Host "  [X] PostgreSQL corriendo" -ForegroundColor Green
}

if (-not $port8080) {
    Write-Host "  [ ] Backend corriendo en puerto 8080" -ForegroundColor Red
    $allGood = $false
} else {
    Write-Host "  [X] Backend corriendo en puerto 8080" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "http://localhost:8080/health" -Method GET -TimeoutSec 3 -ErrorAction Stop | Out-Null
    Write-Host "  [X] Backend responde a /health" -ForegroundColor Green
} catch {
    Write-Host "  [ ] Backend responde a /health" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path ".env") {
    Write-Host "  [X] Archivo .env configurado" -ForegroundColor Green
} else {
    Write-Host "  [ ] Archivo .env configurado" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

if ($allGood) {
    Write-Host "ESTADO: SISTEMA FUNCIONANDO CORRECTAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Puedes proceder a usar el frontend con:" -ForegroundColor Cyan
    Write-Host "  1. Limpiar localStorage en el navegador" -ForegroundColor White
    Write-Host "  2. Hacer login nuevamente" -ForegroundColor White
    Write-Host "  3. Disfrutar!" -ForegroundColor White
} else {
    Write-Host "ESTADO: HAY PROBLEMAS QUE RESOLVER" -ForegroundColor Red
    Write-Host ""
    Write-Host "Sugerencias:" -ForegroundColor Yellow
    Write-Host "  1. Ejecuta: docker-compose up -d" -ForegroundColor White
    Write-Host "  2. Ejecuta: .\restart-backend.ps1" -ForegroundColor White
    Write-Host "  3. Vuelve a ejecutar este diagnostico" -ForegroundColor White
}

Write-Host ""
