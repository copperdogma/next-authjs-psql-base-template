# TypeScript ESLint Rules

This document explains the TypeScript-specific ESLint rules used in this project and the reasoning behind their configuration.

## Overview

TypeScript provides strong type checking, but its benefits can be undermined by certain practices that bypass the type system. This project uses ESLint with `@typescript-eslint` plugin to enforce coding patterns that maximize the benefits of TypeScript while maintaining ease of use.

## Key TypeScript Rules

### 1. `@typescript-eslint/no-explicit-any` (Warn)

This rule discourages the use of the `any` type, which effectively disables TypeScript's type checking for that variable or expression.

**Configuration:** `"warn"`

**Reasoning:**

- Setting to `"warn"` provides a good balance between strict type safety and development flexibility
- Encourages proper typing without blocking development when `any` is occasionally needed
- Can be upgraded to `"error"` in projects requiring stricter type safety

**Example of good practice:**

```typescript
// Instead of this:
function processData(data: any): any {
  return data.value;
}

// Do this:
interface Data {
  value: string;
}

function processData(data: Data): string {
  return data.value;
}
```

### 2. `@typescript-eslint/explicit-function-return-type` (Off)

This rule requires explicit return type annotations for functions and class methods.

**Configuration:** `"off"`

**Reasoning:**

- TypeScript's type inference is generally reliable for simpler functions
- Enforcing explicit return types everywhere adds verbosity that can hinder development
- For a template project, inference provides a good balance between type safety and ease of use
- Projects with stricter requirements can enable this rule later

**Example where inference works well:**

```typescript
// TypeScript correctly infers the return type as string
function getName(user: { name: string }) {
  return user.name;
}
```

### 3. `@typescript-eslint/no-non-null-assertion` (Warn)

This rule discourages using the non-null assertion operator (`!`), which tells the compiler to treat a potentially `null` or `undefined` value as non-null.

**Configuration:** `"warn"`

**Reasoning:**

- Non-null assertions can mask potential runtime errors
- Using explicit null checks, optional chaining (`?.`), or nullish coalescing (`??`) is safer
- Setting to `"warn"` flags potentially unsafe operations without blocking development

**Example of good practice:**

```typescript
// Instead of this:
function getLength(text: string | null) {
  return text!.length; // Unsafe
}

// Do this:
function getLength(text: string | null) {
  return text?.length ?? 0; // Safe
}
```

## How These Rules Are Enforced

These rules are enforced using the `@typescript-eslint/eslint-plugin` package, configured in the project's `eslint.config.mjs` file:

```javascript
// TypeScript-specific configuration
{
  files: ['**/*.{ts,tsx}'],
  // ...
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // Other TypeScript rules...
  },
}
```

## Special Considerations

- These rules have been customized for specific file types:
  - Test files have relaxed `no-explicit-any` settings to allow for easier mocking
  - Utility files may have different settings to accommodate their special needs

## Checking and Fixing Issues

Run the following commands to check and fix TypeScript ESLint issues:

- Check issues: `npm run lint`
- Fix automatic issues: `npm run lint:fix`

## Modifying These Rules

To change the strictness of these rules for your project, edit the `eslint.config.mjs` file.
