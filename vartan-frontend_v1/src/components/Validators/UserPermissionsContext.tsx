"use client";
import React, {createContext, useContext} from "react";
import {PermissionType} from "@models/enums/PermissionType";
import {useAuthStore} from "@libraries/store";

type UserPermissionsContextType = {
  userPermissions: Set<PermissionType>;
  reloadPermissions: () => void;
  validatePermission: (permissions: PermissionType[]) => boolean;
  userRole: 'dueño' | 'empleado';
};

const UserPermissionsContext = createContext<UserPermissionsContextType>({
  userPermissions: new Set(),
  reloadPermissions: () => {},
  validatePermission: () => true,
  userRole: 'dueño',
});

export function UserPermissionsProvider({children}: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  // Usar el rol del usuario autenticado, o 'dueño' por defecto
  const userRole: 'dueño' | 'empleado' = user?.rol === 'empleado' ? 'empleado' : 'dueño';

  const allPermissions = new Set<PermissionType>(Object.values(PermissionType));
  const reloadPermissions = () => {};

  const validatePermission = (permissions: PermissionType[]): boolean => {
    // Si no hay permisos requeridos, permitir acceso
    if (!permissions?.length) return true;

    // Si es dueño, tiene todos los permisos
    if (userRole === 'dueño') return true;

    // Si es empleado, verificar permisos específicos
    return permissions.every((permission) => allPermissions.has(permission));
  };

  return (
    <UserPermissionsContext.Provider value={{userPermissions: allPermissions, reloadPermissions, validatePermission, userRole}}>
      {children}
    </UserPermissionsContext.Provider>
  );
}

export function useUserPermissions() {
  return useContext(UserPermissionsContext);
}
