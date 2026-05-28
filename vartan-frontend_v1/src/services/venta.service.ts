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

        const endpoint = isVendedor ? '/api/mis-ventas' : '/api/owner/ventas';
        const response = await api.get<IVenta[]>(endpoint);
        return response.data;
    },

    getFormasPago: async (): Promise<IFormaPago[]> => {
        const response = await api.get<IFormaPago[]>('/api/formas-pago');
        return response.data;
    },

    getAllPaginated: async (_page: number, _pageSize: number, _filters: Record<string, string> = {}): Promise<{ ventas: IVenta[]; total: number }> => {
        const response = await api.get<IVenta[]>('/api/owner/ventas');
        const ventas = response.data;
        return { ventas, total: ventas.length };
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
        // Agrego Pagos Pendiente
        getPendientes: async (): Promise<IVenta[]> => {
    const response = await api.get<IVenta[]>('/api/ventas-pendientes');
    return response.data;
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




