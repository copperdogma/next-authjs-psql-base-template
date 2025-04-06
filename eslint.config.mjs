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
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/e2e/**/*.test.ts',
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

      // TypeScript-specific rules for better type safety
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Catch unused variables
      '@typescript-eslint/no-explicit-any': 'warn', // Encourage proper typing
      '@typescript-eslint/explicit-function-return-type': 'off', // TypeScript can infer return types
      '@typescript-eslint/explicit-module-boundary-types': 'off', // TypeScript can infer exported types
      '@typescript-eslint/ban-ts-comment': 'warn', // Discourage @ts-ignore
      '@typescript-eslint/no-non-null-assertion': 'warn', // Discourage ! operator, prefer proper null checking
    },
  },

  // Test file configuration
  // Relaxes certain rules that are commonly needed in tests
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      'tests/unit/components/UserProfile.test.tsx',
      'tests/unit/api/auth/*.test.ts',
      'tests/unit/auth/*.test.ts',
      'tests/e2e/**/*.ts',
      'tests/e2e/**/*.js',
      'tests/config/**/*.ts',
      'tests/utils/**/*.ts',
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
      // These allow for more complex test cases while still encouraging good practices
      'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true }], // More permissive for E2E tests
      'max-statements': ['warn', 25], // Allow more statements in test functions
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }], // More permissive for test files
    },
  },

  // End-to-End test specific configuration
  // E2E tests often require more statements and longer functions
  {
    files: [
      'tests/e2e/accessibility-improved.spec.ts',
      'tests/e2e/auth.setup.ts',
      'tests/e2e/auth/**/*.spec.ts',
      'tests/e2e/performance.spec.ts',
      'tests/e2e/navigation-improved.spec.ts',
      'tests/integration/database.test.ts',
      'tests/setup/auth.setup.ts',
      'tests/e2e/basic-navigation.spec.ts',
      'tests/mocks/app/api/auth/session/route.ts',
    ],
    rules: {
      // Further relaxed limits for E2E tests which simulate complex user journeys
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-statements': ['warn', 30],
    },
  },

  // Mock file configuration
  // Allows multiple classes per file for mock files as they often contain related mocks
  {
    files: ['jest.setup.api.js', 'tests/mocks/**/*.js', 'tests/mocks/**/*.ts'],
    rules: {
      'max-classes-per-file': ['warn', 4], // Allow multiple classes for mocks
    },
  },

  // Script files and standalone test files configuration
  // These files often have more complex test setups
  {
    files: ['tests/simple-layout-test.js', 'tests/standalone-test.js'],
    rules: {
      'max-statements': ['warn', 55], // Allow significantly more statements for these specific test files
    },
  },

  // Special case for Prisma adapter user operations
  {
    files: ['tests/mocks/auth/prisma-adapter/user-operations.ts'],
    rules: {
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }], // Slightly more permissive
    },
  },

  // Script files configuration
  // Allows console usage in script files and relaxes complexity for specific scripts
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', 'tests/config/**/*.ts'],
    rules: {
      'no-console': 'off', // Allow console in scripts
    },
  },

  // Override for specific script file needing more complexity
  {
    files: ['scripts/run-e2e-with-checks.js'],
    rules: {
      'max-statements': 'off', // Disable max statements check
      'max-depth': 'off', // Disable max depth check
    },
  },

  // Utility files configuration
  // Relaxes certain rules in utility files
  {
    files: ['lib/**/*.ts', 'tests/utils/**/*.ts', 'tests/e2e/fixtures/**/*.ts', 'types/**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in utility files
    },
  },
];
