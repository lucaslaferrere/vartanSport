import {
    homeRoute,
    dashboardRoute,
    productosRoute,
    ventasRoute,
    clientesRoute,
    pedidosRoute,
    comisionesRoute,
    gastosRoute,
    tareasRoute
} from "@routes/router";

export interface IBreadcrumbItem {
    id: string;
    title: string;
    url: string;
    icon: string;
    father: string | null;
}

const items: IBreadcrumbItem[] = [
    {
        id: "inicio",
        title: "Inicio",
        url: homeRoute(),
        icon: "fa-solid fa-home",
        father: null,
    },
    {
        id: "dashboard",
        title: "Dashboard",
        url: dashboardRoute(),
        icon: "fa-solid fa-chart-line",
        father: null,
    },
    {
        id: "productos",
        title: "Productos",
        url: productosRoute(),
        icon: "fa-solid fa-box",
        father: null,
    },
    {
        id: "ventas",
        title: "Ventas",
        url: ventasRoute(),
        icon: "fa-solid fa-cart-shopping",
        father: null,
    },
    {
        id: "clientes",
        title: "Clientes",
        url: clientesRoute(),
        icon: "fa-solid fa-users",
        father: null,
    },
    {
        id: "pedidos",
        title: "Pedidos",
        url: pedidosRoute(),
        icon: "fa-solid fa-truck",
        father: null,
    },
    {
        id: "comisiones",
        title: "Comisiones",
        url: comisionesRoute(),
        icon: "fa-solid fa-dollar-sign",
        father: null,
    },
    {
        id: "gastos",
        title: "Gastos",
        url: gastosRoute(),
        icon: "fa-solid fa-receipt",
        father: null,
    },
    {
        id: "tareas",
        title: "Tareas",
        url: tareasRoute(),
        icon: "fa-solid fa-list-check",
        father: null,
    }
];

export function GetBreadcrumbs(path: string): IBreadcrumbItem[] {
    const breadcrumbs: IBreadcrumbItem[] = [];
    const currentItem = items.find(item => path.startsWith(item.url));

    // Debug temporal
    console.log('🔍 GetBreadcrumbs - Path:', path);
    console.log('🔍 GetBreadcrumbs - Items disponibles:', items.map(i => ({ id: i.id, url: i.url, title: i.title })));
    console.log('🔍 GetBreadcrumbs - Item encontrado:', currentItem);

    if (!currentItem) {
        return breadcrumbs;
    }

    breadcrumbs.unshift(currentItem);

    let fatherId = currentItem.father;
    while (fatherId) {
        const fatherItem = items.find(item => item.id === fatherId);
        if (fatherItem) {
            breadcrumbs.unshift(fatherItem);
            fatherId = fatherItem.father;
        } else {
            break;
        }
    }

    console.log('🔍 GetBreadcrumbs - Resultado final:', breadcrumbs);
    return breadcrumbs;
}

