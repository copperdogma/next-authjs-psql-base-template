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
  - [x] **Utility Libraries and Shared Functions** (Files: `lib/` (excluding auth, prisma, redis), `lib/utils/`)
    - [x] **1. Centralize Logging in `withDatabaseRetry`**
    - [x] **2. Enhance Request ID Generation with UUID**
    - [x] **3. Standardize Invalid URL Path Extraction**
    - [x] **4. Clarify or Remove Unused `authApiLimiter`**
  - [x] **Testing Suite** (Files: `tests/`, `playwright.config.ts`, `jest.config.js`, mocks)
    - [x] **Consolidate Basic E2E Smoke Tests**
    - [x] **Evaluate and Potentially Remove `tests/e2e/auth/exact-repro.test.ts`**
    - [x] **Relocate or Remove Debugging Helper Scripts from `tests/` Directory**
    - [x] **Consolidate Jest Configuration**
    - [x] **Consolidate Playwright Configuration**
    - [x] **Remove Potentially Orphaned/Redundant Theme Mock**
  - [ ] **Build, Configuration, and DX Scripts** (Files: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `package.json` scripts, `scripts/`)
  - [ ] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)
  - [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)
- [ ] try to upgrade everything again- [x] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `Next Auth Application`, `Your Name`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [x] Final round: search for unused vars/code/files/packages/etc.
- [x] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be

---

Okay, I've double-checked my previous analysis against the codebase and best practices. Here's a comprehensive Markdown checklist of suggestions to enhance the Testing Suite for your Next.js, AuthJS, and PSQL template. The goal is to make it simple, elegant, and robust for AI-driven projects.

## Testing Suite Enhancement Checklist

### [ ] 🧹 Removals & Consolidations (Medium Priority)

- [x] **Consolidate Basic E2E Smoke Tests**

  - **Affected Files**: `tests/e2e/basic.spec.ts`, `tests/e2e/ultra-basic.spec.ts`, `tests/e2e/basic-navigation.spec.ts`.
  - **Reasoning**: Currently, multiple files perform very basic checks (page load, title). A single, focused smoke test is more efficient for a template.
  - **Action**:
    - Create a new file `tests/e2e/smoke.spec.ts`.
    - Migrate the essential checks from the aforementioned files into `smoke.spec.ts`. This should include:
      - Verifying the homepage (`/`) loads successfully (status 200).
      - Checking for the presence of a key layout element (e.g., `header`, `footer`, or a `data-testid` on the main layout component).
      - Optionally, one simple navigation click to a public page (e.g., `/about`) and verify the URL changes.
    - Remove `tests/e2e/basic.spec.ts` and `tests/e2e/ultra-basic.spec.ts`.
    - Refactor or remove `tests/e2e/basic-navigation.spec.ts` if its core purpose is covered by the new `smoke.spec.ts` or other navigation tests. The detailed logging from `basic-navigation.spec.ts` could be a model for the new smoke test.

- [x] **Evaluate and Potentially Remove `tests/e2e/auth/exact-repro.test.ts`**

  - **Affected File**: `tests/e2e/auth/exact-repro.test.ts`.
  - **Reasoning**: This test seems to target a very specific historical scenario ("login page with callback URL from screenshot"). For a general template, tests should cover common, representative use cases.
  - **Action**:
    - ✅ Analyzed that the core behavior (login with a callback URL) is adequately tested in other auth flow tests - specifically in `tests/e2e/auth/login-page.test.ts` and `tests/e2e/auth/redirect.test.ts`.
    - ✅ Removed `exact-repro.test.ts` as it was redundant and contained debugging-focused code that's not necessary for the template.

- [x] **Relocate or Remove Debugging Helper Scripts from `tests/` Directory**

  - **Affected Files**: `tests/run-navigation-tests.sh`, `tests/simple-test-runner.sh`, `tests/standalone-test.js`, `tests/simple-layout-test.js`.
  - **Reasoning**: These scripts are for manual debugging or specific diagnostic runs, not part of the automated test suite. They clutter the main test directory.
  - **Action**:
    - ✅ Created a new directory `scripts/test-debug-helpers/`
    - ✅ Moved all debugging helper scripts to the new directory
    - ✅ Updated ESLint configuration (`eslint.config.mjs`) to reference the new paths
    - ✅ Updated setup script (`scripts/setup.js`) to reference the new path for `simple-layout-test.js`

