export interface IMenuItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  url?: string;
  icon?: any;
  caption?: string;
  breadcrumbs?: boolean;
  disabled?: boolean;
  external?: boolean;
  target?: boolean;
  chip?: {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  };
  children?: IMenuItem[];
}

export interface MenuGroup {
  items: IMenuItem[];
}

export const GetMenuItems = (userRole?: 'dueño' | 'vendedor'): MenuGroup => {
  const isDueño = userRole === 'dueño' || !userRole; // Por defecto es dueño si no se especifica

  return {
    items: [
      {
        id: 'navigation',
        title: 'Navegación',
        type: 'group',
        children: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'item',
            url: '/dashboard',
            icon: 'fa-solid fa-house',
            breadcrumbs: false
          },
          {
            id: 'productos',
            title: 'Productos',
            type: 'item',
            url: '/productos',
            icon: 'fa-solid fa-box',
            breadcrumbs: true
          },
          {
            id: 'ventas',
            title: 'Ventas',
            type: 'item',
            url: '/ventas',
            icon: 'fa-solid fa-cart-shopping',
            breadcrumbs: true
          },
          {
            id: 'clientes',
            title: 'Clientes',
            type: 'item',
            url: '/clientes',
            icon: 'fa-solid fa-users',
            breadcrumbs: true
          },
          {
            id: 'pedidos',
            title: 'Pedidos',
            type: 'item',
            url: '/pedidos',
            icon: 'fa-solid fa-clipboard-list',
            breadcrumbs: true
          },
          // Mostrar "Comisiones" solo para dueños
          ...(isDueño ? [{
            id: 'comisiones',
            title: 'Comisiones',
            type: 'item' as const,
            url: '/comisiones',
            icon: 'fa-solid fa-dollar-sign',
            breadcrumbs: true
          }] : []),
          // Mostrar "Mi Comisión" solo para vendedores
          ...(!isDueño ? [{
            id: 'mi-comision',
            title: 'Mi Comisión',
            type: 'item' as const,
            url: '/mi-comision',
            icon: 'fa-solid fa-wallet',
            breadcrumbs: true
          }] : []),
          ...(isDueño ? [{
            id: 'gastos',
            title: 'Gastos',
            type: 'item' as const,
            url: '/gastos',
            icon: 'fa-solid fa-receipt',
            breadcrumbs: true
          }] : []),
          {
            id: 'tareas',
            title: 'Tareas',
            type: 'item',
            url: '/tareas',
            icon: 'fa-solid fa-list-check',
            breadcrumbs: true
          }
        ]
      }
    ]
  };
};
