import { IGasto, IGastoResumen, IGastoPorMes } from '../entities/gastoEntity';

export interface IListarGastosResponse {
    gastos: IGasto[];
    total: number;
    page: number;
    limit: number;
}

export interface ICrearGastoResponse {
    message: string;
    gasto: IGasto;
}

export interface IActualizarGastoResponse {
    message: string;
    gasto: IGasto;
}

export interface IEliminarGastoResponse {
    message: string;
}

export type IResumenGastosResponse = IGastoResumen[];

export type IGastosPorMesResponse = IGastoPorMes[];

export type IProveedoresResponse = string[];

