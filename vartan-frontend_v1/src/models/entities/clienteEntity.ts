export interface ICliente {
    id: number;
    nombre: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    fecha_creacion: string;
}