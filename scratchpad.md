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
- Redundant Cursor Rules: Just ignore them. They're mind to deal with.
- We have strict eslinting rules for code complexity/length/etc. So don't suggest anything that would violate those rules.

For this round, the subsystem I want you to analyze is:

- [ ] **Database Interaction & Schema** (Files: `lib/prisma.ts`, `prisma/` schema, Prisma-interacting services)

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
  - [x] **API Endpoints (Non-Auth)** (Files: `app/api/health/`, `app/api/user/`, `app/api/log/client/`, etc.)
  - [x] **Core UI Components** (Files: `components/ui/`, `components/forms/`)
    - [x] **`CardDescription.tsx` (within `Card.tsx`) - ARIA Enhancement**: Removed hardcoded `aria-describedby` from CardDescription component to allow more flexible accessibility relationships. Added JSDoc comments to guide proper usage.
    - [x] **`Input.tsx` - Documentation Update**: Created an updated documentation file (`docs/project-reference-updated.mdc`) that correctly describes Input.tsx as a styled MUI input component without variants.
    - [x] **`Snackbar.tsx` - Enhance Configurability**: Added configurable `anchorOrigin` prop with sensible default to allow users to customize toast positioning.
    - [x] **`Toaster.tsx` - Enhance Configurability**: Added configurable `anchorOrigin` prop to the Toaster component for global toast positioning control.
    - [x] **Implement `DateTimePicker.tsx` - Missing Core Component**: Created a comprehensive DateTimePicker component using MUI X Date Pickers with proper React Hook Form integration and full test coverage.
    - [x] **`DateTimePicker.tsx` - API Alignment**: Renamed the `inputFormat` prop to `format` in the DateTimePickerProps interface to align with the current MUI X Date Pickers library conventions. Updated component implementation to use the new prop name.
    - [x] **`Toaster.tsx` - Remove Ineffective Styling for Stacking**: Removed the `sx={{ mb: toasts.indexOf(toast) * 8 }}` prop from the `Snackbar` component within `Toaster.tsx` as it doesn't effectively create spacing between toasts due to how MUI Snackbars are absolutely positioned.
  - [x] **Application Pages and Layouts** (Files: `app/` (excluding `api/`), `app/layout.tsx`, `app/page.tsx`, `app/dashboard/`, `app/login/`, `app/register/`, `app/profile/`, `app/about/`, `components/layouts/`)
    - [x] **Standardize Styling in Error Pages to MUI**: Refactored `app/dashboard/error.tsx` and `app/profile/error.tsx` to use MUI components for layout and styling instead of Tailwind CSS classes, ensuring consistency with the rest of the application.
    - [x] **Simplify `useRouter` Hook Usage in `app/page.tsx`**: Replaced the complex `useCallback` approach with direct import and usage of the `useRouter` hook from 'next/navigation', making the code more straightforward and maintainable.
    - [x] **Adjust `tabIndex` on Page Title in `PageHeader.tsx`**
    - [x] **Make Site Title in Header a Link to Homepage**
    - [x] **Conditionally Render "Debug Log Out" Button**
    - [x] **Correct HTML Structure for Main Content Area in `PageLayout.tsx`**: Updated the component to avoid nested `<main>` elements, removed redundant `role="main"` attribute, and eliminated duplicate `id="main-content"` to improve accessibility and semantic HTML structure.
  - [ ] **Database Interaction & Schema** (Files: `lib/prisma.ts`, `prisma/` schema, Prisma-interacting services)
  - [ ] **State Management & Client-Side Logic** (Files: `app/providers/`, custom hooks, context providers)
  - [ ] **Utility Libraries and Shared Functions** (Files: `lib/` (excluding auth, prisma, redis), `lib/utils/`)
  - [ ] **Testing Suite** (Files: `tests/`, `playwright.config.ts`, `jest.config.js`, mocks)
  - [ ] **Build, Configuration, and DX Scripts** (Files: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `package.json` scripts, `scripts/`)
  - [ ] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)
  - [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)
