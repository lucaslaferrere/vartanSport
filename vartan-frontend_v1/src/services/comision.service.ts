import { api } from '@libraries/api';
import { IComision } from '@models/entities/comisionentity';
import { IComisionObservacionesRequest } from '@models/request/IComisionRequest';

interface ICalcularComisionesResponse {
    message: string;
    comisiones: IComision[];
}

export const comisionService = {
    // Obtener mis comisiones (usuario autenticado)
    getMisComisiones: async (): Promise<IComision[]> => {
        const response = await api.get<IComision[]>('/api/mis-comisiones');
        return response.data;
    },

    // Solo dueño: obtener todas las comisiones
    getAll: async (): Promise<IComision[]> => {
        const response = await api.get<IComision[]>('/api/owner/comisiones');
        return response.data;
    },

    // Solo dueño: obtener comisiones por usuario
    getByUsuario: async (usuarioId: number): Promise<IComision[]> => {
        const response = await api.get<IComision[]>(`/api/owner/comisiones/usuario/${usuarioId}`);
        return response.data;
    },

    // Solo dueño: calcular comisiones del mes
    calcularComisiones: async (): Promise<ICalcularComisionesResponse> => {
        const response = await api.post<ICalcularComisionesResponse>('/api/owner/comisiones/calcular');
        return response.data;
    },

    // Solo dueño: actualizar observaciones de una comisión
    updateObservaciones: async (id: number, data: IComisionObservacionesRequest): Promise<IComision> => {
        const response = await api.put<IComision>(`/api/owner/comisiones/${id}/observaciones`, data);
        return response.data;
    },
};

