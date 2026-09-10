export interface IDashboardDia {
  dia: string;
  actual: number;
  anterior: number;
}

export interface IDashboardProducto {
  nombre: string;
  cantidad: number;
  facturacion: number;
  precio_promedio: number;
}

export interface IDashboardMetodoPago {
  nombre: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
}

export interface IDashboardVendedor {
  nombre: string;
  ventas: number;
  facturacion: number;
}

export interface IDashboardVentaReciente {
  id: number;
  fecha_venta: string;
  cliente: string;
  primer_producto: string;
  cantidad_items: number;
  forma_pago: string;
  total: number;
  saldo: number;
}

export interface IDashboardPrevMetrics {
  cantidad_ventas: number;
  facturacion: number;
  ticket_promedio: number;
}

export interface IDashboardMensual {
  mes: number;
  anio: number;
  cantidad_ventas: number;
  facturacion: number;
  ganancia_real: number;
  costo_productos: number;
  publicidad: number;
  comision_vendedores: number;
  gastos_fijos: number;
  ganancia_neta: number;
  margen: number;
  margen_porcentaje: number;
  fecha_inicio: string;
  fecha_fin: string;

  daily: IDashboardDia[];
  top_productos: IDashboardProducto[];
  metodos_pago: IDashboardMetodoPago[];
  vendedores: IDashboardVendedor[];
  ventas_recientes: IDashboardVentaReciente[];
  prev_metrics: IDashboardPrevMetrics;
}