- [ ] try to upgrade everything again- [x] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `Next Auth Application`, `Your Name`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [x] Final round: search for unused vars/code/files/packages/etc.
- [x] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be

---

## Database Interaction & Schema Enhancement Checklist

### [x] I. Prisma Client & Configuration (`lib/prisma.ts`)

- **Task 1: Enhance Production Database Pooling Guidance.**
  - **File**: `lib/prisma.ts`
  - **Current State**: Comments regarding production datasource configuration (e.g., connection pooling via `config.datasources`) are present but commented out.
  - **Problem**: Default Prisma connection limits might not be optimal for all production scenarios (serverless vs. long-running applications). Users need clear guidance.
  - **Suggestion**:
    1.  Uncomment the section related to `config.datasources` within the `getPrismaConfig` function.
    2.  Provide a minimal, commented-out example for setting a `connection_limit` for the `db` datasource.
    3.  Add a clear, prominent comment above this section:
        ```typescript
        // IMPORTANT: Production Connection Pooling
        // The default Prisma connection pool size might not be optimal for your production environment.
        // For long-running applications (e.g., Node.js servers), you might need to increase the connection_limit.
        // For serverless environments, a smaller pool (or Prisma Accelerate/Data Proxy) is typically recommended.
        // Consult Prisma's documentation on connection management for your specific deployment:
        // https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
        // Example for a long-running server (adjust connection_limit as needed):
        // if (process.env.NODE_ENV === 'production') {
        //   config.datasources = {
        //     db: {
        //       url: process.env.DATABASE_URL + "&connection_limit=10&pool_timeout=5", // Example
        //     },
        //   };
        // }
        ```
  - **Goal**: Make users aware of connection pooling and direct them to official documentation for tailored configurations, while providing a commented-out basic example.

### [x] II. Prisma Schema (`prisma/schema.prisma`)

- **Task 2: Add Indexing Strategy Reminder.**

  - **File**: `prisma/schema.prisma`
  - **Current State**: The schema includes basic indexes for common fields like `User.role`, `User.createdAt`, and `User.updatedAt`.
  - **Problem**: As the application built from the template grows, developers might forget to add custom database indexes crucial for performance based on their specific query patterns.
  - **Suggestion**: Add a comment within the `User` model (or as a general comment at the top of the model definitions) to remind developers about custom indexing.

    ```prisma
    // prisma/schema.prisma

    model User {
      id            String    @id @default(uuid())
      name          String?
      email         String?   @unique
      emailVerified DateTime?
      image         String?
      hashedPassword String?
      role          UserRole  @default(USER)
      createdAt     DateTime  @default(now())
      updatedAt     DateTime  @updatedAt
      lastSignedInAt DateTime?

      accounts      Account[]
      sessions      Session[]

      // REMINDER: Add additional indexes here based on your application's specific query patterns
      // as your project evolves. For example, if you frequently query or sort users
      // by 'lastSignedInAt' and 'role':
      // @@index([lastSignedInAt, role])
      // Or if searching by name becomes common:
      // @@index([name]) // Consider a full-text index for more advanced name searching

      @@index([role])
      @@index([createdAt])
      @@index([updatedAt])
    }
    ```

  - **Goal**: Proactively guide users towards database performance optimization as their application scales.

### [ ] III. Service Layer Consolidation & Refinement

