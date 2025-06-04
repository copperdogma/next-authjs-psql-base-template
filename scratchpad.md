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

- [ ] **Database Interaction & Schema** (Files: `lib/prisma.ts`, `prisma/` schema, Prisma-interacting services)

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

## Database Interaction & Schema Improvement Checklist

### Target File: `lib/services/raw-query-service.ts`

The following suggestions focus on enhancing the security and robustness of raw SQL queries by ensuring consistent and correct parameterization, aligning with Prisma's best practices.

1. [ ] **Refactor `getUserSessionCountsByDay` for Proper Parameterization:**

   - **File:** `lib/services/raw-query-service.ts`
   - **Function:** `async getUserSessionCountsByDay(options: {...})`
   - **Current Issue:** The `params` array returned by `this.buildDateUserWhereClause(options)` (which contains the values for placeholders like `$1`, `$2` in the `whereClause` string) is not being passed as separate arguments to the `this.prismaClient.$queryRaw` call. The `whereClause` string (e.g., `WHERE "createdAt" >= $1`) is injected using `Prisma.raw()`, but the corresponding values are missing.
   - **Suggestion:** Modify the `this.prismaClient.$queryRaw` call to correctly pass the `params` array.
   - **Current Code Snippet (Conceptual):**
     ```typescript
     // Inside getUserSessionCountsByDay
     const { whereClause, params } = this.buildDateUserWhereClause(options);
     // ... SQL construction using whereClause ...
     const results = await this.prismaClient.$queryRaw(
       Prisma.sql`SELECT DATE_TRUNC('day', "createdAt") AS date, COUNT(*) AS count FROM "Session" ${whereClause ? Prisma.raw(whereClause) : Prisma.empty} GROUP BY DATE_TRUNC('day', "createdAt") ORDER BY date DESC`
     );
     ```
   - **Proposed Change:**
     ```typescript
     // Inside getUserSessionCountsByDay
     const { whereClause, params } = this.buildDateUserWhereClause(options);
     // ... SQL construction ...
     const results = await this.prismaClient.$queryRaw(
       Prisma.sql`SELECT DATE_TRUNC('day', "createdAt") AS date, COUNT(*) AS count FROM "Session" ${whereClause ? Prisma.raw(whereClause) : Prisma.empty} GROUP BY DATE_TRUNC('day', "createdAt") ORDER BY date DESC`,
       ...params // Spread the 'params' array here
     );
     ```
   - **Rationale:** Ensures that values for placeholders in the dynamically built `whereClause` are properly and safely passed to the database driver, preventing SQL injection vulnerabilities and potential runtime errors.

