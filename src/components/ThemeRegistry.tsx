'use client';
import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NextAppDirEmotionCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import colors from '@/theme/colors';

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
    customShadows: {
        z1: '0px 2px 8px rgba(0,0,0,0.15)',
    },
    shape: {
        borderRadius: 12,
    },
});

// Declarar customShadows en el theme
declare module '@mui/material/styles' {
    interface Theme {
        customShadows: {
            z1: string;
        };
    }
    interface ThemeOptions {
        customShadows?: {
            z1?: string;
        };
    }
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
    return (
        <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </NextAppDirEmotionCacheProvider>
    );
}