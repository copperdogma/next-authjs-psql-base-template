import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import ThemeRegistry from '@/app/providers/ThemeRegistry';
import SessionProviderWrapper from '@/app/providers/SessionProviderWrapper';
import BaseLayout from '@/components/layouts/BaseLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js + NextAuth + PostgreSQL',
  description: 'A Next.js starter template with NextAuth.js Authentication and PostgreSQL database',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProviderWrapper>
          <ThemeProvider defaultTheme="system">
            <ThemeRegistry>
              <BaseLayout>{children}</BaseLayout>
              <Toaster />
            </ThemeRegistry>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
