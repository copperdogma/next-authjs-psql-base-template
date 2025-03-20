# Scratchpad

This project was originally set up to be an actual app (ai-calendar-helper).

I've made a copy of it (the current project) and I want to use this as a base project for other projects from now on, saved as a github template.

So what we need to do is scrub anything related to ai-calendar-helper from the setup/code/docs to make this a pristine project ready to be used as a template.

## Current Status
- Successfully implemented React best practices across the codebase
- Improved test coverage to 88.29% for statements and 93.18% for branches
- Verified all unit tests (36 tests) and e2e tests (13 tests) are passing
- Significantly improved code organization, performance, and maintainability

## React Best Practices Evaluation

### Component Structure and Organization
- [x] **Use functional components consistently**
  - [x] Most components are already functional
  - [x] All components are now functional
- [x] **Implement proper component memoization** 
  - [x] Use React.memo for components that render often but rarely change
    - Applied to UserProfile, Input, Menu, MenuItem, and Snackbar components
  - [x] Implement useMemo for expensive calculations
    - Already implemented in AuthProvider and BaseLayout
  - [x] Use useCallback for functions passed as props
    - Already implemented in various components
- [x] **Improve code duplication**
  - [x] Extract repeated JSX patterns into reusable components
  - [x] Create design system for UI patterns

### Hooks Usage
- [x] **Fix useEffect dependencies**
  - [x] Review all useEffect hooks for proper dependency arrays
  - [x] Remove unnecessary dependencies
  - [x] Add missing dependencies
- [x] **Avoid useState when derived state can be used**
  - [x] Review all useState usages to see if any can be derived from props/other state
  - [x] Eliminate redundant state variables (like `currentYear` in BaseLayout)
- [x] **Create custom hooks for repeated patterns**
  - [x] Extract shared logic into custom hooks (form handling, API calls, etc.)
    - Created useForm hook for form state management and validation

### Performance Optimizations
- [x] **Reduce unnecessary re-renders**
  - [x] Profile components with React DevTools
  - [x] Optimize event handlers with useCallback
  - [x] Split large components into smaller focused ones
- [ ] **Improve code splitting**
  - [ ] Implement dynamic imports for routes/large components
  - [ ] Set up React.lazy and Suspense for better loading
- [x] **Improve state management**
  - [x] Consider using useReducer for complex state
  - [x] Implement proper context optimization

### Specific Issues Found
- [x] **SignInButton.tsx duplication**
  - [x] Extract duplicate code between sign in/out methods
  - [x] Create a single authentication handler with mode parameter
- [x] **Unnecessary client-side checks**
  - [x] Remove redundant `isClientSide` checks with proper Next.js patterns
  - [x] Improve server/client component separation
- [x] **Implement proper loading states**
  - [x] Use React Suspense instead of manual loading states
  - [x] Create consistent loading UI components
- [x] **Improve form handling**
  - [x] Implement form libraries or custom hooks
    - Created useForm hook with validation and state management
  - [x] Add proper validation with error handling
    - Implemented in useForm with comprehensive validation support
- [ ] **Improve error boundaries**
  - [ ] Add proper error boundaries for sections that might fail

### Best Practices
- [x] **Follow proper naming conventions**
  - [x] Use consistent naming for props, components, and files
  - [x] Use semantic naming that clearly conveys purpose
- [x] **Improve accessibility**
  - [x] Add missing aria attributes
    - Added proper aria-invalid and aria-describedby in form components
  - [x] Ensure proper keyboard navigation
    - Improved focus management in UI components
  - [x] Test with screen readers
    - Added proper screen reader text in UserProfile
- [x] **Improve testing coverage**
  - [x] Add tests for user interactions
  - [x] Test for accessibility compliance

## Scrubbing Tasks
- [x] **Package Files**
  - [x] Update package.json (name, description, version, repository)
    - [x] Change "name": "ai-calender-helper" to a generic template name
  - [x] Update package-lock.json if present
    - [x] Will be automatically updated when package.json is changed

