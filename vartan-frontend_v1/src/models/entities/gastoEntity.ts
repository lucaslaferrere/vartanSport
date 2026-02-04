export type CategoriaGasto = 'Proveedor' | 'Alquiler' | 'Mercadería' | 'Servicios' | 'Otros';
export type MetodoPagoGasto = 'Efectivo' | 'Transferencia' | 'Tarjeta' | '';

export interface IGasto {
    id: number;
    descripcion: string;
    monto: number;
    fecha: string;
    categoria: CategoriaGasto;
    proveedor: string;
    metodo_pago: MetodoPagoGasto;
    comprobante: string;
    notas: string;
    cliente_id: number;
    usuario_id: number;
    created_at: string;
    updated_at: string;
}

export interface IGastoResumen {
    categoria: string;
    total: number;
    cantidad: number;
}

export interface IGastoPorMes {
    mes: number;
    anio: number;
    total: number;
    cantidad: number;
}

