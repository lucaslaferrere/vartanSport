export interface ICliente {
    id: number;
    nombre: string;
    dni?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    codigo_postal?: string
    pais?: string;
    fecha_creacion: string;
}