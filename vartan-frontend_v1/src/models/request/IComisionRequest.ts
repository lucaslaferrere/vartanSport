export interface IComisionObservacionesRequest {
    observaciones: string;
}

export interface IUsuarioComisionConfigRequest {
    porcentaje_comision: number;
    gasto_publicitario: number;
    sueldo: number;
    observaciones?: string;
}
