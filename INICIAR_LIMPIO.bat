@echo off
cls
echo ========================================
echo   INICIANDO VARTAN SPORTS DASHBOARD
echo ========================================
echo.

echo [1/4] Deteniendo procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo      Procesos Node.js detenidos
) else (
    echo      No habia procesos Node.js corriendo
)
echo.

echo [2/4] Limpiando cache de Next.js...
if exist .next (
    rmdir /s /q .next
    echo      Cache eliminado correctamente
) else (
    echo      No habia cache para eliminar
)
echo.

echo [3/4] Esperando 3 segundos...
timeout /t 3 /nobreak >nul
echo      Listo!
echo.

echo [4/4] Iniciando servidor de desarrollo...
echo      Espera a que aparezca la URL...
echo.
echo ========================================
echo   PRESIONA CTRL+C PARA DETENER
echo ========================================
echo.

npm run dev

