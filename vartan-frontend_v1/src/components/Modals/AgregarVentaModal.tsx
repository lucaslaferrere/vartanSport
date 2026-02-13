'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Box, Typography, Checkbox, FormControlLabel } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
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
  const [sena, setSena] = useState<string>('');
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

      const senaNumero = sena === '' || sena === null || sena === undefined ? 0 : Number(sena);

      const ventaData: IVentaCreateRequest = {
        cliente_id: Number(clienteId),
        forma_pago_id: Number(formaPagoId),
        sena: isNaN(senaNumero) ? 0 : senaNumero,
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
    setSena('');
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
          title="Agregar Venta"
          open={open}
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitText="Agregar"
          isLoading={loading}
          error={error}
      >
        <Grid container spacing={2}>
          {/* COLUMNA IZQUIERDA - Cliente */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
                Cliente *
              </Typography>
              <select
                  value={clienteId || ''}
                  onChange={(e) => setClienteId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: 'white',
                    color: '#111827',
                    cursor: 'pointer'
                  }}
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Box>
          </Grid>

          {/* COLUMNA DERECHA - Productos de la venta */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{
              p: 2,
              bgcolor: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              height: '100%'
            }}>
              <Typography sx={{
                fontSize: '14px',
                fontWeight: 600,
                mb: 1.5,
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <i className="fa-solid fa-box" />
                Productos de la venta
              </Typography>

              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', mb: 0.5 }}>
                  Agregar Producto
                </Typography>
                <select
                    value=""
                    onChange={(e) => handleProductoSelect(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      outline: 'none',
                      backgroundColor: 'white',
                      color: '#111827',
                      cursor: 'pointer'
                    }}
                >
                  <option value="">Seleccione un producto...</option>
                  {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} - ${p.costo_unitario.toLocaleString('es-AR')}
                      </option>
                  ))}
                </select>
              </Box>

              {/* Selección de Talles */}
              {productoActual && (
                  <Box sx={{
                    p: 1.5,
                    border: '1px solid #3B82F6',
                    borderRadius: '6px',
                    bgcolor: 'white',
                    mb: 1.5
                  }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, mb: 0.75, color: '#3B82F6' }}>
                      {productoActual.nombre}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.75 }}>
                      Cantidad por talle:
                    </Typography>
                    <Grid container spacing={0.75}>
                      {tallesDisponibles.map(talle => (
                          <Grid size={{ xs: 2.4 }} key={talle}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography sx={{ fontSize: '10px', fontWeight: 500, mb: 0.25 }}>
                                {talle}
                              </Typography>
                              <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={tallesActuales[talle] || ''}
                                  onChange={(e) => handleTalleCantidadChange(talle, parseInt(e.target.value) || 0)}
                                  style={{
                                    width: '100%',
                                    padding: '3px',
                                    fontSize: '11px',
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
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                      <button
                          onClick={agregarProducto}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'background-color 0.2s'
                          }}
                      >
                        Agregar
                      </button>
                      <button
                          onClick={() => { setProductoActual(null); setTallesActuales({}); }}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            backgroundColor: '#6B7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                      >
                        Cancelar
                      </button>
                    </Box>
                  </Box>
              )}

              {/* Lista de Productos Agregados */}
              {productosSeleccionados.length > 0 && (
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {productosSeleccionados.map((item, idx) => (
                        <Box
                            key={idx}
                            sx={{
                              p: 1,
                              mb: 0.5,
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px',
                              bgcolor: 'white',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                        >
                          <Box>
                            <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>
                              {item.producto.nombre}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                              {item.talles.map(t => `${t.talle}: ${t.cantidad}`).join(', ')} - ${(item.talles.reduce((sum, t) => sum + (t.cantidad * item.producto.costo_unitario), 0)).toLocaleString('es-AR')}
                            </Typography>
                          </Box>
                          <button
                              onClick={() => eliminarProducto(idx)}
                              style={{
                                color: '#EF4444',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '4px 8px'
                              }}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </Box>
                    ))}
                  </Box>
              )}
            </Box>
          </Grid>

          {/* SEGUNDA FILA - Forma de Pago, Seña, Checkbox y Observaciones */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Forma de Pago */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
                Forma de Pago *
              </Typography>
              <select
                  value={formaPagoId}
                  onChange={(e) => setFormaPagoId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: 'white',
                    color: '#111827',
                    cursor: 'pointer'
                  }}
              >
                {formasPago.map(fp => <option key={fp.id} value={fp.id}>{fp.nombre}</option>)}
              </select>
            </Box>

            {/* Seña y Checkbox Financiera */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <FormField
                    label="Seña (opcional)"
                    type="number"
                    placeholder="0"
                    value={sena}
                    onChange={(value) => setSena(value)}
                />
              </Box>
              <Box sx={{ pt: 3.5 }}>
                <FormControlLabel
                    control={
                      <Checkbox
                          checked={usaFinanciera}
                          onChange={(e) => setUsaFinanciera(e.target.checked)}
                          sx={{
                            color: '#9CA3AF',
                            '&.Mui-checked': {
                              color: '#3B82F6',
                            },
                          }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        Financiera (-3%)
                      </Typography>
                    }
                />
              </Box>
            </Box>
          </Grid>

          {/* Observaciones */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
                Observaciones
              </Typography>
              <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
              />
            </Box>
          </Grid>

          {/* TERCERA FILA - Comprobante (ancho completo) */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
                Comprobante (opcional)
              </Typography>
              {!comprobante ? (
                  <Box
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('file-input')?.click()}
                      sx={{
                        border: `2px dashed ${isDragging ? '#3B82F6' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: isDragging ? 'rgba(59, 130, 246, 0.05)' : '#F9FAFB',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#3B82F6',
                          bgcolor: 'rgba(59, 130, 246, 0.02)'
                        }
                      }}
                  >
                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '32px', color: '#9CA3AF', marginBottom: '8px' }} />
                    <Typography sx={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                      {isDragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo o haz clic para seleccionar'}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280', mt: 0.5 }}>
                      PDF, JPG, JPEG o PNG (máx. 5MB)
                    </Typography>
                    <input
                        id="file-input"
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
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: '#F9FAFB'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <i
                          className={`fa-solid ${comprobante.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'}`}
                          style={{ fontSize: '20px', color: '#3B82F6' }}
                      />
                      <Box>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                          {comprobante.name.length > 40 ? comprobante.name.substring(0, 40) + '...' : comprobante.name}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                          {(comprobante.size / 1024).toFixed(2)} KB
                        </Typography>
                      </Box>
                    </Box>
                    <button
                        onClick={() => setComprobante(null)}
                        style={{
                          color: '#EF4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '8px'
                        }}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </Box>
              )}
            </Box>
          </Grid>

          {/* CUARTA FILA - Total (ancho completo) */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{
              p: 2.5,
              bgcolor: '#F0FDF4',
              borderRadius: '8px',
              border: '2px solid #059669'
            }}>
              <Typography sx={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#059669',
                textAlign: 'right',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 1
              }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Total:</span>
                ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </BaseModal>
  );
}