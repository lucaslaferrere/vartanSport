'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Box } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IStockCreateRequest } from '@models/request/IProductoRequest';
import { TALLES_OPTIONS } from '@models/enums/TalleEnum';
import { COLORES_OPTIONS } from '@models/enums/ColorEnum';
import { IProducto } from '@models/entities/productoEntity';
import { productoService } from '@services/producto.service';
import { useNotification } from '@components/Notifications';

interface AgregarStockModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarStockModal({ open, onClose, onSuccess }: AgregarStockModalProps) {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<IStockCreateRequest>({
    producto_id: 0,
    talles: [],
    colores: [],
    cantidad: 0
  });
  const [productos, setProductos] = useState<IProducto[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<IProducto | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProductos = useCallback(async () => {
    setLoadingProductos(true);
    try {
      const productosData = await productoService.getAll();
      setProductos(productosData.filter(p => p.activo));
    } catch (err) {
      console.error('Error cargando productos:', err);
      addNotification('Error al cargar los productos', 'error');
    } finally {
      setLoadingProductos(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (open) {
      loadProductos();
    }
  }, [open, loadProductos]);

  const handleProductoChange = (newValue: IProducto | null) => {
    setSelectedProducto(newValue);
    setFormData(prev => ({
      ...prev,
      producto_id: newValue ? newValue.id : 0
    }));
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!formData.producto_id) {
      setError('Debe seleccionar un producto');
      return;
    }

    if (!formData.talles || formData.talles.length === 0) {
      setError('Debe seleccionar al menos un talle');
      return;
    }

    if (!formData.colores || formData.colores.length === 0) {
      setError('Debe seleccionar al menos un color');
      return;
    }

    if (formData.cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      await productoService.addStock(formData);
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error agregando stock:', err);
      addNotification('Error al agregar el stock', 'error');
      setError('Error al agregar el stock. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      producto_id: 0,
      talles: [],
      colores: [],
      cantidad: 0
    });
    setSelectedProducto(null);
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      title="Agregar Stock"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Agregar"
      isLoading={loading}
      error={error}
    >
      <FormField
        label="Producto"
        required
        type="autocomplete"
        placeholder="Seleccione un producto"
        value={selectedProducto}
        onChange={handleProductoChange}
        options={productos}
        getOptionLabel={(option) => option.nombre}
        loading={loadingProductos}
        error={!!error && !formData.producto_id}
      />

      <FormField
        label="Talles"
        required
        type="multiselect"
        placeholder="Seleccione los talles"
        value={formData.talles}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, talles: value || [] }));
          if (error) setError(null);
        }}
        options={TALLES_OPTIONS}
        getOptionLabel={(option) => option}
        error={!!error && (!formData.talles || formData.talles.length === 0)}
      />

      <FormField
        label="Colores"
        required
        type="multiselect"
        placeholder="Seleccione los colores"
        value={formData.colores}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, colores: value || [] }));
          if (error) setError(null);
        }}
        options={COLORES_OPTIONS}
        getOptionLabel={(option) => option}
        error={!!error && (!formData.colores || formData.colores.length === 0)}
      />

      <FormField
        label="Cantidad por talle"
        required
        type="number"
        placeholder="0"
        value={formData.cantidad || ''}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, cantidad: value }));
          if (error) setError(null);
        }}
        error={!!error && formData.cantidad <= 0}
        inputProps={{ min: 1, step: 1 }}
      />

      {formData.talles && formData.talles.length > 0 && formData.colores && formData.colores.length > 0 && formData.cantidad > 0 && (
        <Box sx={{
          mt: -2,
          mb: 2,
          p: 2,
          backgroundColor: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: '6px'
        }}>
          <Typography variant="body2" sx={{ fontSize: '13px', color: '#0369A1' }}>
            💡 Se agregarán <strong>{formData.cantidad}</strong> unidades para cada combinación de:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '12px', color: '#0369A1', mt: 0.5 }}>
            • <strong>{formData.talles.length}</strong> talle{formData.talles.length > 1 ? 's' : ''}: {formData.talles.join(', ')}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '12px', color: '#0369A1' }}>
            • <strong>{formData.colores.length}</strong> color{formData.colores.length > 1 ? 'es' : ''}: {formData.colores.join(', ')}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '12px', color: '#0369A1', mt: 0.5, fontWeight: 600 }}>
            Total de combinaciones: <strong>{formData.talles.length * formData.colores.length}</strong> |
            Total de unidades: <strong>{formData.cantidad * formData.talles.length * formData.colores.length}</strong>
          </Typography>
        </Box>
      )}
    </BaseModal>
  );
}