- **Task 3: Consolidate `UserService`.**

  - **Files Involved**: `lib/db/user-service.ts` and `lib/services/user-service.ts`.
  - **Current State**: Two `UserService` implementations exist. `lib/services/user-service.ts` (class `UserService`) is more robust, using dependency injection for `PrismaClient` and `pino.Logger`, and returning standardized `ServiceResponse` objects. `lib/db/user-service.ts` (exports `userServiceInstance` from class `UserService`) contains useful Prisma query patterns (e.g., N+1 prevention, `_count` usage).
  - **Problem**: Code duplication and potential confusion about which service to use.
  - **Suggestion**:
    1.  Identify all public methods in `lib/db/user-service.ts` (e.g., `getUsersWithSessions`, `getUserWithSessions`, `getUsersWithActiveSessions`, `getUsersWithSessionCounts`, `getUserByAccount`).
    2.  Integrate these methods into the `UserService` class in `lib/services/user-service.ts`.
        - Ensure these methods also adopt the `ServiceResponse` return pattern for consistency.
        - Ensure they use the injected `prismaClient` and `logger` instances.
    3.  Update any existing usages of `userServiceInstance` from `lib/db/user-service.ts` to use the consolidated `UserService` from `lib/services/user-service.ts` (likely via the exported `defaultUserService` or by obtaining an instance through `getUserService()` from `lib/server/services.ts`).
    4.  Delete the file `lib/db/user-service.ts`.
  - **Goal**: Single, robust, and testable `UserService` adhering to consistent error handling and DI patterns.

- **Task 4: Consolidate `RawQueryService`.**

  - **Files Involved**: `lib/db/raw-query-service.ts` and `lib/services/raw-query-service.ts`.
  - **Current State**: Two `RawQueryService` implementations exist. `lib/services/raw-query-service.ts` (class `RawQueryServiceImpl`) is more robust with DI. `lib/db/raw-query-service.ts` (class `RawQueryService`) appears to be a facade or older version.
  - **Problem**: Code duplication.
  - **Suggestion**:
    1.  Ensure all necessary raw query functionalities from `lib/db/raw-query-service.ts` are present or ported to `RawQueryServiceImpl` in `lib/services/raw-query-service.ts`.
    2.  Update any existing usages of `RawQueryService` from `lib/db/raw-query-service.ts` to use `RawQueryServiceImpl` from `lib/services/raw-query-service.ts` (likely via the exported `defaultRawQueryService` or `getRawQueryService()` from `lib/server/services.ts`).
    3.  Delete the file `lib/db/raw-query-service.ts`.
  - **Goal**: Single, canonical `RawQueryService` implementation.

- **Task 5: Standardize Error Response in `ProfileService`.**
  - **File**: `lib/server/services/profile.service.ts` (class `ProfileServiceImpl`).
  - **Current State**: The `updateUserName` method, in its error paths, returns an object like `{ success: false, error: 'Error message string' }`.
  - **Problem**: This is inconsistent with the `ServiceResponse` type defined in `types/index.ts`, which expects the `error` field to be an object (`{ message: string; code?: string; details?: TErrorDetails; }`). The `UserService` in `lib/services/user-service.ts` adheres better to this pattern.
  - **Suggestion**:
    1.  Modify the error return paths in `ProfileServiceImpl#updateUserName` to conform to the `ServiceResponse` structure. For example:
        - Instead of: `{ success: false, error: 'User not found.' }`
        - Return:
          ```typescript
          {
            status: 'error',
            message: 'User not found.', // Or a more generic "Profile update failed."
            error: {
              code: 'USER_NOT_FOUND', // Or a profile-specific code
              message: 'User not found.', // User-facing message
              // details: { originalError: parsedError.originalError } // If applicable
            }
          }
          ```
    2.  Ensure the internal `_parseDbError` method's output is appropriately mapped to this structure. The method `_performDatabaseUpdate` will need to adjust how it uses `_parseDbError` to construct the final `ServiceResponse`.
  - **Goal**: Consistent error handling and response structure across all services.

### [ ] IV. Authentication Logic & Data Handling

