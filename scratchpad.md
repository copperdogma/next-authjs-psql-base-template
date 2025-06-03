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

## Checklist for Database Interaction & Schema Enhancements

### [x] 1. `UserService` Error Handling and Response Consistency

- **Current State:** `lib/services/user-service.ts` methods (`updateUserName`, `findUserById`, `findUserByEmail`) currently throw errors directly or return `User | null`. This is inconsistent with `ProfileService` and `registerUserAction` which use a structured `ServiceResponse` object.
- **Best Practice:** Consistent error handling and response structures across the service layer improve predictability and ease of use.
- **Action:**

  - [x] Modify methods in `lib/services/user-service.ts` to return `Promise<ServiceResponse<User | null, { originalError?: unknown }>>`.
  - [x] Instead of throwing errors, catch them within the service methods and return an error object conforming to the `ServiceResponse` interface (e.g., `{ status: 'error', message: '...', error: { code: '...', details: { originalError: e } } }`).
  - [x] For successful operations, wrap the result in a success object (e.g., `{ status: 'success', data: user, message: '...' }`).
  - **Example for `findUserById`:**

    ```typescript
    // Before
    // async findUserById(userId: string): Promise<User | null> {
    //   // ... logs ...
    //   try {
    //     const user = await this.prismaClient.user.findUnique({ where: { id: userId } });
    //     // ... logs ...
    //     return user;
    //   } catch (error) {
    //     // ... logs ...
    //     throw error;
    //   }
    // }

    // After
    // async findUserById(userId: string): Promise<ServiceResponse<User | null, { originalError?: unknown }>> {
    //   // ... logs ...
    //   try {
    //     const user = await this.prismaClient.user.findUnique({ where: { id: userId } });
    //     if (!user) {
    //       // ... logs ...
    //       return { status: 'error', message: 'User not found.', error: { code: 'USER_NOT_FOUND' } };
    //     }
    //     // ... logs ...
    //     return { status: 'success', data: user, message: 'User fetched successfully.' };
    //   } catch (error: unknown) {
    //     // ... logs ...
    //     return {
    //       status: 'error',
    //       message: 'Failed to fetch user.',
    //       error: { code: 'DB_FETCH_FAILED', details: { originalError: error } }
    //     };
    //   }
    // }
    ```

### [x] 2. Enhance Documentation for Raw Query Rationale

- **Current State:** JSDoc comments in `lib/services/raw-query-service.ts` provide examples of use cases but could be more explicit about _why_ raw SQL was chosen over ORM methods.
- **Best Practice:** Clear justification for using raw SQL enhances maintainability and guides users on appropriate usage.
- **Action:**
  - [x] For each public method in `RawQueryServiceImpl` (`getUserSessionCountsByDay`, `extendSessionExpirations`, `getUserActivitySummary`):
    - [x] Refine the JSDoc comments to explicitly state the reason for using raw SQL.
    - **Example for `getUserSessionCountsByDay`:**
      ```diff
      /**
       * Performs a complex aggregation using raw SQL.
      -* Example: Get user session counts grouped by day for analytics.
      +* Example: Get user session counts grouped by day for analytics.
      +* Raw SQL is used here for direct control over PostgreSQL's `DATE_TRUNC`
      +* and `COUNT(*)` aggregation, which can be more performant or direct
      +* for this specific query pattern compared to composing it with the ORM.
       *
       * @param options Query options
       * @returns Array of daily session counts
      ```
    - **Example for `extendSessionExpirations`:**
      ```diff
      /**
       * Performs a batch update with complex conditions.
      -* Example: Update all expired sessions for specific users.
      +* Example: Update all expired sessions for specific users.
      +* Utilizes raw SQL for a batch update with PostgreSQL-specific interval arithmetic
      +* (`+ interval 'X hours'`), offering fine-grained control for this operation.
      ```

### [x] 3. Verify and Document OAuth Profile Data Handling (Initial Population Only)

