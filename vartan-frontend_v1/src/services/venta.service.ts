import { api } from '@libraries/api';
import { IVenta, IPagoVenta, IFormaPago } from '@models/entities/ventaEntity';
import { IVentaCreateRequest } from '@models/request/IVentaRequest';

interface IVentaCreateResponse {
    message: string;
    venta: IVenta;
}

export const ventaService = {
    getMisVentas: async (): Promise<IVenta[]> => {
        const response = await api.get<IVenta[]>('/api/mis-ventas');
        return response.data;
    },

    create: async (data: IVentaCreateRequest): Promise<IVentaCreateResponse> => {
        const tieneComprobanteValido =
            data.comprobante !== null &&
            data.comprobante !== undefined &&
            data.comprobante instanceof File;

        if (tieneComprobanteValido) {
            const formData = new FormData();
            formData.append('cliente_id', data.cliente_id.toString());
            formData.append('forma_pago_id', data.forma_pago_id.toString());
            formData.append('precio_venta', data.precio_venta.toString());

            const senaValue = Number(data.sena);
            formData.append('sena', (isNaN(senaValue) ? 0 : senaValue).toString());

            if (data.usa_descuento_financiera !== undefined) {
                formData.append('usa_descuento_financiera', data.usa_descuento_financiera.toString());
            }

            if (data.observaciones) {
                formData.append('observaciones', data.observaciones);
            }
            if (data.transporte) {
                formData.append('transporte', data.transporte);
            }
            formData.append('detalles', JSON.stringify(data.detalles));
            formData.append('comprobante', data.comprobante as File);


            const response = await api.post<IVentaCreateResponse>('/api/ventas', formData, {
                headers: {

                    'Content-Type': undefined,
                },
            });
            return response.data;
        } else {
            const senaValue = Number(data.sena);
            const payload = {
                cliente_id: Number(data.cliente_id),
                forma_pago_id: Number(data.forma_pago_id),
                precio_venta: Number(data.precio_venta),
                sena: isNaN(senaValue) ? 0 : senaValue,
                usa_descuento_financiera: data.usa_descuento_financiera || false,
                observaciones: data.observaciones || '',
                transporte: data.transporte || '',
                detalles: data.detalles
            };

            console.log('📤 Enviando venta sin comprobante:', JSON.stringify(payload, null, 2));

            const response = await api.post<IVentaCreateResponse>('/api/ventas', payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
    },

    getAll: async (): Promise<IVenta[]> => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const user = userStr ? JSON.parse(userStr) : null;
        const isVendedor = user?.rol === 'vendedor';

        if (isVendedor) {
            const response = await api.get<IVenta[]>('/api/mis-ventas');
            return response.data;
        }
        const response = await api.get<{ ventas: IVenta[]; total: number }>('/api/owner/ventas');
        return response.data.ventas;
    },

    getAllUnpaginated: async (): Promise<IVenta[]> => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const user = userStr ? JSON.parse(userStr) : null;
        const isVendedor = user?.rol === 'vendedor';

        if (isVendedor) {
            const response = await api.get<IVenta[]>('/api/mis-ventas');
            return response.data;
        }

        const limit = 200;
        let page = 1;
        let all: IVenta[] = [];
        let total = Infinity;
        while (all.length < total) {
            const { ventas, total: t } = await ventaService.getAllPaginated(page, limit);
            all = [...all, ...ventas];
            total = t;
            page++;
            if (ventas.length === 0) break;
        }
        return all;
    },

    getFormasPago: async (): Promise<IFormaPago[]> => {
        const response = await api.get<IFormaPago[]>('/api/formas-pago');
        return response.data;
    },

    getAllPaginated: async (page: number, pageSize: number, filters: Record<string, string> = {}): Promise<{ ventas: IVenta[]; total: number }> => {
        const params = new URLSearchParams({ page: String(page), limit: String(pageSize), ...filters });
        const response = await api.get<{ ventas: IVenta[]; total: number }>(`/api/owner/ventas?${params.toString()}`);
        return { ventas: response.data.ventas, total: response.data.total };
    },

    getByUsuario: async (usuarioId: number): Promise<IVenta[]> => {
        const response = await api.get<IVenta[]>(`/api/owner/ventas/usuario/${usuarioId}`);
        return response.data;
    },

    descargarComprobante: async (ventaId: number, nombreArchivo: string): Promise<void> => {
        const response = await api.get(`/api/ventas/${ventaId}/comprobante`, {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nombreArchivo);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    // Registrar un pago parcial (nueva API multi-pago)
    registrarPago: async (ventaId: number, monto: number, formaPagoId?: number, comprobante?: File): Promise<IPagoVenta> => {
        const formData = new FormData();
        formData.append('monto', monto.toString());

        if (formaPagoId) {
            formData.append('forma_pago_id', formaPagoId.toString());
        }

        if (comprobante) {
            formData.append('comprobante', comprobante);
        }

        const response = await api.post<IPagoVenta>(`/api/ventas/${ventaId}/pagos`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Listar pagos parciales de una venta
    getPagos: async (ventaId: number): Promise<IPagoVenta[]> => {
        const response = await api.get<IPagoVenta[]>(`/api/ventas/${ventaId}/pagos`);
        return response.data;
    },

    // Obtener el detalle completo de una venta (incluye pagos)
    getById: async (ventaId: number): Promise<IVenta> => {
        const response = await api.get<IVenta>(`/api/ventas/${ventaId}`);
        return response.data;
    },

    delete: async (ventaId: number): Promise<void> => {
        await api.delete(`/api/ventas/${ventaId}`);
    },
        getPendientes: async (): Promise<IVenta[]> => {
        const response = await api.get<IVenta[]>('/api/ventas-pendientes');
        return response.data;
    },

    getPendientesPaginated: async (page: number, limit: number): Promise<{ ventas: IVenta[]; total: number }> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.get<any>(`/api/ventas-pendientes?${params.toString()}`);
        // Soporta respuesta paginada { ventas, total } y respuesta legacy IVenta[]
        if (Array.isArray(response.data)) {
            const all: IVenta[] = response.data;
            const start = (page - 1) * limit;
            return { ventas: all.slice(start, start + limit), total: all.length };
        }
        return response.data as { ventas: IVenta[]; total: number };
    },

updateTransporte: async (ventaId: number, transporte: string): Promise<void> => {
    await api.put(`/api/ventas/${ventaId}`, { transporte });
},

updateDetalles: async (id: number, data: {
  precio_venta: number;
  transporte?: string;
  sena?: number;
  usa_descuento_financiera: boolean;
  observaciones?: string;
  detalles: Array<{
    producto_id: number;
    talle: string;
    cantidad: number;
    precio_unitario: number;
  }>;
}): Promise<IVenta> => {
  const response = await api.put<IVenta>(`/api/ventas/${id}/detalles`, data);
  return response.data;
},

};




