export interface IProductoCreateRequest {
    nombre: string;
    costo_unitario: number;
}

export interface IProductoUpdateRequest {
    nombre: string;
    costo_unitario: number;
}

export interface IStockCreateRequest {
    producto_id: number;
    talle: string;
    cantidad: number;
}

export interface IStockUpdateRequest {
    cantidad: number;
}