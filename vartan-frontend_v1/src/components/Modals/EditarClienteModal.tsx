'use client';

import React, { useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import { IClienteUpdateRequest } from '@models/request/IClienteRequest';
import { ICliente } from '@models/entities/clienteEntity';
import { clienteService } from '@services/cliente.service';
import { useNotification } from '@components/Notifications';
import { capitalizeWords } from '@utils/capitalizeWords';

interface EditarClienteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente: ICliente | null;
}

export default function EditarClienteModal({ open, onClose, onSuccess, cliente }: EditarClienteModalProps) {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<IClienteUpdateRequest>({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
    pais: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cliente && open) {
      setFormData({
        nombre: cliente.nombre,
        dni: cliente.dni || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        provincia: cliente.provincia || '',
        codigo_postal: cliente.codigo_postal || '',
        pais: cliente.pais || ''
      });
    }
  }, [cliente, open]);

  const handleSubmit = async () => {
    setError(null);

    if (!cliente) {
      setError('No se encontró el cliente a editar');
      return;
    }

    if (!formData.nombre.trim()) {
      setError('El nombre del cliente es requerido');
      return;
    }

    setLoading(true);

    try {
      await clienteService.update(cliente.id, formData);
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error actualizando cliente:', err);
      addNotification('Error al actualizar el cliente', 'error');
      setError('Error al actualizar el cliente. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      dni: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigo_postal: '',
      pais: ''
    });
    setError(null);
    onClose();
  };

  if (!cliente) return null;

  return (
    <BaseModal
      title="Editar Cliente"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Actualizar"
      isLoading={loading}
      error={error}
    >
      <FormField
        label="Nombre"
        required
        placeholder="Ingrese el nombre del cliente"
        value={formData.nombre}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, nombre: capitalizeWords(value) }));
          if (error) setError(null);
        }}
        error={!!error && !formData.nombre.trim()}
      />
      <FormField
        label="DNI"
        placeholder="Ingrese el DNI del cliente"
        value={formData.dni || ''}
        onChange={(value) => setFormData(prev => ({ ...prev, dni: value }))}
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

      {/* Grid Ciudad/Provincia/CP/País */}
<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 3 }}>
    <FormField
      label="Ciudad"
      placeholder="Ciudad"
      value={formData.ciudad}
      onChange={(value) => setFormData(prev => ({ ...prev, ciudad: capitalizeWords(value) }))}
    />
  </Grid>
  <Grid size={{ xs: 12, sm: 3 }}>
    <FormField
      label="Provincia"
      placeholder="Provincia"
      value={formData.provincia}
      onChange={(value) => setFormData(prev => ({ ...prev, provincia: capitalizeWords(value) }))}
    />
  </Grid>
  <Grid size={{ xs: 12, sm: 3 }}>
    <FormField
      label="Código Postal"
      placeholder="CP"
      value={formData.codigo_postal || ''}
      onChange={(value) => setFormData(prev => ({ ...prev, codigo_postal: value }))}
    />
  </Grid>
  <Grid size={{ xs: 12, sm: 3 }}>
    <FormField
      label="País"
      placeholder="País"
      value={formData.pais}
      onChange={(value) => setFormData(prev => ({ ...prev, pais: capitalizeWords(value) }))}
    />
  </Grid>
</Grid>
    </BaseModal>
  );
}
