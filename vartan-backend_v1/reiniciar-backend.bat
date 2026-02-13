@echo off
echo ==========================================
echo   REINICIANDO BACKEND VARTAN SPORTS
echo ==========================================
echo.

echo [1/3] Deteniendo procesos existentes...
taskkill /F /IM go.exe >nul 2>&1
taskkill /F /IM vartan-backend.exe >nul 2>&1
timeout /t 3 >nul
echo       OK - Procesos detenidos

echo.
echo [2/3] Iniciando backend...
echo       Ubicacion: D:\LyRSolutions\vartanSport\vartan-backend_v1
echo       Comando: go run main.go
echo.
cd /d D:\LyRSolutions\vartanSport\vartan-backend_v1
start /min cmd /k "go run main.go"

echo [3/3] Esperando a que el backend arranque (15 segundos)...
timeout /t 15 >nul

echo.
echo ==========================================
echo   PROBANDO BACKEND
echo ==========================================
echo.

echo Probando health check...
curl -s http://localhost:8080/health
echo.
echo.

echo ==========================================
echo   BACKEND INICIADO
echo ==========================================
echo.
echo El backend deberia estar corriendo en http://localhost:8080
echo.
echo Puedes cerrar esta ventana.
echo.
pause
