import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '{{YOUR_APP_TITLE}}',
    short_name: '{{YOUR_APP_SHORT_NAME}}',
    description: '{{YOUR_PROJECT_DESCRIPTION}}',
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
