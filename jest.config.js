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
    '/node_modules/(?!(@firebase|firebase|@clerk|@radix-ui|@hookform|next|@mui|@emotion|@babel/runtime|next-auth|@auth\/core|oauth4webapi|jose|openid-client|@panva/hkdf|uuid|preact|preact-render-to-string|@auth/prisma-adapter|@prisma/client)/)',
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
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/jest.setup.env.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/unit/msw/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'middleware.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/tests/',
    '/scripts/',
    '/public/',
    '<rootDir>/lib/store/userStore.ts',
    '<rootDir>/lib/services/api-logger-service.ts',
  ],
  maxWorkers: '50%',
};

// Custom Jest configuration with multiple projects
const customJestConfig = {
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
      ],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.api.js',
        '<rootDir>/tests/config/setup/jest.setup.api.mocks.ts',
        '<rootDir>/jest.setup.js',
      ],
      testEnvironment: 'node',
      ...sharedConfig,

      // Override transformIgnorePatterns specifically for node env
      transformIgnorePatterns: [
        // Allow transformation of key ESM dependencies
        '/node_modules/(?!(next-auth|@auth|jose|uuid|@panva/hkdf|oauth4webapi|openid-client|preact|preact-render-to-string)/)',

        // Keep the default CSS/SASS ignore pattern if needed, assuming it came from next/jest
        '^.+\.module\.(css|sass|scss)$',
      ],

      // Keep comprehensive, isolated mapper for node
      roots: [
        '<rootDir>/lib',
        '<rootDir>/lib/actions',
        '<rootDir>/tests',

        // Add other roots if necessary
      ],
      moduleNameMapper: {
        // Keep specific overrides first
        '^@/lib/prisma$': '<rootDir>/lib/prisma.ts',
        '^@/lib/db/prisma$': '<rootDir>/lib/db/prisma.ts',
        '^@/lib/logger$': '<rootDir>/lib/logger.ts',
        '^@/lib/auth-node$': '<rootDir>/lib/auth-node.ts',

        // Add general lib mapping BEFORE specific one
        '^@/lib/(.*)$': '<rootDir>/lib/$1',

        // More specific lib mapping that includes file extensions
        '^@/lib/(.+\\.(?:ts|tsx|js|jsx))$': '<rootDir>/lib/$1',

        // Keep other specific mappings
        '^@/types$': '<rootDir>/types/index.ts',
        '^@/types/(.*)$': '<rootDir>/types/$1',
        '^@/components/(.*)$': '<rootDir>/components/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
        '^.+\\.(css|less|scss)$': 'identity-obj-proxy',

        // Add the general root mapping
        '^@/(.*)$': '<rootDir>/$1',
      },
    },

    // Restore jsdom project
    {
      displayName: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/components/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/utils/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/providers/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/pages/**/*.test.ts?(x)',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testEnvironment: 'jsdom',
      ...sharedConfig,
      moduleNameMapper: {
        ...sharedConfig.moduleNameMapper,
        '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
      },
    },
  ],

  // Restore global coverage options
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },

  // reporters: ['default', 'jest-junit'], // Example: Add JUnit reporter
  testTimeout: 30000, // Increase timeout for potentially slow tests

  // === E2E Testing (Placeholder/Example - Use Playwright config primarily) ===
  // E2E tests are typically run via Playwright (`playwright.config.ts`)
};

module.exports = createJestConfig(customJestConfig); // Restore wrapper
