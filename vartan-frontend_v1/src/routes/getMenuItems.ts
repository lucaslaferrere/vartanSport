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

export const GetMenuItems = (userRole?: string): MenuGroup => {
  // Dueño y demo ven todo. Solo vendedor ve menos.
  const isOwner = userRole !== 'vendedor';

  return {
    items: [
      {
        id: 'navigation',
        title: 'Navegaci\u00f3n',
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
          ...(isOwner ? [{
            id: 'comisiones',
            title: 'Comisiones',
            type: 'item' as const,
            url: '/comisiones',
            icon: 'fa-solid fa-dollar-sign',
            breadcrumbs: true
          }] : []),
          ...(!isOwner ? [{
            id: 'mi-comision',
            title: 'Mi Comisi\u00f3n',
            type: 'item' as const,
            url: '/mi-comision',
            icon: 'fa-solid fa-wallet',
            breadcrumbs: true
          }] : []),
          ...(isOwner ? [{
            id: 'gastos',
            title: 'Gastos',
            type: 'item' as const,
            url: '/gastos',
            icon: 'fa-solid fa-receipt',
            breadcrumbs: true
          }] : []),
          ...(isOwner ? [{
            id: 'comprobantes',
            title: 'Comprobantes',
            type: 'item' as const,
            url: '/comprobantes',
            icon: 'fa-solid fa-file-invoice',
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
