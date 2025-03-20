import type { Metadata, Viewport } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import ThemeRegistry from './providers/ThemeRegistry';
import BaseLayout from '@/components/layouts/BaseLayout';
import AuthProvider from './providers/AuthProvider';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-roboto',
  fallback: ['system-ui', 'arial'],
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

// Critical CSS for above-the-fold content
const criticalCSS = `
  :root {
    --background: #ffffff;
    --foreground: #111827;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --background: #0a0a0a;
      --foreground: #f9fafb;
    }
  }
  body {
    background: var(--background);
    color: var(--foreground);
    margin: 0;
    padding: 0;
    display: block !important;
    visibility: visible !important;
    min-height: 100vh;
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body 
        className={`${inter.className} ${roboto.variable} min-h-screen`}
        suppressHydrationWarning={true}
      >
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
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
