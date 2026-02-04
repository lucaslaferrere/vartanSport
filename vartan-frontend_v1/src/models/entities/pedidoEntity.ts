import { IVenta } from './ventaEntity';

export interface IPedido {
    id: number;
    venta_id: number;
    estado: 'pendiente' | 'despachado' | 'cancelado';
    fecha_creacion: string;
    fecha_actualizacion: string;
    venta?: IVenta;
}