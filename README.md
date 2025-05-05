# {{YOUR_PROJECT_NAME}}

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A modern web application template built with Next.js, Firebase, and PostgreSQL.

## Features

- Next.js 13+ App Router
- Firebase Authentication
- PostgreSQL Database
- Redis Caching
- Comprehensive Testing Setup
- TypeScript
- Material Design Components (MUI)
- Consistent linting with ESLint flat config

## Technology Stack

- **Frontend**: Next.js, React, Material UI (MUI)
- **Backend**: Node.js/TypeScript
- **Auth**: Firebase Authentication
- **Data**: PostgreSQL, Redis (caching)
- **Deployment**: fly.io

## Installation

```bash
# Clone this repository
git clone https://github.com/yourusername/{{YOUR_PROJECT_NAME}}.git

# Navigate to the project directory
cd {{YOUR_PROJECT_NAME}}

# Install dependencies
npm install

# Set up environment variables (create a .env file based on .env.example)

# Run the development server
npm run dev
```

## Configuration

1. Create a Firebase project and enable Authentication
2. Set up a PostgreSQL database
3. Configure Redis (optional)
4. Update environment variables in your .env file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Project Structure

```
{{YOUR_PROJECT_NAME}}/
├── app/                    # Next.js 13+ App Router
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   │   └── session/    # Session management endpoints
│   │   └── health/         # Health check endpoint
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   ├── auth/               # Authentication components
│   │   ├── SignInButton.tsx # Sign-in/sign-out button
│   │   └── UserProfile.tsx  # User profile display
│   ├── ui/                 # Base UI components
├── lib/                    # Utility functions and configurations
│   ├── firebase.ts         # Firebase Web SDK configuration
│   ├── firebase-admin.ts   # Firebase Admin SDK configuration
│   └── session.ts          # Session management utilities
├── middleware.ts           # Authentication middleware
├── tests/                  # Centralized test directory
│   ├── unit/               # Unit tests
│   │   ├── components/     # Component tests
│   │   └── api/            # API tests
│   ├── integration/        # Integration tests
│   ├── e2e/                # E2E tests with Playwright
│   ├── mocks/              # Test mocks
│   ├── utils/              # Test utilities
│   └── config/             # Test configuration
│       ├── jest.config.js  # Jest configuration
│       └── setup/          # Test setup files
├── docs/                   # Project documentation
│   └── testing/            # Testing documentation
├── firebase.json           # Firebase configuration
└── next.config.js          # Next.js configuration
```

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file with the required environment variables (see below)
4. Run the development server with `npm run dev`

## Environment Variables

Required in `.env.local`:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Database
DATABASE_URL=

# Redis (optional)
REDIS_URL=
```

## Available Commands

```bash
# Development
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server

# Testing
npm test          # Run Jest tests
npm test -- --watch   # Run tests in watch mode
npm test -- --coverage # Run tests with coverage

# Linting & Formatting
npm run lint      # Check ESLint issues
npm run lint:fix  # Fix ESLint issues
npm run format    # Format with Prettier

