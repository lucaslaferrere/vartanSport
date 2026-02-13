'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Box, Typography, Checkbox, FormControlLabel, Divider, IconButton } from '@mui/material'; // Agregué Divider e IconButton
import BaseModal from './BaseModal';
import { IVentaCreateRequest, IVentaDetalleCreateRequest } from '@models/request/IVentaRequest';
import { ventaService } from '@services/venta.service';
import { clienteService } from '@services/cliente.service';
import { productoService } from '@services/producto.service';
import { useNotification } from '@components/Notifications';
import { ICliente } from '@models/entities/clienteEntity';
import { IProducto } from '@models/entities/productoEntity';
import { TalleEnum } from '@models/enums/TalleEnum';

interface ProductoConTalles {
  producto: IProducto;
  talles: { talle: string; cantidad: number }[];
}

interface AgregarVentaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarVentaModal({ open, onClose, onSuccess }: AgregarVentaModalProps) {
  const { addNotification } = useNotification();
  const [clientes, setClientes] = useState<ICliente[]>([]);
  const [productos, setProductos] = useState<IProducto[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [formaPagoId, setFormaPagoId] = useState<number>(1);
  const [sena, setSena] = useState<string>('0'); // Inicializar con '0' en lugar de ''
  const [usaFinanciera, setUsaFinanciera] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoConTalles[]>([]);
  const [productoActual, setProductoActual] = useState<IProducto | null>(null);
  const [tallesActuales, setTallesActuales] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formasPago = [
    { id: 1, nombre: 'Transferencia Financiera' },
    { id: 2, nombre: 'Efectivo' },
    { id: 3, nombre: 'Transferencia a Cero' },
    { id: 4, nombre: 'Transferencia Bancaria' },
  ];

  const tallesDisponibles = Object.values(TalleEnum);

  const loadData = useCallback(async () => {
    try {
      const [clientesData, productosData] = await Promise.all([
        clienteService.getAll(),
        productoService.getAll()
      ]);

      setClientes(clientesData || []);
      setProductos(productosData?.filter(p => p.activo) || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
      addNotification('Error al cargar datos', 'error');
      setClientes([]);
      setProductos([]);
    }
  }, [addNotification]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const handleProductoSelect = (productoId: number) => {
    if (!productoId) return;
    const producto = productos.find(p => p.id === productoId);
    if (producto) {
      setProductoActual(producto);
      setTallesActuales({});
    }
  };

  const handleTalleCantidadChange = (talle: string, cantidad: number) => {
    setTallesActuales(prev => {
      if (cantidad <= 0) {
        const newState = { ...prev };
        delete newState[talle];
        return newState;
      }
      return { ...prev, [talle]: cantidad };
    });
  };

  const agregarProducto = () => {
    if (!productoActual || Object.keys(tallesActuales).length === 0) {
      addNotification('Seleccione al menos un talle con cantidad', 'error');
      return;
    }

    const talles = Object.entries(tallesActuales).map(([talle, cantidad]) => ({
      talle,
      cantidad
    }));

    setProductosSeleccionados(prev => [...prev, {
      producto: productoActual,
      talles
    }]);

    setProductoActual(null);
    setTallesActuales({});
    addNotification(`${productoActual.nombre} agregado correctamente`, 'success');
  };

  const eliminarProducto = (index: number) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    let total = 0;
    productosSeleccionados.forEach(item => {
      item.talles.forEach(t => {
        total += item.producto.costo_unitario * t.cantidad;
      });
    });
    if (usaFinanciera) {
      total = total * 0.97;
    }
    return total;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!clienteId) {
      setError('Debe seleccionar un cliente');
      return;
    }

    if (productosSeleccionados.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    setLoading(true);

    try {
      const detalles: IVentaDetalleCreateRequest[] = [];
      productosSeleccionados.forEach(item => {
        item.talles.forEach(t => {
          detalles.push({
            producto_id: item.producto.id,
            talle: t.talle,
            cantidad: t.cantidad,
            precio_unitario: item.producto.costo_unitario
          });
        });
      });


      let senaNumero = 0;
      if (sena !== '' && sena !== null && sena !== undefined) {
        const parsed = parseFloat(sena);
        senaNumero = isNaN(parsed) ? 0 : parsed;
      }

      const ventaData: IVentaCreateRequest = {
        cliente_id: Number(clienteId),
        forma_pago_id: Number(formaPagoId),
        sena: senaNumero, // Garantizado que es un número
        observaciones: observaciones || '',
        detalles
      };

      if (comprobante instanceof File) {
        ventaData.comprobante = comprobante;
      }

      await ventaService.create(ventaData);
      addNotification('Venta creada exitosamente', 'success');
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      console.error('Error creando venta:', err);
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage = error.response?.data?.error || 'Error al crear la venta';
      addNotification(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClienteId(null);
    setFormaPagoId(1);
    setSena('0');
    setUsaFinanciera(false);
    setObservaciones('');
    setComprobante(null);
    setProductosSeleccionados([]);
    setProductoActual(null);
    setTallesActuales({});
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
        setComprobante(null);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        addNotification('El archivo no puede superar los 5MB', 'error');
        setComprobante(null);
        return;
      }
      setComprobante(file);
    } else {
      setComprobante(null);
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
        setComprobante(null);
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        addNotification('El archivo no puede superar los 5MB', 'error');
        setComprobante(null);
        e.target.value = '';
        return;
      }
      setComprobante(file);
    } else {
      setComprobante(null);
    }
  };

  return (
      <BaseModal
          title="Nueva Venta"
          open={open}
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitText="Confirmar Venta"
          isLoading={loading}
          error={error}
      >
        <Grid container spacing={2}>

          {/* SECCIÓN 1: CLIENTE (Ancho Completo) */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 600, color: '#374151', mb: 0.5 }}>
                Cliente
              </Typography>
              <select
                  value={clienteId || ''}
                  onChange={(e) => setClienteId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: 'white',
                    color: '#111827',
                    cursor: 'pointer'
                  }}
              >
                <option value="">Seleccione un cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Box>
          </Grid>

