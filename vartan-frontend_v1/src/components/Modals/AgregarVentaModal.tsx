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

    // Resetear el producto actual para permitir agregar más
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

      // DEBUG: Ver el estado del comprobante
      console.log('=== DEBUG COMPROBANTE ===');
      console.log('comprobante:', comprobante);
      console.log('tipo:', typeof comprobante);
      console.log('instanceof File:', comprobante instanceof File);
      console.log('is null:', comprobante === null);
      console.log('is undefined:', comprobante === undefined);
      console.log('========================');

      // ✅ Preparar datos asegurando que sean números
      const ventaData: IVentaCreateRequest = {
        cliente_id: Number(clienteId),        // ← Convertir a número
        forma_pago_id: Number(formaPagoId),   // ← Convertir a número
        sena: Number(sena) || 0,              // ← Convertir a número
        observaciones: observaciones || '',
        detalles
      };
      // El usuario_id se obtiene automáticamente del token JWT en el backend

      // ✅ SOLO agregar comprobante si es un File válido
      if (comprobante instanceof File) {
        console.log('✅ Agregando comprobante al ventaData');
        ventaData.comprobante = comprobante;
      } else {
        console.log('❌ NO se agrega comprobante (no es File válido)');
      }

      console.log('=== VENTA DATA ANTES DE ENVIAR ===');
      console.log(ventaData);
      console.log('Tipos:');
      console.log('  cliente_id:', typeof ventaData.cliente_id, '=', ventaData.cliente_id);
      console.log('  forma_pago_id:', typeof ventaData.forma_pago_id, '=', ventaData.forma_pago_id);
      console.log('  sena:', typeof ventaData.sena, '=', ventaData.sena);
      console.log('  comprobante:', ventaData.comprobante);
      console.log('==================================');

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

      // Validar tipo
      const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!extensionesPermitidas.includes(extension)) {
        addNotification('Solo se permiten archivos PDF, JPG, JPEG y PNG', 'error');
        setComprobante(null); // ← Resetear a null
        return;
      }

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification('El archivo no puede superar los 5MB', 'error');
        setComprobante(null); // ← Resetear a null
        return;
      }

      setComprobante(file);
    } else {
      setComprobante(null); // ← null cuando no hay archivo
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      const file = files[0];

      // Validar tipo
      const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!extensionesPermitidas.includes(extension)) {
        addNotification('Solo se permiten archivos PDF, JPG, JPEG y PNG', 'error');
        setComprobante(null); // ← Resetear a null
        e.target.value = ''; // ← Limpiar input
        return;
      }

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification('El archivo no puede superar los 5MB', 'error');
        setComprobante(null); // ← Resetear a null
        e.target.value = ''; // ← Limpiar input
        return;
      }

      setComprobante(file);
    } else {
      setComprobante(null); // ← null cuando no hay archivo
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
        {/* Cliente */}
        <Grid size={{ xs: 12 }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>Cliente *</Typography>
            <select value={clienteId || ''} onChange={(e) => setClienteId(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', backgroundColor: 'transparent', color: '#111827' }}>
              <option value="">Seleccione un cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
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
              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', mb: 0.5 }}>Agregar Producto</Typography>
              <select value="" onChange={(e) => handleProductoSelect(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', backgroundColor: 'white', color: '#111827' }}>
                <option value="">Seleccione un producto para agregar...</option>
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

            {/* Lista de productos agregados */}
            {productosSeleccionados.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, mb: 0.75, color: '#374151' }}>
                  <i className="fa-solid fa-check-circle" style={{ marginRight: '4px', color: '#10B981' }} />
                  Productos agregados ({productosSeleccionados.length})
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

        {/* Fila 2: Seña, Forma de Pago, Financiera */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormField label="Seña (opcional)" type="number" placeholder="0" value={sena} onChange={(value) => setSena(value)} />
        </Grid>

        <Grid size={{ xs: 12, sm: 5 }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>Forma de Pago *</Typography>
            <select value={formaPagoId} onChange={(e) => setFormaPagoId(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', backgroundColor: 'transparent', color: '#111827' }}>
              {formasPago.map(fp => <option key={fp.id} value={fp.id}>{fp.nombre}</option>)}
            </select>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', pb: 0.5 }}>
            <FormControlLabel control={<Checkbox checked={usaFinanciera} onChange={(e) => setUsaFinanciera(e.target.checked)} size="small" />} label={<Typography sx={{ fontSize: '11px' }}>-3%</Typography>} />
          </Box>
        </Grid>

        {/* Total */}
<Grid size={{ xs: 12 }}>
  <Box sx={{ p: 1, bgcolor: '#F0FDF4', borderRadius: '6px', textAlign: 'right' }}>
    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#059669' }}>
      Total: ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
    </Typography>
  </Box>
</Grid>

{/* 🔴 TEST - SI VES ESTO, EL CÓDIGO SE ESTÁ EJECUTANDO */}
<Grid size={{ xs: 12 }}>
  <Box sx={{ p: 2, bgcolor: '#FF0000', color: '#FFFFFF', textAlign: 'center' }}>
    <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
      🔴 PRUEBA - SI VES ESTO, EL ARCHIVO SE ACTUALIZÓ
    </Typography>
  </Box>
</Grid>

        <Grid size={{ xs: 12 }}>
  <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>
    Comprobante
  </Typography>
  {!comprobante ? (
    <Box 
      onDragOver={handleDragOver} 
      onDragLeave={handleDragLeave} 
      onDrop={handleDrop} 
      onClick={() => document.getElementById('file-input')?.click()} 
      sx={{ 
        border: `2px dashed ${isDragging ? '#3B82F6' : '#E5E7EB'}`, 
        borderRadius: '6px', 
        p: 1.5, 
        textAlign: 'center', 
        cursor: 'pointer', 
        bgcolor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent', 
        transition: 'all 0.2s ease', 
        '&:hover': { borderColor: '#3B82F6' } 
      }}
    >
      <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '20px', color: '#6B7280' }} />
      <Typography sx={{ fontSize: '11px', color: '#374151', mt: 0.5 }}>
        {isDragging ? 'Suelta aquí' : 'Arrastra o clic'}
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
      p: 1, 
      border: '1px solid #E5E7EB', 
      borderRadius: '6px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      bgcolor: '#F9FAFB' 
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <i className={`fa-solid ${comprobante.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'}`} 
           style={{ fontSize: '14px', color: '#3B82F6' }} />
        <Typography sx={{ fontSize: '11px', fontWeight: 500 }}>
          {comprobante.name.substring(0, 20)}...
        </Typography>
      </Box>
      <button 
        onClick={() => setComprobante(null)} 
        style={{ 
          color: '#EF4444', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          fontSize: '13px' 
        }}
      >
        <i className="fa-solid fa-trash" />
      </button>
    </Box>
  )}
</Grid>

        {/* Fila 3: Comprobante y Observaciones */}
        

        <Grid size={{ xs: 12 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', mb: 0.75 }}>Observaciones</Typography>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones..." rows={3} style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', backgroundColor: 'transparent', color: '#111827', fontFamily: 'inherit', resize: 'none' }} />
        </Grid>
      </Grid>
    </BaseModal>
  );
}
