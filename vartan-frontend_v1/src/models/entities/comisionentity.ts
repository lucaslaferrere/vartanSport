import { IUser } from './userEntity';

export interface IComision {
    id: number;
    usuario_id: number;
    mes: number;
    anio: number;
    total_ventas: number;
    gasto_publicitario: number;     // Gasto publicitario descontado
    base_comision: number;          // Total ventas - gasto publicitario
    porcentaje_comision: number;    // Porcentaje aplicado
    total_comision: number;         // Monto final de la comisión
    sueldo: number;                 // Sueldo base registrado
    observaciones?: string;
    usuario?: IUser;
}