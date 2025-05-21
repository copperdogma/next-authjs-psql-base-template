# Project Setup Scratchpad

This document tracks progress, decisions, and issues encountered during the project setup.

### Current Phase

## Dependencies Needing Best Practices Review

With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist at the top of @scratchpad.md for us to work on.

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

I'm creating a github template with nextjs, firebase, and psql. The idea is for this to be used by AI when starting new project. The AI, if appropriate for the project, will pull from this template to get started. I've been getting AI to vibe code projects and it always takes a day or two at the start to get it to slowly set up the basics (especially auth). I want that step to be minutes instead of hours.

I'm going to paste the entire codebase below.

I want you to analyze it for best practices. This should be a simple, elegant, ready to use out of the box template, so look for anything that should be removed, enhanced, or added to get it to that perfect state.

## Caveats For AI analysis:

- Placeholders: These are intentional. Because this is a base project I plan to install a plugin that leads the user through customizing it for their uses and replacing those placeholders. Igore them for now.
- Outdated Project Documentation: It's currently outdated as it's going to get updated all at once at the end of the project. Just ignore the docs for now. The CODE-level documention should be 100% accurate, though.
- Redundant Cursor Rules: Just ignore them. They're mind to deal with.

Here is the code:

---

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

Use this methodolgy: - Attempt to upgrade and make sure nothing broke - If it's okay, then run all tests (npm run test and npm run test:e2e). You have permission to run these commands. - If they pass, ask me to manually check the website. - THEN check it off as successful.

- NOTE: The "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:" error in Chrome is caused by a personal plugin injecting stuff into the UI and isn't a real error.
- NOTE: We're skipping 2 e2e tests on purpose. They're skipped by default keeps them from cluttering test output during normal runs but maintains them as a valuable resource. This approach aligns with the template's goal of providing a solid foundation that anticipates future needs.

# REFERENCE: To be included with the final docs

## ESLint Configuration Reasoning -- KEEP THIS

Okay, let's refine the ESLint configuration to strike that balance for an AI-driven template, leveraging linting as a helpful guardrail without causing excessive friction.

**Core Principles for AI-Centric Linting:**

1.  **Catch Critical Errors:** Rules preventing runtime errors, type errors, or fundamental syntax issues are essential. The AI needs these immediate flags.
2.  **Enforce Core Best Practices:** Rules promoting readability, maintainability, and preventing common pitfalls (like unused variables, incorrect hook usage) remain valuable.
3.  **Reduce "Nitpicky" Rules:** Rules that enforce stylistic choices with minimal impact on correctness or readability, or where TypeScript inference is usually sufficient, can be relaxed or disabled to avoid slowing the AI down with low-value fixes.
4.  **Leverage Auto-Fix:** Prioritize rules that ESLint can often fix automatically (`eslint --fix`).
5.  **Clear Configuration:** Ensure the configuration itself is clear and maintainable.

**Analysis of Current Rules vs. Ideal Balance:**

