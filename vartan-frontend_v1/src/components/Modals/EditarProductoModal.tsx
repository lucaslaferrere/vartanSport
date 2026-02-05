'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Box, Switch, FormControlLabel } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IProductoUpdateRequest } from '@models/request/IProductoRequest';
import { TalleEnum, TALLES_OPTIONS } from '@models/enums/TalleEnum';
import { ColorEnum, COLORES_OPTIONS } from '@models/enums/ColorEnum';
import { IProducto } from '@models/entities/productoEntity';
import { productoService } from '@services/producto.service';

interface EditarProductoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: IProducto | null;
}

interface ExtendedProductoUpdateRequest extends IProductoUpdateRequest {
  talles?: TalleEnum[];
  colores?: ColorEnum[];
  activo?: boolean;
}

export default function EditarProductoModal({ open, onClose, onSuccess, producto }: EditarProductoModalProps) {
  const [formData, setFormData] = useState<ExtendedProductoUpdateRequest>({
    nombre: '',
    costo_unitario: 0,
    talles: [],
    colores: [],
    activo: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (open && producto) {
      setFormData({
        nombre: producto.nombre,
        costo_unitario: producto.costo_unitario,
        talles: producto.talles_disponibles || [],
        colores: producto.colores_disponibles || [],
        activo: producto.activo
      });
    }
  }, [open, producto]);

  const handleSubmit = async () => {
    setError(null);
    
    if (!producto) {
      setError('No se ha seleccionado un producto para editar');
      return;
    }

    if (!formData.nombre.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (formData.costo_unitario <= 0) {
      setError('El costo unitario debe ser mayor a 0');
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

    setLoading(true);

    try {
      await productoService.update(producto.id, formData as IProductoUpdateRequest);
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error actualizando producto:', err);
      setError('Error al actualizar el producto. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      costo_unitario: 0,
      talles: [],
      colores: [],
      activo: true
    });
    setError(null);
    onClose();
  };

  if (!producto) return null;

  return (
    <BaseModal
      title={`Editar Producto: ${producto.nombre}`}
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Actualizar"
      isLoading={loading}
      error={error}
    >
      <FormField
        label="Nombre del Producto"
        required
        placeholder="Ingrese el nombre del producto"
        value={formData.nombre}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, nombre: value }));
          if (error) setError(null);
        }}
        error={!!error && !formData.nombre.trim()}
      />

      <FormField
        label="Costo Unitario"
        required
        type="number"
        placeholder="0.00"
        value={formData.costo_unitario || ''}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, costo_unitario: value }));
          if (error) setError(null);
        }}
        error={!!error && formData.costo_unitario <= 0}
        startAdornment={<Typography sx={{ mr: 1, color: '#9CA3AF', fontSize: '14px' }}>$</Typography>}
        inputProps={{ min: 0, step: 0.01 }}
      />

      <FormField
        label="Talles Disponibles"
        required
        type="multiselect"
        placeholder="Seleccione los talles disponibles"
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
        label="Colores Disponibles"
        required
        type="multiselect"
        placeholder="Seleccione los colores disponibles"
        value={formData.colores}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, colores: value || [] }));
          if (error) setError(null);
        }}
        options={COLORES_OPTIONS}
        getOptionLabel={(option) => option}
        error={!!error && (!formData.colores || formData.colores.length === 0)}
      />

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.activo}
              onChange={(event) => {
                setFormData(prev => ({ ...prev, activo: event.target.checked }));
              }}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#10B981',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#10B981',
                },
              }}
            />
          }
          label={
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Producto activo
            </Typography>
          }
        />
      </Box>
    </BaseModal>
  );
}
