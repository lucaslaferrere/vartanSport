-- Agregar campos de costo, precio_venta y ganancia a la tabla ventas

-- 1. Agregar columna costo (renombrar total a costo)
ALTER TABLE ventas RENAME COLUMN total TO costo;

-- 2. Agregar columna precio_venta
ALTER TABLE ventas ADD COLUMN precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 3. Agregar columna ganancia
ALTER TABLE ventas ADD COLUMN ganancia DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 4. Agregar columna total (para mantener compatibilidad)
ALTER TABLE ventas ADD COLUMN total DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 5. Copiar valores temporalmente (si hay datos existentes)
UPDATE ventas SET precio_venta = costo WHERE precio_venta = 0;
UPDATE ventas SET total = precio_venta;
UPDATE ventas SET ganancia = precio_venta - costo;

-- Verificar estructura
-- \d ventas
