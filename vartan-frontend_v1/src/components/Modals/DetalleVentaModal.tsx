'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Grid, Divider } from '@mui/material';
import { IVenta } from '@models/entities/ventaEntity';

interface DetalleVentaModalProps {
  open: boolean;
  onClose: () => void;
  venta: IVenta | null;
}

export default function DetalleVentaModal({ open, onClose, venta }: DetalleVentaModalProps) {
  if (!venta) return null;



  const handleDescargarComprobante = () => {
  if (venta.comprobante_url) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    window.open(`${apiUrl}/${venta.comprobante_url}`, '_blank');
  }
};

const handleVerComprobante = () => {
  if (venta.comprobante_url) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    window.open(`${apiUrl}/${venta.comprobante_url}`, '_blank');
  }
};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ pb: 2, borderBottom: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '18px', fontWeight: 700 }}>Detalle de Venta #{venta.id}</Typography>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6B7280' }}>
            <i className="fa-solid fa-times" />
          </button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          {/* Cliente */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '8px' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', mb: 0.5 }}>
                <i className="fa-solid fa-user" style={{ marginRight: '6px' }} />Cliente
              </Typography>
              <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>{venta.cliente?.nombre || 'N/A'}</Typography>
              {venta.cliente?.email && <Typography sx={{ fontSize: '11px', color: '#6B7280', mt: 0.5 }}>{venta.cliente.email}</Typography>}
            </Box>
          </Grid>

          {/* Info de la venta */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', mb: 0.5 }}>Fecha</Typography>
            <Typography sx={{ fontSize: '13px' }}>{new Date(venta.fecha_venta).toLocaleDateString('es-AR')}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', mb: 0.5 }}>Forma de Pago</Typography>
            <Typography sx={{ fontSize: '13px' }}>{venta.forma_pago?.nombre || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', mb: 0.5 }}>Vendedor</Typography>
            <Typography sx={{ fontSize: '13px' }}>{venta.usuario?.nombre || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', mb: 0.5 }}>Financiera</Typography>
            <Typography sx={{ fontSize: '13px' }}>{venta.usa_financiera ? 'Sí (-3%)' : 'No'}</Typography>
          </Grid>

          {/* Productos */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1 }}>
              <i className="fa-solid fa-shopping-bag" style={{ marginRight: '6px' }} />Productos
            </Typography>
            {venta.detalles?.map((detalle, idx) => (
              <Box key={idx} sx={{ p: 1.5, mb: 1, border: '1px solid #E5E7EB', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{detalle.producto?.nombre || 'Producto'}</Typography>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                    Talle: {detalle.talle} | Cant: {detalle.cantidad} | Precio: ${(detalle.precio_unitario || 0).toLocaleString('es-AR')}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>${(detalle.subtotal || 0).toLocaleString('es-AR')}</Typography>
              </Box>
            ))}
          </Grid>

          {/* Totales */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: '8px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Subtotal:</Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>${(venta.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Seña:</Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>${(venta.sena || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Saldo:</Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>${(venta.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
              </Box>
              {(venta.descuento ?? 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '12px', color: '#10B981' }}>Financiera:</Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>-${(venta.descuento || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 700 }}>Total Final:</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>${(venta.total_final || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Observaciones */}
          {venta.observaciones && (
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', mb: 0.5 }}>Observaciones</Typography>
              <Box sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '6px' }}>
                <Typography sx={{ fontSize: '12px' }}>{venta.observaciones}</Typography>
              </Box>
            </Grid>
          )}

          {/* Comprobante - Siempre mostrar */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 2, bgcolor: venta.comprobante_url ? '#EFF6FF' : '#F9FAFB', borderRadius: '8px', border: `1px solid ${venta.comprobante_url ? '#BFDBFE' : '#E5E7EB'}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: venta.comprobante_url ? '#1E40AF' : '#6B7280', mb: 0.5 }}>
                    <i className={`fa-solid ${venta.comprobante_url ? 'fa-file-pdf' : 'fa-file-circle-xmark'}`} style={{ marginRight: '6px' }} />
                    {venta.comprobante_url ? 'Comprobante Adjunto' : 'Sin Comprobante'}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                    {venta.comprobante_url ? 'Click en los botones para ver o descargar el archivo' : 'Esta venta no tiene comprobante adjunto'}
                  </Typography>
                </Box>
                {venta.comprobante_url && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <button
                      onClick={handleVerComprobante}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#2563EB',
                        backgroundColor: 'white',
                        border: '1px solid #2563EB',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-eye" />Ver
                    </button>
                    <button
                      onClick={handleDescargarComprobante}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#fff',
                        backgroundColor: '#2563EB',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-download" />Descargar
                    </button>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
        <button onClick={onClose} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, color: '#6B7280', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Cerrar
        </button>
      </DialogActions>
    </Dialog>
  );
}
