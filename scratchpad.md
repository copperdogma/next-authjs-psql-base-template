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

---

Okay, here's a comprehensive markdown checklist incorporating all previous recommendations, with a primary focus on removing Firebase for core authentication and simplifying the template. This checklist is designed to be actionable by another AI model.

---

# Template Refinement & Simplification Checklist

**Overall Goal:** Transform the current Next.js, Firebase, and PSQL template into a simpler, more elegant, and ready-to-use out-of-the-box base project. The primary strategy involves removing Firebase as a core authentication component and relying on NextAuth.js with Prisma for a streamlined PostgreSQL-centric user management system. This will reduce complexity, dependencies, and setup overhead for users of the template.

---

## I. Core Authentication Overhaul: Removing Firebase for Authentication

**Rationale:** The current setup uses NextAuth.js alongside a custom Firebase session mechanism and Firebase for user identity management (even for email/password). This creates redundancy and unnecessary complexity. NextAuth.js with its Google Provider and Credentials Provider, backed directly by Prisma/PostgreSQL, will provide a simpler, more maintainable architecture.

- [x] Remove Firebase Auth SDK dependencies
- [x] Update NextAuth.js configuration to use Prisma adapter for PostgreSQL
- [x] Implement Credentials provider for email/password auth
- [x] Integrate Google OAuth provider directly through NextAuth.js
- [x] Refactor login/register flows for the simplified auth system
- [x] Update session handling to use NextAuth.js JWT strategy
- [x] Add proper error handling for auth operations
- [x] Implement username/password validation
- [x] Create efficient database migration scripts
- [x] Update middleware for route protection
- [x] Simplify user profile management using direct Prisma queries

## II. Data Layer Simplification

**Rationale:** Having both Firebase and PostgreSQL as data stores creates confusion and complexity. A single database approach with PostgreSQL will simplify development and operations.

- [x] Identify all Firestore data collections in use
- [x] Create equivalent PostgreSQL schema definitions
- [x] Migrate profile data management to PostgreSQL
- [x] Implement data access services for PostgreSQL
- [x] Update existing components to use the new data services
- [x] Remove Firebase data layer code and dependencies
- [x] Provide migration utilities for any existing Firebase data

## III. Configuration and Environment Setup

**Rationale:** The current template has a complex setup involving Firebase configuration alongside NextAuth and PostgreSQL. A streamlined environment setup will make it easier for new developers to get started.

- [x] Simplify environment variable requirements
- [x] Update configuration files for database connections
- [x] Remove Firebase-specific configuration
- [x] Create comprehensive sample environment files
- [x] Update documentation with clear setup instructions
- [x] Simplify server initialization process

## IV. Testing Infrastructure Updates

**Rationale:** The existing testing setup involves mocking both Firebase and PostgreSQL. Streamlining to a single database approach will simplify the test environment.

- [x] Update unit tests to work with PostgreSQL-only setup
- [x] Fix E2E tests to work with new auth mechanisms
- [x] Remove Firebase-specific test utilities and mocks
- [x] Ensure all existing tests pass with the new architecture
- [✅] Validate the entire test suite runs successfully

## V. Documentation Updates

**Rationale:** Clear documentation will help users understand the simplified architecture and get started quickly.

- [x] Update README with new architecture overview
- [x] Create clear setup instructions for NextAuth.js and PostgreSQL
- [x] Document authentication flows and customization options
- [x] Update API documentation to reflect changes
- [x] Provide examples of common customization scenarios

## Completed Tasks

- [x] Removed Firebase Auth SDK dependencies
- [x] Migrated user authentication to NextAuth.js with Prisma adapter
- [x] Implemented direct PostgreSQL data access layer
- [x] Updated session management to use NextAuth.js JWT strategy
- [x] Simplified environment configuration
- [x] Updated testing infrastructure
- [x] Updated documentation for the new architecture
- [✅] All tests are now passing - Fixed auth-jwt test, auth-node test, and profile service test issues. All unit tests and E2E tests now run successfully.

---

## Post-Refactor Verification Checklist (Manual Code Inspection)

This checklist is based on the review of the "Template Refinement & Simplification Checklist" and the `cnew-task-review-optimize-diff` protocol. It focuses on areas for manual code inspection.

### 1. Security Verification

- [x] **Input Validation:**
  - [x] Authentication inputs are validated using Zod schemas in `lib/actions/auth.actions.ts` for registration and in `app/register/hooks/useRegistrationForm.ts` for the client-side form
  - [x] Email format and password length (min 8 chars) are properly validated
  - [x] Password confirmation is verified client-side with matching validation
