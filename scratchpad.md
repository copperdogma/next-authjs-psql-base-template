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

- [ ] **Utility Libraries and Shared Functions** (Files: `lib/` (excluding auth, prisma, redis), `lib/utils/`)

Note that this may not be all of the files, so be sure to look at the entire codebase.

Here is the code:

---

Double check your suggestions. Verify they're best practice and not already implmented.

Then make a comprehensive list of all of your suggestions to improve the codebase as a markdown checklist with checkboxes. Be sure to include as much detail as possible as I'll be giving it to another AI to implement.

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
  - [x] **Database Interaction & Schema** (Files: `lib/prisma.ts`, `prisma/` schema, Prisma-interacting services)
    - [x] **Refactor `getUserSessionCountsByDay` for Proper Parameterization**: Updated the method to correctly pass parameters from `buildDateUserWhereClause` to the `$queryRaw` call, preventing SQL injection vulnerabilities.
    - [x] **Refactor `buildSessionExpirationWhereClause` for Secure Parameterization**: Modified the method to return a parameterized where clause with an array of parameter values, supporting the ANY operator for proper array handling.
    - [x] **Refactor `extendSessionExpirations` for Secure Date Handling**: Updated to use parameterized queries for user IDs and dates, with proper interval handling.
    - [x] **Refactor `buildActivityWhereClause` for Parameterization**: Updated to use placeholders for date filtering with parameter values.
    - [x] **Refactor `executeActivitySummaryQuery` and `getUserActivitySummary` for Full Parameterization**: Modified to properly parameterize all user inputs (since date, minSessionCount, limit) using placeholder syntax.
  - [x] **State Management & Client-Side Logic** (Files: `app/providers/`, custom hooks, context providers)
  - [ ] **Utility Libraries and Shared Functions** (Files: `lib/` (excluding auth, prisma, redis), `lib/utils/`)
    - [x] **1. Centralize Logging in `withDatabaseRetry`**
    - [x] **2. Enhance Request ID Generation with UUID**
    - [ ] **3. Standardize Invalid URL Path Extraction**
    - [x] **4. Clarify or Remove Unused `authApiLimiter`**
  - [ ] **Testing Suite** (Files: `tests/`, `playwright.config.ts`, `jest.config.js`, mocks)
  - [ ] **Build, Configuration, and DX Scripts** (Files: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `package.json` scripts, `scripts/`)
  - [ ] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)
  - [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)
- [ ] try to upgrade everything again- [x] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `Next Auth Application`, `Your Name`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [x] Final round: search for unused vars/code/files/packages/etc.
- [x] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be

---

## Checklist for Utility Libraries and Shared Functions Enhancements

### [x] 1. Centralize Logging in `withDatabaseRetry`

- **File**: `lib/db/utils.ts`
- **Function**: `withDatabaseRetry`
- **Current Situation**: The `withDatabaseRetry` function currently uses `console.warn` for logging retry attempts and failures within the retry loop. While `checkDatabaseConnection` in the same file uses `loggers.db.error`, `withDatabaseRetry` does not.
  ```typescript
  // Snippet from withDatabaseRetry
  // ...
  if (attempt === retries) {
    console.warn(
      // <--- Direct console usage
      {
        context: 'retryOperation',
        attempt: attempt + 1,
        // ...
      },
      `Final attempt ${attempt + 1}/${retries + 1} failed.`
    );
    break;
  }
  // ...
  console.warn(
    // <--- Direct console usage
    {
      context: 'retryOperation',
      attempt: attempt + 1,
      // ...
    },
    `Retry attempt ${attempt + 1}/${retries + 1} failed. Retrying in ${delay}ms...`
  );
  // ...
  ```
- **Issue**: Direct use of `console.warn` bypasses the application's structured logging system (Pino via `lib/logger.ts`). This leads to inconsistent log formats, inability to control log levels for these specific warnings centrally, and potential loss of these logs if console output isn't being captured in certain environments.
- **Best Practice**: Utilize the application's centralized logger for all application-level logging to ensure consistency in format, level control, and output routing.
- **Suggestion**:
  - Ensure `loggers` (or a specific child logger like `loggers.db`) is imported from `lib/logger.ts` into `lib/db/utils.ts` if not already (it appears to be imported for `checkDatabaseConnection`).
  - Replace the `console.warn` calls within `withDatabaseRetry` with `loggers.db.warn` (or an appropriate child logger).
  - Adjust the log object to fit the structured logging approach, ensuring context and error details are passed correctly.
