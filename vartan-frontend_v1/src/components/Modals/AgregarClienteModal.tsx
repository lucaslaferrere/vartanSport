'use client';

import React, { useState } from 'react';
import { Grid } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IClienteCreateRequest } from '@models/request/IClienteRequest';
import { clienteService } from '@services/cliente.service';
import { useNotification } from '@components/Notifications';
import { capitalizeWords } from '@utils/capitalizeWords';

interface AgregarClienteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarClienteModal({ open, onClose, onSuccess }: AgregarClienteModalProps) {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<IClienteCreateRequest>({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    pais: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!formData.nombre.trim()) {
      setError('El nombre del cliente es requerido');
      return;
    }

    setLoading(true);

    try {
      await clienteService.create(formData);
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error creando cliente:', err);
      addNotification('Error al crear el cliente', 'error');
      setError('Error al crear el cliente. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      pais: ''
    });
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      title="Agregar Cliente"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Agregar"
      isLoading={loading}
      error={error}
    >
      <FormField
        label="Nombre Completo"
        required
        placeholder="Ingrese el nombre del cliente"
        value={formData.nombre}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, nombre: capitalizeWords(value) }));
          if (error) setError(null);
        }}
        error={!!error && !formData.nombre.trim()}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormField
            label="Email"
            type="text"
            placeholder="cliente@ejemplo.com"
            value={formData.email}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, email: value }));
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormField
            label="Teléfono"
            type="text"
            placeholder="+54 9 11 1234-5678"
            value={formData.telefono}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, telefono: value }));
            }}
          />
        </Grid>
      </Grid>

      <FormField
        label="Dirección"
        placeholder="Calle, número, departamento"
        value={formData.direccion}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, direccion: capitalizeWords(value) }));
        }}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormField
            label="Ciudad"
            placeholder="Ciudad"
            value={formData.ciudad}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, ciudad: capitalizeWords(value) }));
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormField
            label="Provincia"
            placeholder="Provincia"
            value={formData.provincia}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, provincia: capitalizeWords(value) }));
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormField
            label="País"
            placeholder="País"
            value={formData.pais}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, pais: capitalizeWords(value) }));
            }}
          />
        </Grid>
      </Grid>
    </BaseModal>
  );
}
