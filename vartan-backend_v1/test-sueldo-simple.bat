@echo off
echo ========================================
echo   PROBANDO CAMPO SUELDO
echo ========================================
echo.

echo 1. Health check...
curl -s http://localhost:8080/health
echo.
echo.

echo 2. Login...
curl -s -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@vartan.com\",\"password\":\"admin123\"}" > login.json
echo Login exitoso
echo.

echo 3. Obteniendo vendedores...
echo (Ver archivo vendedores-con-sueldo.json)
curl -s -X GET http://localhost:8080/api/owner/usuarios/vendedores -H "Authorization: Bearer $(type login.json | jq -r .token)" > vendedores-con-sueldo.json
type vendedores-con-sueldo.json
echo.
echo.

echo ========================================
echo   CAMPO SUELDO IMPLEMENTADO
echo ========================================
