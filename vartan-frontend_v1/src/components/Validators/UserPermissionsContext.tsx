"use client";
import React, {createContext, useContext} from "react";
import {PermissionType} from "@models/enums/PermissionType";
import {useAuthStore} from "@libraries/store";

type UserPermissionsContextType = {
  userPermissions: Set<PermissionType>;
  reloadPermissions: () => void;
  validatePermission: (permissions: PermissionType[]) => boolean;
  userRole: 'dueño' | 'vendedor';
};

const UserPermissionsContext = createContext<UserPermissionsContextType>({
  userPermissions: new Set(),
  reloadPermissions: () => {},
  validatePermission: () => true,
  userRole: 'dueño',
});

export function UserPermissionsProvider({children}: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  const userRole: 'dueño' | 'vendedor' = user?.rol === 'vendedor' ? 'vendedor' : 'dueño';

  const allPermissions = new Set<PermissionType>(Object.values(PermissionType));
  const reloadPermissions = () => {};

  const validatePermission = (permissions: PermissionType[]): boolean => {
    if (!permissions?.length) return true;

    if (userRole === 'dueño') return true;

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