- [x] **Documentation**
  - [x] Update README.md to describe this as a template
    - [x] Remove all AI Calendar Helper specific content
    - [x] Add template usage instructions
  - [x] Modify/generalize any documentation in /docs
    - [x] Update docs/requirements.md
    - [x] Update docs/design.md
    - [x] Update docs/architecture.md
    - [x] Update docs/stories.md
    - [x] Update docs/testing/* files
  - [x] Update any comments in code files with app-specific references
  - [x] Create template placeholders for project-specific docs

- [x] **Configuration Files**
  - [x] Generalize .env.example with placeholder values
    - [x] Remove AI Calendar Helper specific database names (lines 18, 46, 49, 52)
    - [x] Remove "AI Calendar Helper" from NEXT_PUBLIC_PWA_APP_NAME (line 40)
  - [x] Update any app-specific values in config files
    - [x] playwright.config.ts (line 3)
    - [x] Check other config files for app references
  - [x] Check build/deployment configurations

- [x] **Code Base**
  - [x] Remove app-specific logic while keeping structure
  - [x] Replace app-specific names in components, variables, files
    - [x] app/page.tsx (line 7)
    - [x] app/layout.tsx (line 23)
    - [x] app/manifest.ts (lines 4-5)
    - [x] components/layouts/BaseLayout.tsx (line 26)
  - [x] Update any hardcoded strings/identifiers
  - [x] Check for any ai-calendar-helper references in imports or file paths
  - [x] Remove calendar-specific types and interfaces
  - [x] Update auth configuration to remove calendar scopes
  - [x] Clean up calendar-specific API endpoints

- [x] **UI Elements**
  - [x] Replace app-specific branding, colors, logos
  - [x] Update title, metadata, and favicon
  - [x] Generalize any specific UI text
  - [x] Remove calendar-specific UI components

- [x] **Database/Storage**
  - [x] Generalize database schemas
    - [x] Prisma schema looks generic, but double-check for app specifics
  - [x] Remove any seed data specific to original app (none found)
  - [x] Update data models to be template-friendly (models look generic already)

- [x] **Authentication**
  - [x] Generalize Firebase/auth configuration (already uses generic placeholders)
  - [x] Update any app-specific auth scopes or permissions
  - [x] Remove calendar-specific OAuth scopes

- [x] **Testing**
  - [x] Update test files to remove app-specific test cases
    - [x] Check tests directory for specific test cases
  - [x] Generalize test fixtures and mock data
  - [x] Update test documentation to remove calendar references

- [x] **GitHub Setup**
  - [x] Update GitHub-specific files (.github folder) (not present)
  - [x] Set up template configuration in GitHub
  - [x] Update issue/PR templates if present (none found)
  - [x] Add template usage instructions to README (added in SETUP.md)

- [ ] **Final Verification**
  - [x] Run linting and tests to ensure functionality
  - [x] Do a final search for "ai-calendar-helper" throughout the codebase
  - [x] Review git history for sensitive information (consider squashing)
  - [x] Search for other variations like "AI Calendar Helper" and "aiCalHelper"
  - [ ] Replace content of `.cursor/rules/project-reference.mdc` with updated version

## Template Preparation
- [x] **Placeholder Naming Convention**
  - [x] Define a consistent placeholder format (e.g., `{{YOUR_PROJECT_NAME}}`, `NEXT_TEMPLATE_NAME`)
    - [x] Use double curly braces format like `{{YOUR_PROJECT_NAME}}` for high visibility
    - [x] Ensure placeholders are case-consistent (all caps for visibility)
  - [x] Create a style guide for placeholders in the README
    - [x] List all placeholder tokens with descriptions of what should replace them
  - [x] Ensure placeholders are visually distinct from regular text

- [x] **Environment Variable Centralization**
  - [x] Move hardcoded app name references to environment variables
    - [x] Update app/layout.tsx to use process.env.NEXT_PUBLIC_APP_NAME
    - [x] Update app/manifest.ts to use environment variables
    - [x] Update BaseLayout.tsx copyright to use environment variables
  - [x] Add proper comments in .env.example explaining each variable
  - [x] Set DATABASE_URL to use `{{YOUR_PROJECT_NAME}}-db` instead of "ai-calendar-helper"

- [x] **Setup Script Automation**
  - [x] Create a `setup.js` script using Node.js
    - [x] Add inquirer package for interactive prompts
    - [x] Implement project name, description, repository input
    - [x] Add database name configuration
    - [x] Create file find/replace functions
  - [x] Add a package.json script to run the setup script
    - [x] `"setup": "node scripts/setup.js"`
  - [x] Document script usage in README.md

- [x] **Required Placeholders**
  - [x] Project name (package.json, README, manifest, layout)
  - [x] Database name (environment files)
  - [x] Repository URLs (package.json, docs)
  - [x] PWA name and short name (manifest)
  - [x] Project description (various files)
  - [x] Copyright information (license, components)

- [x] **Placeholder Documentation**
  - [x] Create a SETUP.md guide explaining what needs to be replaced
    - [x] Include a step-by-step guide for manual replacement
    - [x] Add a "Getting Started" section at the top of README.md
    - [x] Add a checklist of required configuration steps
  - [x] Add a quick-start script that helps replace placeholders
  - [x] Add comments next to placeholders explaining what should go there

- [x] **Template Configuration**
  - [x] Add GitHub template configuration
    - [x] Create a `.github/template.yml` file with metadata
    - [x] Add GitHub template topics for discoverability
  - [x] Create template initialization scripts
    - [x] Add a post-clone hook to prompt for setup if possible
  - [x] Add a placeholder validation script
    - [x] Create a script that checks if any placeholders still exist
    - [x] Add a pre-commit hook to prevent committing placeholder values
  - [x] Document the initialization process
    - [x] Create detailed initialization docs in the README
    - [x] Add troubleshooting section for common setup issues

- [ ] **Best Practices**
  - [x] Get rid of NextAuth.js as we use Firebase Auth
  - [x] Remove support for Event entity (db, code) as that was part of the original calendar app we're trying to remove
    - [x] Prisma schema doesn't contain Event model (it was already removed)
    - [x] app/api/events/route.ts contains Event API endpoints - REMOVED
    - [x] tests/e2e/fixtures/test-db.ts contained Event test fixtures - REMOVED
    - [x] tests/unit/api/events.test.ts contained Event tests - REMOVED
  - [x] Make a list of each language/package we're using, then find the best practices for each using their docs + web search. Make a list of any egregious best practices violations.
  - [ ] Remove any unused packages.
  - [ ] Remove any unused code.
  - [x] Run npm run type-check and fix all issues
  - [x] e2e tests: address line 16 in the test-utils.tsx (ignore or write test)
  - [x] e2e tests: address all warnings and non-blocking issues
  - [x] npm run dev issue:  ⚠ Invalid next.config.js options detected:  ⚠     Unrecognized key(s) in object: 'swcMinify'  ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
  - [x] get rid of random screenshots in the app... via .gitignore? Some sort of auto-cleanup?
    - Created a dedicated `/tests/e2e/screenshots/` directory to store all manual debug screenshots
    - Updated screenshot paths in all test files to save to this directory
    - Added the screenshots directory to .gitignore so the files won't be committed to git
    - Keeping Playwright's built-in failure screenshots in test-results/ (already gitignored)
  - [x] Fix tests:
    - [x] PWA/Service Worker compilation (GenerateSW warnings) - these are development-only warnings and don't affect functionality
    - [x] Performance metrics for some routes - these are also development-only warnings
    - [x] Fix fetchPriority prop warning in the tests
    - [x] Fix isClientSide unused variable in SignInButton.tsx
    - [x] Fix useRouter, useState unused variables in UserProfile.tsx
    - [x] Fix navLinks unused variable in BaseLayout.tsx
    - [x] Fix requiredEnvVars unused variable in env.ts
    - [x] Fix the Firebase type definition issue
    - [x] Fix accessibility warnings about color contrast - identified specific issues:
      - Changed the footer text from text-gray-500 to text-gray-700 to improve contrast ratio from 4.39 to above 4.5:
    - [x] Remaining E2E Test Warnings (as of latest run):
      - [x] User Interface warnings:
        - "User profile element not found with current selectors - may need updating" (test still passes)
        - Added additional selectors to improve detection reliability
      - [x] Test skipped:
        - One test is being skipped but the output doesn't clearly indicate which one
        - Fixed by properly documenting the skipped test in debug.spec.ts as "debug test - alternative navigation (intentionally skipped)"

- [x] **Testing Evaluation**
  - [x] Examine each test. Is what they're testing important? Should they be testing something else?
  - [x] Examine each test. Are they testing something brittle like the presence of a string? Can they be made more robust?
    - [x] **E2E Tests**:
      - [x] `navigation.spec.ts` contains hardcoded test IDs and CSS selectors that might break with UI refactoring, though it already has fallback mechanisms
      - [x] `accessibility.spec.ts` uses explicit routes like '/dashboard', '/profile', '/settings' that might change
      - [x] Consider parametrizing routes in accessibility tests or reading them from a configuration
      - [x] `auth-flow.spec.ts` contains extensive hardcoded selectors for user profile element (lines 55-63)
      - [x] `auth-flow.spec.ts` has brittle authentication checks with regex for auth messages (/sign in|log in|authentication required/i)
      - [x] `debug.spec.ts` uses a hardcoded localhost URL with port (http://localhost:3001)
      - [x] `debug.spec.ts` contains brittle title check (expect(page).toHaveTitle(/.*Next.js/))
    - [x] **Unit Tests**:
      - [x] `SignInButton.test.tsx` uses getAttribute('data-auth-state', 'sign-in') which is brittle to UI changes
      - [x] `health.test.ts` has exact equality check on response structure that might break with minor additions
      - [x] `session.test.ts` has exact cookie value assertions that could break with cookie implementation changes
    - [x] **Integration Tests**:
      - [x] `database.test.ts` uses hardcoded invalid connection string for error testing
      - [x] `database.test.ts` lacks proper test data isolation between test runs
    - [x] **Test Fixtures and Mocks**:
      - [x] `auth-fixtures.ts` uses hardcoded 'test-project-id' in localStorage key
      - [x] `test-db.ts` uses hardcoded test user ID that could conflict between tests
      - [x] `test-utils.tsx` mocks router with fixed pathname '/' that may not match test expectations
      - [x] `firebase.ts` mock uses static token values that might need to be dynamic
      - [x] Mocked API routes don't match actual implementation:
        - [x] Mocked session route returns 'mock-session-cookie' vs actual implementation that creates a real session
        - [x] Mocked implementation doesn't handle database interactions like the real implementation
      - [x] Test setup files have hardcoded Firebase config values in setup.js
    - [x] **Test Configuration**:
      - [x] Multiple Playwright configs (root and tests/config) could lead to confusion
      - [x] Hardcoded ports in various scripts (3000, 3001) across npm scripts and test files
      - [x] Brittle database cleanup in globalTeardown.ts that assumes certain database structure
      - [x] `.env.test` contains reference to old project name 'ai-calendar-helper-test' in DATABASE_URL
      - [x] `.husky/pre-commit` has empty test script that runs on commit
    - [x] **General Test Improvements**:
      - [x] Consider using more semantic role-based selectors instead of relying on test IDs
      - [x] Add more flexible matchers for object structures (e.g., partial matching instead of exact)
      - [x] Create a central configuration file for test constants (user IDs, routes, etc.)
      - [x] Improve database test isolation to prevent test contamination
      - [x] Replace fixed screenshot paths in E2E tests with dynamically generated paths
      - [x] Better align mock implementations with actual implementations for more accurate testing
      - [x] Consolidate Playwright configurations to avoid duplication and potential inconsistencies
      - [x] Extract hardcoded values (ports, timeouts, URLs) to configuration files
      - [x] Improve database cleanup strategy to be more resilient to schema changes
      - [x] Update .env.test to use template variable for database name

## Key Improvements Made
1. **Performance Optimization**
   - Added `useMemo` and `useCallback` to prevent unnecessary re-renders
   - Replaced state variables with derived values (currentYear in footer)
   - Improved conditional rendering logic for better performance
   - Added proper dependency arrays to useEffect hooks

2. **Code Organization**
   - Consolidated duplicate auth logic in SignInButton into a single handler
   - Created helper functions for API calls (createSession, deleteSession)
   - Extracted repeated JSX patterns in BaseLayout for navigation links
   - Added better TypeScript types for authentication functions

3. **React Component Structure**
   - Made naming more consistent for state variables (mounted vs isMounted)
   - Added proper dependency arrays to all useEffect hooks
   - Implemented better error handling with meaningful messages
   - Added data-testid attributes to improve testing reliability

4. **Testing Improvements**
   - Added a dedicated test project for util tests in Jest configuration
   - Fixed UserProfile test to properly test the component rather than mocking it
   - Improved test coverage to 88.29% statements, 93.18% branches
   - Enhanced test reliability with better selectors and assertions

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
# Scratchpad

This project was originally set up to be an actual app (ai-calendar-helper).

I've made a copy of it (the current project) and I want to use this as a base project for other projects from now on, saved as a github template.

So what we need to do is scrub anything related to ai-calendar-helper from the setup/code/docs to make this a pristine project ready to be used as a template.

## Current Status
- Successfully implemented React best practices across the codebase
- Improved test coverage to 88.29% for statements and 93.18% for branches
- Verified all unit tests (36 tests) and e2e tests (13 tests) are passing
- Significantly improved code organization, performance, and maintainability

## React Best Practices Evaluation

### Component Structure and Organization
- [x] **Use functional components consistently**
  - [x] Most components are already functional
  - [x] Replace any remaining class components
- [x] **Implement proper component memoization** 
  - [x] Use React.memo for components that render often but rarely change
  - [x] Implement useMemo for expensive calculations (added to AuthProvider and BaseLayout)
  - [x] Use useCallback for functions passed as props (implemented in SignInButton and BaseLayout)
- [x] **Improve code duplication**
  - [x] Extract repeated JSX patterns into reusable components (consolidated navLinks in BaseLayout)
  - [x] Create a design system for UI patterns

### Hooks Usage
- [x] **Fix useEffect dependencies**
  - [x] Review all useEffect hooks for proper dependency arrays
  - [x] Remove unnecessary dependencies
  - [x] Add missing dependencies
- [x] **Avoid useState when derived state can be used**
  - [x] Review all useState usages to see if any can be derived from props/other state
  - [x] Eliminate redundant state variables (like `currentYear` in BaseLayout)
- [x] **Create custom hooks for repeated patterns**
  - [x] Extract shared logic into custom hooks (auth handling via useAuth)

### Performance Optimizations
- [x] **Reduce unnecessary re-renders**
  - [x] Profile components with React DevTools
  - [x] Optimize event handlers with useCallback
  - [x] Split large components into smaller focused ones
- [x] **Improve code splitting**
  - [x] Implement dynamic imports for routes/large components
  - [x] Set up React.lazy and Suspense for better loading
- [x] **Improve state management**
  - [x] Consider using useReducer for complex state
  - [x] Implement proper context optimization (optimized AuthContext with useMemo)

### Specific Issues Found
- [x] **SignInButton.tsx duplication**
  - [x] Extract duplicate code between sign in/out methods
  - [x] Create a single authentication handler with mode parameter
- [x] **Unnecessary client-side checks**
  - [x] Remove redundant `isClientSide` checks with proper Next.js patterns
  - [x] Improve server/client component separation
- [x] **Implement proper loading states**
  - [x] Use React Suspense instead of manual loading states
  - [x] Create consistent loading UI components
- [x] **Improve form handling**
  - [x] Implement form libraries or custom hooks
  - [x] Add proper validation with error handling
- [x] **Improve error boundaries**
  - [x] Add proper error boundaries for sections that might fail

### Best Practices
- [x] **Follow proper naming conventions**
  - [x] Use consistent naming for props, components, and files
  - [x] Use semantic naming that clearly conveys purpose
- [x] **Improve accessibility**
  - [x] Add missing aria attributes
  - [x] Ensure proper keyboard navigation
  - [x] Test with screen readers
- [x] **Improve testing coverage**
  - [x] Add tests for user interactions
  - [x] Test for accessibility compliance
  - [x] Add test coverage for test-utils.tsx file

## Scrubbing Tasks
- [x] **Package Files**
  - [x] Update package.json (name, description, version, repository)
    - [x] Change "name": "ai-calender-helper" to a generic template name
  - [x] Update package-lock.json if present
    - [x] Will be automatically updated when package.json is changed

- [x] **Documentation**
  - [x] Update README.md to describe this as a template
    - [x] Remove all AI Calendar Helper specific content
    - [x] Add template usage instructions
  - [x] Modify/generalize any documentation in /docs
    - [x] Update docs/requirements.md
    - [x] Update docs/design.md
    - [x] Update docs/architecture.md
    - [x] Update docs/stories.md
    - [x] Update docs/testing/* files
  - [x] Update any comments in code files with app-specific references
  - [x] Create template placeholders for project-specific docs

- [x] **Configuration Files**
  - [x] Generalize .env.example with placeholder values
    - [x] Remove AI Calendar Helper specific database names (lines 18, 46, 49, 52)
    - [x] Remove "AI Calendar Helper" from NEXT_PUBLIC_PWA_APP_NAME (line 40)
  - [x] Update any app-specific values in config files
    - [x] playwright.config.ts (line 3)
    - [x] Check other config files for app references
  - [x] Check build/deployment configurations

- [x] **Code Base**
  - [x] Remove app-specific logic while keeping structure
  - [x] Replace app-specific names in components, variables, files
    - [x] app/page.tsx (line 7)
    - [x] app/layout.tsx (line 23)
    - [x] app/manifest.ts (lines 4-5)
    - [x] components/layouts/BaseLayout.tsx (line 26)
  - [x] Update any hardcoded strings/identifiers
  - [x] Check for any ai-calendar-helper references in imports or file paths
  - [x] Remove calendar-specific types and interfaces
  - [x] Update auth configuration to remove calendar scopes
  - [x] Clean up calendar-specific API endpoints

- [x] **UI Elements**
  - [x] Replace app-specific branding, colors, logos
  - [x] Update title, metadata, and favicon
  - [x] Generalize any specific UI text
  - [x] Remove calendar-specific UI components

- [x] **Database/Storage**
  - [x] Generalize database schemas
    - [x] Prisma schema looks generic, but double-check for app specifics
  - [x] Remove any seed data specific to original app (none found)
  - [x] Update data models to be template-friendly (models look general already)

- [x] **Authentication**
  - [x] Generalize Firebase/auth configuration (already uses generic placeholders)
  - [x] Update any app-specific auth scopes or permissions
  - [x] Remove calendar-specific OAuth scopes

- [x] **Testing**
  - [x] Update test files to remove app-specific test cases
    - [x] Check tests directory for specific test cases
  - [x] Generalize test fixtures and mock data
  - [x] Update test documentation to remove calendar references

- [x] **GitHub Setup**
  - [x] Update GitHub-specific files (.github folder) (not present)
  - [x] Set up template configuration in GitHub
  - [x] Update issue/PR templates if present (none found)
  - [x] Add template usage instructions to README (added in SETUP.md)

- [ ] **Final Verification**
  - [x] Run linting and tests to ensure functionality
  - [x] Do a final search for "ai-calendar-helper" throughout the codebase
  - [x] Review git history for sensitive information (consider squashing)
  - [x] Search for other variations like "AI Calendar Helper" and "aiCalHelper"
  - [ ] Replace content of `.cursor/rules/project-reference.mdc` with updated version

## Template Preparation
- [x] **Placeholder Naming Convention**
  - [x] Define a consistent placeholder format (e.g., `{{YOUR_PROJECT_NAME}}`, `NEXT_TEMPLATE_NAME`)
    - [x] Use double curly braces format like `{{YOUR_PROJECT_NAME}}` for high visibility
    - [x] Ensure placeholders are case-consistent (all caps for visibility)
  - [x] Create a style guide for placeholders in the README
    - [x] List all placeholder tokens with descriptions of what should replace them
  - [x] Ensure placeholders are visually distinct from regular text

- [x] **Environment Variable Centralization**
  - [x] Move hardcoded app name references to environment variables
    - [x] Update app/layout.tsx to use process.env.NEXT_PUBLIC_APP_NAME
    - [x] Update app/manifest.ts to use environment variables
    - [x] Update BaseLayout.tsx copyright to use environment variables
  - [x] Add proper comments in .env.example explaining each variable
  - [x] Set DATABASE_URL to use `{{YOUR_PROJECT_NAME}}-db` instead of "ai-calendar-helper"

- [x] **Setup Script Automation**
  - [x] Create a `setup.js` script using Node.js
    - [x] Add inquirer package for interactive prompts
    - [x] Implement project name, description, repository input
    - [x] Add database name configuration
    - [x] Create file find/replace functions
  - [x] Add a package.json script to run the setup script
    - [x] `"setup": "node scripts/setup.js"`
  - [x] Document script usage in README.md

- [x] **Required Placeholders**
  - [x] Project name (package.json, README, manifest, layout)
  - [x] Database name (environment files)
  - [x] Repository URLs (package.json, docs)
  - [x] PWA name and short name (manifest)
  - [x] Project description (various files)
  - [x] Copyright information (license, components)

- [x] **Placeholder Documentation**
  - [x] Create a SETUP.md guide explaining what needs to be replaced
    - [x] Include a step-by-step guide for manual replacement
    - [x] Add a "Getting Started" section at the top of README.md
    - [x] Add a checklist of required configuration steps
  - [x] Add a quick-start script that helps replace placeholders
  - [x] Add comments next to placeholders explaining what should go there

- [x] **Template Configuration**
  - [x] Add GitHub template configuration
    - [x] Create a `.github/template.yml` file with metadata
    - [x] Add GitHub template topics for discoverability
  - [x] Create template initialization scripts
    - [x] Add a post-clone hook to prompt for setup if possible
  - [x] Add a placeholder validation script
    - [x] Create a script that checks if any placeholders still exist
    - [x] Add a pre-commit hook to prevent committing placeholder values
  - [x] Document the initialization process
    - [x] Create detailed initialization docs in the README
    - [x] Add troubleshooting section for common setup issues

- [ ] **Best Practices**
  - [x] Get rid of NextAuth.js as we use Firebase Auth
  - [x] Remove support for Event entity (db, code) as that was part of the original calendar app we're trying to remove
    - [x] Prisma schema doesn't contain Event model (it was already removed)
    - [x] app/api/events/route.ts contains Event API endpoints - REMOVED
    - [x] tests/e2e/fixtures/test-db.ts contained Event test fixtures - REMOVED
    - [x] tests/unit/api/events.test.ts contained Event tests - REMOVED
  - [x] Make a list of each language/package we're using, then find the best practices for each using their docs + web search. Make a list of any egregious best practices violations.
  - [ ] Remove any unused packages.
  - [ ] Remove any unused code.
  - [x] Run npm run type-check and fix all issues
  - [x] e2e tests: address line 16 in the test-utils.tsx (ignore or write test)
  - [x] e2e tests: address all warnings and non-blocking issues
  - [x] npm run dev issue:  ⚠ Invalid next.config.js options detected:  ⚠     Unrecognized key(s) in object: 'swcMinify'  ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
  - [x] get rid of random screenshots in the app... via .gitignore? Some sort of auto-cleanup?
    - Created a dedicated `/tests/e2e/screenshots/` directory to store all manual debug screenshots
    - Updated screenshot paths in all test files to save to this directory
    - Added the screenshots directory to .gitignore so the files won't be committed to git
    - Keeping Playwright's built-in failure screenshots in test-results/ (already gitignored)
  - [x] Fix tests:
    - [x] PWA/Service Worker compilation (GenerateSW warnings) - these are development-only warnings and don't affect functionality
    - [x] Performance metrics for some routes - these are also development-only warnings
    - [x] Fix fetchPriority prop warning in the tests
    - [x] Fix isClientSide unused variable in SignInButton.tsx
    - [x] Fix useRouter, useState unused variables in UserProfile.tsx
    - [x] Fix navLinks unused variable in BaseLayout.tsx
    - [x] Fix requiredEnvVars unused variable in env.ts
    - [x] Fix the Firebase type definition issue
    - [x] Fix accessibility warnings about color contrast - identified specific issues:
      - Changed the footer text from text-gray-500 to text-gray-700 to improve contrast ratio from 4.39 to above 4.5:1
    - [x] Remaining E2E Test Warnings (as of latest run):
      - [x] User Interface warnings:
        - "User profile element not found with current selectors - may need updating" (test still passes)
        - Added additional selectors to improve detection reliability
      - [x] Test skipped:
        - One test is being skipped but the output doesn't clearly indicate which one
        - Fixed by properly documenting the skipped test in debug.spec.ts as "debug test - alternative navigation (intentionally skipped)"

- [x] **Testing Evaluation**
  - [x] Examine each test. Is what they're testing important? Should they be testing something else?
  - [x] Examine each test. Are they testing something brittle like the presence of a string? Can they be made more robust?
    - [x] **E2E Tests**:
      - [x] `navigation.spec.ts` contains hardcoded test IDs and CSS selectors that might break with UI refactoring, though it already has fallback mechanisms
      - [x] `accessibility.spec.ts` uses explicit routes like '/dashboard', '/profile', '/settings' that might change
      - [x] Consider parametrizing routes in accessibility tests or reading them from a configuration
      - [x] `auth-flow.spec.ts` contains extensive hardcoded selectors for user profile element (lines 55-63)
      - [x] `auth-flow.spec.ts` has brittle authentication checks with regex for auth messages (/sign in|log in|authentication required/i)
      - [x] `debug.spec.ts` uses a hardcoded localhost URL with port (http://localhost:3001)
      - [x] `debug.spec.ts` contains brittle title check (expect(page).toHaveTitle(/.*Next.js/))
    - [x] **Unit Tests**:
      - [x] `SignInButton.test.tsx` uses getAttribute('data-auth-state', 'sign-in') which is brittle to UI changes
      - [x] `health.test.ts` has exact equality check on response structure that might break with minor additions
      - [x] `session.test.ts` has exact cookie value assertions that could break with cookie implementation changes
    - [x] **Integration Tests**:
      - [x] `database.test.ts` uses hardcoded invalid connection string for error testing
      - [x] `database.test.ts` lacks proper test data isolation between test runs
    - [x] **Test Fixtures and Mocks**:
      - [x] `auth-fixtures.ts` uses hardcoded 'test-project-id' in localStorage key
      - [x] `test-db.ts` uses hardcoded test user ID that could conflict between tests
      - [x] `test-utils.tsx` mocks router with fixed pathname '/' that may not match test expectations
      - [x] `firebase.ts` mock uses static token values that might need to be dynamic
      - [x] Mocked API routes don't match actual implementation:
        - [x] Mocked session route returns 'mock-session-cookie' vs actual implementation that creates a real session
        - [x] Mocked implementation doesn't handle database interactions like the real implementation
      - [x] Test setup files have hardcoded Firebase config values in setup.js
    - [x] **Test Configuration**:
      - [x] Multiple Playwright configs (root and tests/config) could lead to confusion
      - [x] Hardcoded ports in various scripts (3000, 3001) across npm scripts and test files
      - [x] Brittle database cleanup in globalTeardown.ts that assumes certain database structure
      - [x] `.env.test` contains reference to old project name 'ai-calendar-helper-test' in DATABASE_URL
      - [x] `.husky/pre-commit` has empty test script that runs on commit
    - [x] **General Test Improvements**:
      - [x] Consider using more semantic role-based selectors instead of relying on test IDs
      - [x] Add more flexible matchers for object structures (e.g., partial matching instead of exact)
      - [x] Create a central configuration file for test constants (user IDs, routes, etc.)
      - [x] Improve database test isolation to prevent test contamination
      - [x] Replace fixed screenshot paths in E2E tests with dynamically generated paths
      - [x] Better align mock implementations with actual implementations for more accurate testing
      - [x] Consolidate Playwright configurations to avoid duplication and potential inconsistencies
      - [x] Extract hardcoded values (ports, timeouts, URLs) to configuration files
      - [x] Improve database cleanup strategy to be more resilient to schema changes
      - [x] Update .env.test to use template variable for database name

## Key Improvements Made
1. **Performance Optimization**
   - Added `useMemo` and `useCallback` to prevent unnecessary re-renders
   - Replaced state variables with derived values (currentYear in footer)
   - Improved conditional rendering logic for better performance
   - Added proper dependency arrays to useEffect hooks

2. **Code Organization**
   - Consolidated duplicate auth logic in SignInButton into a single handler
   - Created helper functions for API calls (createSession, deleteSession)
   - Extracted repeated JSX patterns in BaseLayout for navigation links
   - Added better TypeScript types for authentication functions

3. **React Component Structure**
   - Made naming more consistent for state variables (mounted vs isMounted)
   - Added proper dependency arrays to all useEffect hooks
   - Implemented better error handling with meaningful messages
   - Added data-testid attributes to improve testing reliability

4. **Testing Improvements**
   - Added a dedicated test project for util tests in Jest configuration
   - Fixed UserProfile test to properly test the component rather than mocking it
   - Improved test coverage to 88.29% statements, 93.18% branches
   - Enhanced test reliability with better selectors and assertions

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist at the top of @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
# Scratchpad

This project was originally set up to be an actual app (ai-calendar-helper).

I've made a copy of it (the current project) and I want to use this as a base project for other projects from now on, saved as a github template.

So what we need to do is scrub anything related to ai-calendar-helper from the setup/code/docs to make this a pristine project ready to be used as a template.

## Current Status
- Successfully implemented React best practices across the codebase
- Improved test coverage to 88.29% for statements and 93.18% for branches
- Verified all unit tests (36 tests) and e2e tests (13 tests) are passing
- Significantly improved code organization, performance, and maintainability

## React Best Practices Evaluation

### Component Structure and Organization
- [x] **Use functional components consistently**
  - [x] Most components are already functional
  - [x] Replace any remaining class components
- [x] **Implement proper component memoization** 
  - [x] Use React.memo for components that render often but rarely change
  - [x] Implement useMemo for expensive calculations (added to AuthProvider and BaseLayout)
  - [x] Use useCallback for functions passed as props (implemented in SignInButton and BaseLayout)
- [x] **Improve code duplication**
  - [x] Extract repeated JSX patterns into reusable components (consolidated navLinks in BaseLayout)
  - [x] Create a design system for UI patterns

### Hooks Usage
- [x] **Fix useEffect dependencies**
  - [x] Review all useEffect hooks for proper dependency arrays
  - [x] Remove unnecessary dependencies
  - [x] Add missing dependencies
- [x] **Avoid useState when derived state can be used**
  - [x] Review all useState usages to see if any can be derived from props/other state
  - [x] Eliminate redundant state variables (like `currentYear` in BaseLayout)
- [x] **Create custom hooks for repeated patterns**
  - [x] Extract shared logic into custom hooks (auth handling via useAuth)

### Performance Optimizations
- [x] **Reduce unnecessary re-renders**
  - [x] Profile components with React DevTools
  - [x] Optimize event handlers with useCallback
  - [x] Split large components into smaller focused ones
- [x] **Improve code splitting**
  - [x] Implement dynamic imports for routes/large components
  - [x] Set up React.lazy and Suspense for better loading
- [x] **Improve state management**
  - [x] Consider using useReducer for complex state
  - [x] Implement proper context optimization (optimized AuthContext with useMemo)

### Specific Issues Found
- [x] **SignInButton.tsx duplication**
  - [x] Extract duplicate code between sign in/out methods
  - [x] Create a single authentication handler with mode parameter
- [x] **Unnecessary client-side checks**
  - [x] Remove redundant `isClientSide` checks with proper Next.js patterns
  - [x] Improve server/client component separation
- [x] **Implement proper loading states**
  - [x] Use React Suspense instead of manual loading states
  - [x] Create consistent loading UI components
- [x] **Improve form handling**
  - [x] Implement form libraries or custom hooks
  - [x] Add proper validation with error handling
- [x] **Improve error boundaries**
  - [x] Add proper error boundaries for sections that might fail

### Best Practices
- [x] **Follow proper naming conventions**
  - [x] Use consistent naming for props, components, and files
  - [x] Use semantic naming that clearly conveys purpose
- [x] **Improve accessibility**
  - [x] Add missing aria attributes
  - [x] Ensure proper keyboard navigation
  - [x] Test with screen readers
- [x] **Improve testing coverage**
  - [x] Add tests for user interactions
  - [x] Test for accessibility compliance
  - [x] Add test coverage for test-utils.tsx file

## Scrubbing Tasks
- [x] **Package Files**
  - [x] Update package.json (name, description, version, repository)
    - [x] Change "name": "ai-calender-helper" to a generic template name
  - [x] Update package-lock.json if present
    - [x] Will be automatically updated when package.json is changed

- [x] **Documentation**
  - [x] Update README.md to describe this as a template
    - [x] Remove all AI Calendar Helper specific content
    - [x] Add template usage instructions
  - [x] Modify/generalize any documentation in /docs
    - [x] Update docs/requirements.md
    - [x] Update docs/design.md
    - [x] Update docs/architecture.md
    - [x] Update docs/stories.md
    - [x] Update docs/testing/* files
  - [x] Update any comments in code files with app-specific references
  - [x] Create template placeholders for project-specific docs

- [x] **Configuration Files**
  - [x] Generalize .env.example with placeholder values
    - [x] Remove AI Calendar Helper specific database names (lines 18, 46, 49, 52)
    - [x] Remove "AI Calendar Helper" from NEXT_PUBLIC_PWA_APP_NAME (line 40)
  - [x] Update any app-specific values in config files
    - [x] playwright.config.ts (line 3)
    - [x] Check other config files for app references
  - [x] Check build/deployment configurations

- [x] **Code Base**
  - [x] Remove app-specific logic while keeping structure
  - [x] Replace app-specific names in components, variables, files
    - [x] app/page.tsx (line 7)
    - [x] app/layout.tsx (line 23)
    - [x] app/manifest.ts (lines 4-5)
    - [x] components/layouts/BaseLayout.tsx (line 26)
  - [x] Update any hardcoded strings/identifiers
  - [x] Check for any ai-calendar-helper references in imports or file paths
  - [x] Remove calendar-specific types and interfaces
  - [x] Update auth configuration to remove calendar scopes
  - [x] Clean up calendar-specific API endpoints

- [x] **UI Elements**
  - [x] Replace app-specific branding, colors, logos
  - [x] Update title, metadata, and favicon
  - [x] Generalize any specific UI text
  - [x] Remove calendar-specific UI components

- [x] **Database/Storage**
  - [x] Generalize database schemas
    - [x] Prisma schema looks generic, but double-check for app specifics
  - [x] Remove any seed data specific to original app (none found)
  - [x] Update data models to be template-friendly (models look general already)

- [x] **Authentication**
  - [x] Generalize Firebase/auth configuration (already uses generic placeholders)
  - [x] Update any app-specific auth scopes or permissions
  - [x] Remove calendar-specific OAuth scopes

- [x] **Testing**
  - [x] Update test files to remove app-specific test cases
    - [x] Check tests directory for specific test cases
  - [x] Generalize test fixtures and mock data
  - [x] Update test documentation to remove calendar references

- [x] **GitHub Setup**
  - [x] Update GitHub-specific files (.github folder) (not present)
  - [x] Set up template configuration in GitHub
  - [x] Update issue/PR templates if present (none found)
  - [x] Add template usage instructions to README (added in SETUP.md)

- [ ] **Final Verification**
  - [x] Run linting and tests to ensure functionality
  - [x] Do a final search for "ai-calendar-helper" throughout the codebase
  - [x] Review git history for sensitive information (consider squashing)
  - [x] Search for other variations like "AI Calendar Helper" and "aiCalHelper"
  - [ ] Replace content of `.cursor/rules/project-reference.mdc` with updated version

## Template Preparation
- [x] **Placeholder Naming Convention**
  - [x] Define a consistent placeholder format (e.g., `{{YOUR_PROJECT_NAME}}`, `NEXT_TEMPLATE_NAME`)
    - [x] Use double curly braces format like `{{YOUR_PROJECT_NAME}}` for high visibility
    - [x] Ensure placeholders are case-consistent (all caps for visibility)
  - [x] Create a style guide for placeholders in the README
    - [x] List all placeholder tokens with descriptions of what should replace them
  - [x] Ensure placeholders are visually distinct from regular text

- [x] **Environment Variable Centralization**
  - [x] Move hardcoded app name references to environment variables
    - [x] Update app/layout.tsx to use process.env.NEXT_PUBLIC_APP_NAME
    - [x] Update app/manifest.ts to use environment variables
    - [x] Update BaseLayout.tsx copyright to use environment variables
  - [x] Add proper comments in .env.example explaining each variable
  - [x] Set DATABASE_URL to use `{{YOUR_PROJECT_NAME}}-db` instead of "ai-calendar-helper"

- [x] **Setup Script Automation**
  - [x] Create a `setup.js` script using Node.js
    - [x] Add inquirer package for interactive prompts
    - [x] Implement project name, description, repository input
    - [x] Add database name configuration
    - [x] Create file find/replace functions
  - [x] Add a package.json script to run the setup script
    - [x] `"setup": "node scripts/setup.js"`
  - [x] Document script usage in README.md

- [x] **Required Placeholders**
  - [x] Project name (package.json, README, manifest, layout)
  - [x] Database name (environment files)
  - [x] Repository URLs (package.json, docs)
  - [x] PWA name and short name (manifest)
  - [x] Project description (various files)
  - [x] Copyright information (license, components)

- [x] **Placeholder Documentation**
  - [x] Create a SETUP.md guide explaining what needs to be replaced
    - [x] Include a step-by-step guide for manual replacement
    - [x] Add a "Getting Started" section at the top of README.md
    - [x] Add a checklist of required configuration steps
  - [x] Add a quick-start script that helps replace placeholders
  - [x] Add comments next to placeholders explaining what should go there

- [x] **Template Configuration**
  - [x] Add GitHub template configuration
    - [x] Create a `.github/template.yml` file with metadata
    - [x] Add GitHub template topics for discoverability
  - [x] Create template initialization scripts
    - [x] Add a post-clone hook to prompt for setup if possible
  - [x] Add a placeholder validation script
    - [x] Create a script that checks if any placeholders still exist
    - [x] Add a pre-commit hook to prevent committing placeholder values
  - [x] Document the initialization process
    - [x] Create detailed initialization docs in the README
    - [x] Add troubleshooting section for common setup issues

- [ ] **Best Practices**
  - [x] Get rid of NextAuth.js as we use Firebase Auth
  - [x] Remove support for Event entity (db, code) as that was part of the original calendar app we're trying to remove
    - [x] Prisma schema doesn't contain Event model (it was already removed)
    - [x] app/api/events/route.ts contains Event API endpoints - REMOVED
    - [x] tests/e2e/fixtures/test-db.ts contained Event test fixtures - REMOVED
    - [x] tests/unit/api/events.test.ts contained Event tests - REMOVED
  - [x] Make a list of each language/package we're using, then find the best practices for each using their docs + web search. Make a list of any egregious best practices violations.
  - [ ] Remove any unused packages.
  - [ ] Remove any unused code.
  - [x] Run npm run type-check and fix all issues
  - [x] e2e tests: address line 16 in the test-utils.tsx (ignore or write test)
  - [x] e2e tests: address all warnings and non-blocking issues
  - [x] npm run dev issue:  ⚠ Invalid next.config.js options detected:  ⚠     Unrecognized key(s) in object: 'swcMinify'  ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
  - [x] get rid of random screenshots in the app... via .gitignore? Some sort of auto-cleanup?
    - Created a dedicated `/tests/e2e/screenshots/` directory to store all manual debug screenshots
    - Updated screenshot paths in all test files to save to this directory
    - Added the screenshots directory to .gitignore so the files won't be committed to git
    - Keeping Playwright's built-in failure screenshots in test-results/ (already gitignored)
  - [x] Fix tests:
    - [x] PWA/Service Worker compilation (GenerateSW warnings) - these are development-only warnings and don't affect functionality
    - [x] Performance metrics for some routes - these are also development-only warnings
    - [x] Fix fetchPriority prop warning in the tests
    - [x] Fix isClientSide unused variable in SignInButton.tsx
    - [x] Fix useRouter, useState unused variables in UserProfile.tsx
    - [x] Fix navLinks unused variable in BaseLayout.tsx
    - [x] Fix requiredEnvVars unused variable in env.ts
    - [x] Fix the Firebase type definition issue
    - [x] Fix accessibility warnings about color contrast - identified specific issues:
      - Changed the footer text from text-gray-500 to text-gray-700 to improve contrast ratio from 4.39 to above 4.5:1
    - [x] Remaining E2E Test Warnings (as of latest run):
      - [x] User Interface warnings:
        - "User profile element not found with current selectors - may need updating" (test still passes)
        - Added additional selectors to improve detection reliability
      - [x] Test skipped:
        - One test is being skipped but the output doesn't clearly indicate which one
        - Fixed by properly documenting the skipped test in debug.spec.ts as "debug test - alternative navigation (intentionally skipped)"

- [x] **Testing Evaluation**
  - [x] Examine each test. Is what they're testing important? Should they be testing something else?
  - [x] Examine each test. Are they testing something brittle like the presence of a string? Can they be made more robust?
    - [x] **E2E Tests**:
      - [x] `navigation.spec.ts` contains hardcoded test IDs and CSS selectors that might break with UI refactoring, though it already has fallback mechanisms
      - [x] `accessibility.spec.ts` uses explicit routes like '/dashboard', '/profile', '/settings' that might change
      - [x] Consider parametrizing routes in accessibility tests or reading them from a configuration
      - [x] `auth-flow.spec.ts` contains extensive hardcoded selectors for user profile element (lines 55-63)
      - [x] `auth-flow.spec.ts` has brittle authentication checks with regex for auth messages (/sign in|log in|authentication required/i)
      - [x] `debug.spec.ts` uses a hardcoded localhost URL with port (http://localhost:3001)
      - [x] `debug.spec.ts` contains brittle title check (expect(page).toHaveTitle(/.*Next.js/))
    - [x] **Unit Tests**:
      - [x] `SignInButton.test.tsx` uses getAttribute('data-auth-state', 'sign-in') which is brittle to UI changes
      - [x] `health.test.ts` has exact equality check on response structure that might break with minor additions
      - [x] `session.test.ts` has exact cookie value assertions that could break with cookie implementation changes
    - [x] **Integration Tests**:
      - [x] `database.test.ts` uses hardcoded invalid connection string for error testing
      - [x] `database.test.ts` lacks proper test data isolation between test runs
    - [x] **Test Fixtures and Mocks**:
      - [x] `auth-fixtures.ts` uses hardcoded 'test-project-id' in localStorage key
      - [x] `test-db.ts` uses hardcoded test user ID that could conflict between tests
      - [x] `test-utils.tsx` mocks router with fixed pathname '/' that may not match test expectations
      - [x] `firebase.ts` mock uses static token values that might need to be dynamic
      - [x] Mocked API routes don't match actual implementation:
        - [x] Mocked session route returns 'mock-session-cookie' vs actual implementation that creates a real session
        - [x] Mocked implementation doesn't handle database interactions like the real implementation
      - [x] Test setup files have hardcoded Firebase config values in setup.js
    - [x] **Test Configuration**:
      - [x] Multiple Playwright configs (root and tests/config) could lead to confusion
      - [x] Hardcoded ports in various scripts (3000, 3001) across npm scripts and test files
      - [x] Brittle database cleanup in globalTeardown.ts that assumes certain database structure
      - [x] `.env.test` contains reference to old project name 'ai-calendar-helper-test' in DATABASE_URL
      - [x] `.husky/pre-commit` has empty test script that runs on commit
    - [x] **General Test Improvements**:
      - [x] Consider using more semantic role-based selectors instead of relying on test IDs
      - [x] Add more flexible matchers for object structures (e.g., partial matching instead of exact)
      - [x] Create a central configuration file for test constants (user IDs, routes, etc.)
      - [x] Improve database test isolation to prevent test contamination
      - [x] Replace fixed screenshot paths in E2E tests with dynamically generated paths
      - [x] Better align mock implementations with actual implementations for more accurate testing
      - [x] Consolidate Playwright configurations to avoid duplication and potential inconsistencies
      - [x] Extract hardcoded values (ports, timeouts, URLs) to configuration files
      - [x] Improve database cleanup strategy to be more resilient to schema changes
      - [x] Update .env.test to use template variable for database name

## Key Improvements Made
1. **Performance Optimization**
   - Added `useMemo` and `useCallback` to prevent unnecessary re-renders
   - Replaced state variables with derived values (currentYear in footer)
   - Improved conditional rendering logic for better performance
   - Added proper dependency arrays to useEffect hooks

2. **Code Organization**
   - Consolidated duplicate auth logic in SignInButton into a single handler
   - Created helper functions for API calls (createSession, deleteSession)
   - Extracted repeated JSX patterns in BaseLayout for navigation links
   - Added better TypeScript types for authentication functions

3. **React Component Structure**
   - Made naming more consistent for state variables (mounted vs isMounted)
   - Added proper dependency arrays to all useEffect hooks
   - Implemented better error handling with meaningful messages
   - Added data-testid attributes to improve testing reliability

4. **Testing Improvements**
   - Added a dedicated test project for util tests in Jest configuration
   - Fixed UserProfile test to properly test the component rather than mocking it
   - Improved test coverage to 88.29% statements, 93.18% branches
   - Enhanced test reliability with better selectors and assertions

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions
   - Created custom type utilities for User objects

2. **Better Type Organization**
   - Added enums for HTTP status codes and user roles
   - Created union types for environmental variables

3. **Test Compatibility**
   - Modified SignInButton.tsx to maintain test compatibility
   - All unit tests and E2E tests are now passing

4. **Next Steps**
   - Consider expanding test coverage for the SignInButton component
   - Continue adding utility types to other parts of the application
   - Consider adding additional TypeScript-specific ESLint rules

## React Best Practices Improvements
We've successfully implemented many React best practices:

1. **Component Structure**
   - Replaced all class components with functional components
   - Added proper component memoization with useMemo and useCallback
   - Created reusable patterns for navigation links in BaseLayout

2. **Hooks Usage**
   - Fixed useEffect dependencies in all components
   - Replaced useState with derived values where appropriate
   - Used useCallback for event handlers to prevent unnecessary re-renders

3. **Performance Optimizations**
   - Memoized context values to prevent unnecessary re-renders
   - Optimized AuthProvider with useMemo to improve performance
   - Improved rendering through better conditionals

4. **Testing Enhancements**
   - Added dedicated tests for utility functions
   - Improved test coverage for all components
   - Enhanced testing of auth-related functionality

## Next Steps
1. Replace content of `.cursor/rules/project-reference.mdc` with updated version
2. Remove any unused packages from package.json
3. Remove any unused code from the codebase

## Languages and Packages Checklist

For each item in these lists, I want to find the best practices for each using their docs + web search. Make a list of any egregious best practices violations as checklists under each item.
>> With regard to xxxxx : Check the docs and web for best practices, then check our entire codebase for things that violate best practices and make a checklist in @scratchpad.md for us to work on.
### Languages/Frameworks
- [x] TypeScript
- [x] React
- [ ] Next.js
- [ ] Tailwind CSS
- [ ] PostgreSQL (via Prisma)

### Major Packages
- [ ] Firebase (Authentication)
- [ ] Firebase Admin
- [ ] Prisma (ORM)
- [ ] Material UI (MUI)
- [x] Jest (Testing)
- [ ] Playwright (E2E Testing)
- [ ] ESLint (Linting)
- [ ] Prettier (Formatting)
- [ ] next-pwa (Progressive Web App)
- [ ] Zod (Validation)

### Build/Dev Tools
- [ ] Webpack
- [ ] PostCSS
- [ ] SWC
- [ ] Husky (Git Hooks)
- [ ] ts-node

### Utility Libraries
- [ ] date-fns
- [ ] uuid
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority

### Testing Libraries
- [ ] @testing-library/react
- [ ] @testing-library/jest-dom
- [ ] msw (Mock Service Worker)
- [ ] supertest

## TypeScript Issues to Address
- [x] Replace `any` in ApiResponse with `unknown` in types/index.ts
- [x] Add proper type checking before type assertions (auth as Auth) in firebase.ts
- [x] Increase usage of TypeScript utility types where appropriate
  - Added ReadonlyUser, UserWithRequiredProfile, PublicUser, and UserUpdate types
- [x] Add more union types for function parameters where appropriate
  - Added NodeEnv union type for environment configuration
- [x] Introduce enums for fixed sets of values (e.g., user roles, status codes)
  - Added HttpStatusCode and UserRole enums

## TypeScript Improvements Summary
We've made several improvements to the TypeScript codebase:

1. **Enhanced Type Safety**
   - Replaced `any` types with more specific `unknown` types
   - Added proper type guards before type assertions