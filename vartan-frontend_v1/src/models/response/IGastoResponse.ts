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

export interface IResumenGastosResponse {
    total: number;
    cantidad: number;
    por_categoria: IGastoResumen[];
    fecha_desde?: string;
    fecha_hasta?: string;
}

export interface IGastosPorMesResponse {
    anio: string;
    meses: IGastoPorMes[];
}

export type IProveedoresResponse = string[];

