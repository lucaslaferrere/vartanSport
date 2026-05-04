"use client";
import React, {createContext, useContext} from "react";
import {PermissionType} from "@models/enums/PermissionType";
import {useAuthStore} from "@libraries/store";

type UserPermissionsContextType = {
  userPermissions: Set<PermissionType>;
  reloadPermissions: () => void;
  validatePermission: (permissions: PermissionType[]) => boolean;
  userRole: 'dueño' | 'vendedor' | 'demo' | 'repositor';
};

const UserPermissionsContext = createContext<UserPermissionsContextType>({
  userPermissions: new Set(),
  reloadPermissions: () => {},
  validatePermission: () => true,
  userRole: 'dueño',
});

export function UserPermissionsProvider({children}: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  const userRole: 'dueño' | 'vendedor' | 'demo' | 'repositor' =
    user?.rol === 'vendedor' ? 'vendedor' :
    user?.rol === 'demo' ? 'demo' :
    user?.rol === 'repositor' ? 'repositor' :
    'dueño';

  const allPermissions = new Set<PermissionType>(Object.values(PermissionType));

  const reloadPermissions = () => {};

  const validatePermission = (permissions: PermissionType[]): boolean => {
    if (!permissions?.length) return true;
    
    // ✅ Dueño y Demo tienen acceso a todo (solo lectura para demo, manejado en backend)
    if (userRole === 'dueño' || userRole === 'demo') return true;
    
    // Vendedor: validar permisos específicos
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