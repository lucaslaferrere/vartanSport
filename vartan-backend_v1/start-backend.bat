@echo off
echo ========================================
echo   INICIANDO BACKEND VARTAN SPORTS
echo ========================================
echo.

REM Verificar PostgreSQL
echo [1/2] Verificando PostgreSQL...
docker ps | findstr "vartan_postgres" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo       Iniciando PostgreSQL...
    docker-compose up -d
    timeout /t 5 /nobreak >nul
    echo       OK: PostgreSQL iniciado
) else (
    echo       OK: PostgreSQL corriendo
)
echo.

REM Liberar puerto 8080 si esta ocupado
echo [2/2] Verificando puerto 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080.*LISTENING"') do (
    echo       Puerto ocupado, liberando PID %%a...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo       OK: Puerto disponible
echo.

REM Iniciar backend
echo ========================================
echo   SERVIDOR BACKEND INICIADO
echo ========================================
echo.
echo   URL: http://localhost:8080
echo   Health: http://localhost:8080/health
echo.
echo   Presiona Ctrl+C para detener
echo ========================================
echo.

go run main.go