- **Context:** The intended behavior is that user profile information (name, image) obtained from an OAuth provider is used _only_ for the initial creation of the user record in this application. Subsequent logins with the same OAuth provider should _not_ automatically update the user's name or image in this application's database, allowing users to manage these details independently within this app after their initial signup.
- **Best Practice:** Code behavior should align with intended design, and this design choice must be clearly documented to avoid confusion for developers using the template.
- **Actions:**
  - [x] **Code Verification (`lib/auth/auth-helpers.ts`):**
    - [x] Thoroughly reviewed the `_handleExistingUser` function and related functions in the OAuth sign-in flow.
    - [x] Confirmed that when an existing user signs in via OAuth, the code does **not** update the `User` model's `name` or `image` fields with data from the OAuth provider. Comments explicitly stated that profile updates were not performed on every sign-in.
  - [x] **JSDoc Clarification (`lib/auth/auth-helpers.ts`):**
    - [x] Added detailed JSDoc comments to `_handleExistingUser` and `findOrCreateUserAndAccountInternal` explaining the "initial population only" behavior for OAuth profile data.
    - [x] Clarified in comments that this is by design to allow users to manage their profile independently within the application.
  - [x] **Project Documentation Update:**
    - [x] Created a dedicated `docs/AUTHENTICATION.md` file with a section on OAuth profile data handling that explains the behavior, implementation, and how to customize it if needed.
    - [x] Added a "Security Considerations" section to `README.md` that includes information about the OAuth profile data handling behavior.
    - [x] Added a cross-reference in the Authentication section of `README.md` to the new documentation.
  - [x] **Noted Special Case in `createOrUpdateOAuthUser`:**
    - [x] Documented that the `createOrUpdateOAuthUser` function in `lib/auth/oauth-helpers.ts` has different behavior - it will update user profile info if changed in the OAuth provider.
    - [x] Added explicit JSDoc comment to this function warning about this difference and advising users about the behavior differences.

### [x] 4. Prominently Document Registration Rate Limiting Fail-Open Strategy

- **Current State:** The "fail-open" behavior of Redis-based registration rate limiting (if Redis is unavailable, limiting is skipped) is noted in code comments in `lib/actions/auth.actions.ts` (`_handleRegistrationRateLimit`) and in `.env.example`.
- **Best Practice:** Critical security-related behaviors, especially fail-open mechanisms, should be very clearly communicated to the template user.
- **Action:**
  - [x] Updated the existing "Security Considerations" section in the main `README.md` to prominently explain the fail-open strategy.
  - [x] Expanded the explanation of the rate limiting fail-open strategy with:
    - Paraphrased explanations from `lib/actions/auth.actions.ts` about the fail-open behavior.
    - Clearly stated that if `ENABLE_REDIS_RATE_LIMITING` is true but Redis is unavailable or misconfigured, new user registrations **will not be rate-limited**.
    - Added advice for users to ensure Redis is robust, highly available, and correctly configured in production environments.
    - Added links to `lib/redis.ts` and `lib/actions/auth.actions.ts` for implementation details.
    - Included information about relevant environment variables for configuration.

### [x] 5. Document E2E Test Environment Logic in `ProfileService`

- **Current State:** `lib/server/services/profile.service.ts` contains `if (process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true')` logic in `_performDatabaseUpdate` to return a mock success response if the DB update fails during E2E tests.
- **Best Practice:** Test-specific logic within production code should be well-documented, explaining its purpose and trade-offs.
- **Action:**
  - [ ] Add a JSDoc comment to the `_performDatabaseUpdate` method in `lib/server/services/profile.service.ts`.
  - **Details for the comment:**
    - Explain that the `if (process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true')` block is specifically for E2E testing scenarios.
    - State its purpose: to allow E2E tests (particularly those focusing on UI flow for profile updates) to simulate a successful name update even if the underlying test database cannot be written to, or if direct database interaction is intentionally bypassed in the E2E test setup for simplicity.
    - Acknowledge the trade-off: this introduces test-environment-specific behavior into production code.
    - Suggest an alternative for more complex applications: "For applications requiring stricter separation, consider mocking this service at the E2E test boundary or ensuring the E2E test environment has a fully writable and verifiable database."

### [x] 6. Add Guidance on Database Transactions for Extended Registration Logic

- **Current State:** The user registration action (`lib/actions/auth.actions.ts` -> `_executeRegistrationCore` -> `_createPrismaUser`) currently performs a single `prisma.user.create` operation.
- **Best Practice:** Multiple dependent database writes should be atomic.
- **Action:**
  - [x] Added comprehensive JSDoc comments within `lib/actions/auth.actions.ts` to the `_executeRegistrationCore` function.
  - [x] Also updated the JSDoc for the `_createPrismaUser` function to document the existing transaction support.
  - **Details included in the comments:**
    - Explanation that the current implementation involves a single database write.
    - Guidance that if the registration logic is extended to create multiple related records, all dependent writes should be wrapped in a transaction.
    - Example code showing how to use Prisma transactions to ensure atomicity.
    - Link to Prisma documentation on transactions for further reference.
    - Clarification about the existing `tx` parameter in `_createPrismaUser` that already supports transaction handling.

---
