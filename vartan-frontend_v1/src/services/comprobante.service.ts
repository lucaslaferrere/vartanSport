import { api } from '@libraries/api';

export interface IComprobante {
  venta_id: number;
  comprobante_url: string;
  fecha_venta: string;
  vendedor: { id: number; nombre: string };
  cliente: { id: number; nombre: string };
  total_final: number;
  revisado: boolean;
  revisado_at: string | null;
}

export interface IComprobantesResponse {
  comprobantes: IComprobante[];
  total: number;
  pendientes: number;
}

export interface IFiltrosComprobantes {
  periodo?: 'hoy' | '7dias' | 'todo';
  vendedor_id?: number;
  solo_pendientes?: boolean;
}

const buildParams = (filtros: IFiltrosComprobantes): string => {
  const params = new URLSearchParams();
  if (filtros.periodo) params.append('periodo', filtros.periodo);
  if (filtros.vendedor_id) params.append('vendedor_id', filtros.vendedor_id.toString());
  if (filtros.solo_pendientes) params.append('solo_pendientes', 'true');
  return params.toString();
};

export const comprobanteService = {
  getAll: async (filtros: IFiltrosComprobantes = {}): Promise<IComprobantesResponse> => {
    const qs = buildParams(filtros);
    const response = await api.get<IComprobantesResponse>(`/api/owner/comprobantes?${qs}`);
    return response.data;
  },

  marcarRevisado: async (ventaId: number, revisado: boolean): Promise<void> => {
    await api.put(`/api/owner/comprobantes/${ventaId}/revisar`, { revisado });
  },

  marcarTodosRevisados: async (ventaIds: number[], revisado: boolean): Promise<void> => {
    await api.put('/api/owner/comprobantes/revisar-todos', { venta_ids: ventaIds, revisado });
  },

  getArchivoBlob: async (ventaId: number): Promise<Blob> => {
    const response = await api.get(`/api/ventas/${ventaId}/comprobante`, { responseType: 'blob' });
    return response.data;
  },

  descargar: async (ventaId: number, nombreArchivo: string): Promise<void> => {
    const blob = await comprobanteService.getArchivoBlob(ventaId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  descargarZip: async (filtros: IFiltrosComprobantes = {}): Promise<void> => {
    const qs = buildParams(filtros);
    const response = await api.get(`/api/owner/comprobantes/descargar?${qs}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'comprobantes.zip');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
