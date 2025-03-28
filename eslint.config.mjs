import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
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
      '**/*.d.ts',
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
    },
    rules: {
      // Error Prevention
      'no-console': 'warn', // Prevent accidental console.log in production
      'no-unused-vars': 'off', // Disabled in favor of TypeScript's version
      semi: ['error', 'always'], // Consistent semicolon usage
      curly: ['error', 'multi-line'], // Clear block structure

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
    },
    rules: {
      // Disable JS rules in favor of TS equivalents
      'no-unused-vars': 'off',

      // TypeScript-specific rules for better type safety
      '@typescript-eslint/no-unused-vars': 'error', // Catch unused variables
      '@typescript-eslint/no-explicit-any': 'warn', // Encourage proper typing
      '@typescript-eslint/explicit-function-return-type': 'off', // TypeScript can infer return types
      '@typescript-eslint/explicit-module-boundary-types': 'off', // TypeScript can infer exported types
      '@typescript-eslint/ban-ts-comment': 'warn', // Discourage @ts-ignore
    },
  },

  // Test file configuration
  // Relaxes certain rules that are commonly needed in tests
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      'tests/unit/components/UserProfile.test.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in test mocks
      'no-console': 'off', // Allow console in tests for debugging
      '@next/next/no-img-element': 'off', // Allow img in tests
    },
  },

  // Script files configuration
  // Allows console usage in script files
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', 'tests/config/**/*.ts'],
    rules: {
      'no-console': 'off', // Allow console in scripts
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