- **Example Change**:

  ```typescript
  // Before
  // console.warn({ context: 'retryOperation', ... }, `Retry attempt ...`);

  // After (assuming loggers.db is available)
  // loggers.db.warn({ context: 'retryOperation', attempt: attempt + 1, maxRetries: retries + 1, err: error instanceof Error ? { message: error.message, stack: error.stack } : error, delay }, `Retry attempt ${attempt + 1}/${retries + 1} failed. Retrying in ${delay}ms...`);
  ```

- **Benefit**: Consistent logging, adherence to configured log levels, and better observability.
- **Checkbox**:
  - [x] Modify `withDatabaseRetry` in `lib/db/utils.ts` to use `loggers.db.warn` instead of `console.warn` for logging retry attempts and final failure messages. Ensure the error object is included in the log context for better diagnostics.

### [x] 2. Enhance Request ID Generation with UUID

- **File**: `lib/logger.ts`
- **Function**: `getRequestId`
- **Current Situation**: `getRequestId` generates IDs using `req_${Math.random().toString(36).substring(2, 10)}`. While simple and often sufficient for basic tracing, `Math.random()` is not cryptographically secure and has a theoretical possibility of collision in very high-throughput systems, although unlikely with the prefix.
  ```typescript
  export const getRequestId = () => {
    return `req_${Math.random().toString(36).substring(2, 10)}`;
  };
  ```
- **Issue**: For applications that might scale or integrate into larger distributed systems, a more robust and universally unique identifier is preferable.
- **Best Practice**: Using UUIDs (specifically v4) for generating unique identifiers is a standard best practice due to their extremely low collision probability. The `uuid` package is already a dependency.
- **Suggestion**:
  - Modify `getRequestId` to use `uuidv4()` from the `uuid` package.
  - Ensure the `uuid` package is correctly imported.
- **Example Change**:
  ```typescript
  import { v4 as uuidv4 } from 'uuid'; // Add import
  // ...
  export const getRequestId = () => {
    // return `req_${Math.random().toString(36).substring(2, 10)}`; // Old
    return `req_${uuidv4()}`; // New
  };
  ```
- **Benefit**: Stronger uniqueness guarantee for request IDs, aligning with industry standards for distributed tracing and logging.
- **Checkbox**:
  - [x] Update the `getRequestId` function in `lib/logger.ts` to use `uuidv4()` for generating the unique part of the request ID, replacing the current `Math.random()`-based approach.

### [x] 3. Standardize Invalid URL Path Extraction

- **File**: `lib/services/api-logger-service.ts`
- **Function**: `getRequestPath`
- **Current Situation**: When the `url` parameter provided to `getRequestPath` is a string that cannot be parsed into a valid URL, the function's `catch` block currently returns the original invalid string.
  ```typescript
  // Snippet from getRequestPath
  if (url) {
    if (typeof url === 'string') {
      try {
        return new URL(url).pathname;
      } catch {
        return url; // Returns the original invalid string
      }
    }
    return url.pathname || '/unknown';
  }
  ```
- **Issue**: Returning the raw invalid URL string might lead to inconsistent path formats in logs if this edge case occurs, making log parsing or alerting based on paths less reliable.
- **Best Practice**: For known error conditions or unparseable inputs, returning a consistent, identifiable placeholder string can improve log consistency.
- **Suggestion**:
  - Modify the `catch` block within the `typeof url === 'string'` check. Instead of returning the original `url` string, return a standardized placeholder like `'/malformed_url_string'` or `'/unknown_path_format'`.
- **Example Change**:

  ```typescript
  // Before
  // } catch {
  //   return url;
  // }

  // After
  // } catch {
  //   // Log the issue minimally if desired, then return placeholder
  //   // logger.debug({ invalidUrlString: url }, "Failed to parse URL string in getRequestPath");
  //   return '/malformed_url_string';
  // }
  ```

- **Benefit**: More consistent and predictable path values in logs, especially in error scenarios or when processing malformed inputs.
- **Checkbox**:
  - [ ] In `lib/services/api-logger-service.ts`, modify the `getRequestPath` function so that if a string `url` parameter fails to be parsed by `new URL()`, it returns a consistent placeholder string (e.g., `'/malformed_url_string'`) instead of the original invalid string.

### [x] 4. Clarify or Remove Unused `authApiLimiter`