- [x] **Consolidate Jest Configuration**

  - **Affected Files**: `jest.config.js` (root) and `tests/config/jest.config.js`.
  - **Reasoning**: The root `jest.config.js` is comprehensive and appears to be the active configuration. The one in `tests/config/` is likely redundant or an outdated version.
  - **Action**:
    - ✅ Verified and incorporated all necessary configurations from `tests/config/jest.config.js` into the root `jest.config.js`.
    - ✅ Added project-specific setup files, moduleNameMapper entries for mocks, and specific coverage thresholds from the tests/config version.
    - ✅ Deleted the redundant `tests/config/jest.config.js` file.
    - ✅ Verified that tests still run successfully with the consolidated configuration.

- [x] **Consolidate Playwright Configuration**

  - **Affected Files**: `playwright.config.ts` (root) and `tests/config/playwright.config.ts`.
  - **Reasoning**: The root `playwright.config.ts` is the standard and active configuration.
  - **Action**:
    - ✅ Verified that the file `tests/config/playwright.config.ts` no longer exists in the codebase.
    - ✅ Confirmed that the root `playwright.config.ts` is comprehensive and contains all necessary configurations.
    - ✅ No further action needed as the consolidation appears to have been completed already.

- [x] **Remove Potentially Orphaned/Redundant Theme Mock**
  - **Affected File**: `__mocks__/app/providers/ThemeProvider.js`.
  - **Reasoning**: This file mocks `useTheme` from `next-themes` and a `ThemeProvider` component, similar to `__mocks__/next-themes.js`. The path `app/providers/ThemeProvider.js` does not correspond to an existing file in the provided codebase (the closest is `ThemeRegistry.tsx` for MUI theming or `NextThemesProvider.tsx` which is a thin wrapper). The module-level mock `__mocks__/next-themes.js` is the standard and generally sufficient way to mock `next-themes`.
  - **Action**:
    - ✅ Removed the `__mocks__/app/providers/ThemeProvider.js` file. Tests relying on `next-themes` functionality are covered by the `__mocks__/next-themes.js` module mock.
    - ✅ Verified all unit and E2E tests still pass with the expected failures (which were failing before this change).

### [ ] ✨ Enhancements (High to Medium Priority)

- [x] **Fix Skipped Database Utility Tests (High Priority)**

  - **Affected File**: `tests/unit/db/utils.test.ts`.
  - **Reasoning**: This test file is currently non-functional due to "persistent TypeScript errors (TS2305) related to resolving Prisma Client types". A template with PSQL integration _must_ have working tests for its database utilities.
  - **Action**:
    - Investigate and resolve the TypeScript type resolution errors for Prisma types within the Jest environment. This may involve:
      - Correcting `tsconfig.json` path mappings if Jest isn't picking them up.
      - Adjusting `jest.config.js` `moduleNameMapper` or `transform` settings for Prisma.
      - Ensuring Prisma Client is generated correctly and its types are accessible.
      - Reviewing how Prisma Client is mocked or instantiated in these tests. The `globalPrisma` mock in the test file might need adjustment to correctly mimic the full Prisma Client type structure expected by the utilities.
    - Ensure all tests within this file pass after fixing the type issues.

- [x] **Refine Jest Environment Setup for Node vs. JSDOM (High Priority)**
  - **Affected Files**: `jest.config.js`, `jest.setup.ts`.
  - **Reasoning**: The `node` test environment project in `jest.config.js` currently includes `jest.setup.ts` in `setupFilesAfterEnv`. However, `jest.setup.ts` contains JSDOM-specific mocks (e.g., `IntersectionObserver`, `matchMedia`, `window.location`), which are unnecessary and potentially problematic for Node.js tests (APIs, services).
  - **Action**:
    - ✅ Moved browser-specific mocks (TextEncoder and TextDecoder) from `jest.setup.ts` to `jest.setup.jsdom.ts`.
    - ✅ Kept only general setup code in `jest.setup.ts` that's applicable to both Node and JSDOM environments.
    - ✅ Verified that all tests pass with this separation of concerns.
