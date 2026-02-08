# Script para registrar empleados vendedores en Vartan Backend
# Ejecutar: .\register-employees.ps1

$BaseUrl = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REGISTRO DE EMPLEADOS VENDEDORES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lista de empleados a registrar
$empleados = @(
    @{Nombre="Santino M"; Email="santinom@vartan.com"; Password="SANTINOM1234"},
    @{Nombre="Choco"; Email="choco@vartan.com"; Password="CHOCO1234"},
    @{Nombre="Nico"; Email="nico@vartan.com"; Password="NICO1234"},
    @{Nombre="Thiago"; Email="thiago@vartan.com"; Password="THIAGO1234"},
    @{Nombre="Santino P"; Email="santinop@vartan.com"; Password="SANTINOP1234"},
    @{Nombre="Gaspi"; Email="gaspi@vartan.com"; Password="GASPI1234"},
    @{Nombre="Male"; Email="male@vartan.com"; Password="MALE1234"},
    @{Nombre="Franco"; Email="franco@vartan.com"; Password="FRANCO1234"},
    @{Nombre="Juana"; Email="juana@vartan.com"; Password="JUANA1234"}
)

$exitosos = 0
$fallidos = 0

foreach ($empleado in $empleados) {
    Write-Host "[REGISTRANDO] $($empleado.Nombre)..." -ForegroundColor Yellow

    $body = @{
        nombre = $empleado.Nombre
        email = $empleado.Email
        password = $empleado.Password
        rol = "empleado"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/auth/register" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop

        Write-Host "  OK: $($empleado.Nombre) registrado exitosamente" -ForegroundColor Green
        Write-Host "      Email: $($empleado.Email)" -ForegroundColor Gray
        Write-Host "      Password: $($empleado.Password)" -ForegroundColor Gray
        $exitosos++
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*correo ya está registrado*" -or $errorMsg -like "*already*") {
            Write-Host "  INFO: $($empleado.Nombre) ya existe en la base de datos" -ForegroundColor Cyan
        }
        else {
            Write-Host "  ERROR: No se pudo registrar a $($empleado.Nombre)" -ForegroundColor Red
            Write-Host "         $errorMsg" -ForegroundColor Red
            $fallidos++
        }
    }

    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total empleados: $($empleados.Count)" -ForegroundColor White
Write-Host "Registrados exitosamente: $exitosos" -ForegroundColor Green
Write-Host "Fallidos: $fallidos" -ForegroundColor Red
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar credenciales
Write-Host "CREDENCIALES DE ACCESO:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
foreach ($empleado in $empleados) {
    Write-Host "$($empleado.Nombre.PadRight(15)) | Email: $($empleado.Email.PadRight(25)) | Password: $($empleado.Password)" -ForegroundColor White
}
Write-Host ""
