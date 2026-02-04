import { api } from '@libraries/api';
import { IPedido } from '@models/entities/pedidoEntity';
import { IPedidoUpdateRequest } from '@models/request/IPedidoRequest';

export const pedidoService = {
    // Obtener mis pedidos (usuario autenticado)
    getMisPedidos: async (): Promise<IPedido[]> => {
        const response = await api.get<IPedido[]>('/api/mis-pedidos');
        return response.data;
    },

    // Actualizar estado del pedido
    updateEstado: async (id: number, data: IPedidoUpdateRequest): Promise<IPedido> => {
        const response = await api.put<IPedido>(`/api/pedidos/${id}`, data);
        return response.data;
    },

    // Solo dueño: obtener todos los pedidos
    getAll: async (): Promise<IPedido[]> => {
        const response = await api.get<IPedido[]>('/api/owner/pedidos');
        return response.data;
    },

    // Solo dueño: obtener pedidos por estado
    getByEstado: async (estado: 'pendiente' | 'despachado' | 'cancelado'): Promise<IPedido[]> => {
        const response = await api.get<IPedido[]>(`/api/owner/pedidos/estado/${estado}`);
        return response.data;
    },
};

