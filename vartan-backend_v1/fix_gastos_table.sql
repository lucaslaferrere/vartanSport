-- Script para verificar y corregir la tabla gastos

-- Ver estructura actual de la tabla gastos
\d gastos

-- Si la tabla existe con cliente_id, actualizar la estructura
-- Si usuario_id no existe, agregarlo
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usuario_id INTEGER;

-- Copiar datos de cliente_id a usuario_id si usuario_id está vacío
UPDATE gastos SET usuario_id = cliente_id WHERE usuario_id IS NULL AND cliente_id IS NOT NULL;

-- Si usuario_id aún es NULL, usar el primer usuario dueño
UPDATE gastos SET usuario_id = (SELECT id FROM usuarios WHERE rol = 'dueño' LIMIT 1) WHERE usuario_id IS NULL;

-- Hacer usuario_id NOT NULL
ALTER TABLE gastos ALTER COLUMN usuario_id SET NOT NULL;

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_gastos_usuario_id ON gastos(usuario_id);

-- Verificar estructura final
\d gastos

-- Contar gastos por usuario
SELECT usuario_id, COUNT(*) as total_gastos FROM gastos GROUP BY usuario_id;
