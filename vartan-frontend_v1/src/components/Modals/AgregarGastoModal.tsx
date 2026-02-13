'use client';

import React, { useState } from 'react';
import { Grid, TextField, MenuItem } from '@mui/material';
import BaseModal from './BaseModal';
import { IGastoCreateRequest } from '@models/request/IGastoRequest';
import { gastoService } from '@services/gasto.service';
import { useNotification } from '@components/Notifications';
import { CategoriaGasto, MetodoPagoGasto } from '@models/entities/gastoEntity';

interface AgregarGastoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarGastoModal({ open, onClose, onSuccess }: AgregarGastoModalProps) {
  const { addNotification } = useNotification();
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState<CategoriaGasto | ''>('');
  const [proveedor, setProveedor] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPagoGasto | ''>('');
  const [comprobante, setComprobante] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categorias: CategoriaGasto[] = ['Proveedor', 'Alquiler', 'Mercadería', 'Servicios', 'Otros'];
  const metodosPago: MetodoPagoGasto[] = ['Efectivo', 'Transferencia', 'Tarjeta'];

  const handleSubmit = async () => {
    setError(null);

    // Validaciones
    if (!descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (!monto || parseFloat(monto) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!fecha) {
      setError('La fecha es requerida');
      return;
    }

    if (!categoria) {
      setError('La categoría es requerida');
      return;
    }

    setLoading(true);

    try {
      const gastoData: IGastoCreateRequest = {
        descripcion: descripcion.trim(),
        monto: parseFloat(monto),
        fecha: fecha,
        categoria: categoria,
        proveedor: proveedor.trim() || undefined,
        metodo_pago: metodoPago || undefined,
        comprobante: comprobante.trim() || undefined,
        notas: notas.trim() || undefined,
      };


      await gastoService.create(gastoData);
      addNotification('Gasto creado exitosamente', 'success');
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      console.error('Error creando gasto:', err);
      const error = err as { response?: { data?: { error?: string }; status?: number } };
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Error al crear el gasto';
      addNotification(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescripcion('');
    setMonto('');
    setFecha(new Date().toISOString().split('T')[0]);
    setCategoria('');
    setProveedor('');
    setMetodoPago('');
    setComprobante('');
    setNotas('');
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      title="Agregar Gasto"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText="Guardar Gasto"
      isLoading={loading}
      error={error}
    >
      <Grid container spacing={3}>
        {/* Descripción */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Pago de alquiler Febrero 2026"
            required
          />
        </Grid>

        {/* Monto y Fecha */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Monto"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            required
            slotProps={{
              htmlInput: { min: 0, step: 0.01 }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            focused
          />
        </Grid>

        {/* Categoría y Proveedor */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
            required
          >
            <MenuItem value="">Seleccionar categoría</MenuItem>
            {categorias.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Proveedor"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            placeholder="Ej: Inmobiliaria ABC"
          />
        </Grid>

        {/* Método de Pago y Comprobante */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label="Método de Pago"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as MetodoPagoGasto)}
          >
            <MenuItem value="">Seleccionar método</MenuItem>
            {metodosPago.map((metodo) => (
              <MenuItem key={metodo} value={metodo}>
                {metodo}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="N° Comprobante"
            value={comprobante}
            onChange={(e) => setComprobante(e.target.value)}
            placeholder="Ej: FACT-001234"
          />
        </Grid>

        {/* Notas */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas adicionales (opcional)"
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </BaseModal>
  );
}

