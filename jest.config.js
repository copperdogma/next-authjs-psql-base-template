const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/**
 * Jest Configuration for Next.js Application
 *
 * This configuration uses Jest's multi-project setup to optimize testing:
 * - `node` project: For server-side code (API routes, utilities, database operations)
 * - `jsdom` project: For client-side code (React components, browser utilities)
 *
 * This separation allows for environment-specific optimizations and prevents
 * JSDOM overhead when testing pure Node.js code.
 */

// Shared configuration for both test environments
const sharedConfig = {
  // SWC options for faster and better ES module support
  transform: {
    // Use SWC to transform code - this is what Next.js uses internally
    '^.+\\.(js|jsx|ts|tsx|mjs)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
            dynamicImport: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },

  // Transform ESM modules from node_modules for compatibility with Jest
  // These packages are published as ESM and need to be transpiled for Jest's CommonJS environment
  transformIgnorePatterns: [
    '/node_modules/(?!(@clerk|@radix-ui|@hookform|next|@mui|@emotion|@babel/runtime|next-auth|@auth\/core|oauth4webapi|jose|openid-client|@panva/hkdf|uuid|preact|preact-render-to-string|@auth/prisma-adapter|@prisma/client)/)',
  ],
  moduleNameMapper: {
    // Handle CSS imports with identity-obj-proxy
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',

    // Priority mappings for specific modules
    '@/lib/prisma': '<rootDir>/lib/prisma.ts',
    '@/lib/db/prisma': '<rootDir>/lib/db/prisma.ts',
    '@/lib/logger': '<rootDir>/lib/logger.ts',
    '@/lib/auth-node': '<rootDir>/lib/auth-node.ts',

    // Essential auth mocks
    '^next-themes$': '<rootDir>/__mocks__/next-themes.js',
    '^../../../lib/auth/session$': '<rootDir>/__mocks__/lib/auth/session.ts',
    '^../../../../lib/auth/session$': '<rootDir>/__mocks__/lib/auth/session.ts',
    '^../../../lib/auth/token$': '<rootDir>/__mocks__/lib/auth/token.ts',
    '^../../../lib/auth/token-refresh$': '<rootDir>/__mocks__/lib/auth/token-refresh.ts',
    '^../../../lib/auth/middleware$': '<rootDir>/__mocks__/lib/auth/middleware.ts',

    // Generic path alias that catches all other imports
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/jest.setup.env.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/playwright/',
    '<rootDir>/tests/unit/api/auth/test-utils.ts',
    '<rootDir>/tests/unit/db/prisma.test.ts',
    '<rootDir>/tests/unit/swc/',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'middleware.ts',
    '__mocks__/app/api/**/*.ts',
    'types/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/tests/unit/swc/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/config/',
    '<rootDir>/jest.config.js',
    '<rootDir>/jest.setup.ts',
    '<rootDir>/next.config.ts',
    '<rootDir>/tailwind.config.js',
    '<rootDir>/postcss.config.js',
    '<rootDir>/ecosystem.config.js',
    '<rootDir>/eslint.config.mjs',
    'components/ui/Card.tsx', // Explicitly ignore Card.tsx as it's intentionally not tested
    'tests/utils/server-component-utils.tsx', // Exclude server component utils due to testing complexity
  ],
  maxWorkers: '50%',
  detectOpenHandles: true,
  moduleDirectories: ['node_modules', '<rootDir>'],
};

// Custom Jest configuration with multiple projects
const customJestConfig = {
  // Global setup/teardown - added from tests/config/jest.config.js
  globalSetup: '<rootDir>/tests/config/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/config/setup/globalTeardown.ts',

  projects: [
    // Node environment - for server-side code testing (API routes, utilities, database operations)
    {
      displayName: 'node',
      testMatch: [
        '<rootDir>/tests/unit/lib/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/api/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/db/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/auth/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/swc/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/middleware/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/profile/**/*.test.ts?(x)',
        '<rootDir>/tests/integration/**/*.test.ts?(x)', // Added from tests/config
      ],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.ts', // Shared setup without JSDOM specifics
        '<rootDir>/jest.setup.api.js',
        '<rootDir>/tests/config/setup/jest.setup.api.mocks.ts',
        '<rootDir>/tests/config/setup/node-setup.js',
      ],
      testEnvironment: 'node',
      ...sharedConfig,

      // Override transformIgnorePatterns specifically for node env
      transformIgnorePatterns: [
        // Allow transformation of key ESM dependencies, including Prisma
        '/node_modules/(?!(next-auth|@auth/core|@auth/prisma-adapter|@prisma/client|jose|uuid|@panva/hkdf|oauth4webapi|openid-client|preact|preact-render-to-string)/)',

        // Keep the default CSS/SASS ignore pattern if needed, assuming it came from next/jest
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    },

    // JSDOM environment - for client-side code testing (React components, browser utilities)
    {
      displayName: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/components/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/utils/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/providers/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/pages/**/*.test.ts?(x)',
      ],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.ts', // Shared base setup
        '<rootDir>/jest.setup.jsdom.ts', // JSDOM-specific setup
        'react-intersection-observer/test-utils',
        '<rootDir>/tests/config/setup/browser-setup.js',
      ],
      testEnvironment: 'jsdom',
      ...sharedConfig,
      globals: {
        DISABLE_CLIENT_LOGGER_FETCH: 'true', // Prevent client logger API calls in jsdom tests
      },
    },
  ],

  // Global coverage options
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'text-summary'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },

    // Add specific thresholds from tests/config/jest.config.js
    './components/auth/SignInButton.tsx': {
      statements: 90,
      branches: 75,
      functions: 90,
      lines: 90,
    },
    './components/auth/UserProfile.tsx': {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
    './tests/utils/**/*.tsx': {
      statements: 60,
      branches: 35,
      functions: 42,
      lines: 60,
    },
  },

  verbose: true,
  testTimeout: 30000, // Increase timeout for potentially slow tests
};

module.exports = createJestConfig(customJestConfig);
