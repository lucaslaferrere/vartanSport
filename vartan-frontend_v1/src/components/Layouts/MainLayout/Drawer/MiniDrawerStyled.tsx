// material-ui
import {styled} from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';

// Definir la interfaz para las props del Drawer estilizado
interface MiniDrawerStyledProps {
    open?: boolean;
}

// ==============================|| DRAWER - MINI STYLED ||============================== //

const MiniDrawerStyled = styled(Drawer, {shouldForwardProp: (prop) => prop !== 'open'})<MiniDrawerStyledProps>(({
                                                                                                                    theme,
                                                                                                                    open
                                                                                                                }) => ({
    width: "240px",
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
        width: "240px",
        borderRight: '1px solid #E5E7EB',
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        }),
        overflowX: 'hidden',
        '& .MuiDrawer-paper': {
            width: "240px",
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E5E7EB',
            boxShadow: 'none',
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen
            }),
            overflowX: 'hidden',
        },
    }),
    ...(!open && {
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        overflowX: 'hidden',
        width: '72px',
        borderRight: '1px solid #E5E7EB',
        '& .MuiDrawer-paper': {
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen
            }),
            overflowX: 'hidden',
            width: '72px',
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E5E7EB',
            boxShadow: 'none',
        },
    }),
}));

export default MiniDrawerStyled;
