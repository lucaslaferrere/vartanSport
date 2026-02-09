-- Migraciones necesarias para el backend de Vartan Sport
-- Ejecutar en PostgreSQL (base de datos: vartan_sports)

-- 1. Verificar y agregar campo sueldo a la tabla usuarios si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'sueldo'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN sueldo DECIMAL(10, 2) DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Campo sueldo agregado a la tabla usuarios';
    ELSE
        RAISE NOTICE 'Campo sueldo ya existe en la tabla usuarios';
    END IF;
END $$;

-- 2. Actualizar sueldos de empleados existentes (si es necesario)
UPDATE usuarios
SET sueldo = 0
WHERE rol = 'empleado' AND sueldo IS NULL;

-- 3. Verificar estructura de la tabla comisiones
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'comisiones';

-- 4. Verificar estructura de la tabla ventas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ventas';

-- 5. Ver todos los usuarios actuales
SELECT id, nombre, email, rol, activo, porcentaje_comision, gasto_publicitario, sueldo
FROM usuarios
ORDER BY id;