- [x] **NextAuth.js Configuration:**
  - [x] `NEXTAUTH_SECRET` is properly required and validated in `lib/env.ts` using Zod schema
  - [x] Tests verify that production environment will throw an error if NEXTAUTH_SECRET is missing
  - [x] Development environment has a fallback default secret with appropriate warnings
  - [x] CSRF protection is active via NextAuth.js default protections
  - [x] Session strategy (JWT) settings are properly configured:
    - [x] Cookie settings include httpOnly, secure (in production), and sameSite: 'lax'
    - [x] Cookies use the `__Secure-` prefix in production
    - [x] Sessions expire after 30 days (maxAge: 30 _ 24 _ 60 \* 60)
    - [x] Unit tests verify these security settings
- [x] **Prisma Usage:**
  - [x] No direct SQL injection vulnerabilities found
  - [x] Raw SQL queries are properly parameterized using Prisma's $queryRaw with Prisma.raw for safe parameter handling
  - [x] RawQueryService follows best practices for handling raw queries with proper error handling
- [x] **Dependency Audit:**
  - [x] Firebase auth dependencies successfully removed
  - [x] Current dependencies are from trusted sources and up-to-date (Next.js 15.3.0, NextAuth 5.0.0-beta.25)
  - [x] Security-focused packages like bcryptjs for password hashing are properly implemented

### 2. Error Handling Verification

- [x] **Comprehensive Auth Error Handling:**
  - [x] API routes for NextAuth have robust error handling (auth-node.ts, auth-edge.ts)
  - [x] Registration flows have detailed error handling in `lib/actions/auth.actions.ts`:
    - [x] Input validation errors are returned with specific details
    - [x] Database errors during user creation are properly caught and handled
    - [x] Existing user checks prevent duplicate registrations
    - [x] Rate limiting errors are handled when Redis is configured
  - [x] Login form has error handling for invalid credentials via NextAuth's error system
  - [x] Error messages are user-friendly and don't expose sensitive backend details
  - [x] Errors are properly logged with context for debugging (via Pino logger)
- [x] **Client-Side Error Management:**
  - [x] Form validation with Zod schemas provides immediate feedback
  - [x] Registration form has proper error state handling in useRegistrationForm hook
  - [x] Login form handles authentication errors appropriately
  - [x] Session state errors are properly handled during post-registration flow

### 3. Completeness of Firebase Removal (for Authentication)

- [x] **Orphaned Code:**
  - [x] Firebase Auth SDK calls and imports have been successfully removed from core authentication files
  - [x] There is a `firebase-errors.ts` utility file remaining with a note that it's for optional Firebase services and not used in the core authentication flow
  - [x] All references to Firebase Auth in the authentication system (both client and server) have been removed
  - [x] Firebase-related comments have been appropriately updated or removed
- [x] **Configuration Files:**
  - [x] Firebase Auth specific configurations for NextAuth core authentication have been removed
  - [x] Some Firebase configuration remains for optional Firebase services as documented in the project readme
- [x] **Dependencies:**
  - [x] Firebase Admin SDK for authentication has been removed
  - [x] Client-side Firebase Auth SDKs for core authentication have been removed
  - [x] `FirebaseError` is still imported in the utility file but properly documented as optional

### 4. Test Coverage Verification

- [x] **Critical Auth Paths:**
  - [x] Unit tests verify email/password login functionality via `CredentialsLoginForm.test.tsx`
  - [x] Unit tests verify registration functionality via `RegistrationForm.test.tsx`
  - [x] E2E tests cover successful login and registration flows
  - [x] E2E tests verify session creation, retrieval, and invalidation (logout) in `login-logout-cycle.spec.ts`
  - [x] E2E tests verify middleware route protection for authenticated routes in `auth.login-logout.spec.ts`
- [x] **Error Scenarios:**
  - [x] Tests cover invalid credentials scenarios
  - [x] Tests verify handling of "email already exists" during registration
  - [x] Tests check error display for OAuth failures
  - [x] Tests verify proper error handling for session update issues
- [x] **Profile Management:**
  - [x] Profile service tests in `profile-service.test.ts` verify CRUD operations
  - [x] E2E tests in `edit-profile.spec.ts` verify profile management via Prisma
- [x] **Auth Persistence:**
  - [x] Tests verify proper cookie handling and JWT strategy
  - [x] Tests check that protected routes remain protected without auth
  - [x] Tests verify automatic redirects to login when not authenticated

