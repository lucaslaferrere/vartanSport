import { api } from '@libraries/api';
import { IComision } from '@models/entities/comisionentity';
import { IComisionObservacionesRequest } from '@models/request/IComisionRequest';

interface ICalcularComisionesResponse {
    message: string;
    comisiones: IComision[];
}

export interface IConfiguracionComision {
    porcentaje_comision: number;
    gasto_publicitario: number;
    sueldo_base: number;
    observaciones: string;
}

export interface IMesActualComision {
    mes?: number;
    anio?: number;
    total_ventas: number;
    cantidad_ventas: number;
    comision_bruta?: number;
    gasto_publicitario?: number;
    comision_neta: number;
    sueldo_base: number;
    total_a_cobrar: number;
    comision_registrada?: boolean;
    observaciones_comision?: string;
}

export interface IHistorialComision {
    id: number;
    usuario_id: number;
    mes: number;
    anio: number;
    total_ventas: number;
    total_comision: number;
    sueldo: number;
    observaciones: string;
}

export interface IMiResumenComision {
    usuario: {
        id: number;
        nombre: string;
        email: string;
        rol: string;
    };
    configuracion: IConfiguracionComision;
    mes_actual: IMesActualComision;
    historial: IHistorialComision[];
}

export const comisionService = {
    // Para empleados/vendedores: ver MI resumen (solo lectura)
    getMiResumen: async (): Promise<IMiResumenComision> => {
        console.log('📡 comisionService.getMiResumen() - Iniciando petición');
        console.log('📍 Endpoint:', '/api/mi-resumen-comision');
        const response = await api.get<IMiResumenComision>('/api/mi-resumen-comision');
        console.log('✅ comisionService.getMiResumen() - Respuesta:', response.data);
        return response.data;
    },

    // Obtener mis comisiones (usuario autenticado)
    getMisComisiones: async (): Promise<IComision[]> => {
        const response = await api.get<IComision[]>('/api/mis-comisiones');
        return response.data;
    },

    // Solo dueño: obtener todas las comisiones
    getAll: async (): Promise<IComision[]> => {
        const response = await api.get<IComision[]>('/api/owner/comisiones');
        return response.data;
    },

    // Solo dueño: obtener comisiones por usuario
    getByUsuario: async (usuarioId: number): Promise<IComision[]> => {
        const response = await api.get<IComision[]>(`/api/owner/comisiones/usuario/${usuarioId}`);
        return response.data;
    },

    // Solo dueño: calcular comisiones del mes
    calcularComisiones: async (): Promise<ICalcularComisionesResponse> => {
        const response = await api.post<ICalcularComisionesResponse>('/api/owner/comisiones/calcular');
        return response.data;
    },

    // Solo dueño: actualizar observaciones de una comisión
    updateObservaciones: async (id: number, data: IComisionObservacionesRequest): Promise<IComision> => {
        const response = await api.put<IComision>(`/api/owner/comisiones/${id}/observaciones`, data);
        return response.data;
    },
};

