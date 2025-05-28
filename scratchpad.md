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

### Testing and Validation Plan for Setup Process - We'll do this at the END of the project.

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

## Codebase Improvement Checklist

### I. Documentation & Code Consistency (Crucial for AI)

- **\[ ] Update `KeyFeatures.tsx` to Reflect Correct Authentication**

  - **File(s) to Modify**: `app/about/components/KeyFeatures.tsx`
  - **Current Issue**: The component states: _"Authentication: Firebase Authentication integration with Google sign-in"_.
  - **Recommendation**: Change the text to accurately describe the authentication mechanism. For example: _"Authentication: NextAuth.js v5 with PostgreSQL integration (Google & Email/Password providers)"_.
  - **Rationale**: Ensures the AI (and human users) have an accurate understanding of the template's core authentication system from the example UI itself. Prevents confusion and incorrect assumptions when the AI starts modifying or extending auth features.

- **\[ ] Review All Code Comments and Internal Documentation for Firebase Auth Misreferences**
  - **File(s) to Modify**: Potentially any file with comments.
  - **Current Issue**: While the main README and `project-reference.mdc` are accurate, there might be lingering comments in the codebase that incorrectly suggest Firebase is the _primary_ authentication system.
  - **Recommendation**: Perform a project-wide search for terms like "Firebase Auth", "Firebase Authentication", "Firebase sign-in" (excluding contexts clearly related to optional Firebase services like `firebase.json` or the `/api/test/firebase-config` route). If any comments imply Firebase is the core auth, update them to reflect NextAuth.js with Prisma/PostgreSQL.
  - **Rationale**: Guarantees consistent information across the codebase, preventing AI confusion when interpreting code logic or adding new features related to authentication.

### II. Code Simplification & Elegance

- **\[ ] Simplify `ProfileService.updateUserName` Method**

  - **File(s) to Modify**: `lib/server/services/profile.service.ts`
  - **Current Issue**: The `updateUserName` method in `ProfileServiceImpl` currently attempts a raw SQL update (`_updateNameWithRawSql`) and then falls back to a Prisma ORM update (`_updateNameWithPrisma`), with a comment about "avoiding schema incompatibilities." This adds complexity.
  - **Recommendation**:
    1.  Refactor `updateUserName` to primarily (or solely) use the Prisma ORM update: `await this.db.user.update({ where: { id: userId }, data: { name: processedName } });`.
    2.  Remove the `_updateNameWithRawSql` helper method unless there is a deeply compelling and documented reason _specific to the base template's schema_ that necessitates it. For a generic template, ORM-idiomatic updates are preferred.
    3.  If the raw SQL method is removed, also remove its corresponding E2E test environment handling (`this._createMockUserForE2E`) if it was solely to bypass the raw SQL for tests. Prisma ORM updates are generally easier to mock or test.
  - **Rationale**: Simplifies the codebase, makes it more idiomatic for a Prisma-based project, easier for an AI to understand and extend, and reduces the surface area for potential bugs. Raw SQL for basic field updates is often unnecessary with a powerful ORM like Prisma.

- **\[ ] Add Explanatory Comments to Registration Rate Limiting "Fail Open" Behavior**
  - **File(s) to Modify**: `lib/actions/auth.actions.ts` (specifically the `_handleRegistrationRateLimit` function or where `getOptionalRedisClient` is used for this purpose) and potentially `.env.example`.
  - **Current Issue**: The registration rate limiting currently "fails open" if Redis is unavailable or misconfigured (i.e., it allows the registration to proceed without rate limiting). While this is a good default for a template to prevent setup friction, it's important to be explicit about it.
  - **Recommendation**:
    1.  In `_handleRegistrationRateLimit` (or its caller), add a comment where it's decided to proceed without rate limiting (e.g., when `getOptionalRedisClient` returns null or `redisClient` is null). The comment should explain that rate limiting is skipped if Redis is not available/configured, and that for production, a robust Redis setup is recommended for this feature to be effective.
    2.  In `.env.example`, next to `ENABLE_REDIS_RATE_LIMITING` and `REDIS_URL`, add a brief note: `# Note: If Redis is not configured or unavailable, rate limiting will be skipped (fail open).`
  - **Rationale**: Manages expectations for users and AI regarding the rate limiting feature. Ensures the AI understands the implications of not having Redis configured for this specific functionality.

### III. Testing Refinements

