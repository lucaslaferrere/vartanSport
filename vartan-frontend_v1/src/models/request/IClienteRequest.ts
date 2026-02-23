export interface IClienteCreateRequest {
    nombre: string;
    dni?: string
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    codigo_postal?: string,
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
    codigo_postal?: string,
    pais?: string;
}