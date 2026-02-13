import { api } from '@libraries/api';
import { IGasto, IGastoResumen, IGastoPorMes } from '@models/entities/gastoEntity';
import { IGastoCreateRequest, IGastoUpdateRequest, IGastosFilters } from '@models/request/IGastoRequest';
import {
    IListarGastosResponse,
    ICrearGastoResponse,
    IActualizarGastoResponse,
    IEliminarGastoResponse,
    IResumenGastosResponse,
    IGastosPorMesResponse,
    IProveedoresResponse
} from '@models/response/IGastoResponse';

export const gastoService = {
    // Crear gasto
    create: async (data: IGastoCreateRequest): Promise<IGasto> => {
        const response = await api.post<ICrearGastoResponse>('/api/gastos', data);
        return response.data.gasto;
    },

    // Listar gastos con filtros
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

    // Obtener gasto por ID
    getById: async (id: number): Promise<IGasto> => {
        const response = await api.get<IGasto>(`/api/gastos/${id}`);
        return response.data;
    },

    // Actualizar gasto
    update: async (id: number, data: IGastoUpdateRequest): Promise<IGasto> => {
        const response = await api.put<IActualizarGastoResponse>(`/api/gastos/${id}`, data);
        return response.data.gasto;
    },

    // Eliminar gasto
    delete: async (id: number): Promise<void> => {
        await api.delete<IEliminarGastoResponse>(`/api/gastos/${id}`);
    },

    // Obtener resumen general por categoría
    getResumen: async (fechaDesde?: string, fechaHasta?: string): Promise<IResumenGastosResponse> => {
        const params = new URLSearchParams();
        if (fechaDesde) params.append('fecha_desde', fechaDesde);
        if (fechaHasta) params.append('fecha_hasta', fechaHasta);
        const query = params.toString() ? `?${params}` : '';
        const response = await api.get<IResumenGastosResponse>(`/api/gastos/resumen${query}`);
        return response.data;
    },

    // Obtener gastos por mes
    getPorMes: async (anio?: number): Promise<IGastosPorMesResponse> => {
        const query = anio ? `?anio=${anio}` : '';
        const response = await api.get<IGastosPorMesResponse>(`/api/gastos/resumen/mensual${query}`);
        return response.data;
    },

    // Obtener lista de proveedores únicos
    getProveedores: async (): Promise<string[]> => {
        const response = await api.get<{ proveedores: string[] }>('/api/gastos/proveedores');
        return response.data.proveedores;
    },
};

