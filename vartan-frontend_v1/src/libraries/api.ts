import axios from 'axios';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Comprobantes are served by an authenticated route, and a browser cannot attach
// an Authorization header to <img>, <iframe> or window.open, so the token travels
// as a query parameter.
export const buildComprobanteUrl = (comprobanteUrl: string): string => {
    const normalized = comprobanteUrl.replace(/\\/g, '/').replace(/^\/+/, '');
    const base = `${API_URL}/${normalized}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
};

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // DEBUG: Descomentar para ver requests
            // console.log('🔑 Request a:', config.url, '- Token presente:', !!token);
            // console.log('📦 Request data:', config.data);
            // console.log('📋 Request headers:', config.headers);
        } else {
            console.warn('⚠️ No hay token en localStorage para:', config.url);
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        // DEBUG: Descomentar para ver responses exitosas
        // console.log('✅ Response OK:', response.config.url, '- Status:', response.status);
        // console.log('📦 Response data:', response.data);
        return response;
    },
    async (error) => {
        // Log detallado solo si no es error 401 (autenticación)
        if (error.response?.status !== 401) {
            const errorDetails = {
                url: error.config?.url || 'URL desconocida',
                method: error.config?.method || 'Método desconocido',
                status: error.response?.status || 'Sin respuesta',
                statusText: error.response?.statusText || '',
                message: error.response?.data?.error || error.message || 'Error desconocido',
                data: error.response?.data,
                code: error.code
            };

            console.error('❌ Error en API:', errorDetails);

            // Mensaje adicional para Network Error
            if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                console.error('🔌 El backend no está disponible. Verifica que esté corriendo en http://localhost:8080');
                console.error('💡 Solución: Ejecuta "go run main.go" en la carpeta del backend');
            }
        }

        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Delegating to the store also clears the auth-token cookie. Clearing
                // only localStorage leaves the cookie behind, and the middleware then
                // treats the session as alive and bounces /login back to /dashboard.
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);