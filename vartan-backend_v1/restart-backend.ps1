 # Script para reiniciar el backend de Vartan Sport

Write-Host "🔄 Reiniciando Vartan Backend..." -ForegroundColor Cyan

# Matar todos los procesos en el puerto 8080
Write-Host "🛑 Deteniendo procesos en puerto 8080..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "   Matando proceso PID: $pid" -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Verificar que el puerto está libre
$portCheck = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "❌ Error: El puerto 8080 aún está ocupado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Puerto 8080 liberado" -ForegroundColor Green

# Verificar que Docker PostgreSQL está corriendo
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Yellow
$dockerStatus = docker ps --filter "name=vartan_postgres" --format "{{.Status}}"
if ($dockerStatus -notlike "Up*") {
    Write-Host "⚠️  PostgreSQL no está corriendo. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 3
}

Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green

# Iniciar el backend
Write-Host "🚀 Iniciando backend..." -ForegroundColor Cyan
Write-Host "📍 Puerto: 8080" -ForegroundColor Gray
Write-Host "📍 Base de datos: vartan_sports" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Endpoints disponibles:" -ForegroundColor White
Write-Host "   http://localhost:8080/health" -ForegroundColor Gray
Write-Host "   http://localhost:8080/auth/login" -ForegroundColor Gray
Write-Host "   http://localhost:8080/api/owner/pedidos" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

go run main.go
 solo arreel