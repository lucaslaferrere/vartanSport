import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                const refreshResponse = await axios.post(`${API_URL}/api/refresh-token`, {}, {
                    withCredentials: true,
                });
                const newToken = refreshResponse.data.token;
                document.cookie = `token=${newToken}; path=/; secure;`;
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return api.request(error.config);
            } catch (refreshError) {
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);