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
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `{{YOUR_APP_NAME}}`, `{{YOUR_COPYRIGHT_HOLDER}}`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [x] Final round: search for unused vars/code/files/packages/etc.
- [x] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be

Okay, here's a comprehensive markdown checklist of suggestions to improve the authentication subsystem of your Next.js template. These are based on the analysis provided previously, focusing on making the template simple, elegant, and ready-to-use out-of-the-box while adhering to best practices.

---

## Checklist for Improving Application Pages and Layouts

### I. Root Layout (`app/layout.tsx`)

- [x] **Enhance Accessibility by Integrating SkipToContent:**

  - **File:** `app/layout.tsx`
  - **Current State:** The `components/layouts/SkipToContent.tsx` component exists but is not utilized in the root layout.
  - **Suggestion:** Import and add the `<SkipToContent />` component as one ofthe first focusable elements within the `<body>` tag. This improves keyboard navigation for users who want to bypass header navigation and jump directly to the main content.
  - **Implementation Detail:**

    ```tsx
    // app/layout.tsx
    import { SkipToContent } from '@/components/layouts/SkipToContent';
    // ... other imports

    export default async function RootLayout({ children }: { children: React.ReactNode }) {
      // ...
      return (
        <html lang="en" suppressHydrationWarning>
          <head></head>
          <body className={roboto.className}>
            <SkipToContent />
            <SessionProviderWrapper session={session}>
              {/* ... rest of the providers */}
            </SessionProviderWrapper>
          </body>
        </html>
      );
    }
    ```

### II. Homepage (`app/page.tsx`)

- [x] **Remove Unused Homepage Components:**
  - **Directory:** `app/components/home/`
  - **Current State:** The `app/page.tsx` file defines its primary content sections (`WelcomeSection`, `FeaturesSection`) inline and uses `CombinedLoginOptions` from `components/auth/`. The components within `app/components/home/` (e.g., `AuthButtons.tsx`, its own `FeatureCard.tsx`, `FeaturesSection.tsx`, `WelcomeSection.tsx`, and `AuthFallback.tsx`) do not appear to be imported or used by the current `app/page.tsx`.
  - **Suggestion:** Delete the entire `app/components/home/` directory and its contents to simplify the template, reduce codebase size, and prevent confusion for developers (AI or human) using the template.
  - **Action:** Remove the directory `app/components/home/`.

### III. Dashboard Pages (`app/dashboard/`)

- [x] **Remove Unused Dashboard Components:**
  - **Directory:** `app/dashboard/components/`
  - **Current State:** The `app/dashboard/page.tsx` file defines its content sections (`OverviewSection`, `RecentActivitySection`, `QuickActionsSection`) inline. The components within `app/dashboard/components/` (e.g., `DashboardContent.tsx`, `DashboardSections.tsx`, `ActivitySectionSkeleton.tsx`, `DashboardCardSkeleton.tsx`, `ErrorState.tsx`, `LoadingState.tsx`, `NoSessionState.tsx`, etc.) are not currently imported or used by `app/dashboard/page.tsx`. The `app/dashboard/loading.tsx` already provides a good example of a loading state for the dashboard.
  - **Suggestion:** Delete the `app/dashboard/components/` directory and its contents. This will streamline the dashboard feature, making it clearer that the primary content is defined in `app/dashboard/page.tsx` and loading/error states are handled by their respective special Next.js files.
  - **Action:** Removed the directory `app/dashboard/components/`.

### IV. Profile Page Logic (`app/profile/actions.ts`)

- [ ] **Correct Auth Import for Server Actions:**
  - **File:** `app/profile/actions.ts`
  - **Current State:** The `updateUserName` server action imports `auth` from `'@/lib/auth-edge'`.
  - **Best Practice:** Server Actions run in the Node.js runtime. The `auth-edge.ts` configuration is intended for Edge runtime contexts (like middleware). The main `lib/auth.ts` exports the Node.js-configured `auth` instance from `lib/auth-node.ts`.
  - **Suggestion:** Change the import in `app/profile/actions.ts` to use the main `auth` export.
  - **Implementation Detail:**
    ```diff
    // app/profile/actions.ts
    - import { auth } from '@/lib/auth-edge'; // Use edge-compatible auth
    + import { auth } from '@/lib/auth'; // Use main auth (Node.js runtime for actions)
    ```

### V. Layout Components (`components/layouts/`)

