# Script mejorado para iniciar el backend de Vartan Sports
# Ejecutar: .\start-backend-improved.ps1

Write-Host "🚀 Iniciando Backend de Vartan Sports..." -ForegroundColor Green
Write-Host ""

# Verificar que PostgreSQL esté corriendo
Write-Host "📊 Verificando PostgreSQL..." -ForegroundColor Cyan
try {
    $dockerRunning = docker ps --format "{{.Names}}" 2>&1 | Select-String "vartan_postgres"
    if ($dockerRunning) {
        Write-Host "✅ PostgreSQL ya está corriendo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL no está corriendo. Iniciando..." -ForegroundColor Yellow
        docker-compose up -d
        Start-Sleep -Seconds 5
        Write-Host "✅ PostgreSQL iniciado" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker no disponible. Asegúrate de que PostgreSQL esté corriendo en localhost:5432" -ForegroundColor Yellow
}

Write-Host ""

# Verificar si el puerto 8080 está en uso
Write-Host "🔍 Verificando puerto 8080..." -ForegroundColor Cyan
$portCheck = netstat -ano | Select-String ":8080.*LISTENING"
if ($portCheck) {
    Write-Host "⚠️  Puerto 8080 en uso. Intentando liberar..." -ForegroundColor Yellow

    # Extraer el PID del proceso
    $portLine = $portCheck.Line
    if ($portLine -match '\s+(\d+)\s*$') {
        $pid = $Matches[1]
        Write-Host "   Deteniendo proceso $pid..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Start-Sleep -Seconds 2
            Write-Host "✅ Puerto liberado" -ForegroundColor Green
        } catch {
            Write-Host "❌ No se pudo liberar el puerto. Intenta cerrar manualmente." -ForegroundColor Red
        }
    }
} else {
    Write-Host "✅ Puerto 8080 disponible" -ForegroundColor Green
}

Write-Host ""

# Verificar conectividad a PostgreSQL
Write-Host "🔌 Probando conexión a PostgreSQL..." -ForegroundColor Cyan
$pgReady = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $testConn = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($testConn.TcpTestSucceeded) {
            Write-Host "✅ PostgreSQL responde en puerto 5432" -ForegroundColor Green
            $pgReady = $true
            break
        }
    } catch {}

    if ($i -lt 5) {
        Write-Host "   Intento $i/5 - Esperando PostgreSQL..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $pgReady) {
    Write-Host "❌ PostgreSQL no responde. Verifica que Docker esté corriendo." -ForegroundColor Red
    Write-Host "   Ejecuta: docker-compose up -d" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para continuar de todos modos o Ctrl+C para salir"
}

Write-Host ""

# Iniciar el backend
Write-Host "🏃 Iniciando servidor backend..." -ForegroundColor Cyan
Write-Host "   URL: http://localhost:8080" -ForegroundColor White
Write-Host "   Health Check: http://localhost:8080/health" -ForegroundColor White
Write-Host "   Swagger Docs: http://localhost:8080/swagger/index.html" -ForegroundColor White
Write-Host ""
Write-Host "[!] Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar el backend
go run main.go
