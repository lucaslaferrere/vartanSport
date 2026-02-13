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
  // Menú base (común para todos los roles)
  menuItems: [
    { label: 'Dashboard', icon: 'fa-solid fa-chart-line', path: '/dashboard' },
    { label: 'Productos', icon: 'fa-solid fa-box', path: '/productos' },
    { label: 'Ventas', icon: 'fa-solid fa-cart-shopping', path: '/ventas' },
    { label: 'Clientes', icon: 'fa-solid fa-users', path: '/clientes' },
    { label: 'Pedidos', icon: 'fa-solid fa-truck', path: '/pedidos' },
    { label: 'Comisiones', icon: 'fa-solid fa-dollar-sign', path: '/comisiones' },
    { label: 'Gastos', icon: 'fa-solid fa-receipt', path: '/gastos' },
    { label: 'Tareas', icon: 'fa-solid fa-list-check', path: '/tareas' },
  ],
  // Función para obtener menú según rol
  getMenuByRole: (userRole?: 'dueño' | 'vendedor') => {
    const commonItems = [
      { label: 'Dashboard', icon: 'fa-solid fa-chart-line', path: '/dashboard' },
      { label: 'Productos', icon: 'fa-solid fa-box', path: '/productos' },
      { label: 'Ventas', icon: 'fa-solid fa-cart-shopping', path: '/ventas' },
      { label: 'Clientes', icon: 'fa-solid fa-users', path: '/clientes' },
      { label: 'Pedidos', icon: 'fa-solid fa-truck', path: '/pedidos' },
    ];

    const isOwner = userRole === 'dueño' || !userRole;

    // Items específicos según rol
    const roleSpecificItems = isOwner
      ? [{ label: 'Comisiones', icon: 'fa-solid fa-dollar-sign', path: '/comisiones' }]
      : [{ label: 'Mi Comisión', icon: 'fa-solid fa-wallet', path: '/mi-comision' }];

    // Gastos solo para dueños
    const gastosItem = isOwner
      ? [{ label: 'Gastos', icon: 'fa-solid fa-receipt', path: '/gastos' }]
      : [];

    const endItems = [
      ...gastosItem,
      { label: 'Tareas', icon: 'fa-solid fa-list-check', path: '/tareas' },
    ];

    return [...commonItems, ...roleSpecificItems, ...endItems];
  },
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

