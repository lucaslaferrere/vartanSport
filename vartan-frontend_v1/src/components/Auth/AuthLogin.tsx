'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Grid, InputAdornment, Stack, TextField, Alert, Typography, Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@libraries/store';
import { colors } from '@/src/theme/colors';

export default function AuthLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('demo@vartan.com');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingrese un email y contraseña');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      login(response.token, response.usuario);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al iniciar sesión')
        : 'Error al iniciar sesión. Verifique sus credenciales.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, login, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) handleSubmit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, loading]);

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img src="/icono.png" alt="Vartan Sport" style={{ height: 80, width: 'auto', objectFit: 'contain' }} />
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ mb: 1, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: colors.textPrimary }}>Bienvenido a Vartan Sport</Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Inicia sesión para continuar</Typography>
          </Box>
        </Grid>

        {error && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>{error}</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Stack spacing={1}>
            <TextField
              id="email-login"
              type="email"
              value={email}
              name="email"
              label="Correo Electrónico"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tunombre@vartan.com"
              fullWidth
              required
              autoComplete="email"
              disabled={loading}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ color: colors.textSecondary }} /></InputAdornment> } }}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack spacing={1}>
            <TextField
              fullWidth
              id="password-login"
              type={showPassword ? 'text' : 'password'}
              value={password}
              name="password"
              label="Contraseña"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Lock sx={{ color: colors.textSecondary }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Button
            disableElevation
            disabled={loading}
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            onClick={handleSubmit}
            sx={{
              mt: 2,
              py: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              bgcolor: colors.primary,
              color: colors.white,
              '&:hover': { bgcolor: colors.primaryDark },
              '&:disabled': { bgcolor: `${colors.primary}50`, color: `${colors.white}80` },
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </Grid>


      </Grid>
    </Box>
  );
}

