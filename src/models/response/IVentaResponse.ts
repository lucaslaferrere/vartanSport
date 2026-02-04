import { IVenta, IFormaPago } from '../entities/venta.entity';

export interface IVentasResponse {
    data: IVenta[];
}

export interface IVentaResponse {
    data: IVenta;
}

export interface IFormasPagoResponse {
    data: IFormaPago[];
}