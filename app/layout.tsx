import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

// MUI specific imports
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { CssBaseline } from '@mui/material';
import MuiThemeProvider from '@/app/providers/MuiThemeProvider';
import AuthProvider from '@/app/providers/AuthProvider';
import BaseLayout from '@/components/layouts/BaseLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js + Firebase + PostgreSQL',
  description: 'A Next.js starter template with Firebase Authentication and PostgreSQL database',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AppRouterCacheProvider>
            <MuiThemeProvider>
              <CssBaseline />
              <AuthProvider>
                <BaseLayout>{children}</BaseLayout>
              </AuthProvider>
              <Toaster />
            </MuiThemeProvider>
          </AppRouterCacheProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
