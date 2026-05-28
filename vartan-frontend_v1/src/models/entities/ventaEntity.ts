import { IUser } from './userEntity';
import { ICliente } from './clienteEntity';
import { IProducto } from './productoEntity';

export interface IFormaPago {
    id: number;
    nombre: string;
}

export interface IVenta {
    id: number;
    usuario_id: number;
    cliente_id: number;
    forma_pago_id: number;
    forma_pago_saldo_id?: number;
    transporte?: string;
    costo: number;
    precio_venta: number;
    ganancia: number;
    total: number;
    sena: number;
    sena_inicial?: number;
    saldo: number;
    descuento: number;
    total_final: number;
    usa_financiera: boolean;
    comprobante_url?: string | null;
    comprobante_saldo_url?: string | null;
    observaciones?: string | null;
    fecha_venta: string;
    usuario?: IUser;
    cliente?: ICliente;
    forma_pago?: IFormaPago;
    forma_pago_saldo?: IFormaPago;
    detalles?: IVentaDetalle[];
    pagos?: IPagoVenta[];
}

export interface IVentaDetalle {
    id: number;
    venta_id: number;
    producto_id: number;
    talle: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    producto?: IProducto;
}

export interface IPagoVenta {
    id: number;
    venta_id: number;
    monto: number;
    forma_pago_id?: number | null;
    forma_pago?: IFormaPago | null;
    comprobante_url?: string | null;
    fecha?: string;
    revisado: boolean;
    revisado_at?: string | null;
    created_at: string;
    updated_at?: string;
}