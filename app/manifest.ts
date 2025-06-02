import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Next Auth App',
    short_name: 'NextAuth',
    description: 'A Next.js application with NextAuth.js and PostgreSQL',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png', // Use existing icon
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png', // Use existing icon
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
