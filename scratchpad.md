# Project Setup Scratchpad

This document tracks progress, decisions, and issues encountered during the project setup.

### Current Phase

With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist at the top of @scratchpad.md for us to work on.

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

## Codebase AnalysisAI Prompt

I'm creating a github template with nextjs, firebase, and psql. The idea is for this to be used by AI when starting new project. The AI, if appropriate for the project, will pull from this template to get started. I've been getting AI to vibe code projects and it always takes a day or two at the start to get it to slowly set up the basics (especially auth). I want that step to be minutes instead of hours.

I'm going to paste the entire codebase below.

I want you to analyze it for best practices. This should be a simple, elegant, ready to use out of the box template, so look for anything that should be removed, enhanced, or added to get it to that perfect state.

## Caveats For AI analysis:

- Placeholders: These are intentional. Because this is a base project I plan to install a plugin that leads the user through customizing it for their uses and replacing those placeholders. Igore them for now.
- Outdated Project Documentation: It's currently outdated as it's going to get updated all at once at the end of the project. Just ignore the docs for now. The CODE-level documention should be 100% accurate, though.
- Redundant Cursor Rules: Just ignore them. They're mind to deal with.

Here is the code:

---

Make a comprehensive list of all of your suggestions to improve the codebase as a markdown checklist. Be sure to include as much detail as possible as I'll be giving it to another AI to implement.

---

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

Use this methodolgy: - Attempt to upgrade and make sure nothing broke - If it's okay, then run all tests (npm run test and npm run test:e2e). You have permission to run these commands. - If they pass, ask me to manually check the website. - THEN check it off as successful.

- NOTE: The "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:" error in Chrome is caused by a personal plugin injecting stuff into the UI and isn't a real error.
- NOTE: We're skipping 2 e2e tests on purpose. They're skipped by default keeps them from cluttering test output during normal runs but maintains them as a valuable resource. This approach aligns with the template's goal of providing a solid foundation that anticipates future needs.

### Code To Do

- [ ] add global rules for consistency. Research best practices and encode them. Cursor – Large Codebases: https://docs.cursor.com/guides/
- [ ] Refine: get gemini 2.5 to analyze each subsystem alone
- [ ] try to upgrade everything again
- [ ] Ensure the AI or the `scripts/setup.js` adequately handles providing/replacing all necessary environment variables before the first build/run attempt, particularly due to the strict validation in `lib/env.ts`.
  - Ensure the setup script (`scripts/setup.js`) correctly replaces _all_ placeholders (e.g., `{{YOUR_APP_NAME}}`, `{{YOUR_COPYRIGHT_HOLDER}}`, etc.) across all relevant files (`README.md`, `package.json`, code comments, etc.).
- [ ] Final round: search for unused vars/code/files/packages/etc.
- [ ] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be
- [ ] AI control of dev environment
  - [ ] AI needs a solid way to interact/query the UI. Modern UIs are often too complex for the AI to understand how it will end up being rendered.
  - [ ] AI needs a way to add items to the log, spin up the server, run their manual tests (or a scripted e2e test perhaps), and check the logs afterward.

## Codebase Improvement Checklist

### 1. Firebase Integration Clarification & Streamlining

- **Current:** The template name includes "firebase" and there are some Firebase-related utility files and commented-out code, but core authentication and database are NextAuth.js + PostgreSQL.
- **Goal:** Ensure the template's core functionality is clear and that any Firebase integration is presented as an optional, well-defined extension.

- **Tasks:**
  - `[x]` **Review Template Name vs. Core Stack:**
    - **Detail:** If Firebase is not a _core, out-of-the-box_ component for primary functions (auth, DB), consider if the name `next-authjs-psql-base-template` is potentially misleading. If the intent is to easily _add_ Firebase services, this should be the primary message.
    - **Action:** No direct code change, but this influences documentation and how the template is presented.
  - `[x]` **Remove Dead Firebase Auth Code from `lib/actions/auth.actions.ts`:**
    - **Detail:** This file contains commented-out Firebase Admin SDK code for user creation (`// import * as admin from 'firebase-admin';`, `// const firebaseAdminService = getFirebaseAdminService();`, etc.). The active authentication logic uses NextAuth.js with Prisma.
    - **Action:** Reviewed the file and found that the Firebase code has already been removed. The file now only contains NextAuth.js with Prisma for authentication.
    - **Benefit:** The template is already correctly focused on its primary NextAuth.js authentication mechanism.
  - `[x]` **Clarify Role of Optional Firebase Utilities:**
    - **Files:** Found only `app/api/test/firebase-config/route.ts`. The `lib/utils/firebase-errors.ts` file doesn't exist.
    - **Detail:** The Firebase config route is useful if the end-user decides to integrate Firebase services that use the Firebase Client SDK (e.g., Firestore, client-side Firebase Auth for specific providers not in NextAuth, etc.).
    - **Action Taken:** Kept the Firebase config route file but added prominent comments at the top explaining that it is for _optional Firebase service integration_ and not used by the core template's NextAuth/PostgreSQL setup. Also modified the endpoint to require an explicit environment variable `ALLOW_FIREBASE_CONFIG_ENDPOINT=true` to function, making it more secure by default.
    - **Benefit:** Prevents confusion about whether Firebase is required for the base template to function while maintaining the ability to easily add Firebase services if needed.