- **Task 6: Clarify or Remove `createOrUpdateOAuthUser` in `lib/auth/oauth-helpers.ts`.**

  - **Files Involved**: `lib/auth/oauth-helpers.ts`, `lib/auth/auth-helpers.ts`, `lib/auth/oauth-jwt-flow.ts`.
  - **Current State**:
    - `lib/auth/auth-helpers.ts` (`findOrCreateUserAndAccountInternal`) implements an "initial population only" policy for OAuth profile data (name, image). This is used by the primary OAuth sign-in flow (`handleOAuthJwtSignIn` via `oauth-jwt-flow.ts`).
    - `lib/auth/oauth-helpers.ts` contains `createOrUpdateOAuthUser`, which _does_ update existing user profile information from the OAuth provider on subsequent sign-ins.
  - **Problem**: Potential for conflicting OAuth profile update strategies, leading to confusion or unexpected behavior if `createOrUpdateOAuthUser` is used inadvertently or without clear distinction.
  - **Suggestion**:
    1.  Thoroughly search the codebase to determine if `createOrUpdateOAuthUser` from `lib/auth/oauth-helpers.ts` is actively used by any essential authentication flow or utility.
    2.  **If unused by core flows**:
        - Remove the `createOrUpdateOAuthUser` function and its related types/helpers from `lib/auth/oauth-helpers.ts` to simplify the codebase and enforce a single, clear OAuth profile data strategy ("initial population only").
    3.  **If used for a specific, alternative purpose**:
        - Add extensive JSDoc comments to `createOrUpdateOAuthUser` explaining its specific use case, how it differs from the "initial population only" strategy, and when it should be used.
        - Ensure documentation (e.g., `docs/AUTHENTICATION.md`) clearly outlines both strategies if both are to be kept.
  - **Goal**: A single, clearly understood, and consistently applied strategy for OAuth profile data synchronization, or explicit documentation for alternative strategies if they are intentionally provided.

- **Task 7: Add Transactional Safety Note for User Registration.**

  - **File**: `lib/actions/auth.actions.ts`
  - **Current State**: The `registerUserLogic` function (and its helpers like `_createPrismaUser` and `_handleSuccessfulRegistration` which calls `signIn`) performs user creation in the database and then attempts an auto-sign-in. These are separate operations not wrapped in a single database transaction.
  - **Problem**: If user creation succeeds but the subsequent auto-sign-in process (which might involve session table writes via NextAuth indirectly) fails, the user is registered but not logged in. This is generally acceptable for a basic template, but awareness is key.
  - **Suggestion**: Add a comment in the `registerUserLogic` function or near the `_executeRegistrationCore` and `_handleSuccessfulRegistration` calls, explaining this.

    ```typescript
    // lib/actions/auth.actions.ts
    // Inside registerUserLogic or near the core registration steps:

    // NOTE: The user creation in _executeRegistrationCore and the subsequent
    // auto-sign-in attempt in _handleSuccessfulRegistration are not currently
    // part of a single atomic database transaction. This means a user could be
    // successfully created in the database, but the auto-sign-in might fail,
    // requiring the user to log in manually.
    // For more complex registration flows involving multiple dependent database
    // writes (e.g., creating a user, an initial profile, and sending a welcome email,
    // all of which must succeed or fail together), consider wrapping the core
    // logic within a `prisma.$transaction([async (tx) => { ... }])` block to
    // ensure atomicity.
    const registrationAttemptResult = await _executeRegistrationCore(
      validatedData,
      { db, hasher, log },
      logContextWithEmail
    );
    ```

  - **Goal**: Inform developers using the template about the current transactional scope and guide them if they need stricter atomicity for more complex registration processes.

### [ ] V. Service Code & E2E Test Interactions

