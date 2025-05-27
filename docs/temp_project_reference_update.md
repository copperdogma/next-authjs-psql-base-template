## Project Structure

```
{{YOUR_PROJECT_NAME}}/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints (NextAuth.js)
│   │   │   └── [...nextauth]/ # NextAuth.js dynamic route
│   │   └── health/       # Health check endpoint
│   ├── globals.css       # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   │   ├── SignInButton.tsx  # Sign-in/sign-out button (uses NextAuth.js)
│   │   └── UserProfile.tsx   # User profile display (uses NextAuth.js session)
│   ├── ui/               # Base UI components (MUI based)
│   │   ├── Button.tsx    # Button with variants
│   │   ├── Card.tsx      # Card with subcomponents
│   │   ├── DateTimePicker.tsx # Date/time selection
│   │   ├── Dialog.tsx    # Modal dialogs
│   │   ├── Input.tsx     # Form input
│   │   ├── Label.tsx     # Form label
│   │   ├── Menu.tsx      # Dropdown menus
│   │   ├── Snackbar.tsx  # Notifications
│   │   └── TextField.tsx  # Text input with MUI styling
│   ├── forms/            # Form components (e.g., CredentialsLoginForm)
│   └── layouts/          # Layout components
├── lib/                  # Utility functions and configurations
│   ├── auth-node.ts      # NextAuth.js configuration (Node.js runtime)
│   ├── auth-edge.ts      # NextAuth.js configuration (Edge runtime for middleware)
│   ├── auth-shared.ts    # NextAuth.js shared configuration (providers, etc.)
│   ├── prisma.ts         # Prisma client initialization
│   ├── redis.ts          # Redis client initialization (optional, for rate limiting etc.)
│   └── env.ts            # Environment variable validation (Zod)
├── middleware.ts         # Authentication middleware (uses NextAuth.js)
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma     # Prisma schema file
├── tests/                # Test files
│   ├── e2e/             # End-to-end tests with Playwright
│   │   ├── auth/        # Authentication tests (NextAuth.js focused)
│   │   └── ui/          # UI component tests
│   ├── unit/            # Unit tests with Jest
│   │   ├── components/  # Component tests
│   │   ├── api/         # API route tests
│   │   └── utils/       # Utility function tests
│   └── config/          # Test configuration
├── scripts/              # Helper scripts
```

## Component Architecture

### Authentication Components

- `SignInButton`: Handles sign-in (Google, Email/Password via NextAuth.js) and sign-out.
  - Variants: sign-in (default) and sign-out.
  - Relies on NextAuth.js `signIn()` and `signOut()` methods.
  - Loading states during auth.
- `UserProfile`: Displays authenticated user information from NextAuth.js session.
  - Profile picture, user name, and email display.
  - Dark theme compatible.
  - Integrated sign-out button.
- `CredentialsLoginForm`: Provides a form for email/password login using NextAuth.js Credentials provider.

### UI Components

- Button: default/destructive/outline/secondary/ghost/link variants
- Card: Header/Title/Description/Content/Footer subcomponents
- DateTimePicker: Date and time selection with validation
- Dialog: Modal dialogs with customizable header/content/actions
- Input: default/outline/ghost variants, form integration
- Label: default/error/success variants, accessibility support
- Menu: Dropdown menus with optional icons
- Snackbar: Toast notifications with severity levels
- TextField: Material UI text input with custom styling

### Implementation Details

- All components use 'use client' directive where appropriate.
- TypeScript for type safety.
- Material Design components (MUI) with custom theming.
- Proper ref forwarding.
- Accessibility features.
- Dark mode support via CSS variables.

## Routes

- `/` - Dashboard (protected by NextAuth.js middleware)
- `/login` - Authentication page (NextAuth.js handles providers)
- `/register` - User registration page
- `/about` - Public about page
- `/api/auth/[...nextauth]` - NextAuth.js core authentication endpoints (handles sign-in, sign-out, session management, OAuth callbacks, etc.)
- `/api/health` - Health check endpoint
- `/api/user` - Example API route for user-specific data (protected)

## Project Command Reference

This file summarizes key commands for development, testing, and code quality within this project.

### Core Development

- `npm run dev`: Start the development server.
- `npm run build`: Create a production build.
- `npm start`: Start the production server.
- `npm run db:generate`: Generate Prisma client after schema changes (`prisma generate`).
- `npm run db:migrate:dev`: Run Prisma migrations in development (`prisma migrate dev`).
- `npm run db:studio`: Open Prisma Studio to view/edit data (`prisma studio`).

### AI Agent Server Management (PM2)

- `npm run ai:start`: Start the dev server managed by PM2 (background).
- `npm run ai:stop`: Stop the PM2-managed server.
- `npm run ai:restart`: Restart the PM2-managed server.
- `npm run ai:status`: Check the status of the PM2-managed server.
- `npm run ai:logs`: Show recent logs from the PM2-managed server.
- `npm run ai:health`: Check the `/api/health` endpoint of the running server.
- `npm run ai:port`: Display the port the PM2-managed server is using.

### Testing

- `npm test` or `npm run test:unit`: Run all Jest unit tests (components, API, utils).
- `npm run test:watch`: Run unit tests in watch mode.
- `npm run test:coverage`: Run unit tests with coverage report.
- `npm test <test-file> -- --coverage --collectCoverageFrom=<source-file>`: Run a specific test file with coverage report limited to its corresponding source file.

