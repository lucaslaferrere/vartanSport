"use client";
import {PermissionType} from "@models/enums/PermissionType";
import React from "react";
import {useUserPermissions} from "@components/Validators/UserPermissionsContext";

export default function PermissionValidator({
                                                permissions,
                                                children
                                            }: {
    permissions: PermissionType[],
    children: React.ReactNode
}) {
    const {validatePermission} = useUserPermissions();
    const hasPermission = validatePermission(permissions);

    return hasPermission ? <>{children}</> : null;
}