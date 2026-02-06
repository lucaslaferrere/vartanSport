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
    total: number;
    sena: number;
    saldo: number;
    descuento: number;
    total_final: number;
    usa_financiera: boolean;
    comprobante_url?: string | null;
    observaciones?: string | null;
    fecha_venta: string;
    usuario?: IUser;
    cliente?: ICliente;
    forma_pago?: IFormaPago;
    detalles?: IVentaDetalle[];
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