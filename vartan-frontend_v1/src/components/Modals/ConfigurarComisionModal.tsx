'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import BaseModal from './BaseModal';
import { IUser } from '@models/entities/userEntity';
import { usuarioService } from '@services/usuario.service';

interface ConfigurarComisionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendedor: IUser | null;
}

export default function ConfigurarComisionModal({
  open,
  onClose,
  onSuccess,
  vendedor,
}: ConfigurarComisionModalProps) {
  const [porcentajeComision, setPorcentajeComision] = useState('');
  const [gastoPublicitario, setGastoPublicitario] = useState('');
  const [sueldo, setSueldo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendedor) {
      setPorcentajeComision(vendedor.porcentaje_comision?.toString() || '0');
      setGastoPublicitario(vendedor.gasto_publicitario?.toString() || '0');
      setSueldo(vendedor.sueldo?.toString() || '0');
      setObservaciones(vendedor.observaciones_config || '');
    }
  }, [vendedor]);

  const handleSubmit = async () => {
    if (!vendedor) return;

    // Validaciones
    if (!porcentajeComision || parseFloat(porcentajeComision) < 0 || parseFloat(porcentajeComision) > 100) {
      setError('El porcentaje de comisión debe estar entre 0 y 100');
      return;
    }

    if (!gastoPublicitario || parseFloat(gastoPublicitario) < 0) {
      setError('El gasto publicitario debe ser mayor o igual a 0');
      return;
    }

    if (!sueldo || parseFloat(sueldo) < 0) {
      setError('El sueldo debe ser mayor o igual a 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await usuarioService.updateComisionConfig(vendedor.id, {
        porcentaje_comision: parseFloat(porcentajeComision),
        gasto_publicitario: parseFloat(gastoPublicitario),
        sueldo: parseFloat(sueldo),
        observaciones: observaciones.trim() || undefined,
      });

      onSuccess();
      handleClose();
    } catch (err: unknown) {
      console.error('Error actualizando configuración:', err);
      setError('Error al actualizar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPorcentajeComision('');
    setGastoPublicitario('');
    setSueldo('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={`Configurar comisión - ${vendedor?.nombre || ''}`}
      onSubmit={handleSubmit}
      isLoading={loading}
      error={error}
      submitText="Guardar"
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
              Porcentaje de comisión (%) *
            </Typography>
            <input
              type="number"
              value={porcentajeComision}
              onChange={(e) => setPorcentajeComision(e.target.value)}
              placeholder="Ej: 10"
              min="0"
              max="100"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
              Gasto publicitario ($) *
            </Typography>
            <input
              type="number"
              value={gastoPublicitario}
              onChange={(e) => setGastoPublicitario(e.target.value)}
              placeholder="Ej: 5000"
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
              Sueldo base ($) *
            </Typography>
            <input
              type="number"
              value={sueldo}
              onChange={(e) => setSueldo(e.target.value)}
              placeholder="Ej: 100000"
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{
            bgcolor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '6px',
            p: 2
          }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#0369A1', mb: 0.5 }}>
              Cálculo de sueldo total
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#075985', lineHeight: 1.5 }}>
              Sueldo Total = Sueldo base + ((Ventas - Gasto publicitario) × {porcentajeComision || '0'}%)
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
              Observaciones
            </Typography>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales para el vendedor..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </Box>
        </Grid>
      </Grid>
    </BaseModal>
  );
}

