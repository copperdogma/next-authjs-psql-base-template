# Project Setup Scratchpad

This document tracks progress, decisions, and issues encountered during the project setup.

### Current Phase

With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist at the top of @scratchpad.md for us to work on.

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

## Codebase AnalysisAI Prompt

I'm creating a github template with nextjs, authjs, and psql. The idea is for this to be used by AI when starting new project. The AI, if appropriate for the project, will pull from this template to get started. I've been getting AI to vibe code projects and it always takes a day or two at the start to get it to slowly set up the basics (especially auth). I want that step to be minutes instead of hours.

I'm going to paste the entire codebase below.

I want you to analyze it for best practices. This should be a simple, elegant, ready to use out of the box template, so look for anything that should be removed, enhanced, or added to get it to that perfect state.

## Caveats For AI analysis:

- Placeholders: These are intentional. Because this is a base project I plan to install a plugin that leads the user through customizing it for their uses and replacing those placeholders. Igore them for now.
- Outdated Project Documentation: It's currently outdated as it's going to get updated all at once at the end of the project. Just ignore the docs for now. The CODE-level documention should be 100% accurate, though.
- Redundant Cursor Rules: Just ignore them. They're mind to deal with.

Here is the code:

---

## Codebase SUBSSYSTEM AnalysisAI Prompt

I'm creating a github template with nextjs, authjs, and psql. The idea is for this to be used by AI when starting new project. The AI, if appropriate for the project, will pull from this template to get started. I've been getting AI to vibe code projects and it always takes a day or two at the start to get it to slowly set up the basics (especially auth). I want that step to be minutes instead of hours.

I'm going to paste the entire codebase below.

I want you to analyze just a single subsystem for best practices. This should be a simple, elegant, ready to use out of the box template, so look for anything that should be removed, enhanced, or added to get it to that perfect state.

## Caveats For AI analysis:

- Placeholders: These are intentional. Because this is a base project I plan to install a plugin that leads the user through customizing it for their uses and replacing those placeholders. Igore them for now.
- Outdated Project Documentation: It's currently outdated as it's going to get updated all at once at the end of the project. Just ignore the docs for now. The CODE-level documention should be 100% accurate, though.
- Redundant Cursor Rules: Just ignore them. They're mind to deal with.

For this round, the subsystem I want you to analyze is:

- [ ] **Authentication System** (Files: `app/api/auth/`, `lib/auth-node.ts`, `lib/auth-edge.ts`, `lib/auth-shared.ts`, `middleware.ts`, `components/auth/`)
      That may not be all of the files, so be sure to look at the entire codebase.

Here is the code:

---

Make a comprehensive list of all of your suggestions to improve the codebase as a markdown checklist. Be sure to include as much detail as possible as I'll be giving it to another AI to implement.

---

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

Use this methodolgy: - Attempt to upgrade and make sure nothing broke - If it's okay, then run all tests (npm run test and npm run test:e2e). You have permission to run these commands. - If they pass, ask me to manually check the website. - THEN check it off as successful.

- NOTE: The "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:" error in Chrome is caused by a personal plugin injecting stuff into the UI and isn't a real error.
- NOTE: We're skipping 2 e2e tests on purpose. They're skipped by default keeps them from cluttering test output during normal runs but maintains them as a valuable resource. This approach aligns with the template's goal of providing a solid foundation that anticipates future needs.

### Code To Do

- [ ] add global rules for consistency. Research best practices and encode them. Cursor – Large Codebases: https://docs.cursor.com/guides/
- [ ] Refine: get gemini 2.5 to analyze each subsystem alone
  - [ ] **Authentication System** (Files: `app/api/auth/`, `lib/auth-node.ts`, `lib/auth-edge.ts`, `lib/auth-shared.ts`, `middleware.ts`, `components/auth/`)
  - [ ] **API Endpoints (Non-Auth)** (Files: `app/api/health/`, `app/api/user/`, `app/api/log/client/`, etc.)
  - [ ] **Core UI Components** (Files: `components/ui/`, `components/forms/`)
  - [ ] **Application Pages and Layouts** (Files: `app/` (excluding `api/`), `app/layout.tsx`, `app/page.tsx`, `app/dashboard/`, `app/login/`, `app/register/`, `app/profile/`, `app/about/`, `components/layouts/`)
  - [ ] **Database Interaction & Schema** (Files: `lib/prisma.ts`, `prisma/` schema, Prisma-interacting services)
  - [ ] **State Management & Client-Side Logic** (Files: `app/providers/`, custom hooks, context providers)
  - [ ] **Utility Libraries and Shared Functions** (Files: `lib/` (excluding auth, prisma, redis), `lib/utils/`)
  - [ ] **Testing Suite** (Files: `tests/`, `playwright.config.ts`, `jest.config.js`, mocks)
  - [ ] **Build, Configuration, and DX Scripts** (Files: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `package.json` scripts, `scripts/`)
  - [ ] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)
  - [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)
