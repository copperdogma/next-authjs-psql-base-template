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
- We have strict eslinting rules for code complexity/length/etc. So don't suggest anything that would violate those rules.

For this round, the subsystem I want you to analyze is:

- [ ] **API Endpoints (Non-Auth)** (Files: `app/api/health/`, `app/api/user/`, `app/api/log/client/`, etc.)

Note that this may not be all of the files, so be sure to look at the entire codebase.

Here is the code:

---

Double check your suggestions. Verify they're best practice and not already implmented.

Then make a comprehensive list of all of your suggestions to improve the codebase as a markdown checklist. Be sure to include as much detail as possible as I'll be giving it to another AI to implement.

---

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

Use this methodolgy: - Attempt to upgrade and make sure nothing broke - If it's okay, then run all tests (npm run test and npm run test:e2e). You have permission to run these commands. - If they pass, ask me to manually check the website. - THEN check it off as successful.

- NOTE: The "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:" error in Chrome is caused by a personal plugin injecting stuff into the UI and isn't a real error.
- NOTE: We're skipping 2 e2e tests on purpose. They're skipped by default keeps them from cluttering test output during normal runs but maintains them as a valuable resource. This approach aligns with the template's goal of providing a solid foundation that anticipates future needs.

### Code To Do

- [ ] add global rules for consistency. Research best practices and encode them. Cursor – Large Codebases: https://docs.cursor.com/guides/
- [ ] Refine: get gemini 2.5 to analyze each subsystem alone
  - [x] **Authentication System** (Files: `app/api/auth/`, `lib/auth-node.ts`, `lib/auth-edge.ts`, `lib/auth-shared.ts`, `middleware.ts`, `components/auth/`)
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

## API Endpoints (Non-Auth) Improvement Checklist

### **1. Enhance `app/api/health/route.ts` (POST Handler)**

- [x] **Make Database Check Functional in POST Handler**

  - **Current State:** The `checkDatabase` functionality in the `POST /api/health` endpoint uses a mock delay (`new Promise(resolve => setTimeout(resolve, timeout))`).
  - **Suggestion:** Replace the mock delay with an actual lightweight database query to verify connectivity. This provides a more realistic health check.
  - **Implementation Details:**
    - In the `performDatabaseCheck` function within `app/api/health/route.ts`:
    - Import the `prisma` client from `@/lib/prisma`.
    - Replace `await new Promise(resolve => setTimeout(resolve, timeout));` with a Prisma query like `await prisma.$queryRaw`SELECT 1`;`.
    - The existing `timeout` parameter is less relevant for a simple `SELECT 1` query, but if a more complex check were implemented, it could potentially be used to configure Prisma's query timeout if supported directly for that operation, or handled by a `Promise.race` if needed (though `SELECT 1` should be very fast). For `SELECT 1`, simply executing the query is sufficient.
    - Ensure any errors from `prisma.$queryRaw` are caught and logged (as the current `performDatabaseCheck` function already does with its `.catch(error => logger.warn(...))`).
  - **Reasoning:** A true database connectivity check provides a more accurate health status of the application's dependencies.

- [x] **Ensure Consistent Error Response Structure for Validation in POST Handler**
  - **Current State:** In `app/api/health/route.ts`, the `parseAndValidateRequest` function constructs a JSON error response directly for Zod validation failures, while the main `handleError` function uses `createErrorResponse` from `@/lib/services/api-logger-service`.
  - **Suggestion:** Refactor the error response generation within `parseAndValidateRequest` to align with the structure produced by `createErrorResponse` or use `createErrorResponse` directly if appropriate.
  - **Implementation Details:**
    - Examine the structure returned by `createErrorResponse` (e.g., `{ error: "ErrorCode", message: "User-friendly message", requestId: "...", details?: {...} }`).
    - Modify the `NextResponse.json(...)` call in the `!result.success` block of `parseAndValidateRequest` to return a JSON object with a similar structure. For example:
      ```typescript
      return {
        isValid: false,
        error: NextResponse.json(
          {
            error: 'ValidationError', // Consistent error code
            message: 'Invalid health check request format.', // User-friendly message
            details: result.error.format(), // Detailed validation errors
            // requestId: requestId // If requestId is available/needed here
          },
          { status: 400 }
        ),
      };
      ```
    - Alternatively, if `createErrorResponse` can be easily used here (e.g., by passing necessary parameters like `requestId`), prefer using it.
  - **Reasoning:** Consistent error response structures simplify client-side error handling and improve API predictability.

### **2. Verify/Standardize Rate Limit Error Response in `app/api/log/client/route.ts`**

- [x] **Current State:** The `app/api/log/client/route.ts` endpoint uses `consumeRateLimit` which, if the limit is exceeded, calls `getRateLimitResponse` (presumably from `@/lib/utils/rate-limiters-middleware.ts`, which was not fully provided).
- **Suggestion:** Ensure that the error response generated by `getRateLimitResponse` (when a rate limit is exceeded) is consistent with the error structure produced by `createErrorResponse` used elsewhere (e.g., in `app/api/health/route.ts`).
- **Implementation Details:**
  - The AI will need to inspect or define `lib/utils/rate-limiters-middleware.ts` (specifically the `getRateLimitResponse` function).
  - If this file is not available, the AI should create it, ensuring `getRateLimitResponse` returns a `NextResponse` with a JSON body structured similarly to: `{ error: "RateLimitExceeded", message: "Too many requests, please try again later.", details?: { retryAfterSeconds: number } }`.
  - The response should include standard rate-limiting headers (`Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`), which it currently seems to do based on the context.
- **Reasoning:** Consistency in API error responses, including those for rate limiting, is crucial for a good developer experience.

### **3. Add a Protected User Information Endpoint (e.g., `GET /api/user/me`)**

- [x] **Current State:** There is no specific API endpoint to fetch authenticated user data (e.g., `/api/user/` or `/api/user/me`).
- **Suggestion:** Create a new API route, for example, `app/api/user/me/route.ts`, that provides a `GET` handler to return non-sensitive information about the currently authenticated user.
- **Implementation Details:**
  - Create file `app/api/user/me/route.ts`.
  - The `GET` handler should:
    1.  Import `auth` from `@/lib/auth-node` (or `@/lib/auth-edge` if intended for edge functions, though Node is more typical for DB access).
    2.  Call `const session = await auth();` to get the current session.
    3.  If `!session?.user?.id`, return an unauthorized error:
        ```typescript
        import { NextResponse } from 'next/server';
        // ...
        return NextResponse.json(
          { error: 'Unauthorized', message: 'You must be logged in to access this resource.' },
          { status: 401 }
        );
        ```
    4.  If authenticated, fetch user details from the database using Prisma. Import `prisma` from `@/lib/prisma`.
        ```typescript
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            // IMPORTANT: Explicitly DO NOT select hashedPassword or other sensitive fields.
          },
        });
        ```
    5.  If the user is not found in the database (despite a valid session, which could indicate an inconsistency), return a 404 or 500 error.
        ```typescript
        if (!user) {
          return NextResponse.json(
            { error: 'UserNotFound', message: 'User not found in database.' },
            { status: 404 }
          );
        }
        ```
    6.  Return the selected user data:
        ```typescript
        return NextResponse.json(user);
        ```
  - Wrap the handler with `withApiLogger` for consistent logging.
- **Reasoning:** This provides a practical example of a protected API route that interacts with the authentication system and database, a common requirement for many applications built from this template. It also demonstrates best practices for selecting specific fields and omitting sensitive data.

This checklist should provide clear, actionable items for the AI to enhance your template's non-auth API endpoints.