### 2. Component and Example Streamlining

- **Goal:** Remove redundant or purely illustrative components to create a leaner template.

- **Tasks:**
  - `[x]` **Consolidate or Remove Redundant Login Form:**
    - **Files:** `app/login/components/LoginForm.tsx` and `app/login/components/CredentialsLoginForm.tsx`.
    - **Detail:** `CombinedLoginOptions.tsx` (used by `app/login/page.tsx`) currently imports and uses the `CredentialsLoginForm.tsx` from the components/auth directory. The forms in the app/login/components directory were redundant.
    - **Action Taken:**
      1.  Verified that `app/login/components/LoginForm.tsx` was not actively used in any critical path.
      2.  Removed `app/login/components/LoginForm.tsx` as it was an alternative version using `react-hook-form` more directly.
      3.  Removed `app/login/components/CredentialsLoginForm.tsx` as it was redundant with `components/auth/CredentialsLoginForm.tsx`.
      4.  Confirmed that `app/login/page.tsx` and `components/auth/CombinedLoginOptions.tsx` correctly use the intended primary credentials form from the components/auth directory.
    - **Benefit:** Reduces code duplication and simplifies the login component structure.
  - `[x]` **Remove Purely Example Component `components/examples/CleanupExample.tsx`:**
    - **Detail:** This component demonstrates `useEffect` cleanup, which is good knowledge but not essential for a base template's core functionality.
    - **Action Taken:** Deleted the `components/examples/CleanupExample.tsx` file and its associated test file `tests/unit/components/examples/CleanupExample.test.tsx`.
    - **Benefit:** Makes the template more focused on core features rather than general React examples. Such examples are better suited for documentation or a separate example repository.

### 3. Setup and Developer Experience Enhancements

- **Goal:** Make the template easier and faster to get started with, especially for an AI.

- **Tasks:**
  - `[ ]` **Enhance `scripts/setup.js` for Environment Configuration:**
    - **Detail:** The current `setup.js` replaces placeholders in files. It should also handle `.env` setup.
    - **Action:**
      1.  Modify `scripts/setup.js` to copy `.env.example` to `.env.local` if `.env.local` does not already exist.
      2.  Add prompts (using `inquirer`) within `scripts/setup.js` to ask the user for critical environment variables:
          - `DATABASE_URL` (e.g., `postgresql://USER:PASSWORD@HOST:PORT/{{YOUR_DATABASE_NAME_DEV}}?schema=public`)
          - `NEXTAUTH_SECRET` (suggest generating one with `openssl rand -base64 32`)
          - `GOOGLE_CLIENT_ID`
          - `GOOGLE_CLIENT_SECRET`
          - Optionally, `REDIS_URL` if Redis is intended as a common setup.
      3.  The script should then populate these values into the newly created `.env.local` file.
      4.  Ensure placeholder replacement in `SETUP.md` or other docs correctly points to the new `.env.local` behavior.
    - **Benefit:** Significantly improves the "ready to use out of the box" aspect by partially automating environment setup.
  - `[ ]` **Ensure Comprehensive Placeholder Replacement in `scripts/setup.js`:**
    - **Detail:** Verify that the existing placeholder replacement logic in `scripts/setup.js` covers all intended files and all placeholder tokens (e.g., `{{YOUR_APP_NAME}}`, `{{YOUR_COPYRIGHT_HOLDER}}`, `{{YOUR_REPOSITORY_URL}}`, etc.).
    - **Files to check/add to `FILES_TO_PROCESS` in `setup.js`:** `README.md`, `package.json` (name, description, repository.url), `LICENSE` (copyright holder), `app/layout.tsx` (metadata), `app/manifest.ts`, and any other files containing these placeholders.
    - **Benefit:** Ensures the project is fully customized after running the setup script.
  - `[x]` **Secure or Document `app/api/test/firebase-config/route.ts` for Production:**
    - **Detail:** This route exposes Firebase configuration, which is useful for debugging but a security risk in production.
    - **Action Completed:**
      1.  Added a more robust check beyond just `process.env.NODE_ENV === 'production'`. Now requires a specific environment variable `ALLOW_FIREBASE_CONFIG_ENDPOINT=true` to be set for it to function, which would not be set in production.
      2.  Added prominent comments at the top of the file stating this route is for optional Firebase integration and must not be accessible in production environments.
      3.  Updated the error message to clarify that the endpoint is disabled by default.
    - **Benefit:** Enhances security out-of-the-box by making the endpoint disabled by default in all environments unless explicitly enabled.

