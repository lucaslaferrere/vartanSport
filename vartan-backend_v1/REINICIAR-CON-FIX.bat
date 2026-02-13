@echo off
cls
echo ==========================================
echo   REINICIANDO BACKEND - FIX APLICADO
echo ==========================================
echo.

echo [1/3] Deteniendo procesos de Go...
taskkill /F /IM go.exe >nul 2>&1
if %errorlevel% == 0 (
    echo       OK - Procesos detenidos
) else (
    echo       OK - No habia procesos corriendo
)
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Iniciando backend con el fix...
echo       Ubicacion: %CD%
echo.

start "Vartan Backend" /MIN cmd /k "cd /d %CD% && go run main.go"

echo       Backend iniciando en ventana minimizada...
timeout /t 8 /nobreak >nul

echo.
echo [3/3] Verificando que el backend responda...
timeout /t 2 /nobreak >nul

curl -s http://localhost:8080/health >nul 2>&1
if %errorlevel% == 0 (
    echo       OK - Backend respondiendo correctamente
) else (
    echo       ADVERTENCIA - Backend aun no responde
    echo       Espera unos segundos mas...
)

echo.
echo ==========================================
echo   BACKEND INICIADO
echo ==========================================
echo.
echo El backend esta corriendo con el FIX aplicado.
echo.
echo Para probar el endpoint:
echo   1. Abre tu frontend
echo   2. Ve a la pagina de gastos
echo   3. El error 500 deberia estar resuelto
echo.
echo Para ver los logs del backend:
echo   - Busca la ventana minimizada "Vartan Backend"
echo.
pause
