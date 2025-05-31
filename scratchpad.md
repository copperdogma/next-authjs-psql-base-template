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

- [x] **Implement Standard NextAuth.js API Route Handler**

  - **Description:** The project is missing the conventional `app/api/auth/[...nextauth]/route.ts` file, which is standard for NextAuth.js v5 in the App Router. While `lib/auth.ts` exports the handlers, they need to be re-exported from this specific API route path.
  - **File(s) to Modify/Create:** `app/api/auth/[...nextauth]/route.ts` (Create this file).
  - **Action Required:**

    1.  Create the directory structure `app/api/auth/[...nextauth]/`.
    2.  Inside this directory, create a `route.ts` file.
    3.  Add the following content to `app/api/auth/[...nextauth]/route.ts`:

        ```typescript
        // app/api/auth/[...nextauth]/route.ts
        export { GET, POST } from '@/lib/auth';

        // If lib/auth.ts exports handlers as an object like:
        // export const handlers = { GET, POST };
        // Then use:
        // import { handlers } from '@/lib/auth';
        // export const { GET, POST } = handlers;
        ```

  - **Reasoning:** This aligns the project with NextAuth.js v5 conventions for the App Router, making the authentication endpoint setup explicit and easier for users of the template to understand and locate.

- [x] **Ensure Session/Cookie `maxAge` Consistency and Explicitness**
  - **Description:** The `maxAge` for session tokens and JWT sessions is explicitly set to 30 days in `lib/auth-edge.ts`. However, in `lib/auth-shared.ts` (and by extension, `lib/auth-node.ts`), these values are not explicitly set, relying on NextAuth.js defaults (which are also 30 days for JWTs).
  - **File(s) to Modify:** `lib/auth-shared.ts`.
  - **Action Required:**
    1.  Modify the `sharedAuthConfig` object in `lib/auth-shared.ts`.
    2.  Explicitly define `maxAge` for `cookies.sessionToken.options` to be `30 * 24 * 60 * 60` (30 days in seconds).
    3.  Explicitly define `maxAge` for `session` to be `30 * 24 * 60 * 60` (30 days).
    - Example update in `lib/auth-shared.ts` within `sharedAuthConfig`:
      ```typescript
      // ...
      cookies: {
        sessionToken: {
          // ... any existing sharedCookieConfig.sessionToken properties ...
          name: process.env.NODE_ENV === 'production'
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token', // from existing sharedCookieConfig
          options: {
            // ... any existing sharedCookieConfig.sessionToken.options properties ...
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // Explicitly 30 days
          }
        },
        // ... other cookies if any
      },
      session: {
        strategy: 'jwt' as const, // from existing sharedSessionConfig
        maxAge: 30 * 24 * 60 * 60, // Explicitly 30 days
      },
      // ...
      ```
  - **Reasoning:** Explicitly setting these values in the shared configuration makes the session and cookie lifecycles clearer and more self-documenting for users of the template, reducing potential ambiguity.

### 2. Authentication UI Components

- [x] **Utilize Centralized Logging Wrappers for Auth Actions**
  - **Description:** The project includes `signInWithLogging` and `signOutWithLogging` in `lib/auth-logging.ts`. However, UI components like `SignInButton.tsx`, `CombinedLoginOptions.tsx`, `CredentialsLoginForm.tsx`, and the logout button in `app/about/page.tsx` (if it remains) call `signIn` and `signOut` directly from `next-auth/react`.
  - **File(s) to Modify:**
    - `components/auth/SignInButton.tsx`
    - `components/auth/CombinedLoginOptions.tsx`
    - `components/auth/CredentialsLoginForm.tsx`
    - `app/about/page.tsx` (for its debug logout button)
    - `app/profile/components/SignOutButton.tsx`
  - **Action Required:**
    1.  Import `signInWithLogging` and `signOutWithLogging` from `lib/auth-logging.ts` into the affected components.
    2.  Replace all direct calls to `signIn(...)` from `next-auth/react` with `signInWithLogging(...)`.
    3.  Replace all direct calls to `signOut(...)` from `next-auth/react` with `signOutWithLogging(...)`.
        - Ensure the arguments passed (provider, options, callbackUrl, etc.) are correctly mapped to the wrapper functions.
  - **Reasoning:** This change centralizes authentication action logging, ensuring consistent, enhanced logging across all user-initiated sign-in and sign-out attempts. It improves observability and debugging capabilities for the template user.