### 4. Error Handling Integration Review

- **Goal:** Ensure specialized error handling components are correctly integrated or documented.

- **Tasks:**
  - `[ ]` **Review and Integrate Session Error Components:**
    - **Files:** `app/providers/SessionErrorDisplay.tsx`, `app/providers/SessionErrorHandler.tsx`.
    - **Detail:** These components seem designed to handle global session-related errors.
    - **Action:**
      1.  Determine if these components are intended for a specific, documented use case or if they should be part of the global error handling flow for session issues.
      2.  If global, ensure `SessionErrorHandler.tsx` (and potentially `SessionErrorDisplay.tsx` via the handler) is integrated into `app/layout.tsx` or a high-level client component within the `SessionProviderWrapper` tree, so it can effectively catch and manage session errors.
      3.  If for specific use cases, ensure clear documentation or examples are provided.
      4.  If their utility is niche for a base template, consider removing them for simplicity and document how such a pattern could be added.
    - **Benefit:** Makes error handling more robust or simplifies the template if these are too specialized for a base.

### 5. Code and Configuration Refinements

- **Goal:** Minor tweaks for better clarity and efficiency.

- **Tasks:**
  - `[ ]` **PWA Configuration (`next.config.ts`):**
    - **Detail:** The `next-pwa` configuration is commented out. `app/manifest.ts` exists for basic installability.
    - **Action:** This is a good default. Ensure documentation clearly explains:
      1.  The template provides basic PWA installability via `manifest.ts`.
      2.  For full offline support and advanced PWA features, the user needs to uncomment and configure `next-pwa` in `next.config.ts` and potentially implement a service worker.
    - **Benefit:** Clear guidance for users wanting to enhance PWA capabilities.
  - `[ ]` **Zustand Store Usage (`lib/store/userStore.ts`):**
    - **Detail:** The store is used to sync NextAuth session data for client-side access.
    - **Action:** Add a comment in `userStore.ts` or related documentation guiding the AI/user: "This store is primarily for syncing NextAuth session data. For other client-side state, consider local component state or React Context first. Use this global store for genuinely global state that doesn't fit well into the component tree."
    - **Benefit:** Promotes good state management practices.
  - `[ ]` **Review `app/page.tsx` Logic for Authenticated vs. Unauthenticated Users:**
    - **Detail:** The home page (`app/page.tsx`) currently shows `CombinedLoginOptions` if unauthenticated, and a "Welcome" section if authenticated.
    - **Action:** This logic is fine for a template. Confirm this is the desired out-of-the-box experience. Ensure the "Welcome" section for authenticated users is a good, minimal placeholder.
    - **Benefit:** Ensures the landing page provides a sensible default for both states.

### 6. Documentation (Post-Implementation)

- **Goal:** Ensure all documentation accurately reflects the refined codebase.

- **Tasks:**
  - `[ ]` **Update `project-reference.mdc`:**
    - **Detail:** This is the AI's primary context file. It needs to be accurate.
    - **Action:** After all code changes are made, review and update `project-reference.mdc` to reflect:
      - The final project structure.
      - The core authentication mechanism (NextAuth.js + Prisma) and the _optional_ nature of any Firebase services.
      - Correct component lists and their purposes.
      - Updated command references if any scripts changed.
      - Accurate environment variable list and explanations.
  - `[ ]` **Update Code-Level Comments:**
    - **Detail:** Review key files (especially those modified, like `auth.actions.ts`, `setup.js`, any Firebase utility files if kept) for comments that might be outdated or misleading after changes.
    - **Action:** Adjust comments to accurately describe the current implementation and intent. For example, clearly label Firebase utilities as "for optional Firebase service integration."
  - `[ ]` **Consolidate and Streamline General Documentation (`README.md`, `docs/` folder):**
    - **Detail:** As noted by the user, project documentation is planned for an overhaul.
    - **Action (Long-term, post-code changes):**
      - Update `README.md` to be a concise entry point.
      - Refactor the `docs/` folder. Consolidate information where possible (e.g., a single `AUTHENTICATION.md` covering NextAuth.js, Prisma Adapter, and how to add other providers).
      - Create a clear `FIREBASE_INTEGRATION.md` if Firebase utilities are kept, explaining they are for _adding services_, not for the core template functionality.
      - Ensure all setup instructions reflect the enhanced `scripts/setup.js`.
    - **Benefit:** Provides clear, accurate, and easy-to-navigate documentation for both AI and human developers.
