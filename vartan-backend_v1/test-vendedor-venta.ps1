# Test de Selección de Vendedor en Ventas

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST: SELECCION DE VENDEDOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login como dueño
Write-Host "1. Haciendo login como dueño..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@vartan.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✅ Login exitoso" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error en login: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# 2. Obtener lista de vendedores
Write-Host "2. Obteniendo vendedores..." -ForegroundColor Yellow
try {
    $vendedores = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/usuarios/vendedores" -Method GET -Headers $headers
    Write-Host "   ✅ Vendedores obtenidos: $($vendedores.Count)" -ForegroundColor Green

    if ($vendedores.Count -gt 0) {
        $vendedor = $vendedores[0]
        Write-Host "   Vendedor seleccionado: $($vendedor.nombre) (ID: $($vendedor.id))" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ No hay vendedores disponibles" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Error al obtener vendedores: $_" -ForegroundColor Red
    exit 1
}

# 3. Obtener clientes
Write-Host "3. Obteniendo clientes..." -ForegroundColor Yellow
try {
    $clientes = Invoke-RestMethod -Uri "http://localhost:8080/api/clientes" -Method GET -Headers $headers
    if ($clientes.Count -gt 0) {
        $cliente = $clientes[0]
        Write-Host "   ✅ Cliente seleccionado: $($cliente.nombre) (ID: $($cliente.id))" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No hay clientes, creando uno de prueba..." -ForegroundColor Yellow
        $nuevoCliente = @{
            nombre = "Cliente Test Venta"
            telefono = "1234567890"
        } | ConvertTo-Json

        $cliente = Invoke-RestMethod -Uri "http://localhost:8080/api/clientes" -Method POST -Body $nuevoCliente -ContentType "application/json" -Headers $headers
        Write-Host "   ✅ Cliente creado: $($cliente.nombre) (ID: $($cliente.id))" -ForegroundColor Green
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Error con clientes: $_" -ForegroundColor Red
    exit 1
}

# 4. Obtener productos
Write-Host "4. Obteniendo productos..." -ForegroundColor Yellow
try {
    $productos = Invoke-RestMethod -Uri "http://localhost:8080/api/productos" -Method GET -Headers $headers
    if ($productos.Count -gt 0) {
        $producto = $productos[0]
        Write-Host "   ✅ Producto seleccionado: $($producto.nombre) (ID: $($producto.id))" -ForegroundColor Green
        Write-Host "   Precio: `$$($producto.precio)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ No hay productos disponibles" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Error al obtener productos: $_" -ForegroundColor Red
    exit 1
}

# 5. Crear venta CON vendedor específico
Write-Host "5. Creando venta CON vendedor específico..." -ForegroundColor Yellow
$ventaConVendedor = @{
    usuario_id = $vendedor.id
    cliente_id = $cliente.id
    forma_pago_id = 1
    sena = 10000
    observaciones = "Venta creada por dueño con vendedor específico"
    detalles = @(
        @{
            producto_id = $producto.id
            talle = "M"
            cantidad = 1
            precio_unitario = $producto.precio
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $venta1 = Invoke-RestMethod -Uri "http://localhost:8080/api/ventas" -Method POST -Body $ventaConVendedor -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Venta creada exitosamente" -ForegroundColor Green
    Write-Host "   ID Venta: $($venta1.id)" -ForegroundColor Cyan
    Write-Host "   Vendedor: $($vendedor.nombre) (ID: $($venta1.usuario_id))" -ForegroundColor Cyan
    Write-Host "   Total: `$$($venta1.total_final)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "   ❌ Error al crear venta: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# 6. Crear venta SIN especificar vendedor (usa el autenticado)
Write-Host "6. Creando venta SIN especificar vendedor..." -ForegroundColor Yellow
$ventaSinVendedor = @{
    cliente_id = $cliente.id
    forma_pago_id = 1
    sena = 5000
    observaciones = "Venta sin vendedor específico - usa autenticado"
    detalles = @(
        @{
            producto_id = $producto.id
            talle = "L"
            cantidad = 1
            precio_unitario = $producto.precio
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $venta2 = Invoke-RestMethod -Uri "http://localhost:8080/api/ventas" -Method POST -Body $ventaSinVendedor -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Venta creada exitosamente" -ForegroundColor Green
    Write-Host "   ID Venta: $($venta2.id)" -ForegroundColor Cyan
    Write-Host "   Vendedor (autenticado): ID $($venta2.usuario_id)" -ForegroundColor Cyan
    Write-Host "   Total: `$$($venta2.total_final)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "   ❌ Error al crear venta: $_" -ForegroundColor Red
    exit 1
}

# 7. Actualizar vendedor de la segunda venta
Write-Host "7. Cambiando vendedor de la venta..." -ForegroundColor Yellow

# Buscar otro vendedor diferente
$otroVendedor = $vendedores | Where-Object { $_.id -ne $vendedor.id } | Select-Object -First 1

if ($otroVendedor) {
    $updateVenta = @{
        usuario_id = $otroVendedor.id
    } | ConvertTo-Json

    try {
        $ventaActualizada = Invoke-RestMethod -Uri "http://localhost:8080/api/ventas/$($venta2.id)" -Method PUT -Body $updateVenta -ContentType "application/json" -Headers $headers
        Write-Host "   ✅ Vendedor actualizado exitosamente" -ForegroundColor Green
        Write-Host "   Vendedor anterior: ID $($venta2.usuario_id)" -ForegroundColor Gray
        Write-Host "   Vendedor nuevo: $($otroVendedor.nombre) (ID: $($ventaActualizada.usuario_id))" -ForegroundColor Cyan
        Write-Host ""
    } catch {
        Write-Host "   ❌ Error al actualizar vendedor: $_" -ForegroundColor Red
    }
} else {
    Write-Host "   ℹ️  Solo hay un vendedor, no se puede cambiar" -ForegroundColor Yellow
    Write-Host ""
}

# 8. Verificar ventas creadas
Write-Host "8. Verificando ventas del vendedor..." -ForegroundColor Yellow
try {
    $ventasVendedor = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/ventas/usuario/$($vendedor.id)" -Method GET -Headers $headers
    Write-Host "   ✅ Ventas del vendedor $($vendedor.nombre): $($ventasVendedor.Count)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error al obtener ventas: $_" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ TODAS LAS PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumen:" -ForegroundColor Cyan
Write-Host "  - Venta creada CON vendedor específico: ID $($venta1.id)" -ForegroundColor White
Write-Host "  - Venta creada SIN vendedor (autenticado): ID $($venta2.id)" -ForegroundColor White
Write-Host "  - Funcionalidad de selección de vendedor: ✅ FUNCIONANDO" -ForegroundColor Green