- **Task 8: Document E2E Test-Specific Logic in `ProfileServiceImpl`.**

  - **File**: `lib/server/services/profile.service.ts`
  - **Current State**: The `_performDatabaseUpdate` method in `ProfileServiceImpl` has a branch: `if (process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true') { ... }` which returns a mock success response if a database error occurs during E2E tests.
  - **Problem**: While pragmatic for simpler E2E setups, this mixes test-specific behavior with application code, which can be confusing or hide real issues if not well understood.
  - **Suggestion**: Enhance the existing JSDoc/comment for `_performDatabaseUpdate` (or add one if missing) to clearly explain:

    1.  **Why this logic exists**: To allow UI-focused E2E tests for profile updates to proceed even if the test environment's database is not fully writable or if DB interactions are intentionally bypassed for test speed/simplicity.
    2.  **Trade-offs**: Acknowledge that this is a trade-off for template simplicity and that in more complex or production-like testing scenarios, mocking the `ProfileService` at the E2E test boundary or ensuring a fully operational test database would be a cleaner separation of concerns.
    3.  **Impact**: Clarify that this mock success does _not_ mean the database operation actually succeeded in the E2E context, only that the UI flow can continue as if it did.

    ```typescript
    // lib/server/services/profile.service.ts

    /**
     * Helper method to handle database operations with Prisma.
     *
     * @remarks
     * IMPORTANT E2E TESTING NOTE:
     * This method includes specific behavior for E2E testing environments.
     * When `process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true'`, this method
     * will return a MOCK SUCCESS RESPONSE with a simulated user object if the
     * database update operation fails.
     *
     * Why this exists:
     * This allows UI-focused E2E tests (e.g., testing the profile name change form flow)
     * to complete successfully even if the E2E test environment does not have a fully
     * writable database or if direct database interactions are intentionally bypassed
     * in the test setup to improve speed or simplify the test environment.
     *
     * Trade-offs:
     * This approach introduces test-environment-specific behavior into production code.
     * For projects requiring stricter separation of concerns or more robust E2E database
     * validation, consider these alternatives:
     *   1. Mocking this `ProfileService` at the E2E test boundary (e.g., using Playwright's
     *      route interception to mock the server action's response).
     *   2. Ensuring the E2E test environment uses a fully writable and verifiable database.
     *
     * Impact:
     * Be aware that in an E2E test environment, a "successful" name update indicated by the UI
     * (due to this mock) does NOT guarantee the data was actually persisted to the database
     * if a real database error occurred. Backend database persistence should be verified
     * through integration tests or specific E2E tests that explicitly check database state.
     *
     * @param userId - The ID of the user to update
     * @param processedName - The validated new name to set
     * @param logContext - Logging context for tracing
     * @returns Promise resolving to an object with success status and optional user/error
     */
    private async _performDatabaseUpdate( /* ... */ ) { /* ... */ }
    ```

  - **Goal**: Ensure developers understand this specific E2E testing accommodation, its purpose, and its limitations.

### [ ] VI. Index File Cleanup (Post-Consolidation)

- **Task 9: Update Service Index Files.**
  - **Files Involved**: `lib/db/index.ts`, `lib/services/index.ts`.
  - **Current State**: These files export services from potentially soon-to-be-deleted locations.
  - **Problem**: After service consolidation (Tasks 3 & 4), these index files will have broken or redundant exports.
  - **Suggestion**:
    1.  After `UserService` is consolidated into `lib/services/user-service.ts`, remove its export from `lib/db/index.ts`.
    2.  After `RawQueryService` is consolidated into `lib/services/raw-query-service.ts`, remove its export from `lib/db/index.ts`.
    3.  Review `lib/services/index.ts`. If it's intended to be the primary barrel file for all data/business logic services, ensure it exports the consolidated `UserService`, `ProfileService`, and `RawQueryServiceImpl` (or their instances/getters). If its purpose is different, clarify with comments or adjust exports accordingly.
    4.  Consider if `lib/db/index.ts` is still needed. If it only exports `QueryOptimizer` and database `utils` after other changes, it might be fine. Otherwise, its exports could potentially be moved or the file removed if all its distinct functionalities are better grouped elsewhere.
  - **Goal**: Maintain clean and accurate barrel files for service imports.
