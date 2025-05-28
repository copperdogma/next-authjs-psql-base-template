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
  - `[x]` **Enhance Environment Configuration with Better Documentation:**
    - **Detail:** Improved the .env.example file to provide better documentation and defaults.
    - **Action Completed:**
      1. Added better default application name and description
      2. Enhanced Google OAuth setup instructions with redirect URI examples
      3. Renamed database example names to be more generic and descriptive
      4. Made logging options enabled by default
      5. Added a dedicated section for E2E testing environment settings
      6. Added a production environment section with deployment examples
      7. Improved documentation for Redis and rate limiting configuration
      8. Added connection pooling examples for production database usage
    - **Benefit:** Makes the template's environment setup clearer and provides guidance for both development and production use cases.
  - `[x]` **Enhance `scripts/setup.js` for Environment Configuration:**
    - **Detail:** The current `setup.js` replaces placeholders in files. It should also handle `.env` setup.
    - **Action Completed:**
      1. Modified `scripts/setup.js` to copy `.env.example` to `.env.local` if `.env.local` does not already exist.
      2. Added prompts (using `inquirer`) to ask the user for critical environment variables:
         - `DATABASE_URL` with smart default based on project name
         - Auto-generated `NEXTAUTH_SECRET` using crypto for security
         - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
         - Optional `REDIS_URL`
      3. Enhanced the script to apply these values to the newly created `.env.local` file.
      4. Updated completion message to guide users on next steps including database migrations.
      5. Added proper error handling for environment file creation.
    - **Benefit:** Significantly improves the "ready to use out of the box" aspect by automating environment setup with secure defaults.
  - `[x]` **Ensure Comprehensive Placeholder Replacement in `scripts/setup.js`:**
    - **Detail:** Verified the existing placeholder replacement logic in `scripts/setup.js` and added missing files containing placeholders.
    - **Action Completed:**
      1. Added LICENSE to the FILES_TO_PROCESS list to replace copyright holder
      2. Identified additional files with placeholders that need to be processed:
         - Tests directory: `tests/utils/test-constants.ts` and `tests/README-main.md`
         - Documentation: All files in `docs/testing/` directory
         - App: `app/manifest.ts` (needed placeholder replacement for app title)
      3. Used updated placeholder tokens to ensure consistent database naming
         - Added DATABASE_NAME_DEV and DATABASE_NAME_TEST placeholders
      4. Updated documentation files with appropriate project placeholders
    - **Benefit:** Ensures a more complete and consistent customization of the template for users.
  - `[x]` **Secure or Document `app/api/test/firebase-config/route.ts` for Production:**
    - **Detail:** This route exposes Firebase configuration, which is useful for debugging but a security risk in production.
    - **Action Completed:**
      1.  Added a more robust check beyond just `process.env.NODE_ENV === 'production'`. Now requires a specific environment variable `ALLOW_FIREBASE_CONFIG_ENDPOINT=true` to be set for it to function, which would not be set in production.
      2.  Added prominent comments at the top of the file stating this route is for optional Firebase integration and must not be accessible in production environments.
      3.  Updated the error message to clarify that the endpoint is disabled by default.
    - **Benefit:** Enhances security out-of-the-box by making the endpoint disabled by default in all environments unless explicitly enabled.

### Testing and Validation Plan for Setup Process

- **Goal:** Thoroughly test the template setup process to ensure it works flawlessly for both human developers and AI agents.

- **Approach:** Use a clean environment to simulate the experience of a new user cloning the repository and setting it up for the first time.

- **Steps:**

  1. **Preparation:**

     - Start a new, empty Cursor instance
     - Instruct the AI agent to clone the GitHub repository
     - The AI should follow the setup instructions documented in README.md and SETUP.md

  2. **Testing Scenarios:**

     - **Basic Setup:** Test the standard setup flow with default values
     - **Custom Setup:** Test providing custom values for all prompts
     - **Partial Setup:** Test skipping optional configurations
     - **Error Handling:** Test error cases (e.g., invalid inputs, database connection failures)
     - **Database Initialization:** Test the Prisma migration process

  3. **Validation Criteria:**

     - All placeholders are correctly replaced in all files
     - Environment files are correctly configured
     - Database connects successfully
     - Server starts without errors
     - Basic functionality works (authentication, protected routes)
     - Tests pass after setup

  4. **Documentation Validation:**

     - Check if any steps are missing from documentation
     - Verify that error messages are helpful
     - Ensure documentation covers common troubleshooting scenarios

  5. **Process Documentation:**

     - The AI agent should document each step, noting:
       - What worked as expected
       - What didn't work or was confusing
       - Missing instructions or information
       - Suggestions for improvements
       - Time taken for each major step

  6. **Iterative Improvement:**
     - Review the AI's notes and make necessary adjustments
     - Update documentation, scripts, or code as needed
     - Repeat the process until the setup works flawlessly

