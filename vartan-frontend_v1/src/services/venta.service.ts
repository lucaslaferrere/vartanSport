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

            // Asegurar que sena sea un número válido
            const senaValue = Number(data.sena);
            formData.append('sena', (isNaN(senaValue) ? 0 : senaValue).toString());

            if (data.observaciones) {
                formData.append('observaciones', data.observaciones);
            }
            formData.append('detalles', JSON.stringify(data.detalles));
            formData.append('comprobante', data.comprobante as File);

            console.log('📤 Enviando venta con comprobante (FormData)');
            console.log('  cliente_id:', data.cliente_id);
            console.log('  forma_pago_id:', data.forma_pago_id);
            console.log('  sena:', isNaN(senaValue) ? 0 : senaValue);
            console.log('  comprobante:', data.comprobante.name);

            const response = await api.post<IVentaCreateResponse>('/api/ventas', formData, {
                headers: {
                    // ✅ Eliminar Content-Type para que axios lo setee automáticamente
                    // con el boundary correcto para multipart/form-data
                    'Content-Type': undefined,
                },
            });
            return response.data;
        } else {
            // Sin comprobante, enviar como JSON
            const senaValue = Number(data.sena);
            const payload = {
                cliente_id: Number(data.cliente_id),
                forma_pago_id: Number(data.forma_pago_id),
                sena: isNaN(senaValue) ? 0 : senaValue, // Asegurar que sea un número válido
                observaciones: data.observaciones || '',
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








