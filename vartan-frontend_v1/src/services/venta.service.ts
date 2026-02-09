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
        console.log('=== DEBUG SERVICIO ===');
        console.log('data.comprobante:', data.comprobante);
        console.log('tipo:', typeof data.comprobante);
        console.log('instanceof File:', data.comprobante instanceof File);
        console.log('is null:', data.comprobante === null);
        console.log('is undefined:', data.comprobante === undefined);
        console.log('=====================');

        // ✅ VALIDACIÓN CORRECTA
        const tieneComprobanteValido =
            data.comprobante !== null &&
            data.comprobante !== undefined &&
            data.comprobante instanceof File;

        console.log('🔍 tieneComprobanteValido:', tieneComprobanteValido);

        if (tieneComprobanteValido) {
            console.log('🔄 Enviando FormData (CON comprobante)');

            const formData = new FormData();
            formData.append('cliente_id', data.cliente_id.toString());
            formData.append('forma_pago_id', data.forma_pago_id.toString());
            formData.append('sena', data.sena.toString());
            if (data.observaciones) {
                formData.append('observaciones', data.observaciones);
            }
            formData.append('detalles', JSON.stringify(data.detalles));
            formData.append('comprobante', data.comprobante as File);


            const response = await api.post<IVentaCreateResponse>('/api/ventas', formData);
            return response.data;
        } else {
            console.log('📤 Enviando JSON (SIN comprobante)');

            // ✅ ENVIAR COMO JSON con números
            const payload = {
                cliente_id: Number(data.cliente_id),
                forma_pago_id: Number(data.forma_pago_id),
                sena: Number(data.sena),
                observaciones: data.observaciones || '',
                detalles: data.detalles
            };
            // El usuario_id se obtiene automáticamente del token JWT en el backend

            const response = await api.post<IVentaCreateResponse>('/api/ventas', payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
    },

    // Solo dueño: obtener todas las ventas
    getAll: async (): Promise<IVenta[]> => {
        try {
            console.log('🔄 Obteniendo todas las ventas (endpoint: /api/owner/ventas)');
            const response = await api.get<IVenta[]>('/api/owner/ventas');
            console.log('✅ Ventas obtenidas:', response.data?.length || 0);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error al obtener ventas:', error);
            console.error('Detalles del error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },

    // Solo dueño: obtener ventas por usuario/vendedor
    getByUsuario: async (usuarioId: number): Promise<IVenta[]> => {
        const response = await api.get<IVenta[]>(`/api/owner/ventas/usuario/${usuarioId}`);
        return response.data;
    },

    // Descargar comprobante
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

