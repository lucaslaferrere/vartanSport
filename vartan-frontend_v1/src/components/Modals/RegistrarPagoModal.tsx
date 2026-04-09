'use client';

import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, IconButton, TextField, Select, MenuItem } from '@mui/material';
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
  const [formaPagoSaldoId, setFormaPagoSaldoId] = useState<number>(1);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formasPago = [
    { id: 1, nombre: 'Financiera' },
    { id: 2, nombre: 'Transferencia a Cuenta 0' },
    { id: 3, nombre: 'Efectivo' },
  ];

  useEffect(() => {
    if (open && venta) {
      setNuevaSena('');
      setFormaPagoSaldoId(venta.forma_pago_id || 1);
      setComprobante(null);
      setError(null);
    }
  }, [open, venta]);

  if (!venta) return null;

  const senaActual = venta.sena || 0;
  const precioVenta = venta.precio_venta || venta.total;
  const saldoPendiente = precioVenta - senaActual;
  const pagoDeHoy = parseFloat(nuevaSena) || 0;
  const nuevaSenaTotal = senaActual + pagoDeHoy;
  const nuevoSaldo = precioVenta - nuevaSenaTotal;
  const descuentoFinanciera = formaPagoSaldoId === 1 ? pagoDeHoy * 0.03 : 0;

  const handleSubmit = async () => {
    setError(null);

    if (!nuevaSena || pagoDeHoy <= 0) {
      setError('Debe ingresar un monto válido');
      return;
    }

    if (nuevaSenaTotal > precioVenta) {
      setError(`El pago supera el saldo pendiente ($${saldoPendiente.toLocaleString('es-AR')})`);
      return;
    }

    if (!comprobante) {
      setError('Debe adjuntar un comprobante');
      return;
    }

    setLoading(true);

    try {
      const result = await ventaService.updatePago(venta.id, nuevaSenaTotal, formaPagoSaldoId, comprobante || undefined);

      addNotification('Pago registrado exitosamente', 'success');

      if (result.venta.saldo === 0) {
        addNotification('Venta pagada completamente', 'success');
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
    setFormaPagoSaldoId(1);
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

        {/* Método de pago del saldo */}
        <Grid size={{ xs: 12 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>
            Método de Pago
          </Typography>
          <Select
            fullWidth
            size="small"
            value={formaPagoSaldoId}
            onChange={(e) => setFormaPagoSaldoId(Number(e.target.value))}
            sx={{ fontSize: '13px', bgcolor: 'white' }}
          >
            {formasPago.map(fp => (
              <MenuItem key={fp.id} value={fp.id}>{fp.nombre}</MenuItem>
            ))}
          </Select>
          {formaPagoSaldoId === 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
              <i className="fa-solid fa-circle-info" style={{ color: '#D97706', fontSize: '12px' }} />
              <Typography sx={{ fontSize: '12px', color: '#D97706', fontWeight: 500 }}>
                Comisión financiera (3%) aplicada sobre el monto pagado
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Pago de hoy */}
        <Grid size={{ xs: 12 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>
            Monto a Pagar Hoy *
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 1 }}>
            Ingrese el monto que el cliente está pagando ahora
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={nuevaSena}
            onChange={(e) => setNuevaSena(e.target.value)}
            placeholder={`Saldo pendiente: $${saldoPendiente.toLocaleString('es-AR')}`}
            required
            slotProps={{
              input: {
                sx: {
                  fontSize: '14px',
                  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield',
                  },
                }
              }
            }}
          />
        </Grid>

        {/* Vista previa del cálculo */}
        {pagoDeHoy > 0 && nuevaSenaTotal <= precioVenta && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{
              p: 2,
              bgcolor: nuevoSaldo === 0 ? '#ECFDF5' : '#EFF6FF',
              borderRadius: '8px',
              border: nuevoSaldo === 0 ? '1px solid #A7F3D0' : '1px solid #BFDBFE'
            }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
                {nuevoSaldo === 0 ? (
                  <>
                    <i className="fa-solid fa-circle-check" style={{ color: '#059669', marginRight: '6px' }} />
                    Vista Previa - PAGO COMPLETO
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-chart-simple" style={{ color: '#3B82F6', marginRight: '6px' }} />
                    Vista Previa del Pago
                  </>
                )}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Monto de este pago:</Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                  + ${pagoDeHoy.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              {descuentoFinanciera > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '12px', color: '#D97706' }}>Comisión financiera (3%):</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#D97706' }}>
                    - ${descuentoFinanciera.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Nueva seña total:</Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                  ${nuevaSenaTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
                  {nuevoSaldo === 0 ? (
                    <>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }} />
                      PAGADO
                    </>
                  ) : (
                    `$${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                  )}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}

        {/* Comprobante */}
        <Grid size={{ xs: 12 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>
            Comprobante de Pago *
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

      </Grid>
    </BaseModal>
  );
}