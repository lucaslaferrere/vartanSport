export interface ITarea {
    id: number;
    titulo: string;
    descripcion?: string;
    completada: boolean;
    empleado_id: number;
    empleado_nombre: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface IEmpleado {
    id: number;
    nombre: string;
    email: string;
    total_tareas?: number;
    tareas_completadas?: number;
    tareas_pendientes?: number;
}

