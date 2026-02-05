import { TalleEnum } from '@models/enums/TalleEnum';
import { ColorEnum } from '@models/enums/ColorEnum';

export interface IProductoCreateRequest {
    nombre: string;
    costo_unitario: number;
    talles?: TalleEnum[];
    colores?: ColorEnum[];
    tipo_producto_id?: number;
    equipo_id?: number;
}

export interface IProductoUpdateRequest {
    nombre: string;
    costo_unitario: number;
    talles?: TalleEnum[];
    colores?: ColorEnum[];
    activo?: boolean;
    tipo_producto_id?: number;
    equipo_id?: number;
}

export interface IStockCreateRequest {
    producto_id: number;
    talles: TalleEnum[];
    colores: ColorEnum[];
    cantidad: number;
}

export interface IStockUpdateRequest {
    cantidad: number;
}