# Firebase
npm run firebase:emulators         # Start Firebase emulators
```

## ESLint Configuration

This project uses a modern ESLint setup with the new flat config format (`eslint.config.mjs`). The configuration is designed to provide comprehensive linting for TypeScript, React, and Next.js while maintaining good performance.

### Key Features

- Modern flat config format for better performance and maintainability
- TypeScript-aware linting with strict type checking
- React and Next.js specific rules for best practices
- Integration with Prettier for consistent code formatting
- Specialized configurations for test files
- Import organization and code style consistency rules

### Customizing ESLint Rules

To modify the ESLint configuration for your project:

1. Open `eslint.config.mjs`
2. The config is organized into sections:
   - Base configuration for all JavaScript files
   - TypeScript-specific rules
   - Test file overrides

Example of adding custom rules:

```javascript
// In eslint.config.mjs
export default [
  // ... existing configs ...
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Add your custom rules here
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
    },
  },
];
```

### Available Scripts

```bash
# Lint your code
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Lint specific files
npm run lint:files path/to/your/file.ts
```

The linting configuration works seamlessly with popular IDEs like VS Code when using the ESLint extension.

## Authentication

This project uses Firebase Authentication. The authentication flow is handled by the `SignInButton` component, which:

1. Initiates authentication using Firebase
2. Creates a session using the `/api/auth/session` endpoint
3. Redirects to the dashboard on successful sign-in

## Testing

This template includes a comprehensive testing setup:

- **Unit & Integration Tests:** Jest with React Testing Library. Run with `npm run test:unit`. Coverage reports are generated.
  - **Note:** Due to the multi-project Jest configuration (Node.js environment for backend/API tests, JSDOM for components), Jest might report a number of "skipped" tests even though all discoverable test files are being executed correctly by their designated project runner. This is a known reporting quirk of some complex Jest setups.
- **End-to-End Tests:** Playwright for browser automation. Run with `npm run test:e2e`. See the [Testing Documentation](./docs/testing/README-main.md) for details on running E2E tests, including emulator setup and debugging.

## Tech Stack Details

- **Framework**: Next.js 13+ with App Router
- **Authentication**: Firebase Auth
- **Database**: PostgreSQL
- **Caching**: Redis (optional)
- **UI**: React with Material UI (MUI)
- **Testing**: Jest with React Testing Library
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Formatting**: Prettier

## Code Quality

This project maintains high code quality standards through:

### Automatic Code Formatting

This template uses Prettier for automatic code formatting at multiple stages in the development workflow:

- **During Development**: Files are automatically formatted when you run `npm run dev` or `npm run build`
- **During Git Commits**: Files are automatically formatted before commit via a pre-commit hook
- **Manual Formatting**: Run `npm run format` at any time to format all files
- **VS Code Integration**: Files are automatically formatted on save when using VS Code

For AI-driven workflows or when making multiple changes, use these convenience scripts:

```bash
npm run dev:clean   # Format, lint, and start dev server
npm run build:clean # Format, lint, and build for production
```

These ensure consistent code style without manual intervention, even when using AI-assisted coding.

### ESLint

This project uses ESLint to enforce code quality rules:

## Git Hooks

This project uses Husky to manage Git hooks:

- **Pre-commit**: Automatically runs lint-staged to format and lint your code before each commit
- **Pre-push**: Runs unit tests before pushing to ensure code quality

You can bypass these hooks in emergency situations:

```bash
# Skip pre-commit hooks
git commit --no-verify

# Skip pre-push hooks
git push --no-verify
```

Note: Using these bypass flags is discouraged for normal development workflow.

## Development Scripts

### E2E Testing

This project provides several scripts for running E2E tests:

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run tests with Playwright UI
- `npm run test:e2e:dynamic` - Run tests with dynamic port allocation using ts-node

#### ts-node Scripts

The project uses ts-node for running TypeScript scripts directly without compilation. Several optimized variants are available:

- `npm run test:e2e:dynamic` - Basic script using ts-node with transpile-only flag
- `npm run test:e2e:dynamic:optimized` - Optimized with memory settings for larger projects
- `npm run test:e2e:dynamic:paths` - Includes support for TypeScript path aliases
- `npm run test:e2e:dynamic:tsx` - Alternative using tsx for better performance

For most users, the default `test:e2e:dynamic` script should be sufficient. The other variants are available for specific use cases or performance optimization.

## Logging

This template uses **Pino** for structured, low-overhead logging.

- **Configuration**: Logging behavior is configured in `lib/logger.ts`.
- **Log Levels**: The minimum log level is controlled by the `LOG_LEVEL` environment variable (e.g., `trace`, `debug`, `info`, `warn`, `error`, `fatal`). It defaults to `info`.
- **Development**: Logs are automatically pretty-printed to the console using `pino-pretty` when running `npm run dev` or `npm run ai:start`.
- **Production**: Logs are outputted as raw JSON to `stdout`, suitable for capture by deployment platforms or log collectors.
- **Server-Side Logging**: Use the exported `logger` or create context-specific loggers (e.g., `loggers.api`, `loggers.db`) from `lib/logger.ts`.
- **Client-Side Logging**: Import `clientLogger` from `lib/client-logger.ts` in your client components ('use client'). Logs sent via `clientLogger` (e.g., `clientLogger.warn('Something seems off')`) are sent to the `/api/log/client` endpoint and logged server-side.
- **Request ID**: Incoming requests are automatically assigned an `x-request-id` header (visible in browser dev tools) and the corresponding `requestId` is included in server-side logs for tracing.
- **Redaction**: Sensitive fields (passwords, tokens, etc., defined in `lib/logger.ts`) are automatically redacted from logs.

<!-- Test comment for pre-commit hook verification -->
