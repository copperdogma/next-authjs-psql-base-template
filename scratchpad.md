# Project Setup Scratchpad

This document tracks progress, decisions, and issues encountered during the project setup.

### Current Phase

**✅ COMPLETED: Testing Suite Enhancement**

All testing suite enhancements have been successfully implemented. The testing infrastructure is now optimized with:

- ✅ All E2E test files properly organized into correct project directories
- ✅ Standardized `.spec.ts` naming convention for E2E tests
- ✅ Deprecated test utilities removed for cleaner codebase
- ✅ Improved npm scripts for better local development workflow
- ✅ Enhanced Jest configuration with comprehensive documentation
- ✅ Better documented Prisma adapter mock for testing clarity
- ✅ All unit tests passing (402/402)
- ✅ All E2E tests passing (60/60)
- ✅ Visual regression workflow scripts added

**Next Steps**: Ready for subsystem analysis - Build, Configuration, and DX Scripts

## Recent Actions ✅

**2025-06-08 - Testing Suite Enhancement:**

- ✅ **Organized E2E Test Structure**: Moved orphaned test files (`smoke.spec.ts`, `public-access.spec.ts`, `dashboard.spec.ts`) to appropriate project directories (`tests/e2e/public/` and `tests/e2e/authenticated/`)
- ✅ **Standardized E2E Naming**: Renamed all E2E test files to use `.spec.ts` extension for consistency (e.g., `login-page.test.ts` → `login-page.spec.ts`)
- ✅ **Cleaned Up Test Utilities**: Removed deprecated helper functions (`renderWithAuth`, `renderLoading`, `renderWithError`) from `test-fixtures.tsx` and updated corresponding tests
- ✅ **Improved npm Scripts**: Changed `npm test` to run only unit tests for faster local development, added `npm run test:ci` for comprehensive testing, and added `npm run test:e2e:update-snapshots` for visual regression workflow
- ✅ **Enhanced Jest Documentation**: Added comprehensive comments to `jest.config.js` explaining multi-project setup and ESM transformation requirements
- ✅ **Documented Prisma Mock**: Added detailed JSDoc comments to `__mocks__/auth/prisma-adapter.ts` explaining the in-memory implementation benefits
- ✅ **Verified Test Suite**: All 402 unit tests and 60 E2E tests passing with maintained coverage

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

- [x] **Testing Suite** (Files: `tests/`, `playwright.config.ts`, `jest.config.js`, mocks)

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
    - [x] **Testing Suite Enhancement Checklist**: Completed comprehensive testing suite improvements including:
      - [x] **Organize E2E Test Files into Correct Projects**: Moved orphaned test files (`smoke.spec.ts`, `public-access.spec.ts`, `dashboard.spec.ts`) to appropriate subdirectories to ensure they are included in test runs.
      - [x] **Standardize E2E Test File Naming Convention**: Renamed all E2E test files to use `.spec.ts` extension for consistency.
      - [x] **Remove Deprecated Unit Test Utilities**: Removed deprecated helper functions (`renderWithAuth`, `renderLoading`, `renderWithError`) from test-fixtures.tsx for a cleaner template.
      - [x] **Improve Local Development Test Script**: Changed `npm test` to run only unit tests for faster local development, added `npm run test:ci` for comprehensive testing.
      - [x] **Add Visual Regression Workflow Script**: Added `npm run test:e2e:update-snapshots` script for easy snapshot management.
      - [x] **Enhance Jest Configuration Clarity**: Added comprehensive comments explaining the multi-project setup and ESM transformation requirements.
      - [x] **Enhance Prisma Adapter Mock Documentation**: Added detailed JSDoc comments explaining the in-memory implementation and its benefits for testing.
  - [ ] **Build, Configuration, and DX Scripts** (Files: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `package.json` scripts, `scripts/`)
  - [ ] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)
  - [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)
- [ ] try to upgrade everything again
- [x] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `Next Auth Application`, `Your Name`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [x] Final round: search for unused vars/code/files/packages/etc.
- [x] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be"

---

Of course. After a thorough review of the testing suite and my initial analysis, I have verified my suggestions and identified additional areas for refinement. The current testing architecture is strong, particularly with its E2E setup, but the following changes will enhance its elegance, maintainability, and clarity, making it a truly "perfect" out-of-the-box template for AI-driven development.

Here is a comprehensive checklist of recommendations.

### 📋 Testing Suite Enhancement Checklist

- [ ] **Consolidate and Clarify Mocking Strategy**

  - **Current State**: The project has two mock directories: `__mocks__/` (root) and `tests/mocks/`. This can be confusing, and the latter contains a redundant mock for `next-themes`. Additionally, the complex `auth/prisma-adapter` mock lacks documentation explaining its purpose.
  - **Recommendation**:
    1.  Move all mocks from `tests/mocks/` into the root `__mocks__/` directory. This leverages Jest's standard convention for automatic mocking.
    2.  Delete the now-empty `tests/mocks/` directory.
    3.  Add a detailed JSDoc comment to `__mocks__/auth/prisma-adapter.ts` explaining that it is a full, in-memory re-implementation of the adapter, designed to enable comprehensive testing of authentication logic without requiring a live database connection.
  - **Files to Modify**:
    - `tests/mocks/next-themes.js` (delete)
    - `__mocks__/auth/prisma-adapter.ts` (add comments)
  - **Status**: ⚠️ **Partially Complete** - Enhanced Prisma adapter documentation was completed, but the `tests/mocks/` directory was not found during implementation.

