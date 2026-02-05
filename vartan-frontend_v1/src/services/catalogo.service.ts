import { api } from '@libraries/api';
import { ITipoProducto, IEquipo } from '@models/entities/catalogoEntity';
import { ITipoProductoCreateRequest, ITipoProductoUpdateRequest, IEquipoCreateRequest, IEquipoUpdateRequest } from '@models/request/ICatalogoRequest';

export const tipoProductoService = {
  getAll: async (): Promise<ITipoProducto[]> => {
    const response = await api.get<ITipoProducto[]>('/api/tipos-producto');
    return response.data;
  },

  getById: async (id: number): Promise<ITipoProducto> => {
    const response = await api.get<ITipoProducto>(`/api/tipos-producto/${id}`);
    return response.data;
  },

  create: async (data: ITipoProductoCreateRequest): Promise<ITipoProducto> => {
    const response = await api.post<ITipoProducto>('/api/owner/tipos-producto', data);
    return response.data;
  },

  update: async (id: number, data: ITipoProductoUpdateRequest): Promise<ITipoProducto> => {
    const response = await api.put<ITipoProducto>(`/api/owner/tipos-producto/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/owner/tipos-producto/${id}`);
  },
};

export const equipoService = {
  getAll: async (): Promise<IEquipo[]> => {
    const response = await api.get<IEquipo[]>('/api/equipos');
    return response.data;
  },

  getById: async (id: number): Promise<IEquipo> => {
    const response = await api.get<IEquipo>(`/api/equipos/${id}`);
    return response.data;
  },

  create: async (data: IEquipoCreateRequest): Promise<IEquipo> => {
    const response = await api.post<IEquipo>('/api/owner/equipos', data);
    return response.data;
  },

  update: async (id: number, data: IEquipoUpdateRequest): Promise<IEquipo> => {
    const response = await api.put<IEquipo>(`/api/owner/equipos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/owner/equipos/${id}`);
  },
};
