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

### Comprehensive Checklist for Improving the Testing Suite

Here is a detailed list of suggestions formatted for an AI to implement:

- [x] **1. Consolidate Mock Directories**

  - **Justification:** The project has two mock directories (`__mocks__/` and `tests/mocks/`). Jest's standard convention is to use a single root-level `__mocks__/` directory for automatic module mocking. Consolidating them simplifies the project structure and adheres to best practices.
  - **Action:**
    - **[Done]** Move all files and subdirectories from `tests/mocks/` to the root `__mocks__/` directory. The final structure should place all mocks directly under `__mocks__/`.
    - **[Done]** After moving the files, delete the now-empty `tests/mocks/` directory.
    - **[Done]** Run the unit tests (`npm run test:unit`) to ensure all mocks are still resolved correctly. No path changes in `jest.config.js` should be necessary due to the established module resolution.

- [x] **2. Introduce Visual Regression Testing**

  - **Justification:** For a UI-heavy template, visual regression testing is invaluable for catching unintended visual changes in components and layouts. Playwright offers this capability out-of-the-box.
  - **Action:**

    - **[Done]** Create a new test file at `tests/e2e/public/visual.spec.ts`.
    - **[Done]** Add the following test to the new file. This test will serve as a baseline example for future visual tests.

      ```typescript
      import { test, expect } from '../utils/test-base';

      test.describe('Visual Regression Tests', () => {
        test('Login page should match the approved snapshot', async ({ page }) => {
          await page.goto('/login');
          // Ensure the page is stable and key elements are visible before taking a screenshot
          await expect(page.locator('[data-testid="google-signin-button"]')).toBeVisible();
          await expect(page.locator('[data-testid="credentials-form"]')).toBeVisible();

          // Assert that the page matches the saved snapshot.
          await expect(page).toHaveScreenshot('login-page.png', {
            maxDiffPixels: 100, // Allow for minor anti-aliasing differences between runs
          });
        });
      });
      ```

    - **[Done]** Execute `npx playwright test tests/e2e/public/visual.spec.ts` to generate the initial snapshot.
    - **[Done]** Add a section to the testing `README.md` explaining that visual snapshots are stored in the repository and how to update them using the command: `npx playwright test --update-snapshots`.

- [x] **3. Streamline E2E Test File Organization**

  - **Justification:** The E2E test directory contains files that are either redundant, empty, or could be named more clearly. Cleaning this up improves maintainability.
  - **Action:**
    - **[Delete]** ✅ Delete the file `tests/e2e/authenticated/dashboard.spec.ts`. Its purpose (verifying access to an authenticated route) is already covered in more comprehensive tests like `tests/e2e/authenticated/auth/auth-flow.spec.ts`.
    - **[Rename]** ✅ Rename `tests/e2e/public/accessibility-improved.spec.ts` to `tests/e2e/public/accessibility.spec.ts`.
    - **[Rename]** ✅ Rename `tests/e2e/public/navigation-improved.spec.ts` to `tests/e2e/public/navigation.spec.ts`.

- [x] **4. Clarify Playwright Project Naming**

  - **Justification:** The project names in `playwright.config.ts` (`ui-tests`, `chromium`) are not descriptive of their purpose. Renaming them will make the configuration easier to understand for new developers.
  - **Action:**
    - **[Modify]** ✅ Open `playwright.config.ts`.
    - **[Rename]** ✅ Find the project named `ui-tests` and rename it to `unauthenticated-tests`.
    - **[Rename]** ✅ Find the project named `chromium` and rename it to `authenticated-chromium`.

- [x] **5. Centralize and Enhance Test Suite Documentation**
  - **Justification:** Documentation for testing is currently split between `tests/README-main.md` and `docs/testing/README.md`. A single, authoritative `README.md` inside the `tests/` directory is a cleaner approach.
  - **Action:**
    - **[Create]** ✅ Create a new file named `tests/README.md`.
    - **[Merge Content]** ✅ Consolidate the essential information from `tests/README-main.md` and `docs/testing/README.md` into the new `tests/README.md`. The new file should contain the following sections:
      1.  **Overview:** A brief introduction to the testing strategy (Unit, E2E, etc.).
      2.  **Frameworks:** A list of the primary testing frameworks (Jest, Playwright, React Testing Library).
      3.  **Directory Structure:** A high-level overview of the `tests/` directory layout.
      4.  **Running Tests:** A summary of the key `npm run test:*` commands.
      5.  **Core Utilities:** A brief mention of key utilities like `renderWithProviders` for unit tests and `auth.setup.ts` for E2E tests.
    - **[Delete]** ✅ Delete the old files: `tests/README-main.md` and `docs/testing/README.md`.
