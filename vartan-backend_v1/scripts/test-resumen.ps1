# Test completo del endpoint mi-resumen-comision
$loginBody = @{ email = "santinom@vartan.com"; password = "SANTINOM1234" } | ConvertTo-Json

# Login
$response = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $response.token

# Obtener resumen
$headers = @{ "Authorization" = "Bearer $token" }
$resumen = Invoke-RestMethod -Uri "http://localhost:8080/api/mi-resumen-comision" -Method GET -Headers $headers

# Guardar resultado
$resumen | ConvertTo-Json -Depth 10 | Out-File -FilePath "D:\LyRSolutions\vartanSport\vartan-backend_v1\resumen-test.json" -Encoding UTF8

Write-Host "Resultado guardado en resumen-test.json"
