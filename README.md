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
- TailwindCSS
- Material Design Components
- Progressive Web App Support

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js/TypeScript
- **Auth**: Firebase Authentication
- **Data**: PostgreSQL, Redis (caching)
- **Deployment**: fly.io

## Utility Functions

### `cn()`: Class Name Utility

The template includes a powerful utility function for managing Tailwind CSS classes:

```typescript
import { cn } from '@/lib/utils';

// Basic usage
<div className={cn('text-red-500', 'bg-blue-500')} />

// With conditional classes
<div className={cn(
  'px-4 py-2',
  { 'bg-blue-500': isPrimary, 'bg-gray-500': !isPrimary }
)} />

// With component variants
<Button className={cn(buttonVariants({ variant, size }), className)} />
```

This utility combines:

- **clsx**: For conditional class handling (objects, arrays, etc.)
- **tailwind-merge**: For resolving Tailwind CSS conflicts (later classes override earlier ones)

Use `cn()` whenever applying Tailwind CSS classes in your components to ensure proper class merging and conflict resolution.

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
│   ├── globals.css         # Global styles with Tailwind imports
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
│   ├── firebase/           # Firebase tests
│   │   ├── security-rules.test.ts # Firestore security rules tests
│   │   └── task-rules.test.ts # Task collection rules tests
│   ├── mocks/              # Test mocks
│   ├── utils/              # Test utilities
│   └── config/             # Test configuration
│       ├── jest.config.js  # Jest configuration
│       └── setup/          # Test setup files
├── docs/                   # Project documentation
│   └── testing/            # Testing documentation
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes configuration
├── jest.config.js          # Jest configuration wrapper
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
npm run firebase:emulators:export  # Export emulator data to ./firebase-emulator-data
npm run firebase:emulators:import  # Import data from ./firebase-emulator-data
npm run firebase:deploy:rules      # Deploy Firestore security rules

# Firebase Testing
npm run test:rules                 # Run security rules tests
npm run test:rules:with-emulator   # Run security rules tests with emulator
npm run test:task-rules            # Run task collection rules tests
npm run test:task-rules:with-emulator # Run task rules tests with emulator
npm run test:all-rules             # Run all Firebase rules tests
npm run test:all-rules:with-emulator # Run all Firebase rules tests with emulator
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
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' }
      }]
    }
  }
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

## Firebase Security Rules

This project uses Firebase Firestore for real-time database capabilities alongside the primary PostgreSQL database. The Firestore security rules are defined in `firestore.rules` and follow secure patterns:

### User Collection Rules

- Authenticated users can read any user profile
- Users can create and update their own profiles
- Admin users can update or delete any user profile
- Regular users cannot delete profiles

### Public Collection Rules

- Anyone can read public documents
- Only admin users can write to public documents

### Tasks Collection Rules

- Users can read, update, and delete only their own tasks
- Admin users can read, update, and delete any task
- Users can only create tasks for themselves

### Firebase Security Rules Testing

The project includes comprehensive tests for Firebase security rules:

1. **User Collection Rules Tests**: Validates permissions for user profiles
2. **Public Collection Rules Tests**: Ensures public data is readable but write-protected
3. **Task Collection Rules Tests**: Verifies task ownership and access control
4. **Default Deny Tests**: Confirms default-deny policy works for undefined collections

To run the tests with Firebase emulators:

```bash
# Start Firebase emulators and run all security rules tests
npm run test:all-rules:with-emulator

# Run specific test suites with emulator
npm run test:rules:with-emulator    # Only user/public collection rules
npm run test:task-rules:with-emulator # Only task collection rules
```

## Testing

The project includes comprehensive testing with Jest for unit tests and Playwright for end-to-end tests.

For detailed testing information, see [the testing guide](docs/testing/main.md) and the implementation documentation:

- [Main testing documentation](tests/README-main.md)
- [E2E testing documentation](tests/e2e/README-e2e.md)

## Tech Stack Details

- **Framework**: Next.js 13+ with App Router
- **Authentication**: Firebase Auth
- **Database**: PostgreSQL
- **Real-time Database**: Firebase Firestore
- **Caching**: Redis (optional)
- **UI**: React with Tailwind CSS
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
