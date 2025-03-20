import type { Metadata, Viewport } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import ThemeRegistry from './providers/ThemeRegistry';
import BaseLayout from '@/components/layouts/BaseLayout';
import AuthProvider from './providers/AuthProvider';

const inter = Inter({ subsets: ["latin"] });
const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
};

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '{{YOUR_PROJECT_DESCRIPTION}}',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body 
        className={`${inter.className} ${roboto.variable}`}
        suppressHydrationWarning={true}
      >
        <ThemeRegistry>
          <AuthProvider>
            <BaseLayout>
              {children}
            </BaseLayout>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
