import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import ThemeRegistry from '@/app/providers/ThemeRegistry';
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
        <ThemeProvider defaultTheme="system">
          <ThemeRegistry>
            <AuthProvider>
              <BaseLayout>{children}</BaseLayout>
            </AuthProvider>
            <Toaster />
          </ThemeRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
