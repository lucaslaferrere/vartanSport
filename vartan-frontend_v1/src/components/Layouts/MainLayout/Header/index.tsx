"use client";
import React, {useMemo} from 'react';

// material-ui
import {styled, useTheme} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';

// project import
import HeaderContent from './HeaderContent';
import {toggleDrawer} from "@redux/features/customizationSlice";
import {useAppDispatch, useAppSelector} from "@redux/hook";
import {Icon} from "@mui/material";


// ==============================|| MAIN LAYOUT - HEADER ||============================== //

interface AppBarStyledProps {
    open?: boolean;
}

const AppBarStyled = styled(AppBar, {shouldForwardProp: (prop) => prop !== 'open'})<AppBarStyledProps>(({
                                                                                                            theme,
                                                                                                            open
                                                                                                        }) => ({
    zIndex: theme.zIndex.drawer + 1,
    bgcolor: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    borderBottom: '1px solid #E5E7EB',
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
    }),
    ...(!open && {
        width: `calc(100% - 72px)`
    }),
    ...(open && {
        marginLeft: "240px",
        width: `calc(100% - 240px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    })
}));

export default function Header(
) {
    const theme = useTheme();
    const downLG = useMediaQuery(theme.breakpoints.down('lg'));
    const dispatch = useAppDispatch();
    const drawerOpen = useAppSelector((state) => state.customization.drawerOpen);

    // header content
    const headerContent = useMemo(() => <HeaderContent/>, []);

    // common header
    const mainHeader = (
        <Toolbar sx={{ minHeight: '64px !important', height: '64px' }}>
            <IconButton
                aria-label="open drawer"
                onClick={() => dispatch(toggleDrawer())}
                edge="start"
                sx={{
                    color: '#6B7280',
                    ml: {xs: 0, lg: -1},
                    '&:hover': {
                        bgcolor: 'rgba(82, 140, 158, 0.08)',
                        color: '#528c9e'
                    }
                }}
                size="medium"
            >
                <Icon className="fa-regular fa-solid fa-bars"/>
            </IconButton>
            {headerContent}
        </Toolbar>
    );

    return (
        <>
            {!downLG ? (
                <AppBarStyled
                    open={drawerOpen}
                    position="fixed"
                    color="inherit"
                    elevation={0}
                    sx={{
                        bgcolor: '#FFFFFF',
                        zIndex: 1200,
                        width: drawerOpen ? 'calc(100% - 240px)' : {
                                xs: '100%',
                                lg: 'calc(100% - 72px)'
                            }
                    }}
                >
                    {mainHeader}
                </AppBarStyled>
            ) : (
                <AppBar
                    position="fixed"
                    color="inherit"
                    elevation={0}
                    sx={{
                        bgcolor: '#FFFFFF',
                        borderBottom: '1px solid #E5E7EB',
                        zIndex: 1200
                    }}
                >
                    {mainHeader}
                </AppBar>
            )}
        </>
    );
}
