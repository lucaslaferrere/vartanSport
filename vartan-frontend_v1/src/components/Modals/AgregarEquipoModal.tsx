'use client';

import React, { useState } from 'react';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IEquipoCreateRequest } from '@models/request/ICatalogoRequest';
import { equipoService } from '@services/catalogo.service';
import { useNotification } from '@components/Notifications';

interface AgregarEquipoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarEquipoModal({ open, onClose, onSuccess }: AgregarEquipoModalProps) {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<IEquipoCreateRequest>({
    nombre: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!formData.nombre.trim()) {
      setError('El nombre del equipo es requerido');
      return;
    }

    setLoading(true);

    try {
      await equipoService.create(formData);
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error creando equipo:', err);
      addNotification('Error al crear el equipo', 'error');
      setError('Error al crear el equipo. Inténtelo nuevamente.');
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
      title="Agregar Equipo"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Agregar"
      isLoading={loading}
      error={error}
    >
      <FormField
        label="Nombre del Equipo"
        required
        placeholder="Ej: River, Boca, AFA, San Lorenzo"
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
