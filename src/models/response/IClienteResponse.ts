import { ICliente } from '../entities/cliente.entity';

export interface IClientesResponse {
    data: ICliente[];
}

export interface IClienteResponse {
    data: ICliente;
}