- **Expected Deliverables:**

  1. A comprehensive test report documenting the setup experience
  2. A list of identified issues and their fixes
  3. Improved documentation based on testing feedback
  4. Any additional setup script enhancements needed

- **Benefits:**
  - Validates the template from a true first-time user perspective
  - Identifies gaps in documentation or automation
  - Ensures the template is truly "ready to use out of the box"
  - Tests the template's usability by AI agents specifically

This structured testing approach will help ensure the template provides a smooth, error-free experience for all users, whether they're human developers or AI agents working on behalf of users.

### 4. Error Handling Integration Review

- **Goal:** Ensure specialized error handling components are correctly integrated or documented.

- **Tasks:**
  - `[x]` **Review and Integrate Session Error Components:**
    - **Files:** `app/providers/SessionErrorDisplay.tsx`, `app/providers/SessionErrorHandler.tsx`.
    - **Detail:** These components seem designed to handle global session-related errors.
    - **Action:**
      1. Determined that these components were intended for global session error handling but were not properly integrated in the application.
      2. Integrated `SessionErrorHandler.tsx` and `SessionErrorDisplay.tsx` into the `SessionProviderWrapper` component to effectively catch and manage session errors.
      3. Added proper state management for session errors in `SessionProviderWrapper`.
      4. Added comprehensive JSDoc comments to document the purpose and usage of both components.
      5. Created a unit test (`tests/unit/components/auth/SessionErrorHandling.test.tsx`) to verify the integration works correctly.
    - **Benefit:** Improved error handling for session-related issues, providing a better user experience when auth problems occur, and making the error handling pattern clearer for developers using the template.

### 5. Code and Configuration Refinements

- **Goal:** Minor tweaks for better clarity and efficiency.

- **Tasks:**
  - `[x]` **PWA Configuration (`next.config.ts`):**
    - **Detail:** The `next-pwa` configuration is commented out. `app/manifest.ts` exists for basic installability.
    - **Action:** Added comprehensive documentation to the `next.config.ts` file that:
      1. Explains the current basic PWA installability via `manifest.ts`.
      2. Provides clear instructions for enabling full offline support and advanced PWA features.
      3. References the `docs/pwa-testing.md` file for testing guidelines.
      4. Includes a ready-to-uncomment configuration template for `next-pwa`.
    - **Benefit:** Clear guidance for users wanting to enhance PWA capabilities without cluttering the default setup.
  - `[x]` **Zustand Store Usage (`lib/store/userStore.ts`):**
    - **Detail:** The store is used to sync NextAuth session data for client-side access.
    - **Action:** Added comprehensive comments at the top of `userStore.ts` that:
      1. Clarify the store's primary purpose for syncing NextAuth session data.
      2. Provide guidelines on when to use this global store versus alternatives.
      3. Recommend local component state, React Context, URL state, or form libraries for non-global state.
      4. Explain the types of properties that are appropriate to add to this store.
    - **Benefit:** Promotes good state management practices and prevents overuse of global state.
  - `[x]` **Review `app/page.tsx` Logic for Authenticated vs. Unauthenticated Users:**
    - **Detail:** The home page (`app/page.tsx`) currently shows `CombinedLoginOptions` if unauthenticated, and a "Welcome" section if authenticated.
    - **Action:** Enhanced the authenticated home page experience by:
      1. Improving the welcome section with personalized messaging.
      2. Creating a more visually appealing dashboard layout with quick links.
      3. Adding instructive comments for customizing the components.
      4. Reorganizing the UI elements for better user experience.
    - **Benefit:** Provides a more polished and professional default authenticated experience while maintaining customizability.

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
  - `[ ]` **Consolidate and Streamline General Documentation (`README.md`, `SETUP.md`):**
    - **Detail:** Documentation may be inconsistent or outdated.
    - **Action:** After all implementation changes, ensure that:
      1.  `README.md` clearly states the core stack (NextAuth.js + PostgreSQL)
      2.  The optional nature of Firebase is clearly communicated
      3.  Setup instructions are accurate and complete
      4.  Examples and snippets reflect the final code structure
    - **Benefit:** Makes template onboarding clear and accurate.
