import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ReduxProvider from '@redux/provider';
import { NotificationProvider } from '@components/Notifications';
import AuthInitializer from '@components/Auth/AuthInitializer';
import ThemeRegistry from '@components/ThemeRegistry';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vartan Sports',
  description: 'Sistema de control de stock',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className}>
        <ThemeRegistry>
          <ReduxProvider>
            <NotificationProvider>
              <AuthInitializer>{children}</AuthInitializer>
            </NotificationProvider>
          </ReduxProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}

