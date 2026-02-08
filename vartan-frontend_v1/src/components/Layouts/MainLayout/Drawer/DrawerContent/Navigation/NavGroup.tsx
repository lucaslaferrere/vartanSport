// material-ui
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import NavItem from './NavItem';
import {useAppSelector} from "@redux/hook";
import {useTheme} from "@mui/material";
import NavCollapse from "@components/Layouts/MainLayout/Drawer/DrawerContent/Navigation/NavCollapse";
import {IMenuItem} from "@routes/getMenuItems";

export default function NavGroup({item}: { item: IMenuItem }) {
    const theme = useTheme();
    const drawerOpen = useAppSelector((state) => state.customization.drawerOpen);

    // DEBUG: Ver qué items hay
    console.log('🔴 NavGroup - Grupo:', item.title);
    console.log('🔴 NavGroup - Children count:', item.children?.length);
    console.log('🔴 NavGroup - Todos los items:', item.children?.map(i => ({
        id: i.id,
        title: i.title,
        type: i.type,
        url: i.url
    })));

    // Versión simplificada sin validación de permisos para demo
    const filterMenuItemRol = (item: IMenuItem) => {
        // Por ahora, mostrar todos los items del menú
        return true;
    }

    const navCollapse = item.children?.map((menuItem: IMenuItem) => {
        console.log('🟢 Procesando item:', menuItem.title, '- Tipo:', menuItem.type);

        if (!filterMenuItemRol(menuItem)) {
            console.log('🔴 Item filtrado:', menuItem.title);
            return null;
        }

        switch (menuItem.type) {
            case 'collapse':
                console.log('✅ Renderizando collapse:', menuItem.title);
                return (
                    <NavCollapse
                        key={menuItem.id}
                        menu={menuItem}
                        level={1}
                    />
                );
            case 'item':
                console.log('✅ Renderizando item:', menuItem.title);
                return <NavItem key={menuItem.id} item={menuItem} level={1}/>;
            default:
                console.log('❌ Tipo desconocido:', menuItem.type);
                return null;
        }
    });

    return (
        <List
            subheader={
                item.title &&
                drawerOpen && (
                    <Box sx={{pl: 3, mb: 1.5}}>
                        <Typography variant="subtitle2"
                                    color={theme.palette.mode === 'dark' ? 'textSecondary' : 'text.secondary'}>
                            {item.title}
                        </Typography>
                        {item.caption && (
                            <Typography variant="caption" color="secondary">
                                {item.caption}
                            </Typography>
                        )}
                    </Box>
                )
            }
            sx={{mt: drawerOpen && item.title ? 1.5 : 0, py: 0, zIndex: 0}}
        >
            {navCollapse}
        </List>
    )
}
