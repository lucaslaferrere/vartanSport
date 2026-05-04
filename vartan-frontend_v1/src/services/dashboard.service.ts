import { api } from '@libraries/api';
import { IDashboardMensual } from '@models/entities/dashboardEntity';

export const dashboardService = {
  getMensual: async (mes?: number, anio?: number): Promise<IDashboardMensual> => {
    const params: Record<string, number> = {};
    if (mes !== undefined) params.mes = mes;
    if (anio !== undefined) params.anio = anio;
    const response = await api.get<IDashboardMensual>('/api/owner/dashboard', { params });
    return response.data;
  },
};