### 3. Server-Side Authentication Logic

- [x] **Simplify `authorizeLogic` by Removing Unused Post-Registration Bypass**
  - **Description:** The `authorizeLogic` function in `lib/auth/auth-credentials.ts` contains a helper `_handlePostRegistrationSignIn` and associated logic to bypass normal password validation if specific `isPostRegistration` flags are passed in the credentials. However, the `registerUserAction` in `lib/actions/auth.actions.ts` calls `signIn('credentials', { email, password, redirect: false })` _without_ these special flags after creating a user. This makes the bypass logic in `authorizeLogic` effectively dead code.
  - **File(s) to Modify:** `lib/auth/auth-credentials.ts`.
  - **Action Required:**
    1.  Remove the `_handlePostRegistrationSignIn` helper function.
    2.  Remove the conditional check at the beginning of `authorizeLogic` that calls `_handlePostRegistrationSignIn`.
    3.  Ensure `authorizeLogic` always proceeds with the standard credentials validation flow.
  - **Reasoning:** This simplification makes `authorizeLogic` solely responsible for validating standard credentials, removing dead code and reducing complexity. The minor inefficiency of `registerUserAction` hashing a password and then `authorizeLogic` re-validating it is acceptable for a template, prioritizing security and clarity.

### 4. User Experience & Security Enhancements

- [ ] **Implement a Custom Authentication Error Page**

  - **Description:** NextAuth.js, by default, redirects to `/auth/error` with an error query parameter (e.g., `?error=CredentialsSignin`) when authentication fails. The template currently lacks a custom page at this route, leading to a basic, unstyled NextAuth.js default error page.
  - **File(s) to Modify/Create:** `app/auth/error/page.tsx` (Create this file).
  - **Action Required:**

    1.  Create the directory structure `app/auth/error/`.
    2.  Inside this directory, create a `page.tsx` file.
    3.  Implement a client component that:
        - Uses `useSearchParams` from `next/navigation` to read the `error` query parameter.
        - Displays user-friendly messages based on common NextAuth.js error codes (e.g., `CredentialsSignin`, `OAuthAccountNotLinked`, `EmailSignin`, `Default`).
        - Is styled consistently with the rest of the application (e.g., using MUI components like `Container`, `Paper`, `Typography`).
        - Optionally, include a button or link to navigate back to the login page or home page.

    - Example structure for `app/auth/error/page.tsx`:

      ```typescript
      // app/auth/error/page.tsx
      'use client';
      import { useSearchParams } from 'next/navigation';
      import Link from 'next/link'; // If adding navigation links
      import { Typography, Paper, Container, Box, Button } from '@mui/material'; // Example MUI imports

      export default function AuthErrorPage() {
        const searchParams = useSearchParams();
        const error = searchParams.get('error');

        const errorMessages: { [key: string]: string } = {
          Signin: 'There was an error signing in. Please try again with a different account or method.',
          OAuthSignin: 'There was an error signing in with the OAuth provider. Please try again.',
          OAuthCallback: 'There was an error during the OAuth callback. Please try again.',
          OAuthCreateAccount: 'Could not create user account using OAuth. Please try a different method.',
          EmailCreateAccount: 'Could not create user account with email. Please try again.',
          Callback: 'An error occurred during the callback process. Please try again.',
          OAuthAccountNotLinked: 'This account is not linked. To confirm your identity, please sign in with the same account you used originally.',
          EmailSignin: 'The sign-in email could not be sent. Please try again.',
          CredentialsSignin: 'Sign in failed. Please check your email and password and try again.',
          SessionRequired: 'You need to be signed in to access this page. Please sign in.',
          Default: 'An unexpected authentication error occurred. Please try again.',
        };

        const message = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default;

        return (
          <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
              <Typography component="h1" variant="h5" color="error.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                Authentication Error
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
                {message}
              </Typography>
              <Box sx={{ mt: 3, width: '100%' }}>
                <Button component={Link} href="/login" variant="contained" fullWidth>
                  Go to Login Page
                </Button>
              </Box>
            </Paper>
          </Container>
        );
      }
      ```

  - **Reasoning:** A custom error page provides a much better user experience, maintains consistent branding, and allows for more specific error messaging if desired. This is a key aspect of a "ready-to-use" template.

---

By addressing these checklist items, the authentication subsystem will be more robust, easier to understand, and align better with best practices for a high-quality Next.js template.
