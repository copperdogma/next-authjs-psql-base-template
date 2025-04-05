import type { NextConfig } from 'next';
// import type { RuntimeCaching } from 'next-pwa'; // Remove potentially outdated/incorrect type
import path from 'path'; // Import path for __dirname equivalent
import { loggers } from '@/lib/logger'; // Import logger

// Use ESM imports instead of require
import withBundleAnalyzer from '@next/bundle-analyzer';
import withPWA from 'next-pwa';

// Define the path to the service worker manually if needed, otherwise next-pwa handles it
// const swDest = path.join(__dirname, 'public/sw.js');

// Remove explicit type annotation, rely on inference
const runtimeCaching = [
  {
    urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts',
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
      },
    },
  },
  {
    urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-font-assets',
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      },
    },
  },
  {
    urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-image-assets',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
  {
    urlPattern: /\.(?:js)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-js-assets',
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
  {
    urlPattern: /\.(?:css|less)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-style-assets',
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
  {
    urlPattern: /\.(?:json|xml|csv)$/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'static-data-assets',
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
  {
    urlPattern: /.*/i, // Default catch-all handler
    handler: 'NetworkFirst',
    options: {
      cacheName: 'others',
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
      networkTimeoutSeconds: 10,
    },
  },
];

// Initialize wrappers with imported functions
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const pwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
  // Consider adding buildExcludes if specific files cause issues
  // buildExcludes: [/middleware-manifest.json$/],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Force SWC transforms despite Babel config (potentially removable)
  // experimental: {
  //   forceSwcTransforms: true,
  // },

  // Mark pino and pino-pretty as external packages to prevent bundling issues
  // This is generally the preferred way for server-only packages
  serverExternalPackages: ['pino', 'pino-pretty', 'jose'],

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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '**',
      },
    ],
  },

  // Simplified webpack configuration
  webpack: (config, { dev, isServer, webpack }) => {
    // Log unused variables to satisfy TypeScript compiler
    const logger = loggers.api;
    // Log all context variables, including webpack, to mark as used
    logger.debug({
      msg: 'Webpack context',
      dev,
      isServer: !!isServer,
      webpackVersion: webpack?.version,
    });

    // Type assertion for config.resolve.fallback
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};

    if (!isServer) {
      // Don't bundle server-only modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        process: false, // Consider 'process/browser' if needed for client-side process.env
        path: false, // Consider 'path-browserify' if needed
        stream: false, // Consider 'stream-browserify' if needed
        util: false, // Consider 'util/' if needed
        buffer: false, // Consider 'buffer/' if needed
        http: false, // Consider 'stream-http' if needed
        https: false, // Consider 'https-browserify' if needed
        zlib: false, // Consider 'browserify-zlib' if needed
      };
    }

    // Test building without this if using newer Next.js/Pino versions
    config.externals = config.externals || [];
    // config.externals.push({
    //   'thread-stream': 'commonjs thread-stream',
    // });

    // Enable persistent cache for faster builds
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        // Invalidate cache when this config file changes
        // Use __filename directly in CommonJS, need import.meta.url in ESM
        // Using path.resolve as a workaround for __filename in ESM context
        config: [path.resolve(import.meta.url.replace('file://', ''))],
      },
    };

    // Optimize bundle size in production (Next.js does this by default)
    // config.optimization = config.optimization || {};
    // config.optimization.minimize = true; // Default true in production

    // Enable tree shaking (webpack does this automatically in production mode)
    // config.optimization.usedExports = true; // Default true in production

    // Add DefinePlugin for process.env variables if needed on client
    // config.plugins.push(
    //   new webpack.DefinePlugin({
    //     'process.env.NEXT_PUBLIC_SOME_VAR': JSON.stringify(process.env.NEXT_PUBLIC_SOME_VAR),
    //   })
    // );

    // Let Next.js handle the rest of the configuration
    return config;
  },
};

// Apply both PWA and Bundle Analyzer configurations
// Note: Make sure the wrappers handle the TS config correctly
export default bundleAnalyzer(pwa(nextConfig));
