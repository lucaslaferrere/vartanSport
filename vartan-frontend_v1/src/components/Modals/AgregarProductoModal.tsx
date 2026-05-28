'use client';

import React, { useState } from 'react';
import { Typography } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IProductoCreateRequest } from '@models/request/IProductoRequest';
import { TALLES_OPTIONS } from '@models/enums/TalleEnum';
import { productoService } from '@services/producto.service';
import { useNotification } from '@components/Notifications';

interface AgregarProductoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarProductoModal({ open, onClose, onSuccess }: AgregarProductoModalProps) {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<IProductoCreateRequest>({
    nombre: '',
    costo_unitario: 0,
    talles: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!formData.nombre.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (formData.costo_unitario <= 0) {
      setError('El costo unitario debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await productoService.create(formData);
      handleClose();
      onSuccess();
    } catch {
      addNotification('Error al crear el producto', 'error');
      setError('Error al crear el producto. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ nombre: '', costo_unitario: 0, talles: [] });
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      title="Agregar Producto"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Agregar"
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
        type="multiselect"
        placeholder="Seleccione los talles disponibles"
        value={formData.talles}
        onChange={(value) => setFormData(prev => ({ ...prev, talles: value || [] }))}
        options={TALLES_OPTIONS}
        getOptionLabel={(option) => option}
      />
    </BaseModal>
  );
}
