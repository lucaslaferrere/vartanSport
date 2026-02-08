import { api } from '@libraries/api';
import { IUser } from '@models/entities/userEntity';
import { IUsuarioComisionConfigRequest } from '@models/request/IComisionRequest';

export const usuarioService = {
    // Solo dueño: obtener todos los vendedores
    getVendedores: async (): Promise<IUser[]> => {
        console.log('🔄 Llamando a GET /api/owner/usuarios/vendedores');
        try {
            const response = await api.get<IUser[]>('/api/owner/usuarios/vendedores');
            console.log('✅ Respuesta recibida:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en getVendedores:', error);
            throw error;
        }
    },

    // Solo dueño: actualizar configuración de comisión de un vendedor
    updateComisionConfig: async (id: number, data: IUsuarioComisionConfigRequest): Promise<IUser> => {
        console.log('🔄 Llamando a PUT /api/owner/usuarios/' + id + '/comision-config', data);
        try {
            const response = await api.put<IUser>(`/api/owner/usuarios/${id}/comision-config`, data);
            console.log('✅ Respuesta recibida:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en updateComisionConfig:', error);
            throw error;
        }
    },

    // Obtener información de mi usuario autenticado
    getMe: async (): Promise<IUser> => {
        console.log('🔄 Llamando a GET /api/me');
        try {
            const response = await api.get<IUser>('/api/me');
            console.log('✅ Respuesta recibida:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en getMe:', error);
            throw error;
        }
    },
};

