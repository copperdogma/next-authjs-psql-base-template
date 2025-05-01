import '@/app/globals.css';
import { Roboto } from 'next/font/google';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from 'next-themes';
import ThemeRegistry from '@/app/providers/ThemeRegistry';
import SessionProviderWrapper from '@/app/providers/SessionProviderWrapper';
import BaseLayout from '@/components/layouts/BaseLayout';
import FirebaseClientInitializer from '@/components/internal/FirebaseClientInitializer';
import { auth } from '@/lib/auth-edge';
import { loggers } from '@/lib/logger';
import { CssBaseline, Box } from '@mui/material';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const logger = loggers.auth;

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

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
    
    // Set data attribute on body for client hydration
    document.body.dataset.initialTheme = theme;
    
    // Remove transition prevention after a minimal delay
    setTimeout(function() {
      document.documentElement.classList.remove('prevent-transition');
    }, 0);
  } catch (e) {
    console.error('Theme initialization error:', e);
  }
})()
`;

// RootLayout needs to be async to fetch the session server-side
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch the session on the server
  const session = await auth();

  // Add logging to debug session state
  logger.info({
    msg: '[RootLayout] Fetched session from auth()',
    hasSession: !!session,
    userId: session?.user?.id,
    userName: session?.user?.name,
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>{/* <script dangerouslySetInnerHTML={{ __html: themeScript }} /> */}</head>
      <body className={roboto.className}>
        {/* Visually hidden H1 moved inside main container */}
        <FirebaseClientInitializer />
        <SessionProviderWrapper session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="theme-preference"
          >
            <ThemeRegistry>
              <CssBaseline />
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Header />
                <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
                  <BaseLayout>{children}</BaseLayout>
                  <Toaster />
                </Box>
                <Footer />
              </Box>
            </ThemeRegistry>
          </ThemeProvider>
        </SessionProviderWrapper>
        {/* Moved theme script here to ensure body exists */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </body>
    </html>
  );
}
