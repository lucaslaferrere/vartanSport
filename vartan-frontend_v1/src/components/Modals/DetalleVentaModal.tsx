'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Grid, Divider, CircularProgress, Tabs, Tab } from '@mui/material';
import { IVenta, IPagoVenta } from '@models/entities/ventaEntity';
import { ventaService } from '@services/venta.service';
import TabPanel from '@components/Tabs/TabPanel';

interface DetalleVentaModalProps {
  open: boolean;
  onClose: () => void;
  venta: IVenta | null;
}

const TRANSPORTES = ['', 'Correo Argentino', 'Viacargo', 'Moto', 'Retira'];

export default function DetalleVentaModal({ open, onClose, venta }: DetalleVentaModalProps) {
  const [previsualizando, setPrevisualizando] = useState(false);
  const [transporteEdit, setTransporteEdit] = useState(venta?.transporte || '');
  const [transporteActual, setTransporteActual] = useState(venta?.transporte || '');
  const [guardandoTransporte, setGuardandoTransporte] = useState(false);
  const [pagos, setPagos] = useState<IPagoVenta[]>([]);
  const [pagosLoading, setPagosLoading] = useState(false);
  const [pagosError, setPagosError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setTransporteEdit(venta?.transporte || '');
    setTransporteActual(venta?.transporte || '');
  }, [venta]);

  useEffect(() => {
    if (!open || !venta?.id) {
      setPagos([]);
      setPagosError(null);
      return;
    }
    // Capturar valores actuales para evitar closures obsoletos
    const ventaId = venta.id;
    const fallback = venta.pagos ?? [];
    setPagosLoading(true);
    setPagosError(null);
    ventaService.getPagos(ventaId)
      .then(data => setPagos(data))
      .catch(() => setPagos(fallback))
      .finally(() => setPagosLoading(false));
  }, [open, venta?.id]);

  if (!venta) return null;

  const pagosOrdenados = [...pagos].reverse();
  const ultimoComprobanteUrl =
    pagosOrdenados.find(p => !!p.comprobante_url)?.comprobante_url ||
    venta.comprobante_saldo_url ||
    venta.comprobante_url ||
    null;
  // Muestra comprobantes legacy (venta.comprobante_url / comprobante_saldo_url)
  // siempre que su URL no esté ya cubierta por una entrada en pago_venta.
  const pagoUrls = new Set(pagos.map(p => p.comprobante_url).filter(Boolean));
  const legacyComprobantes: Array<{ label: string; url: string }> = [
    ...(venta.comprobante_url && !pagoUrls.has(venta.comprobante_url)
      ? [{ label: 'Seña', url: venta.comprobante_url }]
      : []),
    ...(venta.comprobante_saldo_url && !pagoUrls.has(venta.comprobante_saldo_url)
      ? [{ label: 'Saldo', url: venta.comprobante_saldo_url }]
      : []),
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const buildComprobanteUrl = (comprobanteUrl: string) => {
    const normalized = comprobanteUrl.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${apiUrl}/${normalized}`;
  };

  const formatFechaPago = (iso: string) => {
    const date = new Date(iso);
    const fecha = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    const hora = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${fecha} · ${hora} h`;
  };

  const handleVerPagoComprobante = (comprobanteUrl: string) => {
    window.open(buildComprobanteUrl(comprobanteUrl), '_blank');
  };

  const handleDescargarComprobante = async (comprobanteUrl: string, fileName: string) => {
    try {
      const response = await fetch(buildComprobanteUrl(comprobanteUrl));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const ext = comprobanteUrl.split('.').pop()?.toLowerCase() || 'pdf';
      link.href = url;
      link.setAttribute('download', `${fileName}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(buildComprobanteUrl(comprobanteUrl), '_blank');
    }
  };

  const handleDescargarPagoComprobante = async (pago: IPagoVenta) => {
    if (!pago.comprobante_url) return;
    try {
      const response = await fetch(buildComprobanteUrl(pago.comprobante_url));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const ext = pago.comprobante_url.split('.').pop()?.toLowerCase() || 'pdf';
      link.href = url;
      link.setAttribute('download', `comprobante_pago_${pago.id}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(buildComprobanteUrl(pago.comprobante_url), '_blank');
    }
  };

  const handleGuardarTransporte = async () => {
    setGuardandoTransporte(true);
    try {
      await ventaService.updateTransporte(venta.id, transporteEdit);
      setTransporteActual(transporteEdit);
    } catch (err) {
      console.error('Error actualizando transporte:', err);
    } finally {
      setGuardandoTransporte(false);
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
              width: 10cm;
              height: 15cm;
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
              @page { margin: 0; size: 100mm 150mm; }
            }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <div class="header">MAYOREA - LR SOLUTIONS</div>

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
            <div class="campo">
              <span class="label">EMAIL</span>
              <span class="valor">${cliente?.email || '-'}</span>
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
              🚚 ${transporteActual || 'Sin transporte especificado'}
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
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Deuda:</Typography>
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

            {/* Transporte */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1 }}>
                <i className="fa-solid fa-truck" style={{ marginRight: '6px' }} />Transporte
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <select
                  value={transporteEdit}
                  onChange={(e) => setTransporteEdit(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px', backgroundColor: 'white', outline: 'none' }}
                >
                  {TRANSPORTES.map((t) => (
                    <option key={t} value={t}>{t || 'Sin especificar'}</option>
                  ))}
                </select>
                <button
                  onClick={handleGuardarTransporte}
                  disabled={guardandoTransporte || transporteEdit.trim() === transporteActual.trim()}
                  style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 500, color: '#fff', backgroundColor: transporteEdit.trim() === transporteActual.trim() ? '#9CA3AF' : '#2563EB', border: 'none', borderRadius: '6px', cursor: transporteEdit.trim() === transporteActual.trim() ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
                >
                  {guardandoTransporte ? 'Guardando...' : 'Guardar'}
                </button>
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

            {/* Comprobantes */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1 }}>
                <i className="fa-solid fa-file-invoice" style={{ marginRight: '6px' }} />
                Comprobantes
              </Typography>

              <Box sx={{ borderBottom: '1px solid #E5E7EB' }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v as number)}
                  sx={{
                    minHeight: '38px',
                    '& .MuiTabs-indicator': { bgcolor: '#2563EB', height: '2px' },
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#6B7280',
                      minHeight: '38px',
                      py: 0.75,
                      px: 1.5,
                      '&.Mui-selected': { color: '#2563EB', fontWeight: 600 },
                    },
                  }}
                >
                  <Tab label="Historial" id="tab-0" aria-controls="tabpanel-0" />
                  <Tab label="Último Comprobante" id="tab-1" aria-controls="tabpanel-1" />
                </Tabs>
              </Box>

              {/* Tab 0: Historial de Comprobantes */}
              <TabPanel value={activeTab} index={0}>
                {pagosLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={22} />
                  </Box>
                )}

                {pagosError && !pagosLoading && (
                  <Box sx={{ p: 2, bgcolor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    <Typography sx={{ fontSize: '12px', color: '#B91C1C' }}>{pagosError}</Typography>
                  </Box>
                )}

                {!pagosLoading && !pagosError && pagosOrdenados.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {pagosOrdenados.map((pago) => {
                      const tieneComprobante = !!pago.comprobante_url;
                      const esPdf = tieneComprobante && pago.comprobante_url!.toLowerCase().endsWith('.pdf');
                      const fechaPago = pago.fecha || pago.created_at;
                      return (
                        <Box
                          key={pago.id}
                          sx={{
                            p: 1.5,
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            bgcolor: '#FAFAFA',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: pago.revisado ? '#10B981' : '#F59E0B', flexShrink: 0 }}
                              title={pago.revisado ? 'Revisado' : 'Pendiente de revisión'}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                                  {pago.monto > 0 ? `$${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'Sin monto registrado'}
                                </Typography>
                                <Typography sx={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                                  {pago.forma_pago?.nombre || '—'}
                                </Typography>
                              </Box>
                              <Typography sx={{ fontSize: '11px', color: '#6B7280', mt: 0.25 }}>
                                {formatFechaPago(fechaPago)}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                            {tieneComprobante ? (
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: '#1E40AF' }}>
                                  <i className={`fa-solid ${esPdf ? 'fa-file-pdf' : 'fa-file-image'}`} style={{ fontSize: '14px' }} />
                                </Box>
                                <button
                                  onClick={() => handleVerPagoComprobante(pago.comprobante_url!)}
                                  style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#2563EB', backgroundColor: 'white', border: '1px solid #2563EB', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <i className="fa-solid fa-eye" />Ver
                                </button>
                                <button
                                  onClick={() => handleDescargarPagoComprobante(pago)}
                                  style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#fff', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <i className="fa-solid fa-download" />Descargar
                                </button>
                              </>
                            ) : (
                              <Typography sx={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>Sin comprobante</Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {!pagosLoading && !pagosError && legacyComprobantes.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {legacyComprobantes.map((item) => {
                      const esPdf = item.url.toLowerCase().endsWith('.pdf');
                      return (
                        <Box
                          key={item.label}
                          sx={{ p: 1.5, border: '1px solid #E5E7EB', borderRadius: '8px', bgcolor: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <i className={`fa-solid ${esPdf ? 'fa-file-pdf' : 'fa-file-image'}`} style={{ color: '#1E40AF', fontSize: '14px' }} />
                            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{item.label}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <button
                              onClick={() => handleVerPagoComprobante(item.url)}
                              style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#2563EB', backgroundColor: 'white', border: '1px solid #2563EB', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <i className="fa-solid fa-eye" />Ver
                            </button>
                            <button
                              onClick={() => handleDescargarComprobante(item.url, `comprobante_${item.label.toLowerCase()}`)}
                              style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#fff', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <i className="fa-solid fa-download" />Descargar
                            </button>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {!pagosLoading && !pagosError && pagosOrdenados.length === 0 && legacyComprobantes.length === 0 && (
                  <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <i className="fa-solid fa-file-circle-xmark" style={{ color: '#9CA3AF', fontSize: '20px' }} />
                    <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>Sin comprobantes registrados</Typography>
                  </Box>
                )}
              </TabPanel>

              {/* Tab 1: Último Comprobante */}
              <TabPanel value={activeTab} index={1}>
                {!ultimoComprobanteUrl ? (
                  <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <i className="fa-solid fa-file-circle-xmark" style={{ color: '#9CA3AF', fontSize: '20px' }} />
                    <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>Sin comprobante registrado</Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 2, border: '1px solid #E5E7EB', borderRadius: '8px', bgcolor: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <i
                        className={`fa-solid ${ultimoComprobanteUrl.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-image'}`}
                        style={{ color: '#1E40AF', fontSize: '16px' }}
                      />
                      <Typography sx={{ fontSize: '12px', color: '#374151' }}>
                        {ultimoComprobanteUrl.toLowerCase().endsWith('.pdf') ? 'Documento PDF' : 'Imagen'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <button
                        onClick={() => handleVerPagoComprobante(ultimoComprobanteUrl)}
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#2563EB', backgroundColor: 'white', border: '1px solid #2563EB', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <i className="fa-solid fa-eye" />Ver
                      </button>
                      <button
                        onClick={() => handleDescargarComprobante(ultimoComprobanteUrl, 'comprobante_ultimo')}
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, color: '#fff', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <i className="fa-solid fa-download" />Descargar
                      </button>
                    </Box>
                  </Box>
                )}
              </TabPanel>
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
              L & R SOLUTIONS
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
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>EMAIL</Typography>
              <Typography sx={{ fontSize: '12px' }}>{venta.cliente?.email || '-'}</Typography>
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
              🚚 {transporteActual || 'Sin transporte especificado'}
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