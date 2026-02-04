import { api } from '@libraries/api';
import { IVenta } from '@models/entities/ventaEntity';
import { IVentaCreateRequest } from '@models/request/IVentaRequest';

interface IVentaCreateResponse {
    message: string;
    venta: IVenta;
}

export const ventaService = {
    // Obtener mis ventas (usuario autenticado)
    getMisVentas: async (): Promise<IVenta[]> => {
        const response = await api.get<IVenta[]>('/api/mis-ventas');
        return response.data;
    },

    // Crear venta
    create: async (data: IVentaCreateRequest): Promise<IVentaCreateResponse> => {
        const response = await api.post<IVentaCreateResponse>('/api/ventas', data);
        return response.data;
    },

    // Solo dueño: obtener todas las ventas
    getAll: async (): Promise<IVenta[]> => {
        const response = await api.get<IVenta[]>('/api/owner/ventas');
        return response.data;
    },

    // Solo dueño: obtener ventas por usuario/vendedor
    getByUsuario: async (usuarioId: number): Promise<IVenta[]> => {
        const response = await api.get<IVenta[]>(`/api/owner/ventas/usuario/${usuarioId}`);
        return response.data;
    },
};