### 5. Documentation Accuracy Verification

- [x] **README.md:**
  - [x] The architecture overview accurately reflects the NextAuth.js/Prisma setup
  - [x] Setup instructions are clear and complete, including environment variables and database migration
  - [x] Project structure documentation matches the actual codebase structure
- [x] **Authentication Flow Documentation:**
  - [x] Clear explanation of NextAuth.js authentication flow provided
  - [x] Note about optional Firebase services properly documented
  - [x] Documentation distinguishes between core authentication (NextAuth.js) and optional Firebase services
- [x] **API Documentation:**
  - [x] Authentication endpoints are properly documented
  - [x] NextAuth.js route explanations are correct
- [x] **Environment Variables:**
  - [x] `.env.example` template in README includes all necessary variables
  - [x] Environment variable validation in `lib/env.ts` matches documented requirements
  - [x] Clear instructions for generating NEXTAUTH_SECRET

### 6. Code Clarity & Maintainability Verification

- [x] **NextAuth.js Configuration:**
  - [x] Code organization is logical with separation into:
    - [x] `auth-shared.ts`: Common configuration shared between Node and Edge runtimes
    - [x] `auth-node.ts`: Node.js specific configuration (includes Prisma adapter)
    - [x] `auth-edge.ts`: Edge runtime configuration (used in middleware)
    - [x] `auth.ts`: Main NextAuth initialization
  - [x] Configuration files are well-commented with clear explanations
  - [x] Modular organization allows for runtime-specific configurations
- [x] **Prisma Schema:**
  - [x] User model is well-defined with proper relations for NextAuth.js
  - [x] Database schema includes all necessary tables for NextAuth.js (User, Account, Session, VerificationToken)
  - [x] Indexes are properly defined for common query patterns
  - [x] Schema includes enums for role-based access control
- [x] **Data Access Logic:**
  - [x] Clean separation between database access and business logic
  - [x] Profile service provides a clean interface for user data operations
  - [x] Error handling is consistent throughout data access code
- [x] **Frontend Components:**
  - [x] Authentication components (login/register) have clear separation of concerns
  - [x] Form handling logic is encapsulated in custom hooks
  - [x] Components follow consistent patterns for state management and error handling
- [x] **Project Conventions:**
  - [x] Code follows consistent naming conventions
  - [x] File organization is logical and follows the documented project structure
  - [x] TypeScript interfaces and types are properly defined and reused

### 7. SOLID Principles & DRY Verification

- [x] **Single Responsibility:**
  - [x] Services are well-organized with clear, focused responsibilities:
    - [x] `ProfileService` handles only profile-related operations
    - [x] Authentication logic is separated from user management
    - [x] Form handling logic is isolated in custom hooks
- [x] **Interface Segregation:**
  - [x] Service interfaces are lean and focused (e.g., `ProfileServiceInterface`)
  - [x] Clear separation between edge and node authentication configurations
  - [x] Type definitions maintain consistent interfaces across the system
- [x] **Dependency Inversion:**
  - [x] Services use constructor dependency injection (e.g., `ProfileService`, `RawQueryServiceImpl`)
  - [x] Service initialization is centralized in `lib/server/services.ts`
  - [x] Default dependencies with ability to override for testing
- [x] **DRY (Don't Repeat Yourself):**
  - [x] Shared authentication configuration prevents duplication
  - [x] Helper functions for common tasks (e.g., validation, error handling)
  - [x] Reusable types and interfaces across the codebase
  - [x] Common logic extracted to shared utilities

### 8. YAGNI Application

- [x] **Removal of Unnecessary Code:**
  - [x] Most Firebase Auth code has been successfully removed
  - [x] `firebase-errors.ts` utility file is kept but properly documented as optional for future Firebase services integration
  - [x] Commented-out imports and code in `auth.actions.ts` could be fully removed
  - [x] Some Firebase-related test constants and types remain but aren't used in the core authentication flow
- [x] **Focused Implementation:**
  - [x] Authentication focuses on NextAuth.js + Prisma without unnecessary complexity
  - [x] Profile management is streamlined to use Prisma directly
  - [x] Error handling is comprehensive but not overly complex
  - [x] Documentation makes clear distinction between core auth and optional Firebase services
- [x] **Future Extensibility:**
  - [x] Design allows for adding additional authentication providers through NextAuth.js configuration
  - [x] Service interfaces and dependency injection support testing and future enhancements
  - [x] Optional Firebase services can be integrated if needed without affecting core authentication