- [ ] **Integrate Mobile-Specific Navigation in Header:**

  - **Files:** `components/layouts/Header.tsx`, `components/layouts/MobileNavigation.tsx`, `components/layouts/MobileDrawerContent.tsx`, `components/layouts/NavItems.tsx`
  - **Current State:** `Header.tsx` renders navigation items directly as buttons but does not use the dedicated mobile navigation components (`MobileNavigation.tsx`, `MobileDrawerContent.tsx`).
  - **Suggestion:** Enhance `Header.tsx` to include the `MobileNavigation` component. This component, along with `MobileDrawerContent` and `NavItems` (specifically `MobileNavItem` and the `useNavigation` hook), will provide a standard hamburger menu and drawer for mobile views. The `navItems` array currently defined in `Header.tsx` should be passed as a prop to `MobileNavigation`.
  - **Action:**
    1.  Modify `Header.tsx` to import and render `MobileNavigation`, passing the `navItems` array to it.
    2.  The `MobileNavigation` component will handle its own state for opening/closing the drawer and will use `MobileDrawerContent` (which in turn uses `MobileNavItem`) to render the links.
    3.  Ensure the hamburger icon for `MobileNavigation` is displayed appropriately on smaller screens, and the direct button links in `Header.tsx` are hidden (or replaced by `DesktopNavigation` if chosen). `Header.tsx`'s current direct rendering of nav buttons can serve as the desktop navigation, or it can be refactored to use `DesktopNavigation.tsx`.

- [ ] **Consolidate or Remove `DesktopNavigation.tsx`:**

  - **Files:** `components/layouts/Header.tsx`, `components/layouts/DesktopNavigation.tsx`
  - **Current State:** `DesktopNavigation.tsx` exists but is not used by `Header.tsx`. `Header.tsx` currently renders desktop navigation links directly.
  - **Suggestion:**
    - **Option A (Preferred for consistency if MobileNavigation is added):** Integrate `DesktopNavigation.tsx` into `Header.tsx` for desktop views. It should use the same `navItems` prop and `useNavigation` hook as `MobileNavigation` for consistency.
    - **Option B (Simpler if current Header.tsx buttons are deemed sufficient):** If the direct rendering of `Button` components in `Header.tsx` is considered adequate for desktop navigation and a separate `DesktopNavigation.tsx` component adds unnecessary complexity for this template's goals, then `DesktopNavigation.tsx` (and potentially the `DesktopNavItem` export from `NavItems.tsx` if only used there) could be removed.
  - **Action:** Choose Option A or B. If A, refactor `Header.tsx`. If B, delete `DesktopNavigation.tsx`.

- [ ] **Remove Unused `MainContent.tsx` Component:**
  - **File:** `components/layouts/MainContent.tsx`
  - **Current State:** `MainContent.tsx` defines a `Box` with `component="main"`. However, `PageLayout.tsx` (used by most pages) also defines its own `Box component="main"`. The root layout uses `BaseLayout.tsx`, which uses an MUI `Container`. It appears `components/layouts/MainContent.tsx` is redundant.
  - **Suggestion:** Remove the `components/layouts/MainContent.tsx` file as its functionality is covered by `PageLayout.tsx`.
  - **Action:** Delete `components/layouts/MainContent.tsx`.

### VI. Global Styles (`app/globals.css`)

- [ ] **Review and Potentially Remove Redundant `:root` CSS Variables for Theming:**
  - **File:** `app/globals.css`
  - **Current State:** Contains CSS variables like `--background` and `--foreground` for light/dark modes. The project also uses `next-themes` and MUI's `ThemeRegistry` with `CssBaseline`, which should comprehensively handle background and text colors based on the MUI theme.
  - **Suggestion:** Verify if these custom `:root` CSS variables are actively used by any components that are _not_ styled by MUI or if they are essential for any global styling that MUI's `CssBaseline` and theme provider do not cover. If all theming (especially background and foreground colors) is effectively managed by the MUI theme and `next-themes` (which classes the `html` element), these custom CSS variables might be redundant and could be removed to simplify the theming strategy, relying solely on the MUI theme as the single source of truth for colors.
  - **Action:** Investigate usage. If unused or fully covered by MUI's theme, remove the `:root` variable definitions for `--background` and `--foreground` (and their dark mode counterparts) from `globals.css`. The `html.light, body.light` and `html.dark, body.dark` rules might still be useful for `color-scheme` and initial defaults before MUI hydration, but the CSS variables themselves might not be needed.

### VII. Offline Page (`app/offline.tsx`)

- [ ] **Restyle Offline Page with Material UI for Consistency:**

  - **File:** `app/offline.tsx`
  - **Current State:** The page uses Tailwind-like utility classes (e.g., `flex`, `text-4xl`, `bg-blue-600`) for styling. The project primarily uses Material UI, and Tailwind CSS is not listed as a dependency or set up globally.
  - **Suggestion:** Rewrite the styling of `app/offline.tsx` to use Material UI components (e.g., `Box` for layout, `Typography` for text, `Button` for the action) and MUI's `sx` prop or `styled()` API. This will ensure visual consistency with the rest of the application.
  - **Action:** Refactor `app/offline.tsx` to use MUI components for its layout and styling.

    - Example structure:

      ```tsx
      // app/offline.tsx
      import { Box, Button, Typography, Container } from '@mui/material';

      export default function Offline() {
        return (
          <Container
            component="main"
            maxWidth="xs"
            sx={
              {
                /* center content styles */
              }
            }
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                py: 8,
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                You are offline
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Please check your internet connection and try again.
              </Typography>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </Box>
          </Container>
        );
      }
      ```

---
