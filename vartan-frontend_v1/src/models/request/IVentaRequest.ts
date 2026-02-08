
export interface IVentaCreateRequest {
    usuario_id?: number; // Opcional - para que el dueño pueda asignar ventas a vendedores específicos
    cliente_id: number;
    forma_pago_id: number;
    sena: number;
    usa_financiera?: boolean; // Opcional, el backend lo calcula automáticamente
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