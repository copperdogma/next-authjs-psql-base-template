# next-auth-psql-app

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Modern web application template: Next.js, NextAuth.js v5 (Prisma Adapter), PostgreSQL. Optional Redis.

## Core Technologies

- **Framework**: Next.js (App Router)
- **Authentication**: NextAuth.js v5 (Prisma Adapter for PostgreSQL)
  - Providers: Google, Email/Password (Credentials)
- **Database**: PostgreSQL
- **UI**: Material UI (MUI)
- **Testing**: Jest (Unit), Playwright (E2E)
- **Language**: TypeScript
- **Styling**: CSS Modules, PostCSS, Tailwind CSS (Configurable)
- **Linting/Formatting**: ESLint (Flat Config), Prettier

## Optional Integrations

- **Caching/Rate Limiting**: Redis

## Quick Start

1.  **Clone**: `git clone https://github.com/yourusername/next-auth-psql-app.git && cd next-auth-psql-app`
2.  **Install Dependencies**: `npm install`
3.  **Setup Environment**:
    - Run `npm run setup` for guided environment configuration (creates `.env.local`).
    - Alternatively, copy `.env.example` to `.env.local` and manually configure:
      - `DATABASE_URL` (PostgreSQL)
      - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
      - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (if using Google Sign-In)
      - `REDIS_URL` (if using Redis)
4.  **Database Migration**: `npx prisma migrate dev`
5.  **Run Dev Server**: `npm run dev` (App available at `http://localhost:3000` or configured `NEXTAUTH_URL`)

## Project Structure

```
next-auth-psql-app/
├── app/                    # Next.js App Router (pages, layouts, API routes)
│   ├── api/                # API routes (e.g., /api/health)
│   │   └── auth/           # NextAuth.js managed endpoints (e.g., /api/auth/signin)
│   └── (routes)/           # Route groups for pages like dashboard, login, etc.
├── components/             # Reusable React components
│   ├── auth/               # Auth-specific components (SignInButton, UserProfile)
│   ├── ui/                 # Generic UI elements (Button, Card, Dialog - MUI based)
│   └── forms/              # Form handling components
├── lib/                    # Core utilities, services, and configurations
│   ├── auth-shared.ts      # Shared NextAuth.js config (providers, callbacks)
│   ├── auth-node.ts        # NextAuth.js server-side config
│   ├── auth-edge.ts        # NextAuth.js edge runtime config (used by middleware)
│   ├── prisma.ts           # Prisma client instance
│   └── redis.ts            # Redis client instance (optional)
├── middleware.ts           # Next.js middleware (handles auth redirects via NextAuth.js)
├── prisma/                 # Prisma schema, migrations, seed data
├── public/                 # Static assets
├── scripts/                # Utility scripts (e.g., setup.js)
├── tests/                  # All tests (E2E with Playwright, Unit with Jest)
│   ├── e2e/
│   └── unit/
├── .env.example            # Template for environment variables
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint flat configuration
└── README.md               # This file
```

## Key Commands

Refer to the "Project Command Reference" section in your `project-reference.mdc` file or run `npm run` to see all available scripts in `package.json`. Common commands:

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run start`: Start production server.
- `npm test`: Run unit tests (Jest).
- `npm run test:e2e`: Run E2E tests (Playwright) - starts dev server automatically.
- `npm run lint`: Check for ESLint issues.
- `npm run format`: Format code with Prettier.
- `npx prisma migrate dev`: Apply database migrations.
- `npx prisma studio`: Open Prisma Studio to view/edit data.

## Environment Variables

See `.env.example` for a comprehensive list. Key variables to configure in `.env.local`:

- `DATABASE_URL`: PostgreSQL connection string.
- `NEXTAUTH_SECRET`: Secret for NextAuth.js.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: For Google OAuth.
- `NEXTAUTH_URL`: Base URL of your application (e.g., `http://localhost:3000`). Important for OAuth redirects.
- `REDIS_URL`: Connection string for Redis (if used).

## Authentication (NextAuth.js)

- Uses Prisma Adapter for PostgreSQL session and user persistence.
- Configuration primarily in `lib/auth-shared.ts`, `lib/auth-node.ts`, and `lib/auth-edge.ts`.
- API routes under `app/api/auth/[...nextauth]/route.ts`.
- Protected routes managed by `middleware.ts`.
- For detailed behavior and implementation details, see [Authentication Documentation](docs/AUTHENTICATION.md).

## Security Considerations

### OAuth Profile Data Handling

This template implements an "initial population only" approach to handling OAuth profile data:

- **Initial Setup**: When a user first signs up or links a new OAuth provider, their name and profile image from the provider are used to populate their initial user record.
- **Subsequent Logins**: Later sign-ins via the OAuth provider will **not** automatically update the user's profile details from the provider.
- This allows users to customize their profile within your application without having it overwritten by their OAuth provider profile changes.
- See [Authentication Documentation](docs/AUTHENTICATION.md) for implementation details and how to modify this behavior if needed.

### Rate Limiting Fail-Open Strategy

The registration rate limiting has a "fail-open" strategy:

- If Redis is unavailable or misconfigured when `ENABLE_REDIS_RATE_LIMITING` is set to `true`, rate limiting will be skipped and new user registrations will **not** be rate-limited.
- This design prioritizes service availability over strict rate limit enforcement.
- If Redis encounters an error during the rate limit check, the system will proceed as if the user is not rate limited.
- In production environments where security is critical, ensure that:
  1. Redis is properly configured and highly available
  2. `ENABLE_REDIS_RATE_LIMITING` is set to `true`
  3. `REDIS_URL` points to a valid Redis instance
  4. `RATE_LIMIT_REGISTER_MAX_ATTEMPTS` and `RATE_LIMIT_REGISTER_WINDOW_SECONDS` are configured appropriately
- You may need to implement additional safeguards if your application requires absolute guarantees on rate limiting.
- The implementation is in [`lib/actions/auth.actions.ts`](lib/actions/auth.actions.ts) (specifically the `_handleRegistrationRateLimit` function) and [`lib/redis.ts`](lib/redis.ts) provides the Redis connection management.

## Database (PostgreSQL with Prisma)

- Schema defined in `prisma/schema.prisma`.
- Migrations in `prisma/migrations/`.
- Use `npx prisma migrate dev` to apply migrations during development.
- Use `npx prisma generate` after schema changes to update Prisma Client.

## ESLint (Flat Configuration)

- Uses modern `eslint.config.mjs` (flat config).
- Includes TypeScript, React, Next.js, and Prettier integration.
- Customizable by editing `eslint.config.mjs`.

## Deployment

- Ensure all necessary environment variables are set in your deployment environment.
- For rate limiting in production, use Redis (`RateLimiterRedis`) instead of the default in-memory store. Configuration for this is in `lib/redis.ts` and relevant API routes.
- The build command is `npm run build`.

## Contributing

Contributions are welcome. Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
