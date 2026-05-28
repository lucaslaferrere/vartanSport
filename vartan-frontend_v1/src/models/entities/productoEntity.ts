export interface IStockPorTalle {
  talle: string;
  cantidad: number;
}

export interface IProducto {
  id: number;
  nombre: string;
  costo_unitario?: number;
  activo: boolean;
  fecha_creacion: string;
  talles_disponibles?: string[];
  stock_total?: number;
  stock_por_talle?: IStockPorTalle[];
}

export interface IProductoStock {
  id: number;
  producto_id: number;
  producto?: IProducto;
  talle: string;
  cantidad: number;
}

export interface IStockPorTalleResponse {
  producto_id: number;
  producto_nombre: string;
  stock_total: number;
  stock_por_talle: IStockPorTalle[];
}
