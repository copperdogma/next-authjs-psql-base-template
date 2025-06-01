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

- [x] **Core UI Components** (Files: `components/ui/`, `components/forms/`)

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

## Core UI Components Enhancement Checklist

### I. General UI Components (`components/ui/`)

1.  **`CardDescription.tsx` (within `Card.tsx`) - ARIA Enhancement**

    - **Current State:** `CardDescription` uses `aria-describedby={props.id ? `${props.id}-title` : undefined}`, which assumes a specific ID convention (`<CardDescription_id>-title`) must exist on a corresponding `CardTitle` component.
    - **Best Practice Violation/Improvement:** While establishing ARIA relationships is crucial, forcing a specific ID-linking convention from a sub-component can be overly prescriptive for a template. A more flexible approach often involves the parent `Card` component managing these relationships or allowing the developer to define them more explicitly.
    - **Suggestion for AI:**
      - **Option A (Decouple):**
        1.  Remove the `aria-describedby={props.id ? `${props.id}-title` : undefined}` line from `components/ui/Card.tsx` (specifically within the `CardDescription` component).
        2.  Add a JSDoc comment to the main `Card` component and/or `CardDescription` and `CardTitle` components guiding the user on how to manually establish `aria-labelledby` and `aria-describedby` relationships between `CardTitle` and `CardDescription` if needed, using unique IDs they provide. Example comment:
            ```jsx
            /**
             * CardDescription component.
             * For accessibility, ensure this description is appropriately linked to a CardTitle
             * using `aria-labelledby` on this component or `aria-describedby` on the CardTitle,
             * referencing their respective unique IDs.
             */
            ```
      - **Option B (Simplify Convention - less ideal):** If a convention is desired, make it clearer. For example, if `Card` takes `titleId` and `descriptionId` props and passes them down. However, Option A is more flexible for a template.
    - **Reasoning:** Increases flexibility and reduces implicit ID contract assumptions for template users.

2.  **`Input.tsx` - Documentation Update (No Code Change to Component)**

    - **Current State:** `Input.tsx` is a styled `MuiInput`. The `project-reference.mdc` file mentions "default/outline/ghost variants" for `Input.tsx`.
    - **Best Practice Violation/Improvement:** Documentation mismatch. `Input.tsx` as implemented provides a single, consistent custom style, not variants. `TextField.tsx` is the component that offers MUI's standard variants.
    - **Suggestion for AI:**
      1.  Locate the `project-reference.mdc` file.
      2.  Find the section describing `components/ui/Input.tsx`.
      3.  Update the description to accurately reflect that `Input.tsx` is a styled version of Material UI's base `Input` component, suitable for creating more complex custom inputs, and that it does _not_ have "default/outline/ghost" variants as props.
      4.  Clarify that for standard form fields with labels, helper text, and variants (like outlined, filled, standard), `components/ui/TextField.tsx` should be used.
    - **Reasoning:** Ensures documentation accuracy, guiding users (and AI) correctly.

3.  **`Snackbar.tsx` - Enhance Configurability**

    - **Current State:** `anchorOrigin` is hardcoded to `{ vertical: 'bottom', horizontal: 'center' }`.
    - **Best Practice Violation/Improvement:** While a sensible default, a base template component benefits from configurability for common presentational aspects.
    - **Suggestion for AI:**
      1.  Open `components/ui/Snackbar.tsx`.
      2.  Modify the `SnackbarProps` interface:
          - Add an optional `anchorOrigin` prop: `anchorOrigin?: MuiSnackbarProps['anchorOrigin'];`
      3.  Update the `Snackbar` component's destructuring:
          - Add `anchorOrigin = { vertical: 'bottom', horizontal: 'center' }` to the destructured props, providing a default value.
      4.  In the `<MuiSnackbar ... />` component, change the `anchorOrigin` prop to use the new prop: `anchorOrigin={anchorOrigin}`.
    - **Reasoning:** Provides users of the template more flexibility in positioning Snackbars without needing to modify the component directly.

