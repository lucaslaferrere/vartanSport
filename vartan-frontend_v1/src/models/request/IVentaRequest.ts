
export interface IVentaCreateRequest {
    cliente_id: number;
    forma_pago_id: number;
    sena: number;
    detalles: IVentaDetalleCreateRequest[];
}

export interface IVentaDetalleCreateRequest {
    producto_id: number;
    talle: string;
    cantidad: number;
    precio_unitario: number;
}