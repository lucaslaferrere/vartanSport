// material-ui
import {List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import {loginRoute} from "@routes/router";
import {useRouter} from "next/navigation";
import {useNotification} from "@components/Notifications/NotificationContext";
import React from "react";
import {useAppDispatch} from "@redux/hook";
import {resetNavigation} from "@redux/features/navigationSlice";

// ==============================|| HEADER PROFILE - PROFILE TAB ||============================== //

const ProfileTab = ({
                        setSelectOpen,
                    }: {
    setSelectOpen: (open: boolean) => void;
}) => {
    const router = useRouter();
    const {addNotification} = useNotification();
    const dispatch = useAppDispatch();

    const handleLogout = async () => {
        try {
            addNotification("Sesión cerrada correctamente", "success");
            dispatch(resetNavigation());
            router.push(loginRoute());
        } catch {
            addNotification("Error al cerrar sesión", "error");
        }
    }

    return (
        <List component="nav" sx={{p: 0, '& .MuiListItemIcon-root': {minWidth: 32}}}>
            <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                    <i className="fa-regular fa-right-from-bracket"></i>
                </ListItemIcon>
                <ListItemText primary="Cerrar Sesión"/>
            </ListItemButton>
        </List>
    );
};

export default ProfileTab;
