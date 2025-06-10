import type { NextConfig } from 'next';
// import type { RuntimeCaching } from 'next-pwa'; // Remove potentially outdated/incorrect type
// import { loggers } from '@/lib/logger'; // Import logger

/**
 * Progressive Web App (PWA) Configuration
 * --------------------------------------
 * Current State: This template provides basic PWA installability via the native
 * Next.js manifest.ts implementation.
 *
 * Features Enabled:
 * - App installation via web app manifest (defined in app/manifest.ts)
 * - Custom app icons
 * - Theme colors
 *
 * To Enable Advanced PWA Features (Offline Support, Background Sync, Push Notifications):
 * 1. Install a PWA library like Serwist or next-pwa:
 *    npm install serwist
 *    or
 *    npm install next-pwa
 *
 * 2. Uncomment and configure the appropriate wrapper in this file
 *
 * 3. Implement a service worker for offline functionality and other advanced features
 *
 * 4. See docs/pwa-testing.md for testing guidelines
 */

// Use ESM imports instead of require
import withBundleAnalyzer from '@next/bundle-analyzer';

// Define the path to the service worker manually if needed, otherwise next-pwa handles it
// const swDest = path.join(__dirname, 'public/sw.js');

// Initialize wrappers with imported functions
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// For next-pwa configuration (if you decide to use it)
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
//   register: true,
//   skipWaiting: true,
//   // Define runtime caching rules if needed
//   // runtimeCaching: [
//   //   {
//   //     urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
//   //     handler: 'CacheFirst',
//   //     options: {
//   //       cacheName: 'google-fonts-webfonts',
//   //       expiration: {
//   //         maxEntries: 10,
//   //         maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
//   //       },
//   //     },
//   //   },
//   //   // Add more caching strategies as needed
//   // ],
// });

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Mark pino and pino-pretty as external packages to prevent bundling issues
  // This is generally the preferred way for server-only packages
  serverExternalPackages: ['pino', 'pino-pretty', 'jose', 'bcryptjs'],

  // Add CORS headers for API routes
  async headers() {
    return [
      {
        // Apply these headers to API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          {
            key: 'Access-Control-Allow-Origin',
            // Use environment variable for production URL
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },
  images: {
    // Modern formats for better performance
    formats: ['image/avif', 'image/webp'],

    // Remote patterns for more secure configuration
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
    ],
  },

  // Simplified webpack configuration
  webpack: (config, { dev: _dev, isServer, webpack: _webpack }) => {
    // Log unused variables to satisfy TypeScript compiler
    // const logger = loggers.api;
    // Log all context variables, including webpack, to mark as used
    // logger.debug({
    //   msg: 'Webpack context',
    //   dev,
    //   isServer: !!isServer,
    //   webpackVersion: webpack?.version,
    // });

    // Type assertion for config.resolve.fallback
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};

    if (!isServer) {
      // These Node.js modules are not available in the browser environment.
      // Setting them to 'false' prevents webpack from bundling large, unnecessary polyfills.
      // This approach is recommended for better performance and smaller bundle sizes.
      // Only add browser polyfills if your application specifically requires them.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, // File system operations (server-only)
        net: false, // Network operations (server-only)
        tls: false, // TLS/SSL operations (server-only)
        crypto: false, // Node.js crypto module (use Web Crypto API in browser)
        process: false, // Node.js process object (consider environment variables instead)
        path: false, // File path utilities (server-only)
        stream: false, // Node.js streams (use browser APIs or lighter alternatives)
        util: false, // Node.js utilities (use modern JavaScript equivalents)
        buffer: false, // Node.js Buffer (use browser ArrayBuffer/Uint8Array)
        http: false, // HTTP client for Node.js (use fetch API in browser)
        https: false, // HTTPS client for Node.js (use fetch API in browser)
        zlib: false, // Compression utilities (server-only)
      };
    }

    // Let Next.js handle the rest of the configuration
    return config;
  },
};

// Apply Bundle Analyzer configuration
// Note: Make sure the wrappers handle the TS config correctly
export default bundleAnalyzer(nextConfig);
