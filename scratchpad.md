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

- [ ] **Testing Suite** (Files: `tests/`, `playwright.config.ts`, `jest.config.js`, mocks)

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
  - [ ] **Build, Configuration, and DX Scripts** (Files: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `package.json` scripts, `scripts/`)
  - [ ] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)
  - [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)
- [ ] try to upgrade everything again- [x] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `Next Auth Application`, `Your Name`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [x] Final round: search for unused vars/code/files/packages/etc.
- [x] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be"

---

Of course. After a thorough review of my initial analysis and the provided codebase, I have confirmed and refined my recommendations. The testing suite is strong, but these changes will enhance its simplicity, maintainability, and adherence to best practices, making it an even better template.

Here is a comprehensive checklist of actionable suggestions to improve the testing suite.

---

### 🚀 Comprehensive Testing Suite Enhancement Plan

#### [x] 1. Configuration & Structure Consolidation

These changes focus on simplifying configuration files and making the project structure more intuitive and maintainable.

- [x] **Consolidate and Simplify Jest Configuration**

  - **Observation**: The `jest.config.js` file is functional but overly complex. It contains a verbose multi-project setup and some redundant `moduleNameMapper` entries that could be streamlined.
  - **Action**: Refactor `jest.config.js`. Merge the `jsdom` and `node` projects under a single configuration where possible, using `testEnvironment` overrides for specific file paths. Remove redundant path mappings in `moduleNameMapper` that are covered by the generic `^@/(.*)$` alias.
  - **Benefit**: This will make the Jest configuration significantly cleaner, easier to understand for new users (or AI), and reduce the chance of misconfiguration.
  - **File(s) to Modify**: `jest.config.js`

- [x] **Simplify Playwright Project Configuration via Directory Structure**

  - **Observation**: The `playwright.config.ts` file uses complex `testMatch` and `testIgnore` regular expressions to define which tests run in which project (e.g., `ui-tests` vs. `chromium` authenticated tests).
  - **Action**:
    1.  Create new subdirectories within `tests/e2e/` like `public/` and `authenticated/`.
    2.  Move the respective test files into these directories (e.g., `public-access.spec.ts` into `public/`, `profile/edit-profile.spec.ts` into `authenticated/`).
    3.  Update the `projects` in `playwright.config.ts` to use simple directory paths (e.g., `testDir: './tests/e2e/public'`) instead of complex regex matching.
  - **Benefit**: This simplifies the Playwright configuration, makes it immediately obvious which tests require authentication, and provides a clear structure for adding new tests.
  - **File(s) to Modify**: `playwright.config.ts`
  - **Files to Move**: All test files within `tests/e2e/`.

- [x] **Consolidate Mock Directories**
  - **Observation**: The project has two mock directories: a root `__mocks__/` and `tests/mocks/`. While functional, this can be confusing. The standard Jest convention is to use the root `__mocks__/` for automatic module mocking.
  - **Action**: Move all mocks from `tests/mocks/` into the root `__mocks__/` directory. Update any import paths that might break as a result. This standardizes the location for all mocks.
  - **Benefit**: Adheres to Jest's standard conventions, making the project more intuitive and reducing developer confusion.
  - **Files to Move**: All files and directories within `tests/mocks/`.

---

#### [x] 2. Redundancy and Cleanup

These actions will remove duplicated, outdated, or unnecessary files, resulting in a cleaner and more focused template.

- [x] **Consolidate E2E Smoke Tests**

  - **Observation**: The files `tests/e2e/basic.spec.ts` and `tests/e2e/smoke.spec.ts` have overlapping intentions. The `smoke.spec.ts` is more comprehensive and provides better validation.
  - **Action**: Delete the `tests/basic.spec.ts` file. Its simple check is already covered by the more robust `smoke.spec.ts`.
  - **Benefit**: Reduces test suite clutter and removes a redundant, less valuable test.
  - **File(s) to Delete**: `tests/basic.spec.ts`

- [x] **Remove Redundant `next-themes` Mock**

  - **Observation**: There are two identical mock files for the `next-themes` library: `__mocks__/next-themes.js` and `tests/mocks/next-themes.js`.
  - **Action**: Delete the mock file located at `
