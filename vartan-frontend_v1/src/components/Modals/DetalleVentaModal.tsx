'use client';

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Grid, Divider } from '@mui/material';
import { IVenta } from '@models/entities/ventaEntity';

interface DetalleVentaModalProps {
  open: boolean;
  onClose: () => void;
  venta: IVenta | null;
}

export default function DetalleVentaModal({ open, onClose, venta }: DetalleVentaModalProps) {
  const [previsualizando, setPrevisualizando] = useState(false);

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

  const handleImprimirEtiqueta = () => {
    const cliente = venta.cliente;
    const contenido = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Etiqueta de Envío</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              width: 15cm;
              height: 10cm;
              padding: 0.5cm;
            }
            .etiqueta {
              border: 2px solid #000;
              padding: 10px;
              width: 100%;
            }
            .header {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 2px;
              border-bottom: 1px solid #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .campo { margin-bottom: 4px; font-size: 12px; }
            .label { font-weight: bold; font-size: 10px; color: #555; display: block; }
            .valor { font-size: 13px; }
            .divider { border-top: 1px dashed #999; margin: 8px 0; }
            .transporte {
              text-align: center;
              font-size: 15px;
              font-weight: bold;
              border: 1px solid #000;
              padding: 5px;
              margin-top: 8px;
              border-radius: 4px;
            }
            .pedido {
              text-align: right;
              font-size: 10px;
              color: #888;
              margin-top: 6px;
            }
            @media print {
              body { margin: 0; }
              @page { margin: 0; size: 150mm 100mm; }
            }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <div class="header">VARTAN SPORTS</div>

            <div class="campo">
              <span class="label">DESTINATARIO</span>
              <span class="valor">${cliente?.nombre || '-'}</span>
            </div>
            <div class="campo">
              <span class="label">DNI</span>
              <span class="valor">${cliente?.dni || '-'}</span>
            </div>
            <div class="campo">
              <span class="label">TELÉFONO</span>
              <span class="valor">${cliente?.telefono || '-'}</span>
            </div>

            <div class="divider"></div>

            <div class="campo">
              <span class="label">DIRECCIÓN</span>
              <span class="valor">${cliente?.direccion || '-'}</span>
            </div>
            <div class="campo">
              <span class="label">LOCALIDAD</span>
              <span class="valor">${cliente?.ciudad || '-'}</span>
            </div>
            <div class="campo">
              <span class="label">PROVINCIA</span>
              <span class="valor">${cliente?.provincia || '-'}</span>
            </div>
            <div class="campo">
              <span class="label">CÓDIGO POSTAL</span>
              <span class="valor">${cliente?.codigo_postal || '-'}</span>
            </div>

            <div class="transporte">
              🚚 ${venta.transporte || 'Sin transporte especificado'}
            </div>

            <div class="pedido">Pedido #${venta.id}</div>
          </div>
          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
        </body>
      </html>
    `;

    const ventana = window.open('', '_blank', 'width=600,height=420');
    ventana?.document.write(contenido);
    ventana?.document.close();
  };

  return (
    <>
      {/* MODAL PRINCIPAL */}
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

            {/* Comprobante */}
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
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#2563EB', backgroundColor: 'white', border: '1px solid #2563EB', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <i className="fa-solid fa-eye" />Ver
                      </button>
                      <button
                        onClick={handleDescargarComprobante}
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#fff', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
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

        <DialogActions sx={{ p: 2, borderTop: '1px solid #E5E7EB', gap: 1 }}>
          <button
            onClick={() => setPrevisualizando(true)}
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, color: '#fff', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-eye" /> Previsualizar Etiqueta
          </button>
          <button
            onClick={onClose}
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, color: '#6B7280', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE PREVISUALIZACIÓN */}
      <Dialog open={previsualizando} onClose={() => setPrevisualizando(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #E5E7EB' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 700 }}>Previsualización de Etiqueta</Typography>
            <button onClick={() => setPrevisualizando(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6B7280' }}>
              <i className="fa-solid fa-times" />
            </button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ border: '2px solid #000', borderRadius: '4px', p: 1.5, fontFamily: 'Arial, sans-serif', width: '100%', bgcolor: 'white' }}>

            <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: '14px', letterSpacing: '2px', borderBottom: '1px solid #000', pb: 0.75, mb: 1 }}>
              VARTAN SPORTS
            </Typography>

            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>DESTINATARIO</Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{venta.cliente?.nombre || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>DNI</Typography>
              <Typography sx={{ fontSize: '12px' }}>{venta.cliente?.dni || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>TELÉFONO</Typography>
              <Typography sx={{ fontSize: '12px' }}>{venta.cliente?.telefono || '-'}</Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>DIRECCIÓN</Typography>
              <Typography sx={{ fontSize: '12px' }}>{venta.cliente?.direccion || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>LOCALIDAD</Typography>
              <Typography sx={{ fontSize: '12px' }}>{venta.cliente?.ciudad || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>PROVINCIA</Typography>
              <Typography sx={{ fontSize: '12px' }}>{venta.cliente?.provincia || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>CÓDIGO POSTAL</Typography>
              <Typography sx={{ fontSize: '12px' }}>{venta.cliente?.codigo_postal || '-'}</Typography>
            </Box>

            <Box sx={{ mt: 1, border: '1px solid #000', borderRadius: '4px', p: 0.75, textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>
              🚚 {venta.transporte || 'Sin transporte especificado'}
            </Box>

            <Typography sx={{ fontSize: '9px', color: '#888', textAlign: 'right', mt: 0.75 }}>
              Pedido #{venta.id}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #E5E7EB', gap: 1 }}>
          <button
            onClick={() => setPrevisualizando(false)}
            style={{ padding: '6px 14px', fontSize: '12px', color: '#6B7280', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => { setPrevisualizando(false); handleImprimirEtiqueta(); }}
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, color: '#fff', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-print" /> Imprimir
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}