"use client";
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import {Container} from "@mui/material";
import React from "react";

// project import
import Drawer from './Drawer';
import Header from './Header';
import Breadcrumbs from "@components/Layouts/MainLayout/Breadcrumbs";
import {HeaderActionsProvider} from "@components/Layouts/HeaderActionsContext";

export default function MainLayout({children}: {
    children: React.ReactNode
}) {
    return (
        <HeaderActionsProvider>
            <Box sx={{
                display: "flex",
                width: "100%",
                minHeight: "100vh",
                bgcolor: "#F7F9FB"
            }}>
                <Header/>
                <Drawer/>
                <Box
                    component="main"
                    sx={{
                        width: 'calc(100% - 240px)',
                        flexGrow: 1,
                        bgcolor: '#F7F9FB',
                        minHeight: '100vh'
                    }}
                >
                    <Toolbar sx={{ minHeight: '64px !important' }} />
                    <Container
                        maxWidth='xl'
                        sx={{
                            px: 3,
                            py: 3,
                            position: 'relative',
                            minHeight: 'calc(100vh - 64px)',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'transparent'
                        }}
                    >
                        <Breadcrumbs />
                        {children}
                    </Container>
                </Box>
            </Box>
        </HeaderActionsProvider>
    )
}