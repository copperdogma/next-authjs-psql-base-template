# TypeScript ESLint Rules: Handling `any` Types

## `no-explicit-any` Rule

In this project, we enforce strict typing by setting the `@typescript-eslint/no-explicit-any` rule to `error`. Using the `any` type bypasses TypeScript's type checking, which can lead to runtime errors and makes code harder to refactor.

### Why We Avoid `any`

- **Type Safety**: Using `any` bypasses TypeScript's type checking, which can lead to runtime errors
- **Code Documentation**: Proper types serve as documentation for your code
- **Refactoring Confidence**: Strong typing makes refactoring safer and easier
- **IDE Support**: Specific types enable better autocompletion and navigation

### Better Alternatives to `any`

Before reaching for `any`, consider these alternatives:

1. **Use `unknown`**: When you don't know the type but want type safety

   ```typescript
   function processInput(input: unknown) {
     if (typeof input === 'string') {
       // Now TypeScript knows input is a string
       return input.toUpperCase();
     }
     return String(input);
   }
   ```

2. **Create interfaces or types**: Even for complex or dynamic structures

   ```typescript
   interface ApiResponse {
     status: number;
     data: Record<string, unknown>;
     meta?: {
       page?: number;
       total?: number;
     };
   }
   ```

3. **Use generics**: For flexible, reusable components

   ```typescript
   function getValue<T>(obj: Record<string, T>, key: string): T | undefined {
     return obj[key];
   }
   ```

4. **Union types**: When a value could be one of several specific types
   ```typescript
   function formatValue(value: string | number | boolean): string {
     return String(value);
   }
   ```

### When `any` Is Actually Needed

Some rare cases where `any` may be justified:

1. **External libraries without typings**
2. **Complex interop with non-TypeScript code**
3. **Certain dynamic patterns that TypeScript cannot model**

### Disabling the Rule When Necessary

If you absolutely need to use `any`, disable the rule with an inline comment:

```typescript
// For a single line:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getDataFromExternalSource();

// For a section of code:
/* eslint-disable @typescript-eslint/no-explicit-any */
function legacyFunction(param: any): any {
  // Code with necessary any usage
}
/* eslint-enable @typescript-eslint/no-explicit-any */
```

### Permitted Usage Areas

In our codebase, the rule is automatically disabled for:

- Test utilities and fixtures
- Type definition files
- Database utility functions
- Test fixture files
- Theme configuration files

For other areas, the rule is enforced and requires explicit disabling if `any` is needed.