- [ ] try to upgrade everything again- [x] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `{{YOUR_APP_NAME}}`, `{{YOUR_COPYRIGHT_HOLDER}}`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [x] Final round: search for unused vars/code/files/packages/etc.
- [x] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be

Okay, here's a comprehensive markdown checklist of suggestions to improve the authentication subsystem of your Next.js template. These are based on the analysis provided previously, focusing on making the template simple, elegant, and ready-to-use out-of-the-box while adhering to best practices.

---

## Authentication Subsystem Improvement Checklist

### 1. Core NextAuth.js Setup & Configuration

- [x] **Critical: Implement Standard NextAuth.js API Route Handler**

  - **Description:** The project currently defines NextAuth.js handlers (GET, POST) in `lib/auth.ts` (which uses `lib/auth-node.ts`). However, to make these handlers accessible via the standard NextAuth.js API endpoints (e.g., `/api/auth/signin`, `/api/auth/callback/google`, etc.) when using the Next.js App Router, a specific route handler file is required at `app/api/auth/[...nextauth]/route.ts`. This file should re-export the GET and POST handlers from `lib/auth.ts`.
  - **File(s) to Modify/Create:** `app/api/auth/[...nextauth]/route.ts` (This file needs to be created).
  - **Action Required:**

    1.  Verify that the directory structure `app/api/auth/[...nextauth]/` exists. If not, create it.
    2.  Inside this directory, create a new file named `route.ts`.
    3.  Add the following content to this new `app/api/auth/[...nextauth]/route.ts` file:

        ```typescript
        // app/api/auth/[...nextauth]/route.ts
        // This file makes the NextAuth.js handlers defined in lib/auth.ts
        // available under the standard /api/auth/* routes.

        export { GET, POST } from '@/lib/auth';

        // Optional: If you plan to use this route for edge runtimes in the future,
        // you might need to conditionally export from auth-edge.ts.
        // For now, assuming Node.js runtime for these core handlers.
        // export const runtime = 'edge'; // Add this line if these handlers are edge-compatible
        ```

  - **Reasoning:** This is the conventional way to expose NextAuth.js v5 (and later) handlers in a Next.js App Router project. It ensures that all default NextAuth.js API endpoints function correctly (e.g., OAuth callbacks, default sign-in/sign-out pages if not customized, session endpoint, etc.). Without this, the authentication flows managed by NextAuth.js might not be reachable.

### 2. User Experience & Security

- [x] **Critical: Implement a Custom Authentication Error Page**

  - **Description:** The NextAuth.js configuration in `lib/auth-shared.ts` correctly specifies `pages: { error: '/auth/error' }`. This means NextAuth.js will redirect to `/auth/error` with an `error` query parameter (e.g., `?error=CredentialsSignin`) upon authentication failures. However, the actual page component for this route (`app/auth/error/page.tsx`) is currently missing from the codebase. This leads to users seeing the default, unstyled NextAuth.js error page.
  - **File(s) to Modify/Create:** `app/auth/error/page.tsx` (This file needs to be created).
  - **Action Required:**

    1.  Create the directory structure `app/auth/error/` if it doesn't exist.
    2.  Inside this directory, create a new file named `page.tsx`.
    3.  This page should be a Client Component (`'use client';`).
    4.  Import `useSearchParams` from `next/navigation` to read the `error` query parameter.
    5.  Implement logic to display user-friendly messages based on common NextAuth.js error codes. You can find a list of common error codes in the NextAuth.js documentation (e.g., `CredentialsSignin`, `OAuthSignin`, `OAuthCallback`, `OAuthCreateAccount`, `EmailCreateAccount`, `Callback`, `OAuthAccountNotLinked`, `EmailSignin`, `SessionRequired`, `Default`).
    6.  Style the page using your project's MUI theme and components (e.g., `Container`, `Paper`, `Typography`, `Button`) for a consistent user experience.
    7.  Provide a clear call to action, such as a button or link to navigate the user back to the login page (`/login`) or the home page (`/`).
    8.  Consider logging the error on the client-side using `clientLogger` for diagnostic purposes, especially for `Default` or unexpected error types.

    - **Example Implementation Snippet for `app/auth/error/page.tsx`:**

      ```typescript
      'use client';

      import { useSearchParams } from 'next/navigation';
      import Link from 'next/link';
      import { Container, Paper, Typography, Button, Box } from '@mui/material';
      // import { clientLogger } from '@/lib/client-logger'; // Optional: for logging

      export default function AuthErrorPage() {
        const searchParams = useSearchParams();
        const error = searchParams.get('error');

        // useEffect(() => { // Optional: Log the error
        //   if (error) {
        //     clientLogger.warn('Authentication error page displayed', { error });
        //   }
        // }, [error]);

        const errorMessages: Record<string, string> = {
          CredentialsSignin: 'Invalid email or password. Please try again.',
          OAuthSignin: 'There was an issue signing in with the selected provider. Please try again or use a different method.',
          OAuthCallback: 'There was an error during the sign-in process with your provider. Please try again.',
          OAuthCreateAccount: 'We could not create an account using this provider. The email might be in use or the provider returned an error.',
          EmailCreateAccount: 'We could not create an account with this email. It might already be in use.',
          Callback: 'An error occurred. Please try returning to the sign-in page and try again.',
          OAuthAccountNotLinked: 'This email is already associated with an account. To link this provider, please sign in with your existing account first.',
          EmailSignin: 'There was an issue sending the sign-in email. Please check your email address and try again.',
          SessionRequired: 'You must be signed in to access this page. Please sign in.',
          Default: 'An unexpected authentication error occurred. Please try again or contact support if the issue persists.',
        };

        const message = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default;

        return (
          <Container component="main" maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center', borderRadius: 2 }}>
              <Typography component="h1" variant="h4" color="error.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                Authentication Failed
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                {message}
              </Typography>
              <Button component={Link} href="/login" variant="contained" color="primary" size="large">
                Return to Login
              </Button>
            </Paper>
          </Container>
        );
      }
      ```

  - **Reasoning:** A custom, well-styled error page is essential for a good user experience. It reassures the user, maintains application branding, and can provide more helpful, context-specific error messages than the NextAuth.js default.

