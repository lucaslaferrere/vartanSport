import { api } from '@libraries/api';
import { IProducto, IProductoStock } from '@models/entities/productoEntity';
import {
    IProductoCreateRequest,
    IProductoUpdateRequest,
    IStockCreateRequest,
    IStockUpdateRequest
} from '@models/request/IProductoRequest';

export const productoService = {
    getAll: async (): Promise<IProducto[]> => {
        const response = await api.get<IProducto[]>('/api/productos');
        return response.data;
    },

    getById: async (id: number): Promise<IProducto> => {
        const response = await api.get<IProducto>(`/api/productos/${id}`);
        return response.data;
    },

    create: async (data: IProductoCreateRequest): Promise<IProducto> => {
        const response = await api.post<IProducto>('/api/owner/productos', data);
        return response.data;
    },

    update: async (id: number, data: IProductoUpdateRequest): Promise<IProducto> => {
        const response = await api.put<IProducto>(`/api/owner/productos/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/owner/productos/${id}`);
    },

    getStock: async (): Promise<IProductoStock[]> => {
        const response = await api.get<IProductoStock[]>('/api/stock');
        return response.data;
    },

    getStockByProducto: async (id: number): Promise<IProductoStock[]> => {
        const response = await api.get<IProductoStock[]>(`/api/stock/producto/${id}`);
        return response.data;
    },

    addStock: async (data: IStockCreateRequest): Promise<IProductoStock> => {
        const response = await api.post<IProductoStock>('/api/owner/stock', data);
        return response.data;
    },

    updateStock: async (id: number, data: IStockUpdateRequest): Promise<IProductoStock> => {
        const response = await api.put<IProductoStock>(`/api/owner/stock/${id}`, data);
        return response.data;
    },
};
