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
- Outdated Project Documentation: It's currently outdated as it's going to get updated all at once at the end of the project. Just ignore the docs for now. The CODE-level documention should be 100% accurate, though.
- Redundant Cursor Rules: Just ignore them. They're mind to deal with.
- We have strict eslinting rules for code complexity/length/etc. So don't suggest anything that would violate those rules.

For this round, the subsystem I want you to analyze is:

- [ ] **Application Pages and Layouts** (Files: `app/` (excluding `api/`), `app/layout.tsx`, `app/page.tsx`, `app/dashboard/`, `app/login/`, `app/register/`, `app/profile/`, `app/about/`, `components/layouts/`)

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
  - [ ] **Application Pages and Layouts** (Files: `app/` (excluding `api/`), `app/layout.tsx`, `app/page.tsx`, `app/dashboard/`, `app/login/`, `app/register/`, `app/profile/`, `app/about/`, `components/layouts/`)
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

## Markdown Checklist for Application Pages and Layouts Improvements

### I. Styling & Component Consistency

- **[x] `app/profile/loading.tsx`: Standardize Skeleton Component**

  - **Current:** Uses Tailwind CSS classes for skeleton UI (`animate-pulse`, `bg-accent`).
  - **Suggestion:** Refactor `app/profile/loading.tsx` to use Material UI `Skeleton` components.
  - **Reasoning:** To maintain visual consistency with `app/dashboard/loading.tsx` and the overall MUI theming. This ensures all loading placeholders share the same design language and respond to theme changes uniformly.
  - **Details:**
    - Replace `div` elements with Tailwind classes with appropriate MUI `Skeleton` variants (e.g., `Skeleton variant="text"`, `Skeleton variant="circular"`, `Skeleton variant="rectangular"`).
    - Structure the MUI Skeletons to visually represent the `ProfileContent` layout (e.g., avatar, name, email, user ID sections).
    - Ensure it's wrapped in a layout that provides appropriate page padding if `PageLayout` isn't used directly in the loading component. (Currently, `ProfileLoading` does not use `PageLayout`, but `app/profile/page.tsx` wraps `ProfileContent` in `PageLayout` with Suspense. The loading component should ideally fit well within that `PageLayout` context).

- **[x] `app/dashboard/not-found.tsx`: Standardize Styling**

  - **Current:** Uses Tailwind CSS classes for styling.
  - **Suggestion:** Refactor `app/dashboard/not-found.tsx` to use Material UI components (e.g., `Container`, `Paper`, `Typography`, `Button`, `ReportProblemOutlined` icon) for its structure and styling.
  - **Reasoning:** To align with `app/not-found.tsx` (global 404) and ensure consistent theming and appearance for "not found" states.
  - **Details:**
    - Use MUI `Container` for centering and `Paper` for the main content box.
    - Employ `Typography` for text and `Button` components for links (e.g., back to Dashboard, back to Home).
    - Utilize an appropriate MUI icon like `ReportProblemOutlined` or `ErrorOutline`.

- **[x] `app/profile/layout.tsx`: Standardize Background Styling**
  - **Current:** Uses Tailwind class `bg-background` for the main div.
  - **Suggestion:** Replace the Tailwind class with an MUI `Box` component using the `sx` prop to set the background color from the theme. For example: `sx={{ bgcolor: 'background.default', minHeight: '100vh' }}`.
  - **Reasoning:** Ensures the background color is strictly governed by the MUI theme, enhancing consistency with other MUI-styled page backgrounds. While `bg-background` likely maps to a theme variable, direct MUI usage is more explicit.

### II. Authenticated Home Page (`app/page.tsx`) Strategy

- **[x] Option A (Recommended for Simplicity): Redirect authenticated users from `/` to `/dashboard`**

  - **Current:** Authenticated users see a unique dashboard-like interface on the root path (`/`).
  - **Implemented:** Modified both `app/page.tsx` and `lib/auth-edge.ts` to redirect authenticated users from the root path (`/`) to `/dashboard`.
  - **Implementation Details:**
    - Used a combined approach for robustness:
      1. Server-side middleware redirect in `lib/auth-edge.ts` that handles the redirect at the edge
      2. Client-side fallback in `app/page.tsx` that redirects via React hooks if middleware doesn't catch it
    - Removed the dashboard-like components from the homepage since they're no longer needed
    - All tests pass after the implementation

