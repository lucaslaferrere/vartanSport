'use client';

import { use, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';
import FormField from '@components/Forms/FormField';
import { capitalizeWords } from '@utils/capitalizeWords';
import { IClienteCreateRequest } from '@models/request/IClienteRequest';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

const emptyForm: IClienteCreateRequest = {
  nombre: '',
  dni: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigo_postal: '',
  pais: '',
};

export default function RegistroClientePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [formData, setFormData] = useState<IClienteCreateRequest>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);

  const update = (field: keyof IClienteCreateRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'nombre' && nameError) setNameError(false);
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      setNameError(true);
      setError('El nombre es requerido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await publicApi.post(`/api/public/clientes/registro?token=${token}`, formData);
      setSubmitted(true);
    } catch (err: unknown) {
      type AxiosLike = { response?: { status?: number; data?: { error?: string } } };
      const axiosErr = err as AxiosLike;
      if (axiosErr.response?.status === 401) {
        setError(axiosErr.response?.data?.error ?? 'El enlace es inválido o ha expirado.');
      } else {
        setError('Error al registrar sus datos. Por favor, inténtelo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Box
        sx={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#F5F5F5',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#059669', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
              ¡Registro exitoso!
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Sus datos fueron registrados correctamente. Ya puede cerrar esta ventana.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        bgcolor: '#F5F5F5',
        p: 2,
        pt: { xs: 3, sm: 6 },
      }}
    >
      <Card sx={{ maxWidth: 560, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
              Formulario de registro
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Complete sus datos para que podamos registrarlo como cliente.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Nombre */}
          <FormField
            label="Nombre completo"
            required
            placeholder="Ingrese su nombre completo"
            value={formData.nombre}
            error={nameError}
            onChange={(v) => update('nombre', capitalizeWords(v))}
          />

          {/* DNI */}
          <FormField
            label="DNI"
            placeholder="Ingrese su DNI"
            value={formData.dni}
            onChange={(v) => update('dni', v)}
          />

          {/* Email + Teléfono */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(v) => update('email', v)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Teléfono"
                placeholder="+54 9 11 1234-5678"
                value={formData.telefono}
                onChange={(v) => update('telefono', v)}
              />
            </Grid>
          </Grid>

          {/* Dirección */}
          <FormField
            label="Dirección"
            placeholder="Calle, número, departamento"
            value={formData.direccion}
            onChange={(v) => update('direccion', capitalizeWords(v))}
          />

          {/* Localidad / Provincia / CP / País */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormField
                label="Localidad"
                placeholder="Localidad"
                value={formData.ciudad}
                onChange={(v) => update('ciudad', capitalizeWords(v))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormField
                label="Provincia"
                placeholder="Provincia"
                value={formData.provincia}
                onChange={(v) => update('provincia', capitalizeWords(v))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormField
                label="Código Postal"
                placeholder="CP"
                value={formData.codigo_postal}
                onChange={(v) => update('codigo_postal', v)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormField
                label="País"
                placeholder="País"
                value={formData.pais}
                onChange={(v) => update('pais', capitalizeWords(v))}
              />
            </Grid>
          </Grid>

          {/* Submit */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              mt: 1,
              bgcolor: '#528c9e',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '15px',
              borderRadius: '10px',
              py: 1.5,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#3d6a78', boxShadow: '0 4px 12px rgba(82,140,158,0.3)' },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} />
                Registrando...
              </>
            ) : (
              'Registrar mis datos'
            )}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
