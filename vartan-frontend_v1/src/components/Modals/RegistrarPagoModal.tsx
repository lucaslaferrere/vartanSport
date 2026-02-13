'use client';

import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, IconButton, TextField } from '@mui/material';
import BaseModal from './BaseModal';
import { IVenta } from '@models/entities/ventaEntity';
import { ventaService } from '@services/venta.service';
import { useNotification } from '@components/Notifications';

interface RegistrarPagoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (ventaActualizada: IVenta) => void;
  venta: IVenta | null;
}

export default function RegistrarPagoModal({ open, onClose, onSuccess, venta }: RegistrarPagoModalProps) {
  const { addNotification } = useNotification();
  const [nuevaSena, setNuevaSena] = useState<string>('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && venta) {
      setNuevaSena('');
      setComprobante(null);
      setError(null);
    }
  }, [open, venta]);

  if (!venta) return null;

  const senaActual = venta.sena || 0;
  const precioVenta = venta.precio_venta || venta.total;
  const saldoPendiente = precioVenta - senaActual;
  const nuevaSenaNum = parseFloat(nuevaSena) || 0;
  const nuevoSaldo = precioVenta - nuevaSenaNum;
  const montoPago = nuevaSenaNum - senaActual;

  const handleSubmit = async () => {
    setError(null);

    if (!nuevaSena || nuevaSenaNum <= 0) {
      setError('Debe ingresar un monto válido');
      return;
    }

    if (nuevaSenaNum <= senaActual) {
      setError(`La nueva seña debe ser mayor a $${senaActual.toLocaleString('es-AR')}`);
      return;
    }

    if (nuevaSenaNum > precioVenta) {
      setError(`La seña no puede superar el precio de venta ($${precioVenta.toLocaleString('es-AR')})`);
      return;
    }

    setLoading(true);

    try {
      const result = await ventaService.updatePago(venta.id, nuevaSenaNum, comprobante || undefined);

      addNotification('Pago registrado exitosamente', 'success');

      if (result.venta.saldo === 0) {
        addNotification('✅ Venta pagada completamente', 'success');
      } else {
        addNotification(`Saldo pendiente: $${result.venta.saldo.toLocaleString('es-AR')}`, 'info');
      }

      handleClose();
      onSuccess(result.venta);
    } catch (err: unknown) {
      console.error('Error registrando pago:', err);
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage = error.response?.data?.error || 'Error al registrar el pago';
      addNotification(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNuevaSena('');
    setComprobante(null);
    setError(null);
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      const file = files[0];
      const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!extensionesPermitidas.includes(extension)) {
        addNotification('Solo se permiten archivos PDF, JPG, JPEG y PNG', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        addNotification('El archivo no puede superar los 5MB', 'error');
        return;
      }
      setComprobante(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      const file = files[0];
      const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!extensionesPermitidas.includes(extension)) {
        addNotification('Solo se permiten archivos PDF, JPG, JPEG y PNG', 'error');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        addNotification('El archivo no puede superar los 5MB', 'error');
        e.target.value = '';
        return;
      }
      setComprobante(file);
    }
  };

  return (
    <BaseModal
      title={`Registrar Pago - Venta #${venta.id}`}
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Registrar Pago"
      isLoading={loading}
      error={error}
    >
      <Grid container spacing={2}>

        {/* Información Actual */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
              Estado Actual de la Venta
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Cliente:</Typography>
              <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>{venta.cliente?.nombre}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Precio de Venta:</Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                ${precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Seña Actual:</Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B82F6' }}>
                ${senaActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>

            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              pt: 1,
              borderTop: '1px solid #E5E7EB'
            }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>
                Saldo Pendiente:
              </Typography>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#DC2626' }}>
                ${saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Nueva Seña */}
        <Grid size={{ xs: 12 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>
            Nueva Seña Total *
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 1 }}>
            Ingrese el monto TOTAL pagado hasta ahora (incluyendo pagos anteriores)
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={nuevaSena}
            onChange={(e) => setNuevaSena(e.target.value)}
            placeholder={`Mínimo: $${(senaActual + 1).toLocaleString('es-AR')}`}
            required
            InputProps={{
              sx: { fontSize: '14px' }
            }}
          />
        </Grid>

        {/* Vista previa del cálculo */}
        {nuevaSenaNum > senaActual && nuevaSenaNum <= precioVenta && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{
              p: 2,
              bgcolor: nuevoSaldo === 0 ? '#ECFDF5' : '#EFF6FF',
              borderRadius: '8px',
              border: nuevoSaldo === 0 ? '1px solid #A7F3D0' : '1px solid #BFDBFE'
            }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
                {nuevoSaldo === 0 ? '✅ Vista Previa - PAGO COMPLETO' : '📊 Vista Previa del Pago'}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Monto de este pago:</Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                  + ${montoPago.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Nueva seña total:</Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                  ${nuevaSenaNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                pt: 1,
                borderTop: '1px solid #E5E7EB'
              }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>
                  {nuevoSaldo === 0 ? 'Estado:' : 'Nuevo saldo pendiente:'}
                </Typography>
                <Typography sx={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: nuevoSaldo === 0 ? '#059669' : '#DC2626'
                }}>
                  {nuevoSaldo === 0 ? 'PAGADO ✅' : `$${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}

        {/* Comprobante */}
        <Grid size={{ xs: 12 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>
            Comprobante de Pago (Opcional)
          </Typography>
          {!comprobante ? (
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pago-file-input')?.click()}
              sx={{
                border: `1px dashed ${isDragging ? '#3B82F6' : '#D1D5DB'}`,
                borderRadius: '8px',
                minHeight: '80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'white',
                gap: 1,
                p: 2,
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#3B82F6', bgcolor: '#F9FAFB' }
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#9CA3AF', fontSize: '24px' }} />
              <Typography sx={{ fontSize: '12px', color: '#6B7280', textAlign: 'center' }}>
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra el comprobante aquí o haz clic para seleccionar'}
              </Typography>
              <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>
                PDF, JPG, JPEG, PNG (máx. 5MB)
              </Typography>
              <input
                id="pago-file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Box>
          ) : (
            <Box sx={{
              p: 1.5,
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: '#F0F9FF'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                <i
                  className={`fa-solid ${comprobante.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'}`}
                  style={{ color: '#3B82F6', fontSize: '16px' }}
                />
                <Typography noWrap sx={{ fontSize: '12px', color: '#1E40AF', maxWidth: '250px' }}>
                  {comprobante.name}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setComprobante(null)} sx={{ color: '#EF4444' }}>
                <i className="fa-solid fa-times" style={{ fontSize: '12px' }} />
              </IconButton>
            </Box>
          )}
        </Grid>

        {/* Advertencia */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ p: 1.5, bgcolor: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
            <Typography sx={{ fontSize: '11px', color: '#92400E' }}>
              <i className="fa-solid fa-info-circle" style={{ marginRight: '6px' }} />
              Recuerda: La seña es <strong>acumulativa</strong>. Debes ingresar el monto TOTAL pagado hasta ahora,
              no solo el pago de hoy.
            </Typography>
          </Box>
        </Grid>

      </Grid>
    </BaseModal>
  );
}

