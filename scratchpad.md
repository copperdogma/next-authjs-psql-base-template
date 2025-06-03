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
    - [x] **Standardize Styling in Error Pages to MUI**: Refactored `app/dashboard/error.tsx` and `app/profile/error.tsx` to use MUI components for layout and styling instead of Tailwind CSS classes, ensuring consistency with the rest of the application.
    - [x] **Simplify `useRouter` Hook Usage in `app/page.tsx`**: Replaced the complex `useCallback` approach with direct import and usage of the `useRouter` hook from 'next/navigation', making the code more straightforward and maintainable.
    - [x] **Adjust `tabIndex` on Page Title in `PageHeader.tsx`**
    - [x] **Make Site Title in Header a Link to Homepage**
    - [x] **Conditionally Render "Debug Log Out" Button**
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

## Application Pages and Layouts Enhancement Checklist

### [x] 1. Standardize Styling in Error Pages to MUI

- **Affected Files**:
  - `app/dashboard/error.tsx`
  - `app/profile/error.tsx`
- **Current State**: These files use Tailwind CSS classes for styling (e.g., `className="container mx-auto..."`, `className="bg-blue-500..."`).
- **Problem**: Inconsistency with the rest of the application, which primarily uses Material-UI (MUI) for styling (e.g., `app/error.tsx`, `app/not-found.tsx`, layouts, and UI components).
- **Best Practice**: Maintain a consistent styling library and approach across the application for better maintainability, a cohesive look and feel, and easier theming.
- **Task**:
  - Refactor `app/dashboard/error.tsx` and `app/profile/error.tsx` to use MUI components for layout and styling.
  - Replace Tailwind classes with equivalent MUI components and `sx` prop styling.
  - **Example (for `app/dashboard/error.tsx`)**:
    - Instead of `<div className="container mx-auto p-6 text-center">`, use `<Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>`.
    - Instead of `<h2 className="text-2xl font-bold text-red-600 mb-4">`, use `<Typography variant="h4" component="h2" color="error.main" gutterBottom sx={{ fontWeight: 'bold' }}>`.
    - Instead of `<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">`, use `<Button variant="contained" color="primary">`.
    - Ensure error messages and action buttons are styled consistently with other MUI-based error pages like `app/error.tsx`.
  - Remove any unused Tailwind class imports or setup if these files are the only ones using them in this context.

### [x] 2. Simplify `useRouter` Hook Usage in `app/page.tsx`

- **Affected File**: `app/page.tsx`
- **Current State**: The `useRouter` hook is initialized using `React.useCallback(async () => { const { useRouter } = await import('next/navigation'); return useRouter(); }, [])` and then called as `router().then(...)`.
- **Problem**: This is an overly complex way to get the router instance for a standard client component hook.
- **Best Practice**: Use the standard import and hook invocation for `useRouter` from `next/navigation` in client components.
- **Task**:
  - Modify `app/page.tsx`:
    1.  Add `import { useRouter } from 'next/navigation';` at the top of the file.
    2.  Inside the `HomePage` component, change the router initialization to: `const router = useRouter();`.
    3.  Update the `useEffect` hook to use the router instance directly:
        ```typescript
        React.useEffect(() => {
          if (status === 'authenticated') {
            router.push('/dashboard'); // No need for .then() if router is obtained directly
          }
        }, [status, router]);
        ```
    4.  Remove the `React.useCallback` for `router`.

### [x] 3. Adjust `tabIndex` on Page Title in `PageHeader.tsx`

- **Affected File**: `components/layouts/PageHeader.tsx`
- **Current State**: The `<h1>` tag (with `id="page-title"`) has `tabIndex={0}`.
- **Problem**: `tabIndex={0}` makes a non-interactive element (the page title heading) a part of the keyboard navigation sequence, which is generally not standard or expected behavior.
- **Best Practice**:
  - Static headings should typically not be in the tab order.
  - If programmatic focus is desired (e.g., for a "skip to content" link to focus the main heading of the new page section for screen reader announcements), `tabIndex={-1}` should be used. This makes the element focusable via script but not via keyboard tabbing.
  - If no programmatic focus is intended, the `tabIndex` attribute should be removed entirely.
- **Task**:
  - Evaluate if programmatic focus on the `<h1>` is a required feature (e.g., for skip links).
  - If programmatic focus _is_ needed: Change `tabIndex={0}` to `tabIndex={-1}`.
  - If programmatic focus is _not_ needed: Remove the `tabIndex={0}` attribute from the `Typography` component that renders the `<h1>`.

### [x] 4. Make Site Title in Header a Link to Homepage

- **Affected File**: `components/layouts/Header.tsx`
- **Current State**: The site title `"{'{YOUR_APP_NAME}'}"` is a `Typography` component but not a link.
- **Problem**: Users expect the site title/logo in the header to navigate to the homepage.
- **Best Practice**: The main site identifier in the header should link to the root of the application (`/`).
- **Task**:
  - Import `Link` from `next/link`.
  - Wrap the `Typography` component for the site title with `<Link href="/" passHref legacyBehavior={false}>`.
  - Ensure the link inherits or has appropriate styling to look like a brand link (e.g., `textDecoration: 'none', color: 'inherit'`). Example:
    ```typescript
    import Link from 'next/link';
    // ...
    <Link href="/" passHref legacyBehavior={false} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mr: 2, '&:hover': { opacity: 0.8 } /* Optional hover effect */ }}>
        {'{YOUR_APP_NAME}'}
      </Typography>
    </Link>
    ```

### [x] 5. Conditionally Render "Debug Log Out" Button

- **Affected File**: `app/about/page.tsx`
- **Current State**: The "Debug Log Out" button is always rendered.
- **Problem**: Exposes debugging functionality in a production environment.
- **Best Practice**: Debug features should only be available during development.
- **Task**:
  - Wrap the "Debug Log Out" button (`Grid` item or the `Button` itself) in a conditional rendering block based on the environment.
  - Use `process.env.NODE_ENV === 'development'` to control its visibility.
  - **Example**:
    ```typescript
    {process.env.NODE_ENV === 'development' && (
      <Grid item xs={12} sm={4}> {/* Or adjust Grid item based on removal */}
        <Button variant="outlined" color="warning" fullWidth onClick={handleLogout}>
          Debug Log Out
        </Button>
      </Grid>
    )}
    ```
  - Consider if the `CardHeader` for "Quick Actions" should also be conditionally rendered if this is the only action and it becomes hidden in production. For a template, it might be fine to leave the CardHeader and an empty CardContent if no actions are available.
