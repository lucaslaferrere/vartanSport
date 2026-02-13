'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Box, Typography, Checkbox, FormControlLabel } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IVenta } from '@models/entities/ventaEntity';
import { IProducto } from '@models/entities/productoEntity';
import { productoService } from '@services/producto.service';
import { useNotification } from '@components/Notifications';
import { TalleEnum } from '@models/enums/TalleEnum';

interface ProductoConTalles {
  producto: IProducto;
  talles: { talle: string; cantidad: number }[];
}

interface EditarVentaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venta: IVenta | null;
}

export default function EditarVentaModal({ open, onClose, onSuccess, venta }: EditarVentaModalProps) {
  const { addNotification } = useNotification();
  const [productos, setProductos] = useState<IProducto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoConTalles[]>([]);
  const [productoActual, setProductoActual] = useState<IProducto | null>(null);
  const [tallesActuales, setTallesActuales] = useState<Record<string, number>>({});
  const [precioVenta, setPrecioVenta] = useState<string>(''); // NUEVO
  const [sena, setSena] = useState<string>('');
  const [usaDescuentoFinanciera, setUsaDescuentoFinanciera] = useState(false); // NUEVO
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tallesDisponibles = Object.values(TalleEnum);

  const loadProductos = useCallback(async () => {
    try {
      const productosData = await productoService.getAll();
      setProductos(productosData.filter(p => p.activo));
    } catch (err) {
      console.error('Error cargando productos:', err);
      addNotification('Error al cargar productos', 'error');
    }
  }, [addNotification]);

  useEffect(() => {
    if (open && venta) {
      loadProductos();
      setPrecioVenta(venta.precio_venta?.toString() || venta.total.toString()); // NUEVO
      setSena(venta.sena.toString());
      setUsaDescuentoFinanciera(venta.usa_financiera || false); // NUEVO
      setObservaciones(venta.observaciones || '');

      // Convertir los detalles de la venta a productos seleccionados
      if (venta.detalles) {
        const productosAgrupados: Record<number, { producto: IProducto; talles: { talle: string; cantidad: number }[] }> = {};

        venta.detalles.forEach(detalle => {
          if (detalle.producto) {
            if (!productosAgrupados[detalle.producto_id]) {
              productosAgrupados[detalle.producto_id] = {
                producto: detalle.producto,
                talles: []
              };
            }
            productosAgrupados[detalle.producto_id].talles.push({
              talle: detalle.talle,
              cantidad: detalle.cantidad
            });
          }
        });

        setProductosSeleccionados(Object.values(productosAgrupados));
      }
    }
  }, [open, venta, loadProductos, addNotification]);

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

  const calcularCosto = () => {
    let costo = 0;
    productosSeleccionados.forEach(item => {
      item.talles.forEach(t => {
        costo += item.producto.costo_unitario * t.cantidad;
      });
    });
    return costo;
  };

  const calcularGanancia = () => {
    const costo = calcularCosto();
    const precio = parseFloat(precioVenta) || 0;
    return precio - costo;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!venta) return;

    if (productosSeleccionados.length === 0) {
      setError('Debe tener al menos un producto');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar ventaService.update() cuando esté disponible en el backend
      addNotification('Actualización en desarrollo. Backend necesita implementar endpoint de actualización', 'info');
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      console.error('Error actualizando venta:', err);
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage = error.response?.data?.error || 'Error al actualizar la venta';
      addNotification(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setProductosSeleccionados([]);
    setProductoActual(null);
    setTallesActuales({});
    setPrecioVenta('');
    setSena('');
    setUsaDescuentoFinanciera(false);
    setObservaciones('');
    setError(null);
    onClose();
  };

  if (!venta) return null;

  return (
    <BaseModal
      title={`Editar Venta #${venta.id}`}
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Actualizar"
      isLoading={loading}
      error={error}
    >
      <Grid container spacing={2}>
        {/* Cliente - Read only */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
            <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.5 }}>Cliente</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{venta.cliente?.nombre}</Typography>
          </Box>
        </Grid>

        {/* Sección de Productos */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1, color: '#374151' }}>
              <i className="fa-solid fa-box" style={{ marginRight: '6px' }} />
              Productos de la venta
            </Typography>

            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', mb: 0.5 }}>Agregar/Modificar Producto</Typography>
              <select value="" onChange={(e) => handleProductoSelect(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', backgroundColor: 'white', color: '#111827' }}>
                <option value="">Seleccione un producto...</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} - ${p.costo_unitario.toLocaleString('es-AR')}</option>)}
              </select>
            </Box>

            {/* Selección de Talles */}
            {productoActual && (
              <Box sx={{ p: 1.5, border: '1px solid #3B82F6', borderRadius: '6px', bgcolor: 'white', mb: 1.5 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, mb: 0.75, color: '#3B82F6' }}>{productoActual.nombre}</Typography>
                <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.75 }}>Cantidad por talle:</Typography>
                <Grid container spacing={0.75}>
                  {tallesDisponibles.map(talle => (
                    <Grid size={{ xs: 2.4 }} key={talle}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 500, mb: 0.25 }}>{talle}</Typography>
                        <input type="number" min="0" placeholder="0" value={tallesActuales[talle] || ''} onChange={(e) => handleTalleCantidadChange(talle, parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '3px', fontSize: '11px', textAlign: 'center', border: '1px solid #E5E7EB', borderRadius: '4px', outline: 'none' }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 1, display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                  <button onClick={agregarProducto} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 500, backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Agregar</button>
                  <button onClick={() => setProductoActual(null)} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 500, color: '#EF4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                </Box>
              </Box>
            )}

            {/* Lista de productos */}
            {productosSeleccionados.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, mb: 0.75, color: '#374151' }}>
                  <i className="fa-solid fa-check-circle" style={{ marginRight: '4px', color: '#10B981' }} />
                  Productos ({productosSeleccionados.length})
                </Typography>
                {productosSeleccionados.map((item, idx) => (
                  <Box key={idx} sx={{ p: 1, mb: 0.5, border: '1px solid #E5E7EB', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white' }}>
                    <Box>
                      <Typography sx={{ fontSize: '12px', fontWeight: 500 }}>{item.producto.nombre}</Typography>
                      <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>{item.talles.map(t => `${t.talle}:${t.cantidad}`).join(', ')}</Typography>
                    </Box>
                    <button onClick={() => eliminarProducto(idx)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}><i className="fa-solid fa-trash" /></button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Seña */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormField label="Seña" type="number" placeholder="0" value={sena} onChange={(value) => setSena(value)} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ height: '100%' }} />
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
                  }
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
            {venta?.forma_pago_id === 1 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={usaDescuentoFinanciera}
                    onChange={(e) => setUsaDescuentoFinanciera(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                    Aplicar descuento financiera (3%)
                  </Typography>
                }
              />
            )}
          </Box>
        </Grid>

        {/* Observaciones */}
        <Grid size={{ xs: 12 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>Observaciones</Typography>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones..." rows={2} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', backgroundColor: 'transparent', color: '#111827', fontFamily: 'inherit', resize: 'none' }} />
        </Grid>

      </Grid>
    </BaseModal>
  );
}