1.  **`@typescript-eslint/no-unused-vars` (Error):**

    - **AI Guardrail:** Excellent. Helps AI clean up effectively.
    - **Configuration:** Needs to allow ignoring variables prefixed with `_` (e.g., `argsIgnorePattern: "^_"`). This is crucial for intentional unused variables/parameters, a pattern AI might use or encounter.
    - **Recommendation:** Keep as **error**. Verify the `ignorePattern` is configured in `eslint.config.mjs`. [Ref: ESLint Docs - no-unused-vars options](https://eslint.org/docs/latest/rules/no-unused-vars)

2.  **`@typescript-eslint/explicit-function-return-type` (Warning):**

    - **AI Guardrail:** Minor benefit, as TypeScript often infers correctly. Can force AI explicitness but often leads to verbose code.
    - **Friction:** High friction (117 warnings currently). Fixing these is often low-value busy work for the AI, contradicting the "elegant simplicity" goal.
    - **Recommendation:** Change to **`'off'`** in `eslint.config.mjs`. TypeScript's inference is powerful, and other type rules will catch meaningful errors.

3.  **Parsing Errors & Type/Import Errors (Errors):**

    - **AI Guardrail:** Critical. These indicate fundamental code issues the AI _must_ fix.
    - **Recommendation:** Keep as **error**. These are non-negotiable for correctness.

4.  **`complexity` (Error):**

    - **AI Guardrail:** Useful deterrent against the AI generating overly complex spaghetti code.
    - **Friction:** Can be high if the threshold is too strict for common patterns. AI might struggle to refactor effectively.
    - **Recommendation:** Keep as **error**, but monitor if it frequently blocks the AI on reasonable code. If it becomes a major bottleneck, consider slightly increasing the threshold (e.g., `["error", { "max": 15 }]`) in `eslint.config.mjs`. For now, leave it at the default.

5.  **`@typescript-eslint/no-explicit-any` (Error):**
    - **AI Guardrail:** Essential for maintaining type safety, a core benefit of TypeScript. Pushes the AI to use proper types.
    - **Recommendation:** Keep as **error**.

**Other Considerations for the Config (`eslint.config.mjs`):**

- **Base Configurations:** Ensure you're extending reasonable base configs (like `eslint:recommended`, `plugin:@typescript-eslint/recommended-type-checked` or `strict-type-checked` if using typed rules, `plugin:react/recommended`, `plugin:react-hooks/recommended`, `plugin:jsx-a11y/recommended`

DOCS Todo - we'll do this at the end when all changes are done

- [ ] Update project-reference.mdc and anything test-running related (we now have e2e and firebase tests)
- [ ] Make docs more succinct, especially whole folder of firebase docs.. probably just ONE doc there?
- [ ] Topics: Theming system, pm2+browsertool use (esp login), auth flow
- [ ] Redis: Where and how is it used?
- [ ] **README.md**: (Present)
- [ ] **Project Reference**: (`docs/project-reference.mdc` - Present)
  - [ ] Ensure current versions of components are present with links to docs (like MUI v7 where it constantly has trouble with the grid)
- [ ] **Firebase Authentication Integration Details**:
  - [ ] Explain how OAuth users (e.g., Google) are automatically in Firebase Auth.
  - [ ] Detail how email/password users are programmatically added to Firebase Auth via Admin SDK in `registerUser` action upon registration (Postgres ID used as Firebase UID).
  - [ ] Emphasize benefits: unified console view (optional), leveraging Firebase features (email actions, security rules for Firestore/Storage, Cloud Functions), and consistency for a "Firebase" template.
- [x] **Code Comments**: (Clarity and necessity - Requires deeper code review)
- [ ] **`.env.example`**:
  - [ ] Add comments explaining _why_ certain less obvious variables are needed (e.g., `NEXTAUTH_URL` for OAuth redirects, `NEXTAUTH_SECRET` for JWT encryption).
  - [ ] Make `DATABASE_URL` for test and production more explicitly different in the example (e.g., `{{YOUR_DATABASE_NAME}}_test`, `{{YOUR_DATABASE_NAME}}_prod`) to emphasize separation, even though comments cover this.
- [ ] **AI Guidance / Project Documentation (`project-reference.mdc` or similar):**
  - [ ] Clarify that when using the `dev:test` script, `NODE_ENV=test` might influence application behavior (logging, mocks).
  - [ ] Strongly emphasize that the `NEXTAUTH_SECRET` fallback in `lib/auth-edge.ts` for dev/test _must_ be replaced with a strong, unique secret in production.
  - [ ] While Zustand is fine, ensure the AI is guided to use it for genuinely global client state and not as a default for all client-side state if React context or local component state is more appropriate.
  - [ ] Note that the `app/api/test/firebase-config/route.ts` endpoint should be disabled or secured in production environments.
  - [ ] Add documentation stubs or reminders for the AI to document new API endpoints, components, or major architectural decisions.
  - [ ] Briefly document or include a placeholder for how more granular permission handling (beyond basic ADMIN/USER roles) could be implemented.
  - [ ] Add a simple example or documentation stub for caching strategies (e.g., with Redis).
  - [ ] Include a prompt/reminder for the AI to tighten Firebase security rules (`firestore.rules`, `storage.rules`) based on application logic during development.
  - [ ] Consider mentioning common PostgreSQL-specific optimizations or features if they are likely to be relevant for projects built from the template.
  - [ ] Stress the importance of keeping `project-reference.mdc` (or the main AI context document) updated as the template evolves or is used.
  - [ ] Guide the AI to consistently use the Next.js `<Image>` component for image optimization.
  - [ ] Remind the AI to add database indexes for frequently queried fields as new features and data models are introduced.

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

---

### Firebase Admin SDK Initialization & Usage:

- [x] **Task:** Consolidate Firebase Admin SDK initialization to a single, canonical method.
  - **Observation:** Multiple approaches for Firebase Admin initialization exist (`lib/firebase-admin.ts`, `lib/firebase/firebase-admin.ts`, `lib/firebase/admin-*.ts` modules, `FirebaseAdminService` class, initialization within `lib/server/services.ts`). This can be confusing and lead to inconsistent usage.
  - **Reasoning:** A single, clear method enhances simplicity, maintainability, and makes it easier for an AI (and humans) to correctly use the Admin SDK. The class-based `FirebaseAdminService` (initialized via `lib/server/services.ts` using the modular `lib/firebase/admin-*.ts` files) appears to be the most robust and modern pattern present.
  - **Implementation Steps:**
    1.  Designated `FirebaseAdminService` (from `lib/services/firebase-admin-service.ts`, initialized as `firebaseAdminServiceInstance` in `lib/server/services.ts` via `getFirebaseAdminService()`) as the sole entry point for Firebase Admin SDK interactions.
    2.  Reviewed and deprecated the direct singleton initialization in `lib/firebase/firebase-admin.ts`. Updated any code using it to use the `FirebaseAdminService` instance via `getFirebaseAdminService()`.
    3.  Ensured the facade at `lib/firebase-admin.ts` (which re-exports from `lib/firebase/admin-*`) clearly directs towards using the `FirebaseAdminService` or is removed if it adds to confusion. (Retained with deprecation notices, guiding towards `lib/firebase/admin-initialization.ts` and `lib/firebase/admin-access.ts` for specific low-level needs, and `getFirebaseAdminService()` for general use).
    4.  Audited the codebase (e.g., `app/api/auth/session/route.ts`) to ensure all Firebase Admin SDK operations consistently use the chosen `getFirebaseAdminService()` function.
  - **Validation:** Ran `npm run validate`, `npm test` (unit tests), and `npm run test:e2e` (E2E tests). All passed successfully after refactoring and updating test mocks.
  - **Code Review & Optimization (cnew-task-review-optimize-diff.mdc):**
    - [x] VERIFY REQUIREMENTS: Passed.
    - [x] CODE QUALITY ASSESSMENT (SOLID, DRY, DI, TDD, YAGNI): Passed. Improved SOLID and DRY.
    - [x] IMPLEMENTATION AUDIT (Abandoned code, debug artifacts, error handling, security, performance): Passed. Good error handling and initialization logic.
    - [x] CODE EFFICIENCY (Performance, elegance, simplicity, data structures): Passed. More elegant and centralized solution.
    - [x] FINAL VERIFICATION (Test coverage, documentation, patterns): Passed. Tests cover changes, deprecation notices are clear.
    - **Suggestions:** Minor cleanup of old commented code in `app/api/auth/session/route.ts` after stabilization period.

### Layout Components:

- [x] **Task:** Remove potentially redundant layout components: `components/layouts/ApplicationHeader.tsx` and `components/layouts/ApplicationFooter.tsx`.
  - **Observation:** The root layout (`app/layout.tsx`) uses `components/layouts/Header.tsx` and `components/layouts/Footer.tsx`. The `ApplicationHeader` and `ApplicationFooter` components might be unused or remnants of an older structure.
  - **Reasoning:** Eliminating unused or redundant components simplifies the codebase, reduces potential confusion for new users/AI, and makes the project structure cleaner.
  - **Implementation Steps:**
    1.  Verified if `components/layouts/ApplicationHeader.tsx` and `components/layouts/ApplicationFooter.tsx` are imported or used anywhere in the application. (Done - found no usages)
    2.  Deleted these two files. (Done)

### Database Service Functions:

- [x] **Task:** Remove deprecated static wrapper functions in `lib/db/user-service.ts`.
  - **Observation:** `lib/db/user-service.ts` exports static functions (e.g., `getUsersWithSessions`) that wrap instance methods of the `UserService` class. These are marked `@deprecated`.
  - **Reasoning:** Removing deprecated patterns makes the codebase cleaner and promotes a consistent instance-based service usage, which is generally a better practice for testability and managing dependencies.
  - **Implementation Steps:**
    1.  Identify all locations in the codebase where these deprecated static functions are called.
    2.  Refactor those locations to import and use an instance of `UserService` directly (e.g., `userServiceInstance` or by instantiating `new UserService()`).
    3.  Once all usages are updated, delete the deprecated static wrapper functions from `lib/db/user-service.ts`.

### Environment Variable Configuration (`.env.example`):

- [ ] **Task:** Enhance clarity for `FIREBASE_PRIVATE_KEY` formatting.

  - **Observation:** Multi-line environment variables, like Firebase private keys, are often a source of setup errors if not formatted correctly in `.env` files.
  - **Reasoning:** Clear instructions improve developer experience and reduce common setup friction.
  - **Implementation Steps:**
    1.  In `.env.example`, add a comment above `FIREBASE_PRIVATE_KEY` explaining:
        - How to handle newlines (e.g., replace actual newlines with `\\n` if the key is pasted as a single line).
        - Alternatively, suggest base64 encoding the key and decoding it in the application (though `\\n` is simpler for a template).
        - Example comment: `# For FIREBASE_PRIVATE_KEY: Ensure to replace actual newlines with '\\n' if pasting as a single line, OR ensure the variable spans multiple lines correctly as provided by Firebase.`

- [ ] **Task:** Add a comment explaining the importance of `NEXTAUTH_URL`.
  - **Observation:** The `NEXTAUTH_URL` variable's role, especially for OAuth redirects in non-localhost environments, might not be immediately obvious.
  - **Reasoning:** Clarification helps users correctly configure the application for different deployment stages.
  - **Implementation Steps:**
    1.  In `.env.example`, add a comment above `NEXTAUTH_URL`.
    2.  Example comment: `# Required by NextAuth.js. This URL is used for OAuth redirects and should match your application's publicly accessible URL in production/staging environments.`

### Rate Limiting Strategy for Production:

- [ ] **Task:** Add a prominent note in the documentation (e.g., README) about the production suitability of the current `RateLimiterMemory`.
  - **Observation:** `lib/utils/rate-limiters-middleware.ts` uses `RateLimiterMemory`, which is not suitable for multi-instance deployments or production environments requiring persistence.
  - **Reasoning:** Users need to be aware of this limitation to avoid issues in production. The template should guide them towards a more robust solution if needed.
  - **Implementation Steps:**
    1.  In the main `README.md` (e.g., in a "Deployment Considerations" or "Production Setup" section), add a clear warning.
    2.  Example text: "**Important Note on Rate Limiting:** The default rate limiting setup uses an in-memory store (`RateLimiterMemory`), which is suitable for development and single-instance deployments. For production environments, especially those that are serverless or distributed, you **must** switch to a persistent store like Redis (using `RateLimiterRedis`). This project includes Redis in its stack, so integrating it for rate limiting is recommended for production."

### Service Initialization (`lib/server/services.ts`):

- [ ] **Task:** Make `profileServiceInstance` initialization more robust or explicit about potential failures.
  - **Observation:** `profileServiceInstance` is conditionally defined. If its dependencies (`firebaseAdminServiceInstance` or `userServiceInstance`) are not ready, it will be `undefined`. Code consuming `profileService` needs to handle this.
  - **Reasoning:** Making dependency failures more explicit improves debuggability and reduces runtime errors from attempting to use an uninitialized service.
  - **Implementation Options (choose one or combine):**
    1.  **Option A (Throw in constructor):** Modify the `ProfileService` constructor to check for its essential dependencies. If `userService` or `firebaseAdminService` is not provided or invalid, throw an error. This makes initialization failure immediate.
    2.  **Option B (Guarded Access Function):** Instead of exporting `profileServiceInstance` directly, export a `getProfileService()` function. This function would internally check if `profileServiceInstance` is initialized and its dependencies are met. If not, it could throw a specific error or return `null` with clear logging.
        - Example `getProfileService()`:
          ```typescript
          // In lib/server/services.ts
          export function getProfileService(): ProfileService | null {
            if (profileServiceInstance) {
              return profileServiceInstance;
            }
            setupLogger.error(
              'ProfileService is not available due to missing dependencies (FirebaseAdminService or UserService).'
            );
            return null;
          }
          ```
        - Consumers would then call `getProfileService()` and handle the potential `null` return.

### Minor Code & Config Considerations:

- [ ] **Task:** Review ESLint overrides in `eslint.config.mjs` for potential simplification.

  - **Observation:** The ESLint configuration is comprehensive but contains numerous file-specific overrides.
  - **Reasoning:** While powerful, a very complex ESLint config can be slightly less approachable for a template intended to be simple. This is a minor point.
  - **Implementation Steps:**
    1.  Examine the `ignores` array and `files` sections with overrides.
    2.  Identify if any groups of files share common override needs that could be consolidated using broader glob patterns or shared configurations.
    3.  The goal is to reduce redundancy if possible, without sacrificing the linting rules' effectiveness. _Prioritize correctness over minimal config length if simplification introduces ambiguity._

- [ ] **Task:** Add a note in the `README.md` about NextAuth.js v5 being beta.

  - **Observation:** The project uses NextAuth.js v5, which is (or was recently) in beta.
  - **Reasoning:** Users should be informed about the potential for API changes or evolving stability with beta software.
  - **Implementation Steps:**
    1.  In `README.md`, in the "Technology Stack" or a "Getting Started" section, add a brief note.
    2.  Example text: "Authentication is handled by NextAuth.js v5 (currently in beta). Be aware that APIs might evolve until a stable release." (Verify current v5 status).

- [ ] **Task:** Consider setting default Jest branch coverage thresholds slightly higher.
  - **Observation:** The global branch coverage threshold in `jest.config.js` is set to `69%`.
  - **Reasoning:** While matching current coverage is practical, a template could set a slightly more aspirational default (e.g., 70% or 75%) to encourage good testing practices from the start. This is optional.
  - **Implementation Steps (Optional):**
    1.  In `jest.config.js`, under `coverageThreshold.global`, change `branches: 69` to a slightly higher value like `branches: 70` or `branches: 75`.
    2.  Add a comment indicating users can adjust these thresholds.
