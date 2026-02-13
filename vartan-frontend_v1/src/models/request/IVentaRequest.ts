
export interface IVentaCreateRequest {
    usuario_id?: number;
    cliente_id: number;
    forma_pago_id: number;
    precio_venta: number;
    sena: number;
    usa_descuento_financiera?: boolean;
    comprobante?: File | null;
    observaciones?: string;
    detalles: IVentaDetalleCreateRequest[];
}

export interface IVentaDetalleCreateRequest {
    producto_id: number;
    talle: string;
    cantidad: number;
    precio_unitario: number;
}