# Script simple para iniciar el backend de Vartan Sports
# Ejecutar: .\start-backend-simple.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  INICIANDO BACKEND VARTAN SPORTS" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker y PostgreSQL
Write-Host "[1/4] Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps --format "{{.Names}}" 2>&1 | Select-String "vartan_postgres"
    if ($dockerCheck) {
        Write-Host "      OK: PostgreSQL corriendo" -ForegroundColor Green
    } else {
        Write-Host "      Iniciando PostgreSQL con Docker..." -ForegroundColor Yellow
        docker-compose up -d
        Start-Sleep -Seconds 5
        Write-Host "      OK: PostgreSQL iniciado" -ForegroundColor Green
    }
} catch {
    Write-Host "      ADVERTENCIA: Docker no disponible" -ForegroundColor Yellow
    Write-Host "      Asegurarse que PostgreSQL este en localhost:5432" -ForegroundColor Yellow
}

Write-Host ""

# 2. Liberar puerto 8080 si está ocupado
Write-Host "[2/4] Verificando puerto 8080..." -ForegroundColor Yellow
$port = netstat -ano | Select-String ":8080.*LISTENING"
if ($port) {
    Write-Host "      Puerto ocupado, liberando..." -ForegroundColor Yellow
    $line = $port.Line.Trim()
    $parts = $line -split '\s+'
    $pid = $parts[-1]
    if ($pid -match '^\d+$') {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Start-Sleep -Seconds 2
            Write-Host "      OK: Puerto liberado" -ForegroundColor Green
        } catch {
            Write-Host "      ADVERTENCIA: No se pudo liberar el puerto" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "      OK: Puerto disponible" -ForegroundColor Green
}

Write-Host ""

# 3. Probar conexión a PostgreSQL
Write-Host "[3/4] Probando conexión a PostgreSQL..." -ForegroundColor Yellow
$connected = $false
for ($i = 1; $i -le 3; $i++) {
    try {
        $test = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($test.TcpTestSucceeded) {
            Write-Host "      OK: PostgreSQL responde" -ForegroundColor Green
            $connected = $true
            break
        }
    } catch {}

    if ($i -lt 3) {
        Write-Host "      Intento $i/3..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $connected) {
    Write-Host "      ERROR: PostgreSQL no responde" -ForegroundColor Red
    Write-Host ""
    Write-Host "      Soluciones:" -ForegroundColor Yellow
    Write-Host "      1. Ejecutar: docker-compose up -d" -ForegroundColor White
    Write-Host "      2. Verificar Docker Desktop este corriendo" -ForegroundColor White
    Write-Host ""
}

Write-Host ""

# 4. Iniciar backend
Write-Host "[4/4] Iniciando servidor backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SERVIDOR BACKEND INICIADO" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  URL Principal: http://localhost:8080" -ForegroundColor White
Write-Host "  Health Check:  http://localhost:8080/health" -ForegroundColor White
Write-Host "  Swagger Docs:  http://localhost:8080/swagger/index.html" -ForegroundColor White
Write-Host ""
Write-Host "  Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar
go run main.go
