'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, TextField, Chip,
} from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IProducto } from '@models/entities/productoEntity';
import { productoService } from '@services/producto.service';
import { useNotification } from '@components/Notifications';
import { TALLES_OPTIONS } from '@models/enums/TalleEnum';

interface AgregarStockModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarStockModal({ open, onClose, onSuccess }: AgregarStockModalProps) {
  const { addNotification } = useNotification();
  const [productos, setProductos] = useState<IProducto[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<IProducto | null>(null);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProductos = useCallback(async () => {
    setLoadingProductos(true);
    try {
      const data = await productoService.getAll();
      setProductos(data.filter(p => p.activo));
    } catch {
      addNotification('Error al cargar los productos', 'error');
    } finally {
      setLoadingProductos(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (open) {
      loadProductos();
      setCantidades({});
    }
  }, [open, loadProductos]);

  const handleCantidadChange = (talle: string, value: string) => {
    const num = parseInt(value, 10);
    setCantidades(prev => ({ ...prev, [talle]: isNaN(num) || num < 0 ? 0 : num }));
    if (error) setError(null);
  };

  const totalUnidades = Object.values(cantidades).reduce((sum, v) => sum + v, 0);
  const tallesConCantidad = TALLES_OPTIONS.filter(t => (cantidades[t] || 0) > 0);

  const handleSubmit = async () => {
    setError(null);

    if (!selectedProducto) {
      setError('Debe seleccionar un producto');
      return;
    }

    if (totalUnidades === 0) {
      setError('Debe ingresar al menos una unidad en algún talle');
      return;
    }

    const cantidades_por_talle = TALLES_OPTIONS
      .filter(t => (cantidades[t] || 0) > 0)
      .map(t => ({ talle: t, cantidad: cantidades[t] }));

    setLoading(true);
    try {
      await productoService.addStock({ producto_id: selectedProducto.id, cantidades_por_talle });
      handleClose();
      onSuccess();
    } catch {
      addNotification('Error al agregar el stock', 'error');
      setError('Error al agregar el stock. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProducto(null);
    setCantidades({});
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      title="Agregar Stock"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Guardar"
      isLoading={loading}
      error={error}
    >
      <FormField
        label="Producto"
        required
        type="autocomplete"
        placeholder="Seleccione un producto"
        value={selectedProducto}
        onChange={(v) => {
          setSelectedProducto(v);
          if (error) setError(null);
        }}
        options={productos}
        getOptionLabel={(o) => o.nombre}
        loading={loadingProductos}
        error={!!error && !selectedProducto}
      />

      <Box sx={{ mt: 1, mb: 2 }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#374151', mb: 1.5 }}>
          Cantidades por talle
        </Typography>
        <Grid container spacing={1.5}>
          {TALLES_OPTIONS.map(talle => (
            <Grid key={talle} size={{ xs: 4, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Chip
                  label={talle}
                  size="small"
                  sx={{ mb: 0.5, bgcolor: 'rgba(59,130,246,0.1)', color: '#1D4ED8', fontWeight: 600, fontSize: '11px' }}
                />
                <TextField
                  size="small"
                  type="number"
                  value={cantidades[talle] || ''}
                  onChange={e => handleCantidadChange(talle, e.target.value)}
                  placeholder="0"
                  slotProps={{ htmlInput: { min: 0, step: 1, style: { textAlign: 'center', fontSize: '13px', padding: '6px 4px' } } }}
                  sx={{ width: '100%' }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {totalUnidades > 0 && (
        <Box sx={{ p: 2, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '6px' }}>
          <Typography sx={{ fontSize: '13px', color: '#0369A1' }}>
            <strong>{totalUnidades}</strong> unidades en {tallesConCantidad.length} talle{tallesConCantidad.length !== 1 ? 's' : ''}:{' '}
            {tallesConCantidad.join(', ')}
          </Typography>
        </Box>
      )}
    </BaseModal>
  );
}
