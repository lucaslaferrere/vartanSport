'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Select, MenuItem, FormControl, InputLabel, Divider } from '@mui/material';
import BaseModal from './BaseModal';
import { IUser } from '@models/entities/userEntity';
import { usuarioService } from '@services/usuario.service';
import { comisionService } from '@services/comision.service';
import { IComision } from '@models/entities/comisionentity';

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

  // Gasto por mes
  const [comisiones, setComisiones] = useState<IComision[]>([]);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [gastoMes, setGastoMes] = useState('0');
  const [savingGasto, setSavingGasto] = useState(false);
  const [gastoGuardado, setGastoGuardado] = useState(false);

  useEffect(() => {
    if (vendedor) {
      setPorcentajeComision(vendedor.porcentaje_comision?.toString() || '0');
      setGastoPublicitario(vendedor.gasto_publicitario?.toString() || '0');
      setSueldo(vendedor.sueldo?.toString() || '0');
      setObservaciones(vendedor.observaciones_config || '');
      comisionService.getByUsuario(vendedor.id).then((data) => {
        setComisiones(data);
        if (data.length > 0) {
          const maxAnio = Math.max(...data.map(c => c.anio));
          const mesesDelAnio = data.filter(c => c.anio === maxAnio).map(c => c.mes);
          const maxMes = Math.max(...mesesDelAnio);
          setSelectedAnio(maxAnio);
          setSelectedMes(maxMes);
        }
      }).catch(() => setComisiones([]));
    }
  }, [vendedor]);

  useEffect(() => {
    const comision = comisiones.find(c => c.mes === selectedMes && c.anio === selectedAnio);
    setGastoMes(comision && comision.gasto_publicitario !== null ? String(comision.gasto_publicitario) : '0');
    setGastoGuardado(false);
  }, [selectedMes, selectedAnio, comisiones]);

  const handleSubmit = async () => {
    if (!vendedor) return;

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

  const handleGuardarGastoMes = async () => {
    const comision = comisiones.find(c => c.mes === selectedMes && c.anio === selectedAnio);
    if (!comision) return;
    setSavingGasto(true);
    try {
      const parsed = parseFloat(gastoMes);
      const updated = await comisionService.updateGastoPublicitario(comision.id, isNaN(parsed) ? 0 : parsed);
      setComisiones(prev => prev.map(c => c.id === comision.id ? { ...c, gasto_publicitario: updated.gasto_publicitario, total_comision: updated.total_comision } : c));
      setGastoGuardado(true);
    } catch {
      // silencioso
    } finally {
      setSavingGasto(false);
    }
  };

  const handleClose = () => {
    setPorcentajeComision('');
    setGastoPublicitario('');
    setSueldo('');
    setObservaciones('');
    setComisiones([]);
    setGastoMes('0');
    setGastoGuardado(false);
    setError(null);
    onClose();
  };

    const comisionSeleccionada = comisiones.find(c => c.mes === selectedMes && c.anio === selectedAnio);

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
              Gasto pub. default ($) *
            </Typography>
            <input
              type="number"
              value={gastoPublicitario}
              onChange={(e) => setGastoPublicitario(e.target.value)}
              placeholder="Ej: 5000"
              min="0"
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
              Sueldo base ($) *
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
              style={{ width: '100%', minHeight: '80px', padding: '10px 12px', fontSize: '14px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </Box>
        </Grid>

        {/* Gasto por mes */}
        {comisiones.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', mb: 1.5 }}>
              Gasto publicitario por mes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Mes</InputLabel>
                <Select value={selectedMes} label="Mes" onChange={(e) => { setSelectedMes(Number(e.target.value)); setGastoGuardado(false); }}>
                  {meses.map((m, i) => (
                    <MenuItem key={i + 1} value={i + 1} disabled={!comisiones.some(c => c.mes === i + 1 && c.anio === selectedAnio)}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel>Año</InputLabel>
                <Select value={selectedAnio} label="Año" onChange={(e) => { setSelectedAnio(Number(e.target.value)); setGastoGuardado(false); }}>
                  {[...new Set(comisiones.map(c => c.anio))].sort().map(a => (
                    <MenuItem key={a} value={a}>{a}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box>
                <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.5 }}>Gasto ($)</Typography>
                <input
                  type="number"
                  value={gastoMes}
                  onChange={(e) => { setGastoMes(e.target.value); setGastoGuardado(false); }}
                  disabled={!comisionSeleccionada}
                  min="0"
                  style={{ padding: '8px 10px', fontSize: '14px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: 'inherit', outline: 'none', width: 130, appearance: 'textfield' }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </Box>
              <button
                onClick={handleGuardarGastoMes}
                disabled={savingGasto || !comisionSeleccionada || gastoGuardado}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff', backgroundColor: gastoGuardado ? '#10B981' : (!comisionSeleccionada ? '#9CA3AF' : '#2563EB'), border: 'none', borderRadius: '6px', cursor: comisionSeleccionada && !gastoGuardado ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
              >
                {savingGasto ? 'Guardando...' : gastoGuardado ? '✓ Guardado' : 'Guardar'}
              </button>
            </Box>
            {comisionSeleccionada && (
              <Typography sx={{ fontSize: '11px', color: '#6B7280', mt: 1 }}>
                Ventas del mes: <strong>${(comisionSeleccionada.total_ventas || 0).toLocaleString('es-AR')}</strong>
                {' · '}Comisión calculada: <strong style={{ color: '#059669' }}>${(comisionSeleccionada.total_comision || 0).toLocaleString('es-AR')}</strong>
              </Typography>
            )}
            {!comisionSeleccionada && (
              <Typography sx={{ fontSize: '11px', color: '#9CA3AF', mt: 1 }}>
                No hay registro de comisión para {meses[selectedMes - 1]} {selectedAnio}
              </Typography>
            )}
          </Grid>
        )}
      </Grid>
    </BaseModal>
  );
}
