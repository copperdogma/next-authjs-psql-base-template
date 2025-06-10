# Project Setup Scratchpad

This document tracks progress, decisions, and issues encountered during the project setup.

## Codebase AnalysisAI Prompt

I'm creating a github template with nextjs, authjs, and psql. The idea is for this to be used by AI when starting new project. The AI, if appropriate for the project, will pull from this template to get started. I've been getting AI to vibe code projects and it always takes a day or two at the start to get it to slowly set up the basics (especially auth). I want that step to be minutes instead of hours.

I'm going to paste the entire codebase below.

I want you to analyze it for best practices. This should be a simple, elegant, ready to use out of the box template, so look for anything that could be improved. I want the architecture to be clean and following best practices and solid principles.

I want you to be very thorough here. Break it down into clear sections or tasks that can be addressed item by item. I want this template to be production ready.

## Caveats For AI analysis:

- Placeholders: These are intentional. Because this is a base project I plan to install a plugin that leads the user through customizing it for their uses and replacing those placeholders. Igore them for now.
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

- [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)

Note that this may not be all of the files, so be sure to look at the entire codebase.

Here is the code:

---

Double check your suggestions. Verify they're best practice and not already implmented.

Then make a comprehensive list of all of your suggestions to improve the codebase as a markdown checklist with checkboxes. Be sure to include as much detail as possible as I'll be giving it to another AI to implement.

---

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

Use this methodolgy: - Attempt to upgrade and make sure nothing broke - If it's okay, then run all tests (npm run test and npm run test:e2e). You have permission to run these commands. - If they pass, ask me to manually check the website. - THEN check it off as successful.

- NOTE: The "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:" error in Chrome is caused by a personal plugin injecting stuff into the UI and isn't a real error.

### Code To Do

- [ ] add global rules for consistency. Research best practices and encode them. Cursor – Large Codebases: https://docs.cursor.com/guides/
- [x] Refine: get gemini 2.5 to analyze each subsystem alone
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
  - [x] **Database Interaction & Schema** (Files: `lib/prisma.ts`, `prisma/` schema, Prisma-interacting services)
    - [x] **Refactor `getUserSessionCountsByDay` for Proper Parameterization**: Updated the method to correctly pass parameters from `buildDateUserWhereClause` to the `$queryRaw` call, preventing SQL injection vulnerabilities.
    - [x] **Refactor `buildSessionExpirationWhereClause` for Secure Parameterization**: Modified the method to return a parameterized where clause with an array of parameter values, supporting the ANY operator for proper array handling.
    - [x] **Refactor `extendSessionExpirations` for Secure Date Handling**: Updated to use parameterized queries for user IDs and dates, with proper interval handling.
    - [x] **Refactor `buildActivityWhereClause` for Parameterization**: Updated to use placeholders for date filtering with parameter values.
    - [x] **Refactor `executeActivitySummaryQuery` and `getUserActivitySummary` for Full Parameterization**: Modified to properly parameterize all user inputs (since date, minSessionCount, limit) using placeholder syntax.
  - [x] **State Management & Client-Side Logic** (Files: `app/providers/`, custom hooks, context providers)
  - [x] **Utility Libraries and Shared Functions** (Files: `lib/` (excluding auth, prisma, redis), `lib/utils/`)
    - [x] **1. Centralize Logging in `withDatabaseRetry`**
    - [x] **2. Enhance Request ID Generation with UUID**
    - [x] **3. Standardize Invalid URL Path Extraction**
    - [x] **4. Clarify or Remove Unused `authApiLimiter`**
  - [x] **Testing Suite** (Files: `tests/`, `playwright.config.ts`, `jest.config.js`, mocks)
    - [x] **Consolidate E2E Smoke Tests**: Removed redundant basic.spec.ts test file as its functionality is covered by the more comprehensive smoke.spec.ts.
    - [x] **Remove Potentially Orphaned/Redundant Theme Mock**: Removed duplicate next-themes.js mock file from tests/mocks directory, keeping only the one in the root **mocks** directory which is automatically used by Jest.
    - [x] **Remove Unnecessary Transpiler Verification Tests**: Deleted unnecessary SWC transpiler verification tests that were not essential for application testing.
    - [x] **Clean Up Outdated Playwright Setup Files**: Removed outdated global-setup.ts and auth.setup.ts files from the tests/e2e directory, keeping only the current version in tests/e2e/setup/.
    - [x] **Enable Disabled Tests**: Enabled the disabled test in dashboard.spec.ts but kept environment check tests skipped in auth-edge.additional.test.ts due to their flaky nature.
    - [x] **Improve the Main `npm test` Script**: Updated the main npm test script to run both unit and E2E tests for more comprehensive validation.
    - [x] **Relocate Debugging Helper Scripts**: Confirmed that debug helper scripts are already correctly located in the scripts/test-debug-helpers directory.
    - [x] **Testing Suite Enhancement Checklist**: Completed comprehensive testing suite improvements including:
      - [x] **Organize E2E Test Files into Correct Projects**: Moved orphaned test files (`smoke.spec.ts`, `public-access.spec.ts`, `dashboard.spec.ts`) to appropriate subdirectories to ensure they are included in test runs.
      - [x] **Standardize E2E Test File Naming Convention**: Renamed all E2E test files to use `.spec.ts` extension for consistency.
      - [x] **Remove Deprecated Unit Test Utilities**: Removed deprecated helper functions (`renderWithAuth`, `renderLoading`, `renderWithError`) from test-fixtures.tsx for a cleaner template.
      - [x] **Improve Local Development Test Script**: Changed `npm test` to run only unit tests for faster local development, added `npm run test:ci` for comprehensive testing.
      - [x] **Add Visual Regression Workflow Script**: Added `npm run test:e2e:update-snapshots` script for easy snapshot management.
      - [x] **Enhance Jest Configuration Clarity**: Added comprehensive comments explaining the multi-project setup and ESM transformation requirements.
      - [x] **Enhance Prisma Adapter Mock Documentation**: Added detailed JSDoc comments explaining the in-memory implementation and its benefits for testing.
  - [x] **Build, Configuration, and DX Scripts** (Files: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `package.json` scripts, `scripts/`)
  - [x] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)
    - [x] **1. Remove Redundant Global Styles**: Successfully removed redundant CSS rules for light/dark mode styling that were being handled by MUI's ThemeProvider and CssBaseline.
    - [x] **2. Abstract Theme Names into Constants for Maintainability**: Theme constants were already properly implemented - verified `lib/constants/theme.ts` exists with proper `THEME_MODES` constants and both `ThemeMenu.tsx` and `ThemeToggle.tsx` are using these constants correctly.
  - [x] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)
