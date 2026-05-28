export interface IProductoCreateRequest {
  nombre: string;
  costo_unitario: number;
  talles?: string[];
}

export interface IProductoUpdateRequest {
  nombre: string;
  costo_unitario: number;
  talles?: string[];
  activo?: boolean;
}

export interface IStockCantidadPorTalle {
  talle: string;
  cantidad: number;
}

export interface IStockCreateRequest {
  producto_id: number;
  cantidades_por_talle: IStockCantidadPorTalle[];
}

export interface IStockUpdateRequest {
  cantidad: number;
}
