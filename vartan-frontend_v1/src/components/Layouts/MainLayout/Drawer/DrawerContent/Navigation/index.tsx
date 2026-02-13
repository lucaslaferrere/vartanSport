// material-ui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import NavGroup from './NavGroup';
import {useAppSelector} from "@redux/hook";
import {GetMenuItems} from "@routes/getMenuItems";
import {useUserPermissions} from "@components/Validators/UserPermissionsContext";

// ==============================|| DRAWER CONTENT - NAVIGATION ||============================== //

export default function Navigation() {
    const drawerOpen = useAppSelector((state) => state.customization.drawerOpen);
    const { userRole } = useUserPermissions();
    const menuItem = GetMenuItems(userRole);

    const navGroups = menuItem.items.map((item) => {

        switch (item.type) {
            case 'group':
                return <NavGroup
                    key={item.id}
                    item={item}
                />;
            default:
                return (
                    <Typography key={item.id} variant="h6" color="error" align="center">
                        Fix - Navigation Group
                    </Typography>
                );
        }
    });

    return <Box
        sx={{
            pt: drawerOpen ? 2 : 0,
            '& > ul:first-of-type': {mt: 0},
            display: 'block'
        }}
    >
        {navGroups}
    </Box>;
}
