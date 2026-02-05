import { TalleEnum } from '@models/enums/TalleEnum';
import { ColorEnum } from '@models/enums/ColorEnum';
import { ITipoProducto, IEquipo } from '@models/entities/catalogoEntity';

export interface IProducto {
    id: number;
    nombre: string;
    costo_unitario: number;
    activo: boolean;
    fecha_creacion: string;
    talles_disponibles?: TalleEnum[];
    colores_disponibles?: ColorEnum[];
    stock_total?: number;
    tipo_producto_id?: number;
    equipo_id?: number;
    tipo_producto?: ITipoProducto;
    equipo?: IEquipo;
}

export interface IProductoStock {
    id: number;
    producto_id: number;
    producto?: IProducto;
    talle: TalleEnum;
    color?: ColorEnum;
    cantidad: number;
}