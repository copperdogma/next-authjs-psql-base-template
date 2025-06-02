import '@/app/globals.css';
import { Roboto } from 'next/font/google';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from 'next-themes';
import ThemeRegistry from '@/app/providers/ThemeRegistry';
import SessionProviderWrapper from '@/app/providers/SessionProviderWrapper';
import BaseLayout from '@/components/layouts/BaseLayout';
import { auth } from '@/lib/auth-edge';
import { CssBaseline, Box, Typography } from '@mui/material';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { SkipToContent } from '@/components/layouts/SkipToContent';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  // TODO: Update this URL for production deployments - now using NEXTAUTH_URL
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
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
        <SkipToContent />
        {/* Visually hidden H1 for site title - ensures every page has a top-level heading for screen readers */}
        <Box
          component="aside"
          role="complementary"
          aria-label="Site title"
          sx={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
        >
          <Typography variant="h1" component="h1">
            {'{YOUR_APP_NAME}'}
          </Typography>
        </Box>
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
                <Box component="main" sx={{ flexGrow: 1, py: 3 }} id="main-content">
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