- [x] **Security Best Practice: Default `allowDangerousEmailAccountLinking` to `false` for Google Provider**
  - **Description:** The Google OAuth provider in `lib/auth-shared.ts` is currently configured with `allowDangerousEmailAccountLinking: true`. While this option can be useful for specific scenarios (like linking an existing email/password account with a Google account that uses the same email), it's generally safer to default this to `false` in a template. When `false`, NextAuth.js handles potential account linking issues more conservatively, often guiding the user to sign in with their original method first.
  - **File(s) to Modify:** `lib/auth-shared.ts`.
  - **Action Required:**
    1.  In the `sharedAuthConfig` object, locate the Google provider configuration.
    2.  Change the line `allowDangerousEmailAccountLinking: true` to `allowDangerousEmailAccountLinking: false`.
    3.  Add a comment above this line to explain why it's defaulted to `false` and under what circumstances a developer might want to enable it.
        ```typescript
        // In lib/auth-shared.ts, within the Google provider config:
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          // Defaulting to false for enhanced security.
          // Set to true only if you understand the implications and have a specific need
          // for users to automatically link OAuth accounts to existing email accounts
          // with the same email address without explicit prior sign-in.
          // See NextAuth.js docs on account linking for more details.
          allowDangerousEmailAccountLinking: false,
          authorization: { /* ... */ },
        }),
        ```
  - **Reasoning:** Defaulting to safer security settings is a best practice for templates. This encourages developers using the template to make a conscious decision if they need this feature and understand its implications, rather than enabling it by default.

### 3. Code Structure & Readability (Optional Refinement)

- [ ] **Clarity/Elegance: Review OAuth JWT Helper Fragmentation**
  - **Description:** The logic for handling the OAuth sign-in flow that results in JWT creation involves functions spread across several files: `lib/auth/oauth-helpers.ts`, `lib/auth/auth-jwt-helpers.ts` (specifically OAuth-related parts like `findOrCreateOAuthDbUserStep`), and `lib/auth/oauth-validation-helpers.ts`. While modularity is good, this specific critical path (from OAuth provider callback to JWT issuance) can be a little hard to follow due to the file separation.
  - **File(s) to Review:** `lib/auth/oauth-helpers.ts`, `lib/auth/auth-jwt-helpers.ts`, `lib/auth/oauth-validation-helpers.ts`, and their usage in `lib/auth/auth-jwt.ts` (specifically `_handleJwtOAuthSignIn`).
  - **Action Required:**
    1.  Analyze the call sequence starting from when an OAuth sign-in occurs (within the JWT callback in `lib/auth/auth-jwt.ts`) through to the creation of the final JWT payload.
    2.  Identify functions that are _exclusively_ part of this OAuth-to-JWT sequence. For example, `findOrCreateOAuthDbUserStep` in `auth-jwt-helpers.ts` seems very specific to this flow and calls `findOrCreateOAuthDbUser` from `oauth-helpers.ts`.
    3.  Consider co-locating these tightly coupled functions into a single file (perhaps `lib/auth/oauth-jwt-flow.ts` or by moving more into `lib/auth/oauth-helpers.ts`) to improve the traceability and understandability of this specific sequence.
    4.  Generic validation functions (like those in `oauth-validation-helpers.ts`) can likely remain separate if they are broadly applicable.
    5.  The goal is not to create a monolith, but to group functions that form a clear, sequential pipeline for a core authentication process to enhance clarity for developers using the template.
  - **Reasoning:** This is an "elegance" and maintainability suggestion. While the current structure works, improving the discoverability of how the OAuth data is processed into a JWT can make the template easier to understand and customize for those less familiar with the intricacies of NextAuth.js internals. This is a lower priority than the critical items above.

These refined suggestions should help you create an even more polished and robust authentication system for your Next.js template.
