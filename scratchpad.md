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

- [ ] **State Management & Client-Side Logic** (Files: `app/providers/`, custom hooks, context providers)

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
  - [x] **Database Interaction & Schema** (Files: `lib/prisma.ts`, `prisma/` schema, Prisma-interacting services)
    - [x] **Refactor `getUserSessionCountsByDay` for Proper Parameterization**: Updated the method to correctly pass parameters from `buildDateUserWhereClause` to the `$queryRaw` call, preventing SQL injection vulnerabilities.
    - [x] **Refactor `buildSessionExpirationWhereClause` for Secure Parameterization**: Modified the method to return a parameterized where clause with an array of parameter values, supporting the ANY operator for proper array handling.
    - [x] **Refactor `extendSessionExpirations` for Secure Date Handling**: Updated to use parameterized queries for user IDs and dates, with proper interval handling.
    - [x] **Refactor `buildActivityWhereClause` for Parameterization**: Updated to use placeholders for date filtering with parameter values.
    - [x] **Refactor `executeActivitySummaryQuery` and `getUserActivitySummary` for Full Parameterization**: Modified to properly parameterize all user inputs (since date, minSessionCount, limit) using placeholder syntax.
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

You got it. I've double-checked the analysis of the **Database Interaction & Schema** subsystem.

My previous assessment holds: the Prisma client setup, schema design, and ORM-based services are well-structured and adhere to best practices for a template project. The primary area for actionable improvement lies within `lib/services/raw-query-service.ts` specifically concerning SQL parameterization in its methods. The generic `executeRawQuery` method within this service is correctly structured to use parameters, but the other specific methods in the same service that construct and execute their own raw queries need to be updated to consistently use proper parameterization techniques provided by Prisma.

Here is a comprehensive list of suggestions to enhance this subsystem:

---

Okay, I've double-checked the suggestions. The core state management and client-side logic using providers, Zustand for global user state, and custom hooks for encapsulated logic is generally sound and follows good practices for a template.

The initial suggestion regarding the redirect delay in `useRegistrationForm.ts` is context-dependent. Given that `app/register/components/RegistrationForm.tsx` _does_ have an `<Alert>` to display success messages, the 300ms delay in `useSuccessRedirectEffect` is reasonable to allow this message to be briefly visible. Thus, I'm removing this as a required change.

The other suggestions remain valid.

Here is a comprehensive list of suggestions to improve the "State Management & Client-Side Logic" subsystem, formatted as a markdown checklist:

---

## Checklist for State Management & Client-Side Logic Enhancements

### [x] 1. Memoize Logger Instance in `UserStoreSync`

- **File**: `app/providers/SessionProviderWrapper.tsx`
- **Component**: `UserStoreSync` (within `SessionProviderWrapper`)
- **Current Situation**: The `log` instance is created using `logger.child({ component: 'UserStoreSync' })` directly within the component function body. This `log` instance is then used as a dependency in the `useEffect` hook.

  ```typescript
  // Inside UserStoreSync component
  const log = logger.child({ component: 'UserStoreSync' });

  useEffect(() => {
    // ... logic using log ...
  }, [session, status, setUserDetails, clearUserDetails, log]);
  ```

