export interface ITareaCreateRequest {
    titulo: string;
    descripcion?: string;
    empleado_id?: number; // Opcional, si no se envía usa el usuario autenticado
}

export interface ITareaUpdateRequest {
    titulo?: string;
    descripcion?: string;
    completada?: boolean;
}

