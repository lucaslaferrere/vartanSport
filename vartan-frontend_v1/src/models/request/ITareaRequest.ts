export interface ITareaCreateRequest {
    titulo: string;
    descripcion?: string;
    empleado_id?: number; 
}

export interface ITareaUpdateRequest {
    titulo?: string;
    descripcion?: string;
    completada?: boolean;
}



