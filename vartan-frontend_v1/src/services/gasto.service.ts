import { api } from '@libraries/api';
import { IGasto, IGastoResumen, IGastoPorMes } from '@models/entities/gastoEntity';
import { IGastoCreateRequest, IGastoUpdateRequest, IGastosFilters } from '@models/request/IGastoRequest';
import {
    IListarGastosResponse,
    ICrearGastoResponse,
    IActualizarGastoResponse,
    IEliminarGastoResponse
} from '@models/response/IGastoResponse';

export const gastoService = {
    getAll: async (filters?: IGastosFilters): Promise<IListarGastosResponse> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params.append(key, String(value));
                }
            });
        }
        const query = params.toString() ? `?${params}` : '';
        const response = await api.get<IListarGastosResponse>(`/api/gastos${query}`);
        return response.data;
    },

    getById: async (id: number): Promise<IGasto> => {
        const response = await api.get<IGasto>(`/api/gastos/${id}`);
        return response.data;
    },

    create: async (data: IGastoCreateRequest): Promise<ICrearGastoResponse> => {
        const response = await api.post<ICrearGastoResponse>('/api/gastos', data);
        return response.data;
    },

    update: async (id: number, data: IGastoUpdateRequest): Promise<IActualizarGastoResponse> => {
        const response = await api.put<IActualizarGastoResponse>(`/api/gastos/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<IEliminarGastoResponse> => {
        const response = await api.delete<IEliminarGastoResponse>(`/api/gastos/${id}`);
        return response.data;
    },

    getResumen: async (fechaDesde?: string, fechaHasta?: string): Promise<IGastoResumen[]> => {
        const params = new URLSearchParams();
        if (fechaDesde) params.append('fecha_desde', fechaDesde);
        if (fechaHasta) params.append('fecha_hasta', fechaHasta);
        const query = params.toString() ? `?${params}` : '';
        const response = await api.get<IGastoResumen[]>(`/api/gastos/resumen${query}`);
        return response.data;
    },

    getPorMes: async (anio?: number): Promise<IGastoPorMes[]> => {
        const query = anio ? `?anio=${anio}` : '';
        const response = await api.get<IGastoPorMes[]>(`/api/gastos/por-mes${query}`);
        return response.data;
    },

    getProveedores: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/api/gastos/proveedores');
        return response.data;
    },
};

