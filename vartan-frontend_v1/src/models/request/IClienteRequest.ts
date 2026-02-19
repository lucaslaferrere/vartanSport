export interface IClienteCreateRequest {
    nombre: string;
    dni?: string
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
}

export interface IClienteUpdateRequest {
    nombre: string;
    dni?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
}