- [x] try to upgrade everything again
  - [x] Successfully upgraded majority of packages
  - [x] Fixed TypeScript error in Menu.tsx component
  - [x] All unit tests passing (416/416)
  - [x] All E2E tests passing (59/59)
  - [x] Build successful
- [x] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `Next Auth Application`, `Your Name`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [ ] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be"
- [x] Final round: search for unused vars/code/files/packages/etc.
  - [x] **Removed Unused Dependencies**: Successfully removed `react-hot-toast`, `@types/supertest`, `supertest`, and `rimraf` (4 packages, ~240KB reduction)
  - [x] **Deleted Deprecated Files**: Removed `lib/db/user-service.ts`, `lib/db/raw-query-service.ts`, `examples/batched-logging-example.ts`, and related test file
  - [x] **Fixed Unused Variables**: ESLint auto-fixed most of the 142 unused variables found
  - [x] **Testing Validation**: All 408 unit tests passing, all 30 E2E authentication tests passing
  - [x] **Created Cleanup Report**: Generated comprehensive `unused-cleanup-report.md` with detailed findings and recommendations
  - [x] **Security Fix**: Removed Google service account key file from `secrets/` directory
  - [x] **File Cleanup**: Removed unused files: `.DS_Store`, empty `examples/` directory, log files, and generated documentation files
  - [x] **Code Fix**: Fixed unused `_session` variable in `app/page.tsx`
  - [x] **Validation**: All 408 unit tests and 30 E2E authentication tests passing after cleanup

---

### **Area 1: Project Configuration & Developer Experience**

- #### [x] Refine Webpack Configuration Comments in `next.config.ts`
  - **Objective:** Make the template's stance on client-side Node.js modules explicit to guide developers and AI agents.
  - **File:** `next.config.ts`
  - **Task:** In the `webpack` configuration function, locate the `resolve.fallback` section. The current comments suggest considering browser polyfills (e.g., `// Consider 'process/browser' if needed`). Replace these with more definitive comments that clarify _why_ these modules are disabled.
  - **Suggested Implementation:**
    ```diff
    // in next.config.ts inside the webpack function
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
    -    // ... more modules
    -    // Consider 'process/browser' if needed for client-side process.env
    +    // These Node.js modules are not available in the browser environment.
    +    // Setting them to 'false' prevents webpack from bundling large, unnecessary polyfills.
    +    process: false,
    +    path: false,
    +    stream: false,
    +    // ... and so on for the other modules
      };
    }
    ```
  - **Rationale:** This removes ambiguity and reinforces the best practice of avoiding server-side code on the client unless a developer makes a conscious choice to add polyfills.

### **Area 2: Authentication & Middleware**

