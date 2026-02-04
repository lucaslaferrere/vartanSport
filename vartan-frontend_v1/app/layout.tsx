// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ReduxProvider from '@redux/provider';
import { NotificationProvider } from '@components/Notifications';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Vartan Sports',
    description: 'Sistema de control de stock',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
        <body className={inter.className}>
        <ReduxProvider>
            <NotificationProvider>
                {children}
            </NotificationProvider>
        </ReduxProvider>
        </body>
        </html>
    );
}