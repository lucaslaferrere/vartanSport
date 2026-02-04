import { CategoriaGasto, MetodoPagoGasto } from '../entities/gastoEntity';

export interface IGastoCreateRequest {
    descripcion: string;
    monto: number;
    fecha: string; // formato "YYYY-MM-DD"
    categoria: CategoriaGasto;
    proveedor?: string;
    metodo_pago?: MetodoPagoGasto;
    comprobante?: string;
    notas?: string;
}

export interface IGastoUpdateRequest {
    descripcion: string;
    monto: number;
    fecha: string;
    categoria: CategoriaGasto;
    proveedor?: string;
    metodo_pago?: MetodoPagoGasto;
    comprobante?: string;
    notas?: string;
}

export interface IGastosFilters {
    categoria?: CategoriaGasto;
    fecha_desde?: string;
    fecha_hasta?: string;
    proveedor?: string;
    page?: number;
    limit?: number;
}