- #### [ ] Centralize Middleware Route Definitions

  - **Objective:** Adhere to the DRY (Don't Repeat Yourself) principle by using a single source of truth for route paths used in the authentication middleware.
  - **Files:** `lib/auth-edge.ts`, `lib/constants/routes.ts`
  - **Task:** The `lib/auth-edge.ts` file currently defines its own arrays for public and authentication routes (`PUBLIC_ROUTES`, `AUTH_ROUTES`). A `lib/constants/routes.ts` file already exists with these routes defined. Refactor `lib/auth-edge.ts` to import and use the constants from `lib/constants/routes.ts` instead of defining its own local arrays.
  - **Example Implementation:**

    ```typescript
    // in lib/auth-edge.ts
    import { ROUTES } from '@/lib/constants/routes';

    // REMOVE these local constants:
    // const PUBLIC_ROUTES = ['/', '/about', ...];
    // const AUTH_ROUTES = ['/login', '/register'];

    // UPDATE the logic to use the imported constants:
    const isPublicRoute = (pathname: string): boolean => {
      return pathname === ROUTES.HOME || pathname === ROUTES.ABOUT || ...;
    };

    const isAuthRoute = (pathname: string): boolean => {
      return pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER;
    };
    ```

  - **Rationale:** This makes the codebase easier to maintain. If a route changes, it only needs to be updated in one place.

- #### [ ] Enhance JWT Type Definitions for Stronger Type Safety

  - **Objective:** Improve type safety and developer experience within the `jwt` callback by explicitly defining the custom properties on the JWT type.
  - **File:** `types/next-auth.d.ts`
  - **Task:** Extend the `JWT` interface from `next-auth/jwt` to include the custom `id` and `role` properties that are being added in the `jwt` callback.
  - **Suggested Implementation:**

    ```typescript
    // in types/next-auth.d.ts
    import { UserRole } from './index';

    declare module 'next-auth/jwt' {
      /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
      interface JWT {
        id: string;
        role: UserRole;
      }
    }
    ```

  - **Rationale:** This provides full type checking and autocompletion for the token object within the `jwt` callback, preventing potential runtime errors and making the code easier for an AI to work with.

### **Area 3: Services & Data Layer**

- #### [ ] Standardize Server Action and Service Response Format

  - **Objective:** Create a consistent and predictable data contract for all server-side operations, whether they are services or server actions.
  - **Files:** `app/profile/actions.ts`, `types/index.ts`
  - **Task:** The server action `updateUserName` in `app/profile/actions.ts` currently returns a custom type `NameUpdateState`. Refactor this action to return the standardized `ServiceResponse` type defined in `types/index.ts`.
  - **Example Implementation:**

    ```typescript
    // in app/profile/actions.ts
    import { ServiceResponse, User } from '@/types'; // Assuming User type is also available

    // Old type to be replaced
    // export type NameUpdateState = { message: string; success: boolean; updatedName: string | null; };

    // New type definition using ServiceResponse
    export type NameUpdateState = ServiceResponse<User | null, { originalError?: unknown }>;

    export async function updateUserName(
      _prevState: NameUpdateState,
      formData: FormData
    ): Promise<NameUpdateState> {
      // ... existing logic ...
      // Example of returning the new format on success:
      // return { status: 'success', data: updatedUser, message: 'Name updated successfully' };
      // Example of returning the new format on error:
      // return { status: 'error', message: 'Validation failed', error: { code: 'VALIDATION_ERROR', message: 'Name must be...' } };
    }
    ```

  - **Rationale:** This consistency simplifies client-side state management (e.g., when using `useActionState`), as the shape of the response from any server operation will be the same.

### **Area 4: UI Components**

- #### [ ] Improve `Card` Component Accessibility with JSDoc

  - **Objective:** Guide developers and AI agents to correctly implement accessibility for the `Card` component.
  - **File:** `components/ui/Card.tsx`
  - **Task:** Add JSDoc comments to the `CardTitle` and `CardDescription` components. Since the `id` and `aria-labelledby` attributes must be context-specific, the components themselves cannot enforce the relationship. The JSDoc will serve as clear documentation.
  - **Suggested Implementation:**

    ```tsx
    // in components/ui/Card.tsx

    /**
     * Card title component.
     * For accessibility, provide a unique `id` and reference it in an associated
     * CardDescription's `aria-labelledby` prop to create a semantic link.
     */
    const CardTitle = forwardRef<...>(...)

    /**
      * Card description component.
      * For accessibility, use the `aria-labelledby` prop to reference the `id` of the
      * corresponding CardTitle to programmatically link this description to its title.
      */
    const CardDescription = forwardRef<...>(...)
    ```

  - **Rationale:** This makes accessibility a documented feature of the component, prompting correct usage without over-engineering the component's props.

### **Area 5: Caching Service**

- #### [ ] Implement Compression in `CacheService`
  - **Objective:** Enhance the `CacheService` to reduce Redis memory usage and network latency for large cached objects.
  - **File:** `lib/services/cache.service.ts`
  - **Task:** The `serializeValue` method within `CacheServiceImpl` currently has a placeholder for compression. Implement this feature using Node.js's built-in `zlib` module. When the `compress` option is true and the serialized data exceeds a defined threshold (e.g., 1KB), the data should be gzipped before being stored. The `deserializeValue` method will need to be updated to detect and decompress this data.
  - **Suggested Implementation:**
    1.  Import `gzipSync` and `gunzipSync` from `zlib`.
    2.  In `serializeValue`, if `compress` is true and `serialized.length > this.compressionThreshold`, prefix the gzipped buffer with a marker (e.g., `gzip:`), convert to a string (e.g., base64), and return that.
    3.  In `deserializeValue`, check for the `gzip:` prefix. If present, decode from base64, decompress using `gunzipSync`, and then parse the JSON. If not present, parse the JSON as normal.
  - **Rationale:** This is a valuable, production-ready optimization that makes the template more powerful for a wider range of applications without adding external dependencies.
