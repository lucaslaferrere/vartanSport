'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Box, Typography, Checkbox, FormControlLabel, Divider, IconButton, Autocomplete, TextField } from '@mui/material';
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
  const [transporte, setTransporte] = useState<string>('');
  const [productos, setProductos] = useState<IProducto[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [formaPagoId, setFormaPagoId] = useState<number>(1);
  const [precioVenta, setPrecioVenta] = useState<string>(''); // NUEVO
  const [sena, setSena] = useState<string>('');
  const [usaDescuentoFinanciera, setUsaDescuentoFinanciera] = useState(true); // NUEVO
  const [observaciones, setObservaciones] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoConTalles[]>([]);
  const [productoActual, setProductoActual] = useState<IProducto | null>(null);
  const [tallesActuales, setTallesActuales] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteInput, setClienteInput] = useState('');
  const [clienteInputDebounced, setClienteInputDebounced] = useState('');
  const [productoInput, setProductoInput] = useState('');
  const [productoInputDebounced, setProductoInputDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setClienteInputDebounced(clienteInput), 300);
    return () => clearTimeout(t);
  }, [clienteInput]);

  useEffect(() => {
    const t = setTimeout(() => setProductoInputDebounced(productoInput), 300);
    return () => clearTimeout(t);
  }, [productoInput]);

  const formasPago = [
    { id: 1, nombre: 'Financiera' },
    { id: 2, nombre: 'Transferencia a Cuenta 0' },
    { id: 3, nombre: 'Efectivo' },
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
  }, [open, loadData]);

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

  // Calcular costo de los productos
  const calcularCosto = () => {
    let costo = 0;
    productosSeleccionados.forEach(item => {
      item.talles.forEach(t => {
        costo += item.producto.costo_unitario * t.cantidad;
      });
    });
    return costo;
  };

  // Calcular ganancia
  const calcularGanancia = () => {
  const costo = calcularCosto();
  const precio = parseFloat(precioVenta) || 0;
  // Si es financiera (id=1), descontar el 3% de la ganancia
  const descuentoFinanciera = (formaPagoId === 1) ? precio * 0.03 : 0;
  return precio - costo - descuentoFinanciera;
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

    if (!precioVenta || parseFloat(precioVenta) <= 0) {
      setError('Debe ingresar un precio de venta válido');
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
        transporte: transporte || undefined,  //AGREGO TRANSPORTE
        precio_venta: parseFloat(precioVenta), // NUEVO
        sena: senaNumero,
        usa_descuento_financiera: usaDescuentoFinanciera, // NUEVO
        observaciones: observaciones || '',
        detalles
      };

      if (comprobante instanceof File) {
        ventaData.comprobante = comprobante;
      }

      console.log('📤 Enviando venta:', ventaData);

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
    setClienteInput('');
    setClienteInputDebounced('');
    setFormaPagoId(1);
    setPrecioVenta('');
    setTransporte('');
    setSena('');
    setUsaDescuentoFinanciera(false);
    setObservaciones('');
    setComprobante(null);
    setProductosSeleccionados([]);
    setProductoActual(null);
    setProductoInput('');
    setProductoInputDebounced('');
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
              <Autocomplete
                options={clientes}
                getOptionLabel={(c) => c.nombre}
                filterOptions={(options) => {
                  const search = clienteInputDebounced.toLowerCase();
                  if (!search) return options;
                  return options.filter(c =>
                    c.nombre.toLowerCase().includes(search) ||
                    (c.dni && c.dni.toLowerCase().includes(search)) ||
                    (c.email && c.email.toLowerCase().includes(search))
                  );
                }}
                value={clientes.find(c => c.id === clienteId) ?? null}
                onChange={(_, val) => setClienteId(val?.id ?? null)}
                inputValue={clienteInput}
                onInputChange={(_, val) => setClienteInput(val)}
                noOptionsText="Sin resultados"
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Seleccione un cliente..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '13px',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        '& fieldset': { borderColor: '#D1D5DB' },
                        '&:hover fieldset': { borderColor: '#9CA3AF' },
                        '&.Mui-focused fieldset': { borderColor: '#588a9e' },
                      }
                    }}
                  />
                )}
              />
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
                  <Autocomplete
                    options={productos}
                    getOptionLabel={(p) => `${p.nombre} - $${p.costo_unitario.toLocaleString('es-AR')}`}
                    filterOptions={(options) => {
                      const search = productoInputDebounced.toLowerCase();
                      if (!search) return options;
                      return options.filter(p =>
                        p.nombre.toLowerCase().includes(search) ||
                        (p.equipo?.nombre && p.equipo.nombre.toLowerCase().includes(search))
                      );
                    }}
                    value={productoActual}
                    onChange={(_, val) => {
                      if (val) handleProductoSelect(val.id);
                      else { setProductoActual(null); setTallesActuales({}); }
                    }}
                    inputValue={productoInput}
                    onInputChange={(_, val) => setProductoInput(val)}
                    noOptionsText="Sin resultados"
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="+ Buscar Producto"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '12px',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            '& fieldset': { borderColor: '#D1D5DB' },
                            '&:hover fieldset': { borderColor: '#9CA3AF' },
                            '&.Mui-focused fieldset': { borderColor: '#588a9e' },
                          }
                        }}
                      />
                    )}
                  />
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
                      {tallesDisponibles.map((talle, idx) => (
                          <Grid size={{ xs: 2.4 }} key={talle}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography sx={{ fontSize: '10px', mb: 0.25, color: '#6B7280' }}>{talle}</Typography>
                              <input
                                  type="number"
                                  min="0"
                                  placeholder="-"
                                  data-talle-idx={idx}
                                  value={tallesActuales[talle] || ''}
                                  onChange={(e) => handleTalleCantidadChange(talle, parseInt(e.target.value) || 0)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const next = document.querySelector<HTMLInputElement>(`[data-talle-idx="${idx + 1}"]`);
                                      if (next) next.focus();
                                    }
                                  }}
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

          {/* Forma de Pago */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>Forma de Pago</Typography>
            <select
                value={formaPagoId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setFormaPagoId(id);
                  setUsaDescuentoFinanciera(id === 1); // automático
                  }}
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

          {/* Transporte */}
<Grid size={{ xs: 12, sm: 6 }}>
  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>Transporte</Typography>
  <select
      value={transporte}
      onChange={(e) => setTransporte(e.target.value)}
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
    <option value="">Sin especificar</option>
    <option value="Correo Argentino">Correo Argentino</option>
    <option value="Viacargo">Viacargo</option>
    <option value="Moto">Moto</option>
    <option value="Retira">Retira</option>
  </select>
</Grid>
          {/* Seña */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 0.5 }}>Seña</Typography>
            <input
                type="text"
                inputMode="numeric"
                placeholder="$0"
                value={sena}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setSena(value);
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

          {/* Observaciones */}
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

          {/* Comprobante */}
          <Grid size={{ xs: 12, md: 12 }}>
            {!comprobante ? (
                <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                    sx={{
                      border: `1px dashed ${isDragging ? '#3B82F6' : '#D1D5DB'}`,
                      borderRadius: '6px',
                      height: '46px',
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

          {/* Resumen Financiero */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', mb: 2 }}>
                Resumen de Venta
              </Typography>

              {/* Costo (Calculado) */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
                  Costo (Productos):
                </Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#DC2626' }}>
                  ${calcularCosto().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              {/* Precio de Venta (Input) */}
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, mb: 0.5 }}>
                  Precio de Venta *
                </Typography>
                <Box
                  component="input"
                  type="number"
                  value={precioVenta}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrecioVenta(e.target.value)}
                  placeholder="Ingrese el precio final"
                  required
                  sx={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    outline: 'none',
                    backgroundColor: 'white',
                    '&:focus': {
                      borderColor: '#588a9e'
                    },
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    MozAppearance: 'textfield',
                  }}
                />
              </Box>

              {/* Ganancia (Calculada) */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                bgcolor: calcularGanancia() >= 0 ? '#ECFDF5' : '#FEF2F2',
                borderRadius: '6px',
                border: calcularGanancia() >= 0 ? '1px solid #A7F3D0' : '1px solid #FECACA',
                mb: 1.5
              }}>
                <Typography sx={{ fontSize: '13px', color: calcularGanancia() >= 0 ? '#047857' : '#DC2626', fontWeight: 600 }}>
                  Ganancia:
                </Typography>
                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: calcularGanancia() >= 0 ? '#059669' : '#DC2626' }}>
                  ${calcularGanancia().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              {/* Checkbox Descuento Financiera - Solo si es Transferencia Financiera */}
              {formaPagoId === 1 && (
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
         <i className="fa-solid fa-circle-info" style={{ color: '#D97706', fontSize: '12px' }} />
    <Typography sx={{ fontSize: '12px', color: '#D97706', fontWeight: 500 }}>
      Comisión financiera (3%) aplicada automáticamente
    </Typography>
           </Box>
          )}
            </Box>
          </Grid>

        </Grid>
      </BaseModal>
  );
}

