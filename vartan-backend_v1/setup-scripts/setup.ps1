# Script para configurar el proyecto Vartan Backend

Write-Host "=== Configurando Vartan Backend ===" -ForegroundColor Cyan

Write-Host "`n1. Descargando dependencias de Go..." -ForegroundColor Yellow
go mod download
if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencias descargadas exitosamente" -ForegroundColor Green
} else {
    Write-Host "Error al descargar dependencias" -ForegroundColor Red
    exit 1
}


Write-Host "`n2. Limpiando dependencias..." -ForegroundColor Yellow
go mod tidy
if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencias organizadas exitosamente" -ForegroundColor Green
} else {
    Write-Host "Error al organizar dependencias" -ForegroundColor Red
    exit 1
}


Write-Host "`n3. Verificando compilación..." -ForegroundColor Yellow
go build -o vartan-backend_v1.exe
if ($LASTEXITCODE -eq 0) {
    Write-Host "Proyecto compilado exitosamente" -ForegroundColor Green
} else {
    Write-Host "Error al compilar el proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Configuración completada ===" -ForegroundColor Cyan
Write-Host "`nPuedes ejecutar el proyecto con: ./vartan-backend_v1.exe" -ForegroundColor Green
Write-Host "O con: go run main.go" -ForegroundColor Green
