# Verificar el rol del usuario
$loginBody = @{ email = "santinom@vartan.com"; password = "SANTINOM1234" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
Write-Host "Rol del usuario: $($response.usuario.rol)"
Write-Host "Respuesta completa:"
$response | ConvertTo-Json -Depth 5