#### E2E Testing

- `npm run test:e2e`: **Primary E2E command** - Starts the test server, runs all Playwright tests. (Note: Firebase emulators are no longer part of this core flow).
- `npm run test:e2e:ui-only`: Run only UI tests.
- `npm run test:e2e:auth-only`: Run only authentication tests.
- `npm run test:e2e:debug`: Run E2E tests with Playwright's debug mode enabled.
- `npm run test:e2e:headed`: Run E2E tests in headed mode (visible browser).
- `npm run test:e2e:report`: View the HTML test report from previous test runs.
- `npm run test:e2e:auth-setup`: Run only the auth setup script (logs in a test user and saves session state for Playwright).

### Code Quality & Formatting

- `npm run lint`: Check for ESLint issues.
- `npm run lint:fix`: Automatically fix ESLint issues.
- `npm run format`: Format code using Prettier.
- `npm run format:check`: Check code formatting without making changes.
- `npm run type-check`: Run TypeScript compiler for type checking.
- `npm run validate`: Run lint, format check, and type check together.

## Environment Variables

Required in `.env.local`:

```bash
# Next Auth
NEXTAUTH_URL=http://localhost:3000 # URL of your app
NEXTAUTH_SECRET= # A random string used to hash tokens, sign cookies and generate cryptographic keys.

# Google OAuth Provider (Optional, for Google Sign-In)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database (PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Redis (Optional, for rate limiting, etc.)
REDIS_URL="redis://localhost:6379"
# Optional: Enable Redis-based rate limiting for registration (true/false)
ENABLE_REDIS_RATE_LIMITING=true
# Optional: Max registration attempts per IP in window (default: 10)
RATE_LIMIT_REGISTER_MAX_ATTEMPTS=10
# Optional: Window in seconds for registration rate limit (default: 3600)
RATE_LIMIT_REGISTER_WINDOW_SECONDS=3600


# Test Configuration (used by E2E tests and auth setup)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test123!

# Application Settings
NEXT_PUBLIC_APP_NAME="{{YOUR_APP_NAME}}"
NEXT_PUBLIC_APP_DESCRIPTION="{{YOUR_APP_DESCRIPTION}}"
# ... other app-specific public env vars
```

## Tech Stack

- Next.js
- React
- TypeScript
- Material Design components (MUI)
- NextAuth.js (for authentication)
  - Providers: Google, Email/Password (Credentials)
  - Adapter: Prisma (for PostgreSQL user persistence)
- Prisma (ORM for PostgreSQL)
- PostgreSQL
- Playwright for E2E testing
- Jest for unit testing
- Redis (optional, for rate limiting, caching)

## Configuration Files

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript settings
- `.env.example` - Environment variables template
- `eslint.config.mjs` - ESLint rules
- `.prettierrc` - Code formatting
- `prisma/schema.prisma` - Prisma schema for database models
- `jest.config.js` - Jest test configuration
- `playwright.config.ts` - Playwright E2E testing configuration
- `ecosystem.config.js` - PM2 configuration for AI agent server management

## CSS Architecture

```css
/* Global CSS Structure */
:root {
  --background: #ffffff;    // Light mode variables
  --foreground: #171717;
}

@theme inline {             // Theme configuration
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {                  // Dark mode variables
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

## Testing Architecture

### End-to-End (E2E) Testing

- **Framework**: Playwright
- **Projects**:
  - `setup`: Authentication setup (uses NextAuth.js login, saves `storageState`)
  - `ui-tests`: Tests without authentication
  - `chromium`: Authenticated tests (uses saved `storageState`)
- **Features**:
  - Automatic server management
  - Dynamic port handling
  - Authentication state reuse via `storageState`
  - Comprehensive debugging tools

### Unit Testing

- **Framework**: Jest
- **Projects**:
  - `jsdom`: Browser environment tests (React components)
  - `node`: Server-side tests (API routes, services, utils)
- **Features**:
  - Component testing with React Testing Library
  - API route testing with `next-test-api-route-handler` or similar.
  - Mock implementations for external services (e.g., Prisma client for service tests).
  - Coverage reporting

## Error Handling

- Form validation errors (client-side and server-side actions)
- API error responses (standardized JSON structure)
- Authentication errors (handled by NextAuth.js, custom error pages)
- Database interaction errors (Prisma errors, service layer error handling)

## Performance Optimizations

- Server components by default
- Client components marked explicitly (`'use client'`)
- Proper code splitting (Next.js default behavior)
- Redis caching layer (optional, for specific data or API responses)
- Optimized images and assets (Next.js Image component)

## Security Measures

- Environment variables for sensitive data (`.env.local`, `lib/env.ts` for validation)
- API route protection (NextAuth.js middleware, session checks in API routes/server actions)
- CORS configuration (Next.js defaults, customizable in `next.config.ts` if needed)
- Rate limiting (optional, via Redis and custom logic, e.g., for registration)
- Input sanitization/validation (Zod for server actions/API inputs, form validation on client)
- Secure session management (NextAuth.js handles session tokens, CSRF protection)
- Server-side operations for sensitive logic (NextAuth.js backend, Prisma client on server)
