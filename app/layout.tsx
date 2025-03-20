import type { Metadata, Viewport } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import ThemeRegistry from './providers/ThemeRegistry';
import BaseLayout from '@/components/layouts/BaseLayout';
import AuthProvider from './providers/AuthProvider';

// Optimize font loading
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-roboto',
});

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
};

// Enhanced metadata configuration
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}'}`,
    default: process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}'
  },
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '{{YOUR_PROJECT_DESCRIPTION}}',
  applicationName: process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}',
  authors: [{ name: '{{YOUR_NAME}}', url: '{{YOUR_URL}}' }],
  creator: '{{YOUR_NAME}}',
  publisher: '{{YOUR_COMPANY}}',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  generator: 'Next.js',
  keywords: ['Next.js', 'React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Firebase'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '192x192' }
    ],
    apple: { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_BASE_URL,
    title: process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '{{YOUR_PROJECT_DESCRIPTION}}',
    siteName: process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '{{YOUR_PROJECT_DESCRIPTION}}',
    creator: '@{{YOUR_TWITTER_HANDLE}}',
    images: ['/twitter-image.jpg'],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'google-site-verification-code',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Title is automatically set by Next.js based on metadata */}
      </head>
      <body 
        className={`${inter.className} ${inter.variable} ${roboto.variable}`}
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
