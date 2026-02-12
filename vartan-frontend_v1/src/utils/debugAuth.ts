/**
 * Utilidad para debuggear problemas de autenticación
 */

export const debugAuth = () => {
  if (typeof window === 'undefined') {
    console.log('🔍 Debug Auth: Ejecutando en servidor');
    return;
  }

  console.log('🔍 ==========  DEBUG AUTH ==========');

  // Verificar localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  console.log('📦 Token en localStorage:', token ? `${token.substring(0, 30)}...` : '❌ NO HAY TOKEN');

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('👤 Usuario:', {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      });
    } catch (e) {
      console.error('❌ Error parseando usuario:', e);
    }
  } else {
    console.log('👤 Usuario: ❌ NO HAY USUARIO');
  }

  // Verificar cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  console.log('🍪 Cookie auth-token:', cookies['auth-token'] ? 'SÍ EXISTE' : '❌ NO EXISTE');

  // Verificar si el token está expirado (JWT)
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      const isExpired = now > exp;

      console.log('⏰ Token expira:', new Date(exp).toLocaleString('es-AR'));
      console.log('⏰ Hora actual:', new Date(now).toLocaleString('es-AR'));
      console.log('⏰ Estado:', isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO');

      if (isExpired) {
        console.warn('⚠️ El token está EXPIRADO. Debes hacer login nuevamente.');
      }
    } catch (e) {
      console.error('❌ Error parseando JWT:', e);
    }
  }

  console.log('🔍 ============================');
};

