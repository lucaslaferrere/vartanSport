@echo off
echo ====================================
echo Verificando estado del Backend
echo ====================================
echo.

echo Probando conexion con el backend...
curl -s http://localhost:8080/health

echo.
echo.
echo ====================================
echo Si aparece un mensaje de salud arriba, el backend esta funcionando.
echo Si aparece un error, el backend NO esta corriendo.
echo ====================================
pause

