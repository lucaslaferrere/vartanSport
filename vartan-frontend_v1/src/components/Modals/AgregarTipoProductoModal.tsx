'use client';

import React, { useState } from 'react';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { ITipoProductoCreateRequest } from '@models/request/ICatalogoRequest';
import { tipoProductoService } from '@services/catalogo.service';
import { useNotification } from '@components/Notifications';

interface AgregarTipoProductoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarTipoProductoModal({ open, onClose, onSuccess }: AgregarTipoProductoModalProps) {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<ITipoProductoCreateRequest>({
    nombre: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!formData.nombre.trim()) {
      setError('El nombre del tipo es requerido');
      return;
    }

    setLoading(true);

    try {
      await tipoProductoService.create(formData);
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error creando tipo de producto:', err);
      addNotification('Error al crear el tipo de producto', 'error');
      setError('Error al crear el tipo de producto. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: ''
    });
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      title="Agregar Tipo de Producto"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Agregar"
      isLoading={loading}
      error={error}
    >
      <FormField
        label="Nombre del Tipo"
        required
        placeholder="Ej: Camiseta, Buzo, Short"
        value={formData.nombre}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, nombre: value }));
          if (error) setError(null);
        }}
        error={!!error && !formData.nombre.trim()}
      />
    </BaseModal>
  );
}
