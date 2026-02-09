import { ICliente } from '../entities/clienteEntity';

export interface IClientesResponse {
    data: ICliente[];
}

export interface IClienteResponse {
    data: ICliente;
}