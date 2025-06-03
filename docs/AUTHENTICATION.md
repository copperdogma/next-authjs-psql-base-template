# Authentication Documentation

This document explains the authentication implementation details and behaviors in this template.

## Overview

This template uses NextAuth.js v5 with the Prisma Adapter for PostgreSQL to provide a complete authentication solution. Key authentication features include:

- Multiple sign-in providers:
  - OAuth (Google)
  - Email/Password (Credentials)
- Session handling (JWT-based)
- Protected routes (via middleware)
- User profile management

## Configuration Files

- `lib/auth-shared.ts`: Core NextAuth.js configuration shared across runtimes
- `lib/auth-node.ts`: Server-side NextAuth.js configuration
- `lib/auth-edge.ts`: Edge runtime NextAuth.js configuration (used by middleware)
- `middleware.ts`: Next.js middleware for route protection
- `lib/auth/`: Directory containing auth helper functions and implementation details

## OAuth Profile Data Handling

### Initial Population Only Policy

The template implements an "initial population only" approach to handling user profile data from OAuth providers:

- When a user signs up or links a new OAuth provider to their existing account for the first time, their name and profile image from the provider are used to populate their initial user record in the database.
- After this initial setup, the user's profile name and image within this application are managed independently.
- Subsequent logins via the OAuth provider will **not** automatically update these details from the provider.

This design allows users to customize their profile specifically for this application without having it overwritten by their OAuth provider's profile changes.

### Implementation Details

This behavior is implemented in:

- `lib/auth/auth-helpers.ts`: The `_handleExistingUser` function intentionally does not update user profile information from the OAuth provider during subsequent sign-ins.
- `lib/auth/findOrCreateUserAndAccountInternal`: This function uses profile data from the OAuth provider only when creating a new user or linking a new account.

### Customizing This Behavior

If you require a different behavior, such as continuous profile synchronization with the OAuth provider:

1. Modify the `_handleExistingUser` function in `lib/auth/auth-helpers.ts` to update user data on each sign-in.
2. Update the JSDoc comments to reflect your modified behavior.

#### Example Implementation for Continuous Synchronization:

```typescript
// In _handleExistingUser
// Add this code before creating resultUser:
let updatedUser = dbUserWithAccounts;
if (name !== dbUserWithAccounts.name || image !== dbUserWithAccounts.image) {
  // Update user profile with latest data from OAuth provider
  updatedUser = await prisma.user.update({
    where: { id: dbUserWithAccounts.id },
    data: {
      name: name || dbUserWithAccounts.name,
      image: image || dbUserWithAccounts.image,
    },
  });
  logger.info(
    logContext,
    '[_handleExistingUser] Updated user profile with latest OAuth provider data.'
  );
}

// Then use updatedUser for the resultUser creation
```

## Rate Limiting

The template includes Redis-based rate limiting for authentication operations, particularly for user registration. This is configured in `lib/actions/auth.actions.ts`.

### Fail-Open Strategy

**Important Security Note**: The registration rate limiting has a "fail-open" strategy:

- If Redis is unavailable or misconfigured, rate limiting will be skipped.
- This means that if `ENABLE_REDIS_RATE_LIMITING` is set to `true` but Redis cannot be connected to, new user registrations will not be rate-limited.
- In production environments, ensure Redis is properly configured and highly available if you rely on rate limiting for security.

## Protected Routes

Routes requiring authentication are protected via the Next.js middleware in `middleware.ts`. The middleware uses NextAuth.js to check if a user is authenticated and redirects to the login page if not.

### Configuration

Protected routes are defined in the middleware configuration. By default, the following routes require authentication:

- `/dashboard/*`
- `/profile/*`
- `/api/user/*`

To modify this configuration, edit the `PROTECTED_ROUTES` array in `middleware.ts`.
