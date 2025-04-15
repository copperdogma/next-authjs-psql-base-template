const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

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
    '/node_modules/(?!(@firebase|firebase|@clerk|@radix-ui|@hookform|next|@mui|@emotion|@babel/runtime|next-auth|jose|openid-client|@panva/hkdf|uuid|preact|preact-render-to-string|@auth/prisma-adapter|@prisma/client)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/jest.setup.env.js'],
  testEnvironment: 'jest-environment-jsdom',

  // Add msw to ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/unit/msw/'],

  // Improved coverage reporting
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'middleware.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // This ensures coverage is only collected from files that are actually tested
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/tests/',
    '/scripts/',
    '/public/',
  ],

  // Increase max listeners to suppress warning during parallel test runs
  maxWorkers: '50%', // Adjust based on your system resources if needed
};

// Custom Jest configuration with multiple projects
const customJestConfig = {
  // Define multiple test projects for different test environments
  projects: [
    // API, utility, SWC, middleware tests in Node.js environment
    {
      displayName: 'node',
      testMatch: [
        '<rootDir>/tests/unit/lib/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/api/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/db/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/auth/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/swc/**/*.test.ts?(x)', // Added swc
        '<rootDir>/tests/unit/middleware/**/*.test.ts?(x)', // Added middleware
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js', '<rootDir>/jest.setup.js'],
      testEnvironment: 'node',
      ...sharedConfig,
    },

    // Component, utils, profile, providers, pages tests in JSDOM environment
    {
      displayName: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/components/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/utils/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/profile/**/*.test.ts?(x)', // Added profile
        '<rootDir>/tests/unit/providers/**/*.test.ts?(x)', // Added providers
        '<rootDir>/tests/unit/pages/**/*.test.ts?(x)', // Added pages
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testEnvironment: 'jsdom',
      ...sharedConfig,
    },
  ],

  // Move coverage options back here
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],

  // Set coverage thresholds to enforce code quality
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};

// Export the combined configuration
module.exports = createJestConfig(customJestConfig);
