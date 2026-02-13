-- ============================================
-- MIGRACION PARA DIGITAL OCEAN / COOLIFY
-- Fecha: 2026-02-12
-- ============================================

-- 1. Cambiar rol de 'empleado' a 'vendedor'
-- (El frontend espera 'vendedor', no 'empleado')
UPDATE usuarios SET rol = 'vendedor' WHERE rol = 'empleado';

-- 2. Agregar campo 'sueldo' a tabla usuarios (si no existe)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sueldo DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- 3. Agregar campo 'sueldo' a tabla comisiones (si no existe)
ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS sueldo DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- 4. Hacer cliente_id nullable en gastos (para que no de error al crear gastos)
ALTER TABLE gastos ALTER COLUMN cliente_id DROP NOT NULL;

-- 5. Agregar campo vendedor_id a ventas (para asignar vendedor a una venta)
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS vendedor_id INTEGER REFERENCES usuarios(id);

-- ============================================
-- VERIFICACION
-- ============================================

-- Ver usuarios y sus roles
SELECT id, nombre, email, rol, sueldo FROM usuarios ORDER BY id;

-- Ver estructura de tabla gastos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'gastos';

-- Ver estructura de tabla comisiones
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comisiones';

-- ============================================
-- FIN DE MIGRACION
-- ============================================
