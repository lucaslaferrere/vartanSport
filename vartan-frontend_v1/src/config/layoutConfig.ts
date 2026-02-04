export const layoutConfig = {
  drawer: {
    width: 280,
    widthCollapsed: 80,
  },
  header: {
    height: 64,
  },
  logos: {
    expanded: '/icono.png',
    collapsed: '/iconoSmall.png',
  },
  menuItems: [
    { label: 'Dashboard', icon: 'fa-solid fa-chart-line', path: '/dashboard' },
    { label: 'Productos', icon: 'fa-solid fa-box', path: '/productos' },
    { label: 'Ventas', icon: 'fa-solid fa-cart-shopping', path: '/ventas' },
    { label: 'Clientes', icon: 'fa-solid fa-users', path: '/clientes' },
    { label: 'Pedidos', icon: 'fa-solid fa-truck', path: '/pedidos' },
    { label: 'Comisiones', icon: 'fa-solid fa-dollar-sign', path: '/comisiones' },
    { label: 'Gastos', icon: 'fa-solid fa-receipt', path: '/gastos' },
  ],
};

export const gastosConfig = {
  categorias: [
    { value: 'Proveedor', label: 'Proveedor' },
    { value: 'Alquiler', label: 'Alquiler' },
    { value: 'Mercaderia', label: 'Mercadería' },
    { value: 'Servicios', label: 'Servicios' },
    { value: 'Otros', label: 'Otros' },
  ],
  metodosPago: [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Tarjeta', label: 'Tarjeta' },
  ],
  tabs: [
    { id: 'gastos', label: 'Gastos', color: 'default' as const },
    { id: 'recurrentes', label: 'Gastos Recurrentes', color: 'warning' as const },
    { id: 'pendientes', label: 'Pendientes', color: 'error' as const },
  ],
};

export default layoutConfig;

