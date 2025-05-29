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
- [x] Final round: search for unused vars/code/files/packages/etc.
- [ ] AutoGen(?) to do a FULL e2e test: download github repo, run setup script, run e2e test, take notes on issues/improvements: https://chatgpt.com/share/681acf9d-93fc-800a-a8cc-3e360a7a85be

### Testing and Validation Plan for Setup Process - We'll do this at the END of the project.

- **Goal:** Thoroughly test the template setup process to ensure it works flawlessly for both human developers and AI agents.

- **Approach:** Use a clean environment to simulate the experience of a new user cloning the repository and setting it up for the first time.

- **Steps:**

  1. **Preparation:**

     - Start a new, empty Cursor instance
     - Instruct the AI agent to clone the GitHub repository exaclty like this (with the dot): git clone https://github.com/copperdogma/next-authjs-psql-base-template .
     - The AI should follow the setup instructions documented in README.md and SETUP.md
     - NOTE: You can use the username/password of postgres/postgres for the database.

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
  3. Improved documentation (mostly SETUP.md) based on testing feedback
  4. Any additional setup script enhancements needed

- **Benefits:**
  - Validates the template from a true first-time user perspective
  - Identifies gaps in documentation or automation
  - Ensures the template is truly "ready to use out of the box"
  - Tests the template's usability by AI agents specifically

This structured testing approach will help ensure the template provides a smooth, error-free experience for all users, whether they're human developers or AI agents working on behalf of users.