- **\[ ] Evaluate and Refine Unit Tests for Server Actions**
  - **File(s) to Modify**: `tests/unit/lib/actions/auth.actions.test.ts`
  - **Current Issue**: This test file is currently a placeholder.
  - **Recommendation**:
    - **Option A (Simplicity First - Recommended for Template)**:
      1.  Remove the placeholder file `tests/unit/lib/actions/auth.actions.test.ts`.
      2.  Add a section to your main testing documentation (e.g., in `docs/testing/main.md` or as a comment in `project-reference.mdc`) stating: "Server Actions (e.g., `registerUserAction`) are primarily validated through End-to-End (E2E) tests. This approach ensures that the full flow, including data validation, database interaction, and NextAuth.js integration, is tested from the user's perspective. Unit testing server actions can be complex due to the need to mock database clients (Prisma), NextAuth.js session management, and other server-side dependencies. For this template, E2E tests provide comprehensive coverage for these actions."
    - **Option B (If Basic Unit Tests are Desired)**:
      1.  If choosing to keep unit tests, add 1-2 very simple tests to `auth.actions.test.ts` that focus _only_ on input validation (e.g., calling `registerUserAction` with invalid FormData and checking if it returns a `VALIDATION_ERROR` without actually mocking database calls). This keeps the unit tests lightweight.
      2.  Example for Option B:
          ```typescript
          // In tests/unit/lib/actions/auth.actions.test.ts
          it('should return a validation error if email is missing', async () => {
            const formData = new FormData();
            // formData.append('password', 'password123'); // Email is missing
            const result = await registerUserAction(null, formData);
            expect(result.status).toBe('error');
            expect(result.error?.code).toBe('VALIDATION_ERROR');
            // Potentially check result.errors for specific field error
          });
          ```
  - **Rationale**: For a base template, E2E tests provide excellent coverage for server actions. Overly complex unit tests for actions with many external dependencies (DB, Auth) can be brittle and hard for an AI to maintain or extend. Option A prioritizes simplicity and robust E2E validation. Option B offers a minimal unit testing footprint.

### IV. Environment Setup & Developer Experience (DX)

- **\[ ] Enhance `.env.example` with More Explanations**

  - **File(s) to Modify**: `.env.example`
  - **Current Issue**: Some critical environment variables could benefit from more context.
  - **Recommendation**:
    1.  Next to `NEXTAUTH_URL`, add a comment: `NEXTAUTH_URL=http://localhost:3000 # Crucial for OAuth redirects in development and MUST match your production URL.`
    2.  Next to `NEXTAUTH_SECRET`, add: `# Generate with: openssl rand -base64 32. Used for JWT signing and encryption.`
    3.  If your E2E or integration testing strategy _might_ use a separate database connection string (even if not the default for this template), consider adding a commented-out example:
        ```
        # Example for a dedicated test database (optional, configure if your testing strategy requires it)
        # TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/your_project_name_test?schema=public"
        ```
        (This relates to the `DATABASE_NAME_TEST` placeholder in `scripts/setup.js` – it's good to show where such a variable might be used, even if the template's default test setup doesn't require modifying `DATABASE_URL` directly for tests.)
  - **Rationale**: Provides clearer guidance for developers (and AI) setting up the environment, reducing potential configuration errors, especially for critical variables like `NEXTAUTH_URL`.

- **\[ ] Ensure Setup Script Handles All Placeholders**
  - **File(s) to Modify**: `scripts/setup.js`, and verify all files listed in `FILES_TO_PROCESS` within `setup.js`.
  - **Current Issue**: The setup script is designed to replace placeholders. A final check is needed.
  - **Recommendation**:
    1.  Manually review all files that are intended to have placeholders (e.g., `README.md`, `package.json`, `app/manifest.ts`, any copyright headers in code files).
    2.  Ensure that `scripts/setup.js` correctly targets and replaces _all_ instances of `{{YOUR_PROJECT_NAME}}`, `{{YOUR_APP_NAME}}` (if different from project name), `{{YOUR_PROJECT_DESCRIPTION}}`, `{{YOUR_COPYRIGHT_HOLDER}}`, `{{YOUR_APP_TITLE}}`, `{{YOUR_APP_SHORT_NAME}}`, etc.
    3.  Pay special attention to `app/manifest.ts` as it uses `{{YOUR_APP_TITLE}}`, `{{YOUR_APP_SHORT_NAME}}`, and `{{YOUR_PROJECT_DESCRIPTION}}`.
  - **Rationale**: A fully automated and accurate setup script is key for a good template experience, especially for AI that will rely on it for project initialization.

### V. Code & Dependency Hygiene (Optional but good practice)

- **\[ ] Final Review for Unused Code/Dependencies**
  - **File(s) to Modify**: Entire codebase.
  - **Current Issue**: Common for templates to accumulate minor unused elements over development.
  - **Recommendation**:
    1.  Run `npx depcheck` or a similar tool to identify unused dependencies in `package.json`. Review and remove any that are truly unnecessary for the base template.
    2.  Use IDE features or linters (if configured) to find unused variables, functions, imports, or files.
    3.  Manually scan for any commented-out code blocks that represent old logic and are no longer needed.
  - **Rationale**: Keeps the template lean, reduces build times, and simplifies the codebase for AI comprehension.
