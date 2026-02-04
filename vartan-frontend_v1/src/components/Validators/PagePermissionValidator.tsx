"use client";
import {homeRoute, dashboardRoute} from "@routes/router";
import {PermissionType} from "@models/enums/PermissionType";
import React, {useEffect} from "react";
import {usePathname, useRouter} from 'next/navigation'
import {Box, CircularProgress} from "@mui/material";
import {useUserPermissions} from "@components/Validators/UserPermissionsContext";

const PagesValidations = [
    {
        path: dashboardRoute(),
        permissions: [],
    },
    {
        path: "/productos",
        permissions: [PermissionType.PRODUCTOS_VIEW],
    },
    {
        path: "/ventas",
        permissions: [PermissionType.VENTAS_VIEW],
    },
    {
        path: "/clientes",
        permissions: [PermissionType.CLIENTES_VIEW],
    },
    {
        path: "/pedidos",
        permissions: [PermissionType.PEDIDOS_VIEW],
    },
    {
        path: "/comisiones",
        permissions: [PermissionType.COMISIONES_VIEW],
    }
]


export default function PagePermissionValidator({
                                                    children
                                                }: {
    children: React.ReactNode
}) {
    const {validatePermission} = useUserPermissions();
    const pathname = usePathname();
    const router = useRouter()

    const page = PagesValidations.find(page => pathname.startsWith(page.path)) || PagesValidations[-1];
    const hasPermission = validatePermission(page.permissions);

    useEffect(() => {
        if (!hasPermission && pathname !== homeRoute()) {
            router.push(homeRoute());
        }
    }, [hasPermission, pathname, router]);

    if (!hasPermission) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <CircularProgress/>
            </Box>
        )
    }

    return <>{children}</>
}