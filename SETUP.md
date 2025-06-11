# AI Agent Setup Guide

This template is designed for AI agents to quickly set up a Next.js application with NextAuth.js authentication and PostgreSQL database.

## Prerequisites

- PostgreSQL server running and accessible
- Node.js environment with npm
- Terminal/shell access

## Setup Process

### 1. Repository Setup

```bash
git clone <your-repo-url>
cd <your-project-directory>
```

### 2. Dependencies Installation

```bash
# Note: --legacy-peer-deps required due to jest version conflicts
npm install --legacy-peer-deps
```

### 3. Project Configuration

```bash
# Run automated setup with pre-configured answers
node scripts/setup.js --config setup-answers.json
```

The `setup-answers.json` file should contain:

```json
{
  "YOUR_PROJECT_NAME": "your-project-name",
  "YOUR_PROJECT_DESCRIPTION": "Your project description",
  "YOUR_COPYRIGHT_HOLDER": "Your Name or Company",
  "YOUR_PROJECT_URL": "https://your-project.example.com",
  "YOUR_REPOSITORY_URL": "https://github.com/your-username/your-project-name",
  "YOUR_AUTHOR_NAME": "Your Name",
  "YOUR_AUTHOR_EMAIL": "you@example.com",
  "YOUR_APP_TITLE": "Your App Title",
  "YOUR_APP_SHORT_NAME": "YourApp",
  "YOUR_APP_NAME": "Your Application Name",
  "YOUR_APP_DESCRIPTION": "A description for your application",
  "YOUR_DATABASE_NAME_DEV": "your_dev_db_name",
  "YOUR_DATABASE_NAME_TEST": "your_test_db_name",
  "YOUR_DATABASE_NAME": "your_main_db_name",
  "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/your_dev_db_name?schema=public",
  "GOOGLE_CLIENT_ID": "",
  "GOOGLE_CLIENT_SECRET": "",
  "REDIS_URL": "",
  "overwriteEnv": true
}
```

**Database URL Notes:**

- Use `127.0.0.1` instead of `localhost` if connection issues occur (Prisma error P1001)
- PostgreSQL user must have database creation privileges (superuser or `CREATEDB` role)
- Default `postgres:postgres` credentials work for local development
- Database will be created automatically if it doesn't exist

**Important:** Ensure `dotenv-cli` is available as a development dependency for environment variable loading.

### 4. Database Migration

```bash
npx dotenv-cli -e .env.local npx prisma migrate dev
```

This creates necessary tables based on `prisma/schema.prisma`.

### 5. Server Management

**Development Environment (port 3001):**

```bash
npm run ai:start              # Start development server
npm run ai:restart            # Restart development server
npm run ai:status             # Check server status
npm run ai:health            # Health check endpoint
npm run ai:logs              # View server logs
npm run ai:stop              # Stop server
```

**Test Environment (port 3777):**

```bash
npm run ai:start:test         # Start test server
npm run ai:restart:test       # Restart test server
```

### 6. Validation

```bash
# Run tests to verify setup
npm run test:unit            # Unit tests
npm run test:e2e            # End-to-end tests (if needed)
```

## Environment Variables

The setup script automatically creates `.env.local` with:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Auto-generated secure secret (or use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Application base URL
- `GOOGLE_CLIENT_ID/SECRET`: For Google OAuth (optional)
- `REDIS_URL`: For Redis services (optional)

**Manual Configuration Alternative:**
If needed, copy `.env.example` to `.env.local` and manually configure the variables above.

## Authentication Setup

Core authentication uses NextAuth.js with Prisma Adapter:

- Google OAuth and credentials providers supported
- User data stored in PostgreSQL
- Session management via JWT tokens
- Configuration in `lib/auth-shared.ts`

## Google OAuth Configuration (Optional)

If using Google Sign-In:

1. Obtain credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. Configure OAuth consent screen
3. Add authorized origins: `http://localhost:3001` (or your NEXTAUTH_URL)
4. Add redirect URI: `[YOUR_APP_URL]/api/auth/callback/google`
5. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
6. Restart server: `npm run ai:restart`

## Project Structure

Key directories and files:

- `app/`: Next.js 13+ App Router pages and API routes
- `components/`: Reusable UI components
- `lib/`: Utilities, authentication, and services
- `prisma/`: Database schema and migrations
- `tests/`: Unit and E2E test suites

## Optional Firebase Services

This template does **not** use Firebase for core authentication, but you can integrate other Firebase services:

1. Set up a Firebase project in the Firebase Console
2. Add Firebase client configuration variables to `.env.local`
3. The route `app/api/test/firebase-config/route.ts` provides client-side Firebase config (requires `ALLOW_FIREBASE_CONFIG_ENDPOINT=true` in `.env.local` for development/testing)

## Commands Reference

```bash
# Setup and dependencies
npm install --legacy-peer-deps
node scripts/setup.js --config setup-answers.json

# Database
npx dotenv-cli -e .env.local npx prisma migrate dev

# Server management
npm run ai:start              # Development (3001)
npm run ai:start:test         # Test environment (3777)
npm run ai:health            # Health check

# Testing
npm run test:unit            # Unit tests
npm run test:e2e            # End-to-end tests

# Utilities
npm run ai:status            # PM2 status
npm run ai:logs              # View logs
npm run ai:stop              # Stop server
```

## Troubleshooting

**Common Issues:**

- **Setup script fails**: Ensure using Node.js with dynamic import support
- **Database connection**: Try `127.0.0.1` instead of `localhost` in DATABASE_URL
- **Permission errors**: Ensure PostgreSQL user has CREATEDB privileges
- **Port conflicts**: Check if ports 3001/3777 are available
- **Dependency conflicts**: Use `--legacy-peer-deps` flag

**Health Check:**

```bash
npm run ai:health
# Should return: {"status": "ok", "uptime": X, "timestamp": "...", "serverInfo": {...}}
```

This template is optimized for AI agent deployment and automation while maintaining human usability as a secondary consideration.
