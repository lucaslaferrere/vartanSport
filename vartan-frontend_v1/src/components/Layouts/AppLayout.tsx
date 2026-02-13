'use client';

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { colors, transitions } from '@/src/theme/colors';
import { layoutConfig } from '@/src/config/layoutConfig';
import { useAuthStore } from '@libraries/store';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const drawerWidth = isCollapsed ? layoutConfig.drawer.widthCollapsed : layoutConfig.drawer.width;

  const toggleDrawer = () => setIsCollapsed(!isCollapsed);
  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    router.push('/login');
  };

  const getUserInitials = (name = 'Admin') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  // Obtener menú según el rol del usuario
  const userRole = user?.rol as 'dueño' | 'vendedor' | undefined;
  const menuItems = layoutConfig.getMenuByRole(userRole);

  const currentPageLabel = menuItems.find((item) => item.path === pathname)?.label || 'Dashboard';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.background }}>
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, sm: `${drawerWidth}px` },
          bgcolor: colors.white,
          boxShadow: 'none',
          transition: transitions.drawer,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={toggleDrawer} size="small" sx={{ color: colors.textSecondary, '&:hover': { bgcolor: colors.primaryHover } }}>
              <i className="fa-solid fa-bars" style={{ fontSize: '20px' }} />
            </IconButton>
            <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600, fontSize: '18px' }}>
              {currentPageLabel}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Perfil de usuario">
              <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: colors.primary, fontSize: '14px', fontWeight: 600 }}>
                  {getUserInitials(user?.nombre)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose} sx={{ mt: 1 }}>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" fontWeight={600} color={colors.textPrimary}>{user?.nombre || 'Admin'}</Typography>
                <Typography variant="caption" color={colors.textSecondary}>{user?.email || 'admin@vartan.com'}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleUserMenuClose}>
                <i className="fa-solid fa-user" style={{ marginRight: 12, fontSize: 14 }} />Mi Perfil
              </MenuItem>
              <MenuItem onClick={handleUserMenuClose}>
                <i className="fa-solid fa-gear" style={{ marginRight: 12, fontSize: 14 }} />Configuracion
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: colors.error }}>
                <i className="fa-solid fa-right-from-bracket" style={{ marginRight: 12, fontSize: 14 }} />Cerrar Sesion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: colors.white,
            borderRight: 'none',
            overflowX: 'hidden',
            transition: transitions.drawer,
          },
        }}
      >
        <Box sx={{ p: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 64 }}>
          <Box
            component="img"
            src={isCollapsed ? layoutConfig.logos.collapsed : layoutConfig.logos.expanded}
            alt="Vartan"
            sx={{ height: isCollapsed ? 55 : 60, width: 'auto', objectFit: 'contain' }}
          />
        </Box>

        <List sx={{ flexGrow: 1, py: 2 }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ px: isCollapsed ? 1 : 1.5, py: 0.25 }}>
                <Tooltip title={isCollapsed ? item.label : ''} placement="right" arrow>
                  <ListItemButton
                    onClick={() => router.push(item.path)}
                    sx={{
                      p: '10px 16px',
                      borderRadius: 2,
                      m: '4px 0',
                      transition: transitions.default,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      minHeight: 44,
                      ...(isActive
                        ? { bgcolor: colors.primaryMedium, color: colors.primary, '&:hover': { bgcolor: colors.primarySelected } }
                        : { color: colors.textSecondary, '&:hover': { bgcolor: colors.primaryHover } }),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: isCollapsed ? 'auto' : 40, color: 'inherit', display: 'flex', justifyContent: 'center' }}>
                      <i className={item.icon} style={{ fontSize: 18 }} />
                    </ListItemIcon>
                    {!isCollapsed && (
                      <ListItemText
                        primary={item.label}
                        slotProps={{ primary: { fontSize: 14, fontWeight: isActive ? 600 : 500, color: 'inherit' } }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: colors.background, minHeight: '100vh', pt: '88px', px: 3, pb: 3, transition: transitions.drawer }}>
        {children}
      </Box>
    </Box>
  );
}

