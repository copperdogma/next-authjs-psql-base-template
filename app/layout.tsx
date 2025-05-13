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
import { CssBaseline, Box } from '@mui/material';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Next.js + NextAuth + PostgreSQL',
  description: 'A Next.js starter template with NextAuth.js Authentication and PostgreSQL database',
};

// RootLayout needs to be async to fetch the session server-side
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch the session on the server
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
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
        {/* Custom theme script removed as next-themes handles FOUC */}
      </body>
    </html>
  );
}
