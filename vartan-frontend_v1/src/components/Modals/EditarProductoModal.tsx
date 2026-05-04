'use client';

import React, { useState, useEffect } from 'react';
import { Box, Switch, FormControlLabel, Typography } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IProductoUpdateRequest } from '@models/request/IProductoRequest';
import { TALLES_OPTIONS } from '@models/enums/TalleEnum';
import { IProducto } from '@models/entities/productoEntity';
import { productoService } from '@services/producto.service';

interface EditarProductoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: IProducto | null;
}

export default function EditarProductoModal({ open, onClose, onSuccess, producto }: EditarProductoModalProps) {
  const [formData, setFormData] = useState<IProductoUpdateRequest>({
    nombre: '',
    costo_unitario: 0,
    talles: [],
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && producto) {
      setFormData({
        nombre: producto.nombre,
        costo_unitario: producto.costo_unitario || 0,
        talles: producto.talles_disponibles || [],
        activo: producto.activo,
      });
    }
  }, [open, producto]);

  const handleSubmit = async () => {
    setError(null);

    if (!producto) return;

    if (!formData.nombre.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    if ((formData.costo_unitario || 0) <= 0) {
      setError('El costo unitario debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await productoService.update(producto.id, formData);
      handleClose();
      onSuccess();
    } catch {
      setError('Error al actualizar el producto. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ nombre: '', costo_unitario: 0, talles: [], activo: true });
    setError(null);
    onClose();
  };

  if (!producto) return null;

  return (
    <BaseModal
      title={`Editar: ${producto.nombre}`}
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
        error={!!error && (formData.costo_unitario || 0) <= 0}
        startAdornment={<Typography sx={{ mr: 1, color: '#9CA3AF', fontSize: '14px' }}>$</Typography>}
        inputProps={{ min: 0, step: 0.01 }}
      />

      <FormField
        label="Talles Disponibles"
        type="multiselect"
        placeholder="Seleccione los talles disponibles"
        value={formData.talles}
        onChange={(value) => setFormData(prev => ({ ...prev, talles: value || [] }))}
        options={TALLES_OPTIONS}
        getOptionLabel={(option) => option}
      />

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.activo}
              onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#10B981' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10B981' },
              }}
            />
          }
          label={<Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Producto activo</Typography>}
        />
      </Box>
    </BaseModal>
  );
}
