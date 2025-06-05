import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

/**
 * ESLint configuration using the modern flat config format.
 * This setup provides comprehensive linting for TypeScript, React, and Next.js
 * while maintaining good performance through targeted configurations.
 *
 * The configuration has been simplified to reduce redundancy while maintaining
 * the same effective behavior.
 */
export default [
  // Ignore build artifacts and dependencies to improve performance
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'public/**',
      '**/*.js.map',
      'coverage/**',
      'dist/**',
      'build/**',
      'tests/e2e/fixtures/auth-fixtures.ts',
      'tests/e2e/fixtures/test-fixtures.ts',
      '**/*.d.ts',
      'playwright-report/**',
    ],
  },

  // Base configuration for all JavaScript files
  // Includes essential rules for React, Next.js, and code organization
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      prettier: prettierPlugin,
      '@next/next': nextPlugin,
      'jest-dom': jestDom,
      sonarjs: sonarjs,
    },
    rules: {
      // Error Prevention
      'no-console': 'warn', // Prevent accidental console.log in production
      'no-unused-vars': 'off', // Disabled in favor of TypeScript's version
      semi: ['error', 'always'], // Consistent semicolon usage
      curly: ['error', 'multi-line'], // Clear block structure

      // Added for code quality
      'no-duplicate-imports': 'error', // Prevent duplicate imports
      'no-dupe-else-if': 'error', // Prevent duplicate conditions in else-if chains
      'no-empty': ['error', { allowEmptyCatch: false }], // Disallow empty blocks

      // SOLID Principles - Open/Closed Principle (OCP)
      'no-param-reassign': ['error', { props: false }], // Prevent direct modification of parameters
      'sonarjs/no-ignored-return': 'warn', // Encourage immutability by not ignoring returns from functions that create new values

      // SOLID Principles - Interface Segregation Principle (ISP)
      'sonarjs/no-all-duplicated-branches': 'warn', // Prefer composition over inheritance

      // SOLID Principles - Dependency Inversion Principle (DIP)
      'import/no-cycle': ['error', { maxDepth: 5 }], // Prevent circular dependencies, which often violate DIP

      // Code Complexity Rules
      complexity: ['error', 10], // Cyclomatic complexity
      'sonarjs/cognitive-complexity': ['error', 15], // Cognitive complexity
      'max-depth': ['error', 3], // Maximum nesting depth
      'max-params': ['error', 4], // Maximum parameters

      // Code Organization Rules
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }], // Max lines per file
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }], // Max lines per function
      'max-statements': ['warn', 15], // Max statements per function
      'max-classes-per-file': ['warn', 1], // Single class per file

      // React Best Practices
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react-hooks/rules-of-hooks': 'error', // Enforce React Hooks rules
      'react-hooks/exhaustive-deps': 'warn', // Prevent stale closures

      // Next.js Best Practices
      '@next/next/no-html-link-for-pages': 'error', // Use Next.js Link component
      '@next/next/no-img-element': 'error', // Use Next.js Image component

      // Code Organization
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'newline-before-return': 'error', // Improve code readability
      'lines-around-comment': [
        'error',
        {
          beforeLineComment: true,
          beforeBlockComment: true,
          allowBlockStart: true,
          allowClassStart: true,
          allowObjectStart: true,
          allowArrayStart: true,
        },
      ],

      // Code Formatting (via Prettier)
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],

      // Testing Best Practices
      'jest-dom/prefer-checked': 'error',
      'jest-dom/prefer-empty': 'error',
      'jest-dom/prefer-enabled-disabled': 'error',
      'jest-dom/prefer-focus': 'error',
      'jest-dom/prefer-in-document': 'error',
      'jest-dom/prefer-required': 'error',
      'jest-dom/prefer-to-have-attribute': 'error',
      'jest-dom/prefer-to-have-class': 'error',
      'jest-dom/prefer-to-have-style': 'error',
      'jest-dom/prefer-to-have-text-content': 'error',
      'jest-dom/prefer-to-have-value': 'error',
    },
  },

  // TypeScript-specific configuration
  // Adds type-aware linting and TypeScript-specific rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      sonarjs: sonarjs,
      import: importPlugin,
    },
    rules: {
      // Disable JS rules in favor of TS equivalents
      'no-unused-vars': 'off',

      // TypeScript-specific rules for better type safety
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ], // Catch unused variables, ignore _ prefixed
      '@typescript-eslint/no-explicit-any': 'error', // Enforce proper typing
      '@typescript-eslint/explicit-function-return-type': 'off', // Changed from 'warn' to 'off'
      '@typescript-eslint/explicit-module-boundary-types': 'off', // TypeScript can infer exported types
      '@typescript-eslint/ban-ts-comment': 'warn', // Discourage @ts-ignore
      '@typescript-eslint/no-non-null-assertion': 'warn', // Discourage ! operator, prefer proper null checking
    },
  },

  // Test file configuration
  // Relaxes certain rules that are commonly needed in tests
  {
    files: [
      '**/tests/**/*.{test,spec}.{js,jsx,ts,tsx}', // Covers all tests within any 'tests' directory (unit, e2e, integration, etc.)
      '**/*.{test,spec}.{js,jsx,ts,tsx}', // Covers test files that might be co-located with source files
    ],
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in test mocks
      'no-console': 'off', // Allow console in tests for debugging
      '@next/next/no-img-element': 'off', // Allow img in tests
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables in tests

      // Jest-specific test naming and structure rules
      'jest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      'jest/require-top-level-describe': 'error',
      'jest/no-identical-title': 'error',
      'jest/valid-title': 'error',

      // Prevent accidentally committed skipped/focused tests
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',

      // Test isolation (prevents shared state/fixture misuse)
      'jest/no-standalone-expect': 'error',

      // Adjusted complexity thresholds for test files
      'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true }],
      'max-statements': ['warn', 25],
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
      complexity: 'off', // Relax complexity for tests
      'sonarjs/cognitive-complexity': 'off',
    },
  },

  // Consolidated configuration for test setup, utilities, mocks, and config files
  {
    files: [
      // Test setup files
      '**/setup/*.{js,ts}',
      '**/jest.setup.*.{js,ts}',
      'tests/config/**/*.{js,ts}',
      'tests/utils/**/*.{js,ts}',
      'tests/mocks/**/*.{js,ts}',
      'tests/e2e/setup/**/*.ts',
      'tests/setup/**/*.ts',
      'tests/e2e/**/*.ts',

      // Config files
      'playwright.config.ts',
      'jest.setup.api.js',

      // Script files
      'scripts/**/*.js',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in setup/utility files
      'no-console': 'off', // Allow console in setup/utility files
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables in setup/utility files
      'max-lines-per-function': 'off', // No line limits for setup/utility files
      'max-statements': 'off', // No statement limits for setup/utility files
      'max-lines': 'off', // No file line limits for setup/utility files
      complexity: 'off', // Allow complexity in setup/utility files
      'sonarjs/cognitive-complexity': 'off', // Allow cognitive complexity in setup/utility files
    },
  },

  // Mock file configuration
  // Allows multiple classes per file for mock files as they often contain related mocks
  {
    files: ['tests/mocks/**/*.{js,ts}', 'jest.setup.api.js'],
    rules: {
      'max-classes-per-file': ['warn', 4], // Allow multiple classes for mocks
    },
  },

  // Consolidated E2E and integration test configuration
  // These tests often have more complex user journeys and setup
  {
    files: [
      'tests/e2e/**/*.spec.ts',
      'tests/integration/**/*.test.ts',
      'tests/e2e/auth.setup.ts',
      'tests/setup/auth.setup.ts',
    ],
    rules: {
      // Further relaxed limits for E2E tests which simulate complex user journeys
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-statements': ['warn', 45], // Increased from 30 to 45 for E2E test complexity
    },
  },

  // Unit test specific configuration with more permissive limits
  {
    files: ['tests/unit/**/*.test.{js,ts,tsx}'],
    rules: {
      'max-lines-per-function': ['warn', { max: 600, skipBlankLines: true, skipComments: true }], // Much higher limit for unit tests
      'max-statements': ['warn', 60], // More permissive statements limit
      'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }], // Higher file line limit
      'jest/no-disabled-tests': 'warn', // Keep as warning to avoid accidental commits of skipped tests
    },
  },

  // Special override for auth setup files which require extensive initialization
  {
    files: ['tests/e2e/auth.setup.ts', 'tests/setup/auth.setup.ts'],
    rules: {
      'max-statements': ['warn', 60], // Allow up to 60 statements for auth setup files
      complexity: ['error', 15], // Increased complexity threshold for setup files
      'sonarjs/cognitive-complexity': ['error', 20], // Increased cognitive complexity for setup files
    },
  },

  // Standalone test files with complex setups
  {
    files: [
      'scripts/test-debug-helpers/simple-layout-test.js',
      'scripts/test-debug-helpers/standalone-test.js',
    ],
    rules: {
      'max-statements': ['warn', 55], // Allow significantly more statements for these specific test files
      'no-console': 'off', // Allow console in these test files
    },
  },

  // Special override for run-e2e-with-checks.js
  {
    files: ['scripts/run-e2e-with-checks.js'],
    rules: {
      'max-statements': 'off', // Disable max statements check
      'max-depth': 'off', // Disable max depth check
    },
  },

  // Consolidated utility files configuration where 'any' type might be necessary
  {
    files: [
      // Type definition files, test fixtures, and utilities
      'tests/utils/**/*.ts',
      'tests/e2e/fixtures/**/*.ts',
      'types/**/*.d.ts',

      // Database and service utilities
      'lib/db/utils.ts',
      'lib/db/raw-query-service.ts',
      'lib/services/raw-query-service.ts',
      'lib/__mocks__/**/*.ts',
      'lib/theme/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any where necessary for flexibility
    },
  },

  // Special override for database service files
  {
    files: ['lib/db/session-cleanup-service.ts'],
    rules: {
      'max-statements': ['warn', 20], // Allow up to 20 statements for complex DB operations
    },
  },
];