4.  **`Toaster.tsx` - Enhance Configurability**

    - **Current State:** The `anchorOrigin` for all toasts managed by `Toaster.tsx` is hardcoded to `{ vertical: 'bottom', horizontal: 'right' }`.
    - **Best Practice Violation/Improvement:** Similar to `Snackbar.tsx`, global configurability is beneficial.
    - **Suggestion for AI:**

      1.  Open `components/ui/Toaster.tsx`.
      2.  Define an interface for `ToasterProps` (if it doesn't exist implicitly) or add to existing props:

          ```typescript
          import { SnackbarProps as MuiSnackbarProps } from '@mui/material'; // Add if not present

          interface ToasterProps {
            // Or add to existing props interface
            anchorOrigin?: MuiSnackbarProps['anchorOrigin'];
          }
          ```

      3.  Modify the `Toaster` component to accept this prop: `export function Toaster({ anchorOrigin: globalAnchorOrigin = { vertical: 'bottom', horizontal: 'right' } }: ToasterProps) { ... }`.
      4.  Inside the `toasts.map(...)` function, when rendering the `Snackbar` component, pass the `globalAnchorOrigin`:
          ```jsx
          <Snackbar
            key={toast.id}
            // ... other props
            anchorOrigin={globalAnchorOrigin} // Use the prop from Toaster
            // ...
          />
          ```
      5.  Update any usage of `<Toaster />` in `app/layout.tsx` (or equivalent root layout) if you want to set a different default globally, e.g., `<Toaster anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />`. Otherwise, it will use the new default defined in `Toaster.tsx`.

    - **Reasoning:** Allows global default positioning for all toasts generated by the `Toaster` system.

5.  **Implement `DateTimePicker.tsx` - Missing Core Component**

    - **Current State:** Mentioned in `project-reference.mdc` but not implemented.
    - **Best Practice Violation/Improvement:** Missing a commonly needed form component.
    - **Suggestion for AI:**

      1.  Create a new file: `components/ui/DateTimePicker.tsx`.
      2.  **Dependencies:** Ensure `@mui/x-date-pickers` and a date library adapter (e.g., `@mui/x-date-pickers/AdapterDateFns` or `@mui/x-date-pickers/AdapterDayjs`) are installed. If not, instruct the user that these are typical peer dependencies for MUI X Date Pickers. (For the template, you might pre-install `AdapterDayjs` as it's lightweight).
      3.  **Implementation:**

          - Create a new component `DateTimePicker` that wraps a picker from `@mui/x-date-pickers` (e.g., `StaticDateTimePicker` for inline, or `MobileDateTimePicker` for a modal-based picker, or provide variants). For a general template, `MobileDateTimePicker` is often a good versatile choice.
          - The component should accept common props: `label`, `value`, `onChange`, `error` (boolean), `helperText`, `disabled`, `required`, and any other relevant props from the underlying MUI X picker.
          - Ensure it's styled consistently with other form inputs. You can use the `slotProps` of the MUI X picker to style its `textField`.
          - Integrate with `react-hook-form` by designing it to be easily used with RHF's `<Controller>` component or by directly accepting RHF-compatible props if a simpler integration is preferred (though Controller is more robust for complex inputs).
          - Example structure (using `MobileDateTimePicker` and simplified RHF compatibility):

            ```typescript
            // components/ui/DateTimePicker.tsx
            'use client';
            import React from 'react';
            import { MobileDateTimePicker, MobileDateTimePickerProps } from '@mui/x-date-pickers/MobileDateTimePicker';
            import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
            import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; // Or your preferred adapter
            import { TextFieldProps } from '@mui/material/TextField';

            export interface CustomDateTimePickerProps<TDate>
              extends Omit<MobileDateTimePickerProps<TDate, TDate>, 'value' | 'onChange' | 'renderInput'> {
              value: TDate | null;
              onChange: (date: TDate | null) => void;
              label: string;
              error?: boolean;
              helperText?: React.ReactNode;
              textFieldProps?: Partial<TextFieldProps>; // Allow passing props to the internal TextField
            }

            export function DateTimePicker<TDate = Date>({
              value,
              onChange,
              label,
              error,
              helperText,
              textFieldProps,
              ...muiPickerProps
            }: CustomDateTimePickerProps<TDate>) {
              return (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <MobileDateTimePicker
                    label={label}
                    value={value}
                    onChange={onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined', // Match your other form fields
                        error: error,
                        helperText: helperText,
                        ...textFieldProps,
                      },
                    }}
                    {...muiPickerProps}
                  />
                </LocalizationProvider>
              );
            }
            export default DateTimePicker;
            ```

      4.  **Testing:** Add basic unit tests for rendering and interaction.

    - **Reasoning:** Provides a crucial and common form input out-of-the-box.

### II. Form Components (`components/forms/`)

- [x] **`PasswordField.tsx` - Enhance with Show/Hide Toggle**

  - Enhanced PasswordField component with a show/hide toggle feature for better user experience
  - Added configuration option via `showToggle` prop (default: true)
  - Added visual toggle button with appropriate ARIA attributes

- [x] **`ExampleForm.tsx` - Clarify Naming or Purpose**
  - Added comprehensive JSDoc documentation clarifying that while it resembles a login form, it serves as a general template
  - Documented key features demonstrated (React Hook Form integration, Zod validation, error handling, etc.)

This checklist should be actionable for an AI to implement the suggested improvements.
