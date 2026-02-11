import { api } from '@libraries/api';
import { IVenta } from '@models/entities/ventaEntity';
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
            formData.append('sena', data.sena.toString());
            if (data.observaciones) {
                formData.append('observaciones', data.observaciones);
            }
            formData.append('detalles', JSON.stringify(data.detalles));
            formData.append('comprobante', data.comprobante as File);

            const response = await api.post<IVentaCreateResponse>('/api/ventas', formData, {
                headers: {
                    // ✅ Eliminar Content-Type para que axios lo setee automáticamente
                    // con el boundary correcto para multipart/form-data
                    'Content-Type': undefined,
                },
            });
            return response.data;
        } else {
            const payload = {
                cliente_id: Number(data.cliente_id),
                forma_pago_id: Number(data.forma_pago_id),
                sena: Number(data.sena),
                observaciones: data.observaciones || '',
                detalles: data.detalles
            };

            const response = await api.post<IVentaCreateResponse>('/api/ventas', payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
    },

    getAll: async (): Promise<IVenta[]> => {
        const response = await api.get<IVenta[]>('/api/owner/ventas');
        return response.data;
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
};








