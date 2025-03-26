import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Mock plugins for testing-library and jest-dom
// These will be properly installed later, but for now we'll define recommended rules
const testingLibraryPlugin = {
  configs: {
    recommended: {
      plugins: ['testing-library'],
      rules: {
        // Core testing-library recommended rules
        'testing-library/await-async-queries': 'error',
        'testing-library/await-async-utils': 'error',
        'testing-library/no-await-sync-queries': 'error',
        'testing-library/no-container': 'error',
        'testing-library/no-debugging-utils': 'warn',
        'testing-library/no-dom-import': 'error',
        'testing-library/no-node-access': 'error',
        'testing-library/no-promise-in-fire-event': 'error',
        'testing-library/no-render-in-setup': 'error',
        'testing-library/no-unnecessary-act': 'error',
        'testing-library/no-wait-for-multiple-assertions': 'error',
        'testing-library/no-wait-for-side-effects': 'error',
        'testing-library/no-wait-for-snapshot': 'error',
        'testing-library/prefer-find-by': 'error',
        'testing-library/prefer-presence-queries': 'error',
        'testing-library/prefer-query-by-disappearance': 'error',
        'testing-library/prefer-screen-queries': 'error',
        'testing-library/prefer-user-event': 'error',
        'testing-library/render-result-naming-convention': 'error',
      }
    }
  }
};

const jestDomPlugin = {
  configs: {
    recommended: {
      plugins: ['jest-dom'],
      rules: {
        // Core jest-dom recommended rules
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
      }
    }
  }
};

export default [
  // Ignore patterns
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'public/**', '**/*.js.map', 'coverage/**'],
  },

  // Base configuration for all JavaScript files
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
    },
    rules: {
      // Base rules
      'no-console': 'warn',
      'no-unused-vars': 'off',
      semi: ['error', 'always'],
      curly: ['error', 'multi-line'],

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',

      // Import organization
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'newline-before-return': 'error',
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

      // Prettier integration
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    },
  },

  // TypeScript-specific configuration
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
      // Turn off JS rules that TypeScript handles better
      'no-unused-vars': 'off',

      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },

  // Test file configuration
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      
      // Apply testing-library and jest-dom rules
      ...testingLibraryPlugin.configs.recommended.rules,
      ...jestDomPlugin.configs.recommended.rules,
    },
  },
];
