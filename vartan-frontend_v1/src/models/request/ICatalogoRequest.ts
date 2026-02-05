export interface ITipoProductoCreateRequest {
  nombre: string;
}

export interface ITipoProductoUpdateRequest {
  nombre: string;
  activo?: boolean;
}

export interface IEquipoCreateRequest {
  nombre: string;
}

export interface IEquipoUpdateRequest {
  nombre: string;
  activo?: boolean;
}
