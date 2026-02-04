import { IUser } from './userEntity';

export interface IComision {
    id: number;
    usuario_id: number;
    mes: number;
    anio: number;
    total_ventas: number;
    total_comision: number;
    observaciones?: string;
    usuario?: IUser;
}