- [x] **Organize E2E Test Files into Correct Projects**

  - **Current State**: Several E2E test files (`dashboard.spec.ts`, `smoke.spec.ts`, `public-access.spec.ts`) are located in the `tests/e2e/` root directory. The `playwright.config.ts` file defines test projects that only look inside `tests/e2e/public/` and `tests/e2e/authenticated/`. As a result, these root-level tests are currently orphaned and are not being executed by the `npm run test:e2e` command.
  - **Recommendation**: Move the orphaned test files into the appropriate subdirectories to ensure they are included in the test runs.
    - Move `smoke.spec.ts` and `public-access.spec.ts` to `tests/e2e/public/`.
    - Move `dashboard.spec.ts` to `tests/e2e/authenticated/`.
  - **Files Modified**:
    - `tests/e2e/smoke.spec.ts` → `tests/e2e/public/smoke.spec.ts`
    - `tests/e2e/public-access.spec.ts` → `tests/e2e/public/public-access.spec.ts`
    - `tests/e2e/dashboard.spec.ts` → `tests/e2e/authenticated/dashboard.spec.ts`
  - **Status**: ✅ **Complete** - All orphaned E2E test files successfully moved to appropriate project directories.

- [x] **Standardize E2E Test File Naming Convention**

  - **Current State**: The E2E tests use a mix of `.spec.ts` and `.test.ts` file extensions (e.g., `login-page.test.ts`).
  - **Recommendation**: Standardize all Playwright E2E test files to use the `.spec.ts` extension. This is a common convention that helps differentiate E2E tests (specifications) from Jest unit tests (`.test.ts`).
  - **Files Modified**:
    - `tests/e2e/auth/login-page.test.ts` → `tests/e2e/auth/login-page.spec.ts`
    - `tests/e2e/auth/redirect.test.ts` → `tests/e2e/auth/redirect.spec.ts`
    - `tests/e2e/public/auth/login-page.test.ts` → `tests/e2e/public/auth/login-page.spec.ts`
    - `tests/e2e/authenticated/auth/redirect.test.ts` → `tests/e2e/authenticated/auth/redirect.spec.ts`
  - **Status**: ✅ **Complete** - All E2E test files now use consistent `.spec.ts` naming convention.

- [x] **Remove Deprecated Unit Test Utilities**

  - **Current State**: The file `tests/utils/test-fixtures.tsx` contains several deprecated helper functions (`renderWithAuth`, `renderLoading`, `renderWithError`) that now log a `console.warn`.
  - **Recommendation**: For a clean, "perfect" template, remove the deprecated functions and their `console.warn` calls. This presents a single, modern way to render components for testing (`renderWithSession` or `renderWithProviders`) and avoids confusion for developers and AI agents.
  - **Files Modified**:
    - `tests/utils/test-fixtures.tsx` - Removed deprecated functions
    - `tests/unit/utils/test-fixtures.test.tsx` - Removed tests for deprecated functions
  - **Status**: ✅ **Complete** - All deprecated test utilities removed, providing a cleaner template.

- [x] **Improve Local Development Test Script**

  - **Current State**: The `npm test` script runs both unit and E2E tests, which can be slow for rapid local development. The pre-push git hook correctly runs only `test:unit`.
  - **Recommendation**:
    1.  Change the `test` script in `package.json` to only run the unit tests: `"test": "npm run test:unit"`.
    2.  Create a new script named `test:ci` specifically for running the full suite: `"test:ci": "npm run test:unit && npm run test:e2e"`.
    3.  This provides a fast default command for local use while having an explicit, comprehensive command for CI environments.
  - **Files Modified**:
    - `package.json` - Updated test scripts for better developer experience
  - **Status**: ✅ **Complete** - Local development optimized with fast `npm test` and comprehensive `npm run test:ci`.

- [x] **Enhance Jest Configuration Clarity**

  - **Current State**: The `jest.config.js` file has a sophisticated multi-project setup but lacks comments explaining the configuration choices.
  - **Recommendation**: Add comments to `jest.config.js` to clarify key sections. Specifically, explain the purpose of the `node` and `jsdom` projects and provide a brief explanation for the `transformIgnorePatterns` array, noting that it's required to properly transpile ESM-based dependencies from `node_modules`.
  - **Files Modified**:
    - `jest.config.js` - Added comprehensive documentation explaining multi-project setup and ESM transformation
  - **Status**: ✅ **Complete** - Jest configuration now well-documented for better maintainability.

- [x] **Make Visual Regression Workflow Explicit**
  - **Current State**: The project has a visual regression test (`visual.spec.ts`) but no explicit npm script for updating the baseline snapshots.
  - **Recommendation**: Add a dedicated script to `package.json` to make updating snapshots easy and discoverable. For example: `"test:e2e:update-snapshots": "playwright test --update-snapshots"`.
  - **Files Modified**:
    - `package.json` - Added `test:e2e:update-snapshots` script
  - **Status**: ✅ **Complete** - Visual regression workflow now easily discoverable and manageable.
