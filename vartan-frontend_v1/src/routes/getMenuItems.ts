// Menu items configuration - Updated 2026-02-08 - Force reload v3
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

export const GetMenuItems = (): MenuGroup => {
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
          {
            id: 'comisiones',
            title: 'Comisiones',
            type: 'item',
            url: '/comisiones',
            icon: 'fa-solid fa-dollar-sign',
            breadcrumbs: true
          },
          {
            id: 'gastos',
            title: 'Gastos',
            type: 'item',
            url: '/gastos',
            icon: 'fa-solid fa-receipt',
            breadcrumbs: true
          },
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
