import { api } from '@libraries/api';
import { ICliente } from '@models/entities/clienteEntity';
import { IClienteCreateRequest, IClienteUpdateRequest } from '@models/request/IClienteRequest';

export const clienteService = {
    getAll: async (): Promise<ICliente[]> => {
        const response = await api.get<ICliente[]>('/api/clientes');
        return response.data;
    },

    getById: async (id: number): Promise<ICliente> => {
        const response = await api.get<ICliente>(`/api/clientes/${id}`);
        return response.data;
    },

    create: async (data: IClienteCreateRequest): Promise<ICliente> => {
        const response = await api.post<ICliente>('/api/clientes', data);
        return response.data;
    },

    update: async (id: number, data: IClienteUpdateRequest): Promise<ICliente> => {
        const response = await api.put<ICliente>(`/api/clientes/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/owner/clientes/${id}`);
    },
};