### III. Metadata Completeness

- **[x] `app/about/page.tsx`: Add Page-Specific Metadata**

  - **Current:** Does not explicitly define its own metadata.
  - **Implemented:** Created a layout file `app/about/layout.tsx` with metadata for the About page.
  - **Details:**

    ```tsx
    // app/about/layout.tsx
    import { Metadata } from 'next';

    export const metadata: Metadata = {
      title: 'About Us | Next Auth App',
      description: 'Learn more about next-auth-psql-app and its mission.',
    };
    ```

- **[x] `app/login/page.tsx`: Add Page-Specific Metadata**

  - **Current:** Does not explicitly define its own metadata.
  - **Implemented:** Created a layout file `app/login/layout.tsx` with metadata for the Login page.
  - **Details:**

    ```tsx
    // app/login/layout.tsx
    import { Metadata } from 'next';

    export const metadata: Metadata = {
      title: 'Login | Next Auth App',
      description: 'Sign in to access your account.',
    };
    ```

- **[x] `app/register/page.tsx`: Add Page-Specific Metadata**

  - **Current:** Does not explicitly define its own metadata.
  - **Implemented:** Created a layout file `app/register/layout.tsx` with metadata for the Registration page.
  - **Details:**

    ```tsx
    // app/register/layout.tsx
    import { Metadata } from 'next';

    export const metadata: Metadata = {
      title: 'Register | Next Auth App',
      description: 'Create a new account to get started.',
    };
    ```

- **[x] `app/profile/layout.tsx`: Enhance Metadata**
  - **Current:** Defines `title: 'Profile | Next.js Template'`.
  - **Implemented:** Updated the metadata to be more specific and use the app title placeholder.
  - **Details:**
    ```tsx
    // app/profile/layout.tsx
    export const metadata: Metadata = {
      title: 'Your Profile | Next Auth App',
      description: 'View and manage your user profile details and settings.',
    };
    ```

### IV. Accessibility Enhancements

- **[x] Visually Hidden H1 in `app/layout.tsx`**
  - **Current:** A visually hidden H1 for the app name is present in `app/layout.tsx` but is outside the `<body>` in the provided snippet.
  - **Suggestion:** Ensure the visually hidden H1 (if kept for screen reader context) is placed _within_ the `<body>` tag, ideally at the beginning of the `main` content or as a general site title if `Header` doesn't provide an `h1`. However, `PageLayout` already includes an `h1` via `PageHeader`. A global, visually hidden `h1` in `RootLayout` might be redundant or conflict if every page already has a visible `h1` via `PageHeader`.
  - **Action:** Review the necessity of the visually hidden H1 in `RootLayout`. If `PageHeader` consistently provides the primary `h1` for each page, the global one might be removable to avoid confusion or ensure it's truly for overall site context and not page-specific.
  - **Correction from previous thoughts:** The `Header` component has `<Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mr: 2 }}>{YOUR_APP_NAME}</Typography>`. This is an `h6` acting as a site title/logo text. `PageLayout` correctly uses `PageHeader` which renders an `h1`. The visually hidden `h1` in `RootLayout` might be intended as the _overall site_ `h1` for screen readers if the visible site title in the header is not an `h1`. If this is the case, it should be inside `<body>`.
  - **Final Check:** The `<h1>` is inside `<body>` in the full `RootLayout` code. The question is its semantic utility given `PageHeader` usually provides the main page `H1`. For a template, it's often clearer if the main visible heading of a page is its primary `h1`. If the visually hidden H1 is intended as an overarching site title for accessibility before page-specific H1s, that's a valid pattern, but ensure it's semantically appropriate.
    - **Proposed Action:** No change needed to code directly for this, but document its purpose or ensure that if AI modifies the header structure, it considers the main page `H1` implications. For the template, it's okay as is, assuming `PageHeader` is consistently used.

By addressing these points, the Application Pages and Layouts subsystem will be more consistent, potentially simpler, and even more aligned with best practices for a starter template.
