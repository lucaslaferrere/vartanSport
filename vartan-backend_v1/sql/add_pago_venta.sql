-- ============================================================
-- MIGRATION: pago_venta
-- Permite registrar multiples pagos parciales por venta, cada uno
-- con su monto, forma de pago, comprobante y estado de revision.
-- Coexiste con el campo legacy venta.comprobante_url.
-- ============================================================

-- ===== UP =====

CREATE TABLE IF NOT EXISTS pago_venta (
    id              SERIAL PRIMARY KEY,
    venta_id        INTEGER       NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
    monto           NUMERIC(12,2) NOT NULL,
    forma_pago_id   INTEGER       REFERENCES forma_pagos(id),
    comprobante_url VARCHAR(500),
    revisado        BOOLEAN       NOT NULL DEFAULT FALSE,
    revisado_at     TIMESTAMP,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pago_venta_venta_id ON pago_venta(venta_id);

-- ===== DOWN =====

-- DROP INDEX IF EXISTS idx_pago_venta_venta_id;
-- DROP TABLE IF EXISTS pago_venta;
