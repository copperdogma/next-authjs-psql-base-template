# NextAuth Prisma Adapter Integration

This document explains how the NextAuth Prisma adapter is integrated into our authentication system and how to test it.

## Overview

The NextAuth Prisma adapter provides a seamless way to store authentication-related data in our PostgreSQL database. It handles:

- User creation on first login
- Session management
- OAuth account linking
- Token verification

## Implementation

The adapter is implemented in `lib/auth.ts` as part of the NextAuth configuration:

```typescript
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Other NextAuth configuration...
};
```

## Database Schema

The adapter uses the following tables in our database:

1. `User` - Stores user information
2. `Account` - Stores OAuth account details
3. `Session` - Manages user sessions
4. `VerificationToken` - Handles email verification

The schema for these tables follows the NextAuth requirements and is defined in `prisma/schema.prisma`.

## Testing

We have three levels of tests for the adapter:

### 1. Unit Tests

Located in `tests/unit/auth/nextauth-adapter.test.ts`, these verify that:

- The adapter is properly configured in NextAuth
- The adapter has all required methods
- Session configuration is correct
- Callbacks are properly set up

### 2. Integration Tests

Located in `tests/integration/auth-user-creation.test.ts`, these test:

- User creation in the database
- Account linking
- Session creation and retrieval
- Error handling for duplicate users

These tests use a mock implementation of the adapter to avoid external dependencies.

### 3. End-to-End Tests

Located in `tests/e2e/auth-user-creation.spec.ts`, these test:

- Complete authentication flow with the real database
- User creation after Google authentication
- Existing user updates on subsequent logins

## Troubleshooting

### Common Issues

1. **Session Not Found**: If sessions aren't being created or found, check that:

   - The `sessionToken` is being correctly passed
   - The session hasn't expired
   - The session table schema matches NextAuth's expectations

2. **Account Linking Issues**: If accounts aren't being linked, check:

   - The provider configuration in NextAuth
   - That the `providerAccountId` is unique

3. **JWT Errors**: These often occur when:
   - The JWT secret is missing or has changed
   - The JWE format is invalid
   - Session strategy conflicts with adapter configuration

### Testing the Adapter

To run the adapter tests:

```bash
# Run unit tests
npm test -- --testPathPattern=tests/unit/auth/nextauth-adapter.test.ts

# Run integration tests
npm test -- --testPathPattern=tests/integration/auth-user-creation.test.ts

# Run E2E tests
npm run test:e2e -- --grep="User Authentication and Database Creation"
```

## Future Improvements

1. Add monitoring for adapter operations
2. Implement caching to reduce database queries
3. Add custom error handling for common adapter issues