          {/* SECCIÓN 2: PRODUCTOS (Ancho Completo - Estilo Tarjeta) */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{
              p: { xs: 1.5, sm: 2 },
              bgcolor: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: 'sm'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                <i className="fa-solid fa-cart-plus" style={{ color: '#6B7280', fontSize: '14px' }} />
                <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 600, color: '#374151' }}>
                  Armado del Pedido
                </Typography>
              </Box>

              {/* Selector de Producto */}
              <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <select
                      value=""
                      onChange={(e) => handleProductoSelect(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        outline: 'none',
                        backgroundColor: 'white',
                        color: '#111827'
                      }}
                  >
                    <option value="">+ Buscar Producto</option>
                    {productos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - ${p.costo_unitario.toLocaleString('es-AR')}
                        </option>
                    ))}
                  </select>
                </Box>
              </Box>

              {/* Zona de Talles (Aparece solo al seleccionar) */}
              {productoActual && (
                  <Box sx={{
                    p: 1.5,
                    bgcolor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #3B82F6',
                    mb: 2,
                    animation: 'fadeIn 0.3s ease-in'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>
                        {productoActual.nombre}
                      </Typography>
                      <Box>
                        <button
                            onClick={() => { setProductoActual(null); setTallesActuales({}); }}
                            style={{ border: 'none', background: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '11px', marginRight: '10px' }}
                        >
                          Cancelar
                        </button>
                        <button
                            onClick={agregarProducto}
                            style={{
                              border: 'none',
                              background: '#3B82F6',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontWeight: 500
                            }}
                        >
                          Confirmar
                        </button>
                      </Box>
                    </Box>
                    <Grid container spacing={1}>
                      {tallesDisponibles.map(talle => (
                          <Grid size={{ xs: 2.4 }} key={talle}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography sx={{ fontSize: '10px', mb: 0.25, color: '#6B7280' }}>{talle}</Typography>
                              <input
                                  type="number"
                                  min="0"
                                  placeholder="-"
                                  value={tallesActuales[talle] || ''}
                                  onChange={(e) => handleTalleCantidadChange(talle, parseInt(e.target.value) || 0)}
                                  style={{
                                    width: '100%',
                                    padding: '4px',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '4px',
                                    outline: 'none'
                                  }}
                              />
                            </Box>
                          </Grid>
                      ))}
                    </Grid>
                  </Box>
              )}

              {/* Lista de Items Agregados */}
              {productosSeleccionados.length > 0 ? (
                  <Box sx={{ maxHeight: '150px', overflowY: 'auto', borderTop: '1px solid #E5E7EB', pt: 1 }}>
                    {productosSeleccionados.map((item, idx) => (
                        <Box key={idx} sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 0.75,
                          mb: 0.5,
                          bgcolor: 'white',
                          borderRadius: '4px',
                          border: '1px solid #F3F4F6'
                        }}>
                          <Box>
                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{item.producto.nombre}</Typography>
                            <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                              {item.talles.map(t => `${t.talle}:${t.cantidad}`).join(', ')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>
                              ${(item.talles.reduce((sum, t) => sum + (t.cantidad * item.producto.costo_unitario), 0)).toLocaleString('es-AR')}
                            </Typography>
                            <IconButton size="small" onClick={() => eliminarProducto(idx)} sx={{ color: '#EF4444', p: 0.5 }}>
                              <i className="fa-solid fa-times" style={{ fontSize: '12px' }}/>
                            </IconButton>
                          </Box>
                        </Box>
                    ))}
                  </Box>
              ) : (
                  <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', py: 1, fontStyle: 'italic' }}>
                    No hay productos agregados
                  </Typography>
              )}
            </Box>
          </Grid>

          {/* DIVIDER VISUAL */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1, borderColor: '#E5E7EB' }}><Typography variant="caption" sx={{ color: '#9CA3AF' }}>DETALLES DE PAGO</Typography></Divider>
          </Grid>

          {/* SECCIÓN 3: PAGO Y OBSERVACIONES (Grid Mixto) */}

          {/* Forma de Pago */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>Forma de Pago</Typography>
            <select
                value={formaPagoId}
                onChange={(e) => setFormaPagoId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
            >
              {formasPago.map(fp => <option key={fp.id} value={fp.id}>{fp.nombre}</option>)}
            </select>
          </Grid>

          {/* Seña */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>Seña</Typography>
            <input
                type="number"
                placeholder="$0"
                value={sena}
                onChange={(e) => {
                  const value = e.target.value;
                  // Si el usuario borra todo, poner '0'
                  // Si ingresa un número, mantenerlo
                  setSena(value === '' ? '0' : value);
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none'
                }}
            />
          </Grid>

          {/* Checkbox Financiera */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
              <FormControlLabel
                  control={
                    <Checkbox
                        size="small"
                        checked={usaFinanciera}
                        onChange={(e) => setUsaFinanciera(e.target.checked)}
                        sx={{ color: '#9CA3AF', '&.Mui-checked': { color: '#3B82F6' } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: '12px', color: '#374151' }}>Financiera </Typography>}
              />
            </Box>
          </Grid>

          {/* Observaciones (Ancho completo para escribir cómodo) */}
          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>Observaciones</Typography>
            <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
            />
          </Grid>

          {/* SECCIÓN 4: COMPROBANTE Y TOTAL (Diseño Compacto) */}

          {/* Comprobante - Estilo Barra Horizontal */}
          <Grid size={{ xs: 12, md: 7 }}>
            {!comprobante ? (
                <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                    sx={{
                      border: `1px dashed ${isDragging ? '#3B82F6' : '#D1D5DB'}`,
                      borderRadius: '6px',
                      height: '46px', // Altura fija reducida
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      bgcolor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'white',
                      gap: 1.5,
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: '#3B82F6', bgcolor: '#F9FAFB' }
                    }}
                >
                  <i className="fa-solid fa-paperclip" style={{ color: '#9CA3AF', fontSize: '14px' }} />
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                    {isDragging ? 'Suelta aquí' : 'Adjuntar Comprobante (Opcional)'}
                  </Typography>
                  <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} style={{ display: 'none' }} />
                </Box>
            ) : (
                <Box sx={{
                  height: '46px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  bgcolor: '#F0F9FF'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                    <i className={`fa-solid ${comprobante.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'}`} style={{ color: '#3B82F6', fontSize: '14px' }} />
                    <Typography noWrap sx={{ fontSize: '12px', color: '#1E40AF', maxWidth: '180px' }}>
                      {comprobante.name}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setComprobante(null)} sx={{ color: '#EF4444' }}>
                    <i className="fa-solid fa-times" style={{ fontSize: '12px' }} />
                  </IconButton>
                </Box>
            )}
          </Grid>

          {/* Total - Estilo Compacto Derecha */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{
              height: '46px',
              bgcolor: '#ECFDF5',
              borderRadius: '6px',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: 2,
              gap: 1
            }}>
              <Typography sx={{ fontSize: '13px', color: '#047857', fontWeight: 500 }}>TOTAL:</Typography>
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
                ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Grid>

        </Grid>
      </BaseModal>
  );
}