# Script para decodificar y verificar un token JWT
# Sin validar la firma, solo muestra el contenido

param(
    [Parameter(Mandatory=$false)]
    [string]$Token
)

Write-Host "=== Verificador de Token JWT ===" -ForegroundColor Cyan
Write-Host ""

if (-not $Token) {
    Write-Host "Ingresa el token JWT (o pegalo desde localStorage):" -ForegroundColor Yellow
    $Token = Read-Host
}

# Limpiar el token por si viene con "Bearer "
$Token = $Token.Replace("Bearer ", "").Trim()

# Separar las partes del JWT
$parts = $Token.Split('.')

if ($parts.Count -ne 3) {
    Write-Host "ERROR: El token no tiene el formato correcto (debe tener 3 partes separadas por .)" -ForegroundColor Red
    exit 1
}

Write-Host "Token recibido:" -ForegroundColor Green
Write-Host "  Header:  $($parts[0].Substring(0, [Math]::Min(20, $parts[0].Length)))..." -ForegroundColor Gray
Write-Host "  Payload: $($parts[1].Substring(0, [Math]::Min(20, $parts[1].Length)))..." -ForegroundColor Gray
Write-Host "  Firma:   $($parts[2].Substring(0, [Math]::Min(20, $parts[2].Length)))..." -ForegroundColor Gray
Write-Host ""

# Decodificar el payload (segunda parte)
$payloadBase64 = $parts[1]

# Agregar padding si es necesario
$mod = $payloadBase64.Length % 4
if ($mod -gt 0) {
    $payloadBase64 += "=" * (4 - $mod)
}

try {
    $payloadBytes = [Convert]::FromBase64String($payloadBase64)
    $payloadJson = [System.Text.Encoding]::UTF8.GetString($payloadBytes)
    $payload = $payloadJson | ConvertFrom-Json

    Write-Host "=== CONTENIDO DEL TOKEN ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usuario ID: $($payload.user_id)" -ForegroundColor White
    Write-Host "Email:      $($payload.email)" -ForegroundColor White
    Write-Host "Rol:        $($payload.rol)" -ForegroundColor White

    # Verificar expiración
    $exp = $payload.exp
    $expDate = [DateTimeOffset]::FromUnixTimeSeconds($exp).LocalDateTime
    $now = Get-Date

    Write-Host "Expira:     $expDate" -ForegroundColor White

    if ($now -gt $expDate) {
        Write-Host ""
        Write-Host "ESTADO: EXPIRADO" -ForegroundColor Red
        Write-Host "Este token ya no es valido, necesitas hacer login nuevamente" -ForegroundColor Yellow
    } else {
        $timeLeft = $expDate - $now
        Write-Host ""
        Write-Host "ESTADO: VALIDO" -ForegroundColor Green
        Write-Host "Tiempo restante: $($timeLeft.Hours) horas, $($timeLeft.Minutes) minutos" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "=== NOTA IMPORTANTE ===" -ForegroundColor Yellow
    Write-Host "Este token solo funcionara si el backend usa el MISMO JWT_SECRET" -ForegroundColor White
    Write-Host "con el que fue generado." -ForegroundColor White
    Write-Host ""
    Write-Host "Si obtuviste este token en produccion, NO funcionara en local." -ForegroundColor Red
    Write-Host ""

} catch {
    Write-Host "ERROR: No se pudo decodificar el token" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
    exit 1
}