2. [ ] **Refactor `extendSessionExpirations` for Secure Array and Date Parameterization:**

   - **File:** `lib/services/raw-query-service.ts`
   - **Function:** `async extendSessionExpirations(options: {...})`
   - **Current Issues & Suggestions:**

     - **User IDs IN Clause:** The `userIds` array is currently processed into a string like `"'id1','id2'"` and directly interpolated into the SQL: `WHERE "userId" IN (${userIdsParam})`. This is not fully parameterized.

       - **Proposed Change:** Use `Prisma.join()` for array parameterization.
         ```typescript
         // Change from:
         // const userIdsParam = userIds.map(id => `'${id}'`).join(',');
         // let whereClause = `WHERE "userId" IN (${userIdsParam})`;
         // To (within the Prisma.sql template literal):
         // WHERE "userId" IN (${Prisma.join(userIds.map(id => Prisma.sql`${id}`))}) // If IDs need to be individually parameterized
         // Or more simply if Prisma handles array types directly in IN for $executeRaw (check Prisma docs for $executeRaw array passing)
         // It might be simpler to build the condition like:
         // const userIdConditions = userIds.map(id => Prisma.sql`"userId" = ${id}`);
         // const whereUserIdClause = Prisma.sql`WHERE (${Prisma.join(userIdConditions, ' OR ')})`;
         // For IN clause, Prisma.join directly with values is best:
         // WHERE "userId" IN (${Prisma.join(userIds)})
         //
         // The final Prisma.sql call would then look something like this for the WHERE part:
         // const userInClause = userIds.length > 0 ? Prisma.sql`"userId" IN (${Prisma.join(userIds)})` : Prisma.empty;
         // let fullWhereClause = userInClause;
         // if (currentExpiryBefore) {
         //   const expiryCondition = Prisma.sql`"expiresAt" <= ${currentExpiryBefore}`;
         //   fullWhereClause = userInClause !== Prisma.empty ? Prisma.sql`${userInClause} AND ${expiryCondition}` : expiryCondition;
         // }
         // const finalSql = Prisma.sql`UPDATE "Session" SET "expiresAt" = "expiresAt" + interval '${Prisma.raw(String(extensionHours))} hours', "updatedAt" = NOW() WHERE ${fullWhereClause}`;
         // Note: `extensionHours` handling is addressed next.
         ```
         Modify `buildSessionExpirationWhereClause` to return `Prisma.Sql` or parts that can be combined into one.
         Alternatively, if constructing the raw SQL string remains, `userIds` should be passed as parameters and the SQL should use placeholders, e.g., `userId = ANY($1::text[])`.

     - **`currentExpiryBefore` Date:** The date is interpolated as a string: `"expiresAt" <= '${currentExpiryBefore.toISOString()}'`.

       - **Proposed Change:** Parameterize the date.
         ```typescript
         // If using Prisma.sql, change to:
         // AND "expiresAt" <= ${currentExpiryBefore}
         // Prisma.sql will handle the date object correctly.
         ```

     - **`extensionHours` Interval:** The interval is constructed with string interpolation: `interval '${extensionHours} hours'`.
       - **Proposed Change:** While `Prisma.raw(String(extensionHours))` inside `Prisma.sql` is safer than direct interpolation, the most robust way for intervals when the value is dynamic is to pass `extensionHours` as a parameter and use database functions if complex, or ensure `Prisma.sql` handles it. For simple "X hours", `Prisma.sql\`"expiresAt" + make_interval(hours => ${extensionHours})\`` or ``Prisma.sql`"expiresAt" + (${extensionHours} \* interval '1 hour')`(syntax might vary by DB and exact Prisma handling). A simpler and safe approach with`Prisma.sql`is acceptable:`interval '${Prisma.raw(String(extensionHours))} hours'`. However, if `extensionHours` is just a number, `Prisma.sql\`interval '${extensionHours} hours'\``itself allows Prisma to treat`${extensionHours}` as a parameter.

   - **Rationale:** Prevents SQL injection vulnerabilities and ensures data types are handled correctly by the database driver. `Prisma.join()` is the recommended way to handle arrays for `IN` clauses.

3. [ ] **Refactor `getUserActivitySummary` for Full Parameterization:**
   - **File:** `lib/services/raw-query-service.ts`
   - **Function:** `async getUserActivitySummary(options: {...})`
   - **Current Issues:** `since` (date), `minSessionCount` (number), and `limit` (number) are directly interpolated into the SQL string.
     - `WHERE s."createdAt" >= '${since.toISOString()}'`
     - `HAVING COUNT(s."id") >= ${minSessionCount}`
     - `LIMIT ${limit}`
   - **Proposed Change:** Use `Prisma.sql` template literals and pass these values as parameters.
     ```typescript
     // Inside executeActivitySummaryQuery or main function SQL construction
     // ...
     // const whereSinceClause = since ? Prisma.sql`WHERE s."createdAt" >= ${since}` : Prisma.empty;
     // ...
     // const query = Prisma.sql`
     //   SELECT ... FROM "User" u ...
     //   ${whereSinceClause}
     //   GROUP BY u."id", u."email", u."name"
     //   HAVING COUNT(s."id") >= ${minSessionCount}
     //   ORDER BY MAX(s."createdAt") DESC
     //   LIMIT ${limit}
     // `;
     // const results = await this.prismaClient.$queryRaw(query);
     ```
   - **Rationale:** Critical for security and proper query execution, especially with user-supplied or derived numeric and date inputs.

---
