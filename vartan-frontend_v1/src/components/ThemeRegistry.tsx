'use client';
import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { colors } from '@/src/theme/colors';

// Crear tema básico con tus colores
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: colors.primary,
            light: colors.primaryLight,
            dark: colors.primaryDark,
        },
        secondary: {
            main: colors.primary,
        },
        background: {
            default: colors.background,
            paper: colors.backgroundCard,
        },
        text: {
            primary: colors.textPrimary,
            secondary: colors.textSecondary,
        },
        grey: {
            200: '#eeeeee',
            300: '#e0e0e0',
        },
    },
    shape: {
        borderRadius: 12,
    },
});


export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
    return (
        <AppRouterCacheProvider options={{ key: 'mui' }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </AppRouterCacheProvider>
    );
}