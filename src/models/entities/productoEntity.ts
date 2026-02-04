export interface IProducto {
    id: number;
    nombre: string;
    costo_unitario: number;
    activo: boolean;
    fecha_creacion: string;
}

export interface IProductoStock {
    id: number;
    producto_id: number;
    producto?: IProducto;
    talle: string;
    cantidad: number;
}