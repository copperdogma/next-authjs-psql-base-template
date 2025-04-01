import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from 'next-themes';
import ThemeRegistry from '@/app/providers/ThemeRegistry';
import SessionProviderWrapper from '@/app/providers/SessionProviderWrapper';
import BaseLayout from '@/components/layouts/BaseLayout';
import { logger } from '@/lib/logger';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js + NextAuth + PostgreSQL',
  description: 'A Next.js starter template with NextAuth.js Authentication and PostgreSQL database',
};

// This script runs before page renders to prevent theme flashing
// It is minimal and only handles the initial render before React hydration
const themeScript = `
(function() {
  try {
    // Prevent transitions during theme initialization
    document.documentElement.classList.add('prevent-transition');
    
    // Get stored theme preference or use system default
    let theme = localStorage.getItem('theme-preference') || 'system';
    
    // Resolve system preference if needed
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Apply theme class to html element
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
    
    // Remove transition prevention after a minimal delay
    setTimeout(function() {
      document.documentElement.classList.remove('prevent-transition');
    }, 0);
  } catch (e) {
    console.error('Theme initialization error:', e);
  }
})()
`;

// Log application initialization at the server level
logger.info({
  msg: 'Application initializing',
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme-preference"
        >
          <SessionProviderWrapper>
            <ThemeRegistry>
              <BaseLayout>{children}</BaseLayout>
              <Toaster />
            </ThemeRegistry>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
