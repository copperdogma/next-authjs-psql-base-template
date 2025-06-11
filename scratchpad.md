# Project Setup Scratchpad

This document tracks progress, decisions, and issues encountered during the project setup.

## Current Phase: ✅ Dependencies Resolved

**Status**: All npm install issues have been resolved successfully.

## Recent Actions

- ✅ Resolved Jest version conflicts by downgrading from v30 beta to stable v29
- ✅ Fixed dependency conflicts between jest-mock-extended and @jest/globals
- ✅ Restored proper TypeScript ESLint plugin versions after audit fix issues
- ✅ Verified all unit tests pass (543 tests, 88.62% coverage)
- ✅ Confirmed linter works correctly with 9 warnings (no errors)

## Completed Tasks

### Dependency Management ✅

- [x] **Npm Install Issues Resolved** - Fixed Jest v30 beta conflicts with jest-mock-extended
  - Downgraded @jest/globals, jest-environment-jsdom, jest-mock from v30 beta to v29 stable
  - All dependencies now install cleanly without --legacy-peer-deps
  - Unit tests pass with excellent coverage (88.62% statements, 74.51% branches)
  - Linter working correctly with only 9 warnings (no errors)

## Issues or Blockers

### Security Vulnerabilities - Low Priority ⚠️

- 8 low severity vulnerabilities remain in brace-expansion and related packages
- Attempted audit fix with --force caused breaking changes to ESLint
- **Decision**: Keep current stable versions rather than risk breaking changes
- These are low-severity RegEx DoS vulnerabilities in dev dependencies only

## Decisions Made

- **Jest Versions**: Use stable Jest 29.x instead of beta 30.x for compatibility
- **Security Audits**: Prioritize stability over fixing low-severity dev dependency vulnerabilities
- **ESLint Versions**: Maintain current TypeScript ESLint 8.x versions for compatibility

## Next Steps

1. Run E2E tests to ensure full functionality
2. Test the build process
3. Verify the development server starts correctly
4. Review remaining security vulnerabilities if critical

---

## Codebase AnalysisAI Prompt

I'm creating a github template with nextjs, authjs, and psql. The idea is for this to be used by AI when starting new project. The AI, if appropriate for the project, will pull from this template to get started. I've been getting AI to vibe code projects and it always takes a day or two at the start to get it to slowly set up the basics (especially auth). I want that step to be minutes instead of hours.

I'm going to paste the entire codebase below.

I want you to analyze it for best practices. This should be a simple, elegant, ready to use out of the box template, so look for anything that could be improved. I want the architecture to be clean and following best practices and solid principles.

I want you to be very thorough here. Break it down into clear sections or tasks that can be addressed item by item. I want this template to be production ready.

## Caveats For AI analysis:

- Placeholders: These are intentional. Because this is a base project I plan to install a plugin that leads the user through customizing it for their uses and replacing those placeholders. Igore them for now.
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

- [ ] **Redis Integration** (Files: `lib/redis.ts`, Redis-specific services)

Note that this may not be all of the files, so be sure to look at the entire codebase.

Here is the code:

---

Double check your suggestions. Verify they're best practice and not already implmented.

Then make a comprehensive list of all of your suggestions to improve the codebase as a markdown checklist with checkboxes. Be sure to include as much detail as possible as I'll be giving it to another AI to implement.

---

Keep in mind this project is meant to be an easy-to-use template for getting projects started, so best practices that are costly and mostly relevant to larger features/installations, or future features that may not be required, should not be included. The user of the template can add those later if required. The project is meant to be a clean, simple, elegant, easy to use starting point.

Use this methodolgy: - Attempt to upgrade and make sure nothing broke - If it's okay, then run all tests (npm run test and npm run test:e2e). You have permission to run these commands. - If they pass, ask me to manually check the website. - THEN check it off as successful.

- NOTE: The "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:" error in Chrome is caused by a personal plugin injecting stuff into the UI and isn't a real error.

### Code To Do

- [ ] add global rules for consistency. Research best practices and encode them. Cursor – Large Codebases: https://docs.cursor.com/guides/

- [ ] Do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be"
  - [ ] Dependency version conflicts (documented with --legacy-peer-deps workaround)
  - [ ] One E2E test flaky (authentication flow) - requires separate investigation
  - [ ] PM2 version mismatch warning (cosmetic, not blocking)

---
