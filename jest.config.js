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
    '/node_modules/(?!(@firebase|firebase|@clerk|@radix-ui|@hookform|next|@mui|@emotion|@babel/runtime)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts?(x)'],
  setupFiles: ['<rootDir>/jest.setup.env.js'],
  testEnvironment: 'jest-environment-jsdom',

  // Improved coverage reporting
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // This ensures coverage is only collected from files that are actually tested
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/tests/',
    '/scripts/',
    '/public/',
  ],
};

// Custom Jest configuration with multiple projects
const customJestConfig = {
  // Define multiple test projects for different test environments
  projects: [
    // API and utility tests in Node.js environment
    {
      displayName: 'node',
      testMatch: [
        '<rootDir>/tests/unit/lib/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/api/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/db/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/auth/**/*.test.ts?(x)',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
      testEnvironment: 'node',
      ...sharedConfig,
    },

    // Component tests in JSDOM environment
    {
      displayName: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/components/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/app/**/*.test.ts?(x)',
        '<rootDir>/tests/unit/utils/**/*.test.ts?(x)',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testEnvironment: 'jsdom',
      ...sharedConfig,
    },
  ],

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
