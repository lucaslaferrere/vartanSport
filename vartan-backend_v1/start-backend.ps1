# Script para iniciar el backend de Vartan Sports
# Ejecutar: .\start-backend.ps1

Write-Host "🚀 Iniciando Backend de Vartan Sports..." -ForegroundColor Green
Write-Host ""

# Verificar que PostgreSQL esté corriendo
Write-Host "📊 Verificando PostgreSQL..." -ForegroundColor Cyan
$dockerStatus = docker-compose ps postgres 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Docker Compose no está disponible o no se encuentra el contenedor" -ForegroundColor Yellow
    Write-Host "   Asegúrate de que PostgreSQL esté corriendo localmente en el puerto 5432" -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL verificado" -ForegroundColor Green
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
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ Puerto liberado" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Puerto 8080 disponible" -ForegroundColor Green
}
Write-Host ""

# Iniciar el backend
Write-Host "🏃 Iniciando servidor backend..." -ForegroundColor Cyan
Write-Host "   URL: http://localhost:8080" -ForegroundColor White
Write-Host "   Health Check: http://localhost:8080/health" -ForegroundColor White
Write-Host "   Swagger Docs: http://localhost:8080/swagger/index.html" -ForegroundColor White
Write-Host ""
Write-Host "⏹️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Ejecutar el backend
go run main.go
