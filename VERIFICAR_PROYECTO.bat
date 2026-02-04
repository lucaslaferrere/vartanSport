@echo off
echo ============================================
echo   VERIFICACION DEL PROYECTO VARTAN SPORTS
echo ============================================
echo.

echo [Verificando archivos criticos...]
echo.

set ERROR=0

if exist "src\routes\router.ts" (
    echo [OK] router.ts existe
) else (
    echo [ERROR] Falta router.ts
    set ERROR=1
)

if exist "src\components\Validators\UserPermissionsContext.tsx" (
    echo [OK] UserPermissionsContext.tsx existe
) else (
    echo [ERROR] Falta UserPermissionsContext.tsx
    set ERROR=1
)

if exist "src\redux\features\navigationSlice.ts" (
    echo [OK] navigationSlice.ts existe
) else (
    echo [ERROR] Falta navigationSlice.ts
    set ERROR=1
)

if exist "src\redux\provider.tsx" (
    echo [OK] provider.tsx existe
) else (
    echo [ERROR] Falta provider.tsx
    set ERROR=1
)

if exist "app\dashboard\page.tsx" (
    echo [OK] dashboard/page.tsx existe
) else (
    echo [ERROR] Falta dashboard/page.tsx
    set ERROR=1
)

if exist "app\dashboard\layout.tsx" (
    echo [OK] dashboard/layout.tsx existe
) else (
    echo [ERROR] Falta dashboard/layout.tsx
    set ERROR=1
)

if exist "package.json" (
    echo [OK] package.json existe
) else (
    echo [ERROR] Falta package.json
    set ERROR=1
)

if exist "node_modules" (
    echo [OK] node_modules existe
) else (
    echo [WARN] Falta node_modules - ejecuta: npm install
)

echo.
echo ============================================

if %ERROR%==0 (
    echo   RESULTADO: TODOS LOS ARCHIVOS OK!
    echo   Puedes ejecutar: INICIAR_LIMPIO.bat
) else (
    echo   RESULTADO: HAY ARCHIVOS FALTANTES
    echo   Revisa los errores arriba
)

echo ============================================
echo.
pause

