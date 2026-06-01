'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import BaseModal from './BaseModal';
import { IUser } from '@models/entities/userEntity';
import { usuarioService } from '@services/usuario.service';
import { comisionService } from '@services/comision.service';

interface ConfigurarComisionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendedor: IUser | null;
  mesInicial?: number;
  anioInicial?: number;
}

export default function ConfigurarComisionModal({
  open,
  onClose,
  onSuccess,
  vendedor,
  mesInicial,
  anioInicial,
}: ConfigurarComisionModalProps) {
  const [porcentajeComision, setPorcentajeComision] = useState('');
  const [gastoPublicitario, setGastoPublicitario] = useState('');
  const [gastoNotSet, setGastoNotSet] = useState(false);
  const [loadingGasto, setLoadingGasto] = useState(false);
  const [sueldo, setSueldo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMes, setSelectedMes] = useState(mesInicial ?? new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(anioInicial ?? new Date().getFullYear());

  const fetchGastoPublicitario = async (userId: number, mes: number, anio: number) => {
    setLoadingGasto(true);
    try {
      const data = await comisionService.getComisionPublicitaria(userId, mes, anio);
      setGastoPublicitario(String(data.valor_comision));
      setGastoNotSet(data.not_set === true || data.valor_comision === 0);
    } catch {
      setGastoPublicitario('0');
      setGastoNotSet(true);
    } finally {
      setLoadingGasto(false);
    }
  };

  useEffect(() => {
    if (vendedor) {
      setPorcentajeComision(vendedor.porcentaje_comision?.toString() || '0');
      setSueldo(vendedor.sueldo?.toString() || '0');
      setObservaciones(vendedor.observaciones_config || '');
      const mes = mesInicial ?? new Date().getMonth() + 1;
      const anio = anioInicial ?? new Date().getFullYear();
      fetchGastoPublicitario(vendedor.id, mes, anio);
    }
  }, [vendedor]);

  useEffect(() => {
    if (mesInicial) setSelectedMes(mesInicial);
    if (anioInicial) setSelectedAnio(anioInicial);
  }, [mesInicial, anioInicial]);

  useEffect(() => {
    if (vendedor) {
      fetchGastoPublicitario(vendedor.id, selectedMes, selectedAnio);
    }
  }, [selectedMes, selectedAnio]);

  const handleSubmit = async () => {
    if (!vendedor) return;

    if (!porcentajeComision || parseFloat(porcentajeComision) < 0 || parseFloat(porcentajeComision) > 100) {
      setError('El porcentaje de comisión debe estar entre 0 y 100');
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
        sueldo: parseFloat(sueldo),
        observaciones: observaciones.trim() || undefined,
        mes: selectedMes,
        anio: selectedAnio,
      });

      // Guardar gasto publicitario del mes (siempre, crea o actualiza el registro mensual)
      const parsed = parseFloat(gastoPublicitario);
      await comisionService.setComisionPublicitaria(
        vendedor.id,
        selectedMes,
        selectedAnio,
        isNaN(parsed) ? 0 : parsed,
      );

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
    setGastoNotSet(false);
    setSueldo('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const showGastoWarning = gastoNotSet || parseFloat(gastoPublicitario) === 0;

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
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: 'inherit', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
              Gasto pub. {mesesNombres[selectedMes - 1]} {selectedAnio} ($)
            </Typography>
            <input
              type="number"
              value={gastoPublicitario}
              onChange={(e) => { setGastoPublicitario(e.target.value); setGastoNotSet(false); }}
              placeholder="Ej: 5000"
              min="0"
              step="0.01"
              disabled={loadingGasto}
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: `1px solid ${showGastoWarning ? '#FCD34D' : '#E5E7EB'}`, borderRadius: '6px', fontFamily: 'inherit', outline: 'none', background: loadingGasto ? '#F9FAFB' : 'white' }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = showGastoWarning ? '#FCD34D' : '#E5E7EB'}
            />
            {showGastoWarning && !loadingGasto && (
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#B45309', mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                ⚠️ Requiere asignación para este mes
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
              Bonos ($) *
            </Typography>
            <input
              type="number"
              value={sueldo}
              onChange={(e) => setSueldo(e.target.value)}
              placeholder="Ej: 100000"
              min="0"
              step="0.01"
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: 'inherit', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '6px', p: 2 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#0369A1', mb: 0.5 }}>
              Cálculo de sueldo total
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#075985', lineHeight: 1.5 }}>
              Sueldo Total = Bonos + ((Ventas - Gasto publicitario) × {porcentajeComision || '0'}%)
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
              style={{ width: '100%', minHeight: '80px', padding: '10px 12px', fontSize: '14px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </Box>
        </Grid>
      </Grid>
    </BaseModal>
  );
}
