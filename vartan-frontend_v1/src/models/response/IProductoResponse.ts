import { IProducto, IProductoStock } from '../entities/productoEntity';

export interface IProductosResponse {
    data: IProducto[];
}

export interface IProductoResponse {
    data: IProducto;
}

export interface IStockResponse {
    data: IProductoStock[];
}