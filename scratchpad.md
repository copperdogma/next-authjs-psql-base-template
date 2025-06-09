# Project Setup Scratchpad

This document tracks progress, decisions, and issues encountered during the project setup.

## Codebase AnalysisAI Prompt

I'm creating a github template with nextjs, authjs, and psql. The idea is for this to be used by AI when starting new project. The AI, if appropriate for the project, will pull from this template to get started. I've been getting AI to vibe code projects and it always takes a day or two at the start to get it to slowly set up the basics (especially auth). I want that step to be minutes instead of hours.

I'm going to paste the entire codebase below.

I want you to analyze it for best practices. This should be a simple, elegant, ready to use out of the box template, so look for anything that could be improved. I want the architecture to be clean and following best practices and solid principles.

I want you to be very thorough here. Break it down into clear sections or tasks that can be addressed item by item. I want this template to be production ready.

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

- [ ] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)

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
  - [x] **Build, Configuration, and DX Scripts** (Files: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `package.json` scripts, `scripts/`)
  - [x] **Styling and Theming** (Files: `app/globals.css`, `components/ui/theme/`)
    - [x] **1. Simplify Global CSS by Removing Redundant Media Query**: Confirmed that the `@media (prefers-color-scheme: dark)` query was already not present, as the app correctly uses next-themes with class-based strategy.
    - [x] **2. Optimize Performance by Scoping Global Transitions**: Changed the universal selector `*` to target only interactive elements (`a, button, [role="button"], input, textarea, select`) to improve performance and prevent unwanted visual glitches.
    - [x] **3. Improve Maintainability by Abstracting Theme Names into Constants**: Created `lib/constants/theme.ts` with `THEME_MODES` constants and `ThemeMode` type, updated `ThemeMenu.tsx` and `ThemeToggle.tsx` to use these constants instead of hardcoded strings for better maintainability and type safety.
  - [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)
- [ ] try to upgrade everything again
- [x] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `Next Auth Application`, `Your Name`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [x] Final round: search for unused vars/code/files/packages/etc.
- [x] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be"

---

---

### Styling and Theming Enhancement Checklist

- [ ] **1. Simplify Global CSS by Removing Redundant Media Query**

  - **File to Modify**: `app/globals.css`
  - **Reasoning**: Your application correctly uses the `next-themes` library with a `class` strategy (e.g., `<html class="dark">`). This means the theme is determined by the presence of a class on the HTML tag, not the user's OS-level preference via the `@media (prefers-color-scheme: dark)` query. The current CSS file contains both, which is redundant. Removing the media query establishes the `next-themes` provider as the single source of truth, simplifies the CSS, and prevents potential style conflicts.
  - **Implementation Details**:

    1.  Open the `app/globals.css` file.
    2.  Locate and **delete** the entire `@media (prefers-color-scheme: dark)` block.

        ```css
        /* DELETE THIS ENTIRE BLOCK */
        @media (prefers-color-scheme: dark) {
          :root {
            --background: #0a0a0a;
            --foreground: #ededed;
          }
        }
        ```

- [ ] **2. Optimize Performance by Scoping Global Transitions**

  - **File to Modify**: `app/globals.css`
  - **Reasoning**: The file currently applies a CSS `transition` to every element on the page using the universal selector (`*`). This is inefficient and can cause performance issues (layout thrashing) and unwanted visual glitches on complex pages, as the browser must account for transitions on non-interactive elements. Best practice is to apply transitions only to elements that a user interacts with.
  - **Implementation Details**:

    1.  Open the `app/globals.css` file.
    2.  Find the `*` selector that defines the transitions.
    3.  Replace the universal selector (`*`) with a more specific list of selectors targeting interactive and state-changing elements.

        ```css
        /* ---- REPLACE THIS ---- */
        * {
          transition:
            background-color var(--transition-normal) ease,
            border-color var(--transition-normal) ease,
            color var(--transition-normal) ease,
            fill var(--transition-normal) ease,
            stroke var(--transition-normal) ease,
            box-shadow var(--transition-normal) ease;
        }

        /* ---- WITH THIS ---- */
        a,
        button,
        [role='button'],
        input,
        textarea,
        select {
          transition:
            background-color var(--transition-normal) ease,
            border-color var(--transition-normal) ease,
            color var(--transition-normal) ease,
            fill var(--transition-normal) ease,
            stroke var(--transition-normal) ease,
            box-shadow var(--transition-normal) ease;
        }
        ```

- [ ] **3. Improve Maintainability by Abstracting Theme Names into Constants**

  - **Files to Modify**: `components/ui/theme/ThemeMenu.tsx`
  - **File to Create**: `lib/constants/theme.ts`
  - **Reasoning**: The `ThemeMenu.tsx` component uses hardcoded strings ('light', 'dark', 'system') to represent theme modes. This pattern, known as "magic strings," is prone to typos and makes the code harder to maintain. By abstracting these values into a shared constants file, you ensure consistency, enable type safety, and make the code self-documenting.
  - **Implementation Details**:

    1.  **Create a new file** at `lib/constants/theme.ts` with the following content:

        ```typescript
        // lib/constants/theme.ts
        export const THEME_MODES = {
          LIGHT: 'light',
          DARK: 'dark',
          SYSTEM: 'system',
        } as const;

        export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES];
        ```

    2.  **Update `components/ui/theme/ThemeMenu.tsx`** to use these new constants.

        ```typescript
        // components/ui/theme/ThemeMenu.tsx

        import React from 'react';
        import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
        import { DarkMode, LightMode, BrightnessAuto } from '@mui/icons-material';
        import { THEME_MODES, ThemeMode } from '@/lib/constants/theme'; // Import constants

        interface ThemeMenuProps {
          anchorEl: null | HTMLElement;
          open: boolean;
          onClose: () => void;
          currentTheme: string | undefined;
          onThemeChange: (theme: ThemeMode) => void; // Use ThemeMode type
        }

        export default function ThemeMenu({
          // ...props
        }: ThemeMenuProps) {
          const menuOptions = [
            { value: THEME_MODES.LIGHT, label: 'Light', icon: <LightMode fontSize="small" /> },
            { value: THEME_MODES.DARK, label: 'Dark', icon: <DarkMode fontSize="small" /> },
            { value: THEME_MODES.SYSTEM, label: 'System', icon: <BrightnessAuto fontSize="small" /> },
          ];

          // ... rest of the component remains the same
        }
        ```

    3.  **Update `components/ui/ThemeToggle.tsx`** to use the new `ThemeMode` type for better type safety.

        ```typescript
        // components/ui/ThemeToggle.tsx

        import { ThemeMode } from '@/lib/constants/theme'; // Import ThemeMode type
        //...

        const handleThemeChange = (newTheme: ThemeMode) => {
          // Use ThemeMode type here
          setTheme(newTheme);
          handleClose();
        };

        // ... rest of the component
        ```
