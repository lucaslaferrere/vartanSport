import { api } from '@libraries/api';
import { ITarea, IEmpleado } from '@models/entities/tareaEntity';
import { ITareaCreateRequest, ITareaUpdateRequest } from '@models/request/ITareaRequest';

export const tareaService = {
    // Obtener tareas (todas para dueño, solo las propias para vendedor)
    getAll: async (): Promise<ITarea[]> => {
        const response = await api.get<ITarea[]>('/api/tareas');
        return response.data;
    },

    // Obtener tareas de un empleado específico (solo dueño)
    getByEmpleado: async (empleadoId: number): Promise<ITarea[]> => {
        const response = await api.get<ITarea[]>(`/api/tareas/empleado/${empleadoId}`);
        return response.data;
    },

    // Crear nueva tarea
    create: async (data: ITareaCreateRequest): Promise<ITarea> => {
        const response = await api.post<ITarea>('/api/tareas', data);
        return response.data;
    },

    // Actualizar tarea
    update: async (id: number, data: ITareaUpdateRequest): Promise<ITarea> => {
        const response = await api.patch<ITarea>(`/api/tareas/${id}`, data);
        return response.data;
    },

    // Eliminar tarea
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/tareas/${id}`);
    },

    // Obtener lista de empleados (solo dueño)
    getEmpleados: async (): Promise<IEmpleado[]> => {
        const response = await api.get<IEmpleado[]>('/api/owner/usuarios/vendedores');
        return response.data;
    },
};