- **Issue**: `logger.child()` typically returns a new object instance on each call. If `UserStoreSync` were to re-render for reasons unrelated to `session` or `status` changes, a new `log` instance would be created, potentially causing the `useEffect` hook to re-run unnecessarily due to a changed dependency reference (even if the logger's functionality is the same).
- **Suggestion**: Memoize the `log` instance using `React.useMemo` to ensure its reference stability across re-renders of `UserStoreSync` unless its own dependencies change (which are none in this case).
- **Implementation Detail**:

  ```typescript
  import React, { ReactNode, useEffect, useState, useMemo } from 'react'; // Add useMemo
  // ... other imports

  const UserStoreSync = () => {
    const { data: session, status } = useSession();
    const setUserDetails = useUserStore(state => state.setUserDetails);
    const clearUserDetails = useUserStore(state => state.clearUserDetails);
    // Memoize the logger instance
    const log = useMemo(() => logger.child({ component: 'UserStoreSync' }), []); // Empty dependency array means it's created once

    useEffect(() => {
      if (status === 'authenticated' && session?.user) {
        log.info('Syncing authenticated session to Zustand store', {
          // Use the memoized log instance
          userId: session.user.id,
        });
        setUserDetails({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        });
      } else if (status === 'unauthenticated') {
        log.info('Clearing Zustand store due to unauthenticated session'); // Use the memoized log instance
        clearUserDetails();
      }
    }, [session, status, setUserDetails, clearUserDetails, log]); // log is now a stable dependency

    return null;
  };
  ```

- **Benefit**: Minor performance optimization and stricter adherence to React hook dependency rules.

### [x] 2. Add Comprehensive JSDoc to `useRegistrationForm` Hook

- **File**: `app/register/hooks/useRegistrationForm.ts`
- **Current Situation**: The hook `useRegistrationForm` lacks a top-level JSDoc block explaining its overall purpose, how to use it, its parameters (if any were to be added, though currently it takes none), and the shape/meaning of its return value (`form`, `onSubmit`, `isPending`, `error`, `success`).
- **Suggestion**: Add a detailed JSDoc comment at the beginning of the `useRegistrationForm` hook definition.
- **Implementation Detail**:
  ```typescript
  /**
   * @file Manages the state and logic for the user registration form.
   *
   * This hook encapsulates:
   * - Form state management using `react-hook-form`.
   * - Client-side validation using a Zod schema (`formSchema`).
   * - Submission handling that calls the `registerUserAction` server action.
   * - Tracking of submission pending state (`isPending`).
   * - Storing and exposing success or error messages from the server action.
   * - Effect for handling post-registration session updates and redirection.
   *
   * @returns {object} An object containing:
   *  - `form`: The `react-hook-form` instance (includes `register`, `handleSubmit`, `formState`, etc.).
   *  - `onSubmit`: The function to be passed to the form's `onSubmit` handler. It takes validated form data.
   *  - `isPending`: A boolean indicating if the form submission is currently in progress.
   *  - `error`: A string containing an error message if the registration failed, otherwise null.
   *  - `success`: A string containing a success message if registration was successful, otherwise null.
   */
  export function useRegistrationForm() {
    // ... existing hook code ...
  }
  ```
- **Benefit**: Improved code clarity, maintainability, and easier understanding for developers (and AI agents) using or modifying the hook.

### [x] 3. Add Comprehensive JSDoc to `useProfileDetails` Hook

- **File**: `app/profile/components/ProfileDetailsSection.tsx` (where `useProfileDetails` is defined)
- **Current Situation**: The custom hook `useProfileDetails` (defined within `ProfileDetailsSection.tsx`) lacks a JSDoc block detailing its purpose, parameters, and return values.
- **Suggestion**: Add a detailed JSDoc comment at the beginning of the `useProfileDetails` hook definition.
- **Implementation Detail**:

  ```typescript
  // Inside app/profile/components/ProfileDetailsSection.tsx

  /**
   * Custom hook to manage the logic for editing and displaying profile details,
   * specifically for updating the user's name.
   *
   * It handles:
   * - Local state for edit mode (`isEditingName`).
   * - Interaction with the `updateUserName` server action using `useActionState`.
   * - Displaying success/error messages via toast notifications.
   * - Syncing updated user details back to the global Zustand `userStore`.
   *
   * @param {string | null} currentName - The current name of the user, typically from the Zustand store.
   * @param {(details: Partial<User>) => void} setUserDetails - The Zustand store action to update user details.
   * @returns {object} An object containing:
   *  - `isEditingName`: Boolean state indicating if the name field is in edit mode.
   *  - `setIsEditingName`: Function to toggle the `isEditingName` state.
   *  - `state`: The state returned by `useActionState` from the `updateUserName` server action (contains `message`, `success`, `updatedName`).
   *  - `handleFormSubmit`: A memoized function to wrap the `formAction` from `useActionState`, ensuring `storeUpdateAttemptedRef` is reset.
   *  - `effectiveUserName`: The current name to be displayed, derived from the `currentName` prop.
   *  - `formAction`: The action function returned by `useActionState` to be passed to the form.
   */
  const useProfileDetails = (
    currentName: string | null,
    setUserDetails: (details: Partial<User>) => void // User type might need import or adjustment based on actual User type
  ) => {
    // ... existing hook code ...
  };
  ```

- **Benefit**: Enhanced readability and maintainability of the profile editing logic. Makes it easier for others (including AI) to understand and safely extend this part of the application.

---
