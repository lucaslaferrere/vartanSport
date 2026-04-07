-- ============================================================
-- MIGRATION: monthly_advertising_commissions
-- Replaces the carryover fallback to usuarios.gasto_publicitario
-- with an explicit per-month record that defaults to 0 if absent.
-- ============================================================

-- ===== UP =====

CREATE TABLE IF NOT EXISTS comisiones_publicitarias_mensuales (
    id            SERIAL PRIMARY KEY,
    empleado_id   INTEGER        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mes           INTEGER        NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio          INTEGER        NOT NULL,
    valor_comision DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comision_pub_mensual UNIQUE (empleado_id, mes, anio)
);

CREATE INDEX IF NOT EXISTS idx_comision_pub_mensual_empleado_mes
    ON comisiones_publicitarias_mensuales (empleado_id, mes, anio);

-- ===== DOWN =====

-- DROP TABLE IF EXISTS comisiones_publicitarias_mensuales;
