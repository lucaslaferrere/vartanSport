'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import { useAuthStore } from '@libraries/store';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [cookies, setCookies] = useState<string>('');
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);
  const [localStorageUser, setLocalStorageUser] = useState<string | null>(null);

  useEffect(() => {
    // Obtener cookies
    setCookies(document.cookie);

    // Obtener localStorage
    setLocalStorageToken(localStorage.getItem('token'));
    setLocalStorageUser(localStorage.getItem('user'));
  }, []);

  const handleClearAndReload = () => {
    localStorage.clear();
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload();
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToPedidos = () => {
    router.push('/pedidos');
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom>
        🔍 Página de Debug - Autenticación
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Estado de Zustand Store
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>
            <strong>isAuthenticated:</strong> {' '}
            <Chip
              label={isAuthenticated ? 'SÍ' : 'NO'}
              color={isAuthenticated ? 'success' : 'error'}
              size="small"
            />
          </Typography>
          <Typography sx={{ mt: 1 }}>
            <strong>Token en store:</strong> {token ? `${token.substring(0, 30)}...` : 'NO HAY TOKEN'}
          </Typography>
          <Typography sx={{ mt: 1 }}>
            <strong>Usuario en store:</strong> {user ? JSON.stringify(user, null, 2) : 'NO HAY USUARIO'}
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          2. LocalStorage
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>
            <strong>Token en localStorage:</strong>
          </Typography>
          <Box sx={{ bgcolor: '#f0f0f0', p: 2, borderRadius: 1, mt: 1, fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
            {localStorageToken || 'NO HAY TOKEN'}
          </Box>

          <Typography sx={{ mt: 2 }}>
            <strong>Usuario en localStorage:</strong>
          </Typography>
          <Box sx={{ bgcolor: '#f0f0f0', p: 2, borderRadius: 1, mt: 1, fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
            {localStorageUser || 'NO HAY USUARIO'}
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          3. Cookies
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ bgcolor: '#f0f0f0', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
            {cookies || 'NO HAY COOKIES'}
          </Box>
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            {cookies.includes('auth-token') ? '✅ Cookie auth-token encontrada' : '❌ Cookie auth-token NO encontrada'}
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          4. Diagnóstico
        </Typography>
        <Box sx={{ mt: 2 }}>
          {!localStorageToken && (
            <Typography color="error" sx={{ mb: 1 }}>
              ❌ NO hay token en localStorage - Necesitas hacer login
            </Typography>
          )}
          {!cookies.includes('auth-token') && (
            <Typography color="error" sx={{ mb: 1 }}>
              ❌ NO hay cookie auth-token - El middleware te redirigirá al login
            </Typography>
          )}
          {localStorageToken && !cookies.includes('auth-token') && (
            <Typography color="warning.main" sx={{ mb: 1 }}>
              ⚠️ Hay token en localStorage pero NO en cookies - Problema de sincronización
            </Typography>
          )}
          {localStorageToken && cookies.includes('auth-token') && (
            <Typography color="success.main" sx={{ mb: 1 }}>
              ✅ Token encontrado en localStorage Y cookies - Todo está bien
            </Typography>
          )}
          {user && user.rol && (
            <Typography sx={{ mt: 2 }}>
              <strong>Rol del usuario:</strong> {user.rol} {user.rol === 'dueño' ? '👑' : '👤'}
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          5. Acciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoToLogin}
          >
            Ir al Login
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGoToPedidos}
            disabled={!localStorageToken}
          >
            Ir a Pedidos
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearAndReload}
          >
            Limpiar Todo y Recargar
          </Button>
        </Box>
      </Paper>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2">
          💡 <strong>Nota:</strong> Si ves que NO hay token o cookie, haz click en "Limpiar Todo y Recargar" y luego haz login nuevamente.
        </Typography>
      </Box>
    </Box>
  );
}
