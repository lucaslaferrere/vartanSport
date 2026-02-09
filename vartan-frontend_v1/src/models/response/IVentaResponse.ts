import { IVenta, IFormaPago } from '../entities/ventaEntity';

export interface IVentasResponse {
    data: IVenta[];
}

export interface IVentaResponse {
    data: IVenta;
}

export interface IFormasPagoResponse {
    data: IFormaPago[];
}