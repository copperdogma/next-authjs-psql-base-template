const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

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
  transformIgnorePatterns: [
    '/node_modules/(?!(@clerk|@radix-ui|@hookform|next|@mui|@emotion|@babel/runtime|next-auth|@auth\/core|oauth4webapi|jose|openid-client|@panva/hkdf|uuid|preact|preact-render-to-string|@auth/prisma-adapter|@prisma/client)/)',
  ],
  moduleNameMapper: {
    // Restore original shared mappings
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/types$': '<rootDir>/types/index',
    '^@/actions/(.*)$': '<rootDir>/lib/actions/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/$1',

    // Add mocks from the tests/config/jest.config.js
    '^next-themes$': '<rootDir>/tests/mocks/next-themes.js',
    '^../../../lib/auth/session$': '<rootDir>/tests/mocks/lib/auth/session.ts',
    '^../../../../lib/auth/session$': '<rootDir>/tests/mocks/lib/auth/session.ts',
    '^../../../lib/auth/token$': '<rootDir>/tests/mocks/lib/auth/token.ts',
    '^../../../lib/auth/token-refresh$': '<rootDir>/tests/mocks/lib/auth/token-refresh.ts',
    '^../../../lib/auth/middleware$': '<rootDir>/tests/mocks/lib/auth/middleware.ts',
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
    'tests/mocks/app/api/**/*.ts',
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
    // Node environment
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

      // Keep comprehensive, isolated mapper for node
      roots: ['<rootDir>/lib', '<rootDir>/lib/actions', '<rootDir>/tests'],
      moduleNameMapper: {
        // Keep specific overrides first
        '@/lib/prisma': '<rootDir>/lib/prisma.ts',
        '@/lib/db/prisma': '<rootDir>/lib/db/prisma.ts',
        '@/lib/logger': '<rootDir>/lib/logger.ts',
        '@/lib/auth-node': '<rootDir>/lib/auth-node.ts',

        // Add general lib mapping AFTER specific one
        '^@/lib/(.*)$': '<rootDir>/lib/$1',

        // Keep other specific mappings
        '^@/types$': '<rootDir>/types/index.ts',
        '^@/types/(.*)$': '<rootDir>/types/$1',
        '^@/components/(.*)$': '<rootDir>/components/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
        '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
        '^@/tests/(.*)$': '<rootDir>/tests/$1',

        // Add the general root mapping
        '^@/(.*)$': '<rootDir>/$1',
      },
    },

    // JSDOM environment
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
      moduleNameMapper: {
        ...sharedConfig.moduleNameMapper,
        '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
      },
    },
  ],

  // Restore global coverage options
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
      functions: 55,
      lines: 65,
    },
  },

  verbose: true,
  testTimeout: 30000, // Increase timeout for potentially slow tests
};

module.exports = createJestConfig(customJestConfig);
