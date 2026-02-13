import axios from 'axios';

// Crear instancia de Axios
const api = axios.create({
baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api', // Ajusta tu URL base si es necesario
headers: {
'Content-Type': 'application/json',
},
});

// Interceptor de Request (Solicitud)
api.interceptors.request.use(
(config) => {
// DEBUG: Descomentar para ver requests salientes
// console.log('🔑 Request a:', config.url);
// console.log('📦 Request data:', config.data);

        // Inyectar Token si existe
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        console.error('❌ Error en configuración de Request:', error);
        return Promise.reject(error);
    }
);

// Interceptor de Response (Respuesta)
api.interceptors.response.use(
(response) => {
// ✅ CORRECCIÓN: Todo el bloque debe estar dentro de las llaves { }

        // DEBUG: Logs informativos (Descomentar si necesitas debug)
        // console.log('✅ Response OK:', response.config.url, '- Status:', response.status);
        // console.log('📦 Response data:', response.data);

        return response;
    },
    async (error) => {
        // Manejo de errores
        const errorDetails = {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
            message: error.message
        };

        console.error('❌ Error en API:', errorDetails);

        // Manejo específico de error 401 (No autorizado)
        if (error.response?.status === 401) {
            console.warn('⚠️ Sesión expirada o inválida');
            if (typeof window !== 'undefined') {
                // Opcional: Redirigir al login o limpiar token
                // localStorage.removeItem('token');
                // window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;