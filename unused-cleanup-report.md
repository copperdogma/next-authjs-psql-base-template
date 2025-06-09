# Unused Code Cleanup Report

## Summary

This report identifies unused variables, code, files, and packages in the codebase that can be safely removed to improve maintainability and reduce bundle size.

## 🚨 Unused Variables & Parameters (142 instances found)

### High Priority - Production Code

1. **app/page.tsx**: `_session` variable assigned but never used
2. **app/profile/components/NameEditSection.tsx**: `isEditing` and `payload` parameters unused (2 instances each)
3. **app/profile/components/ProfileDetailsSection.tsx**: `details` parameter unused
4. **components/auth/CredentialsLoginForm.tsx**: Multiple unused event parameters and variables
5. **components/ui/DateTimePicker.tsx**: `date` parameter unused
6. **lib/actions/auth.actions.ts**: `password` and `saltOrRounds` parameters unused
7. **lib/auth-edge.ts**: Multiple unused parameters in auth callbacks
8. **lib/redis.ts**: Several unused parameters in callback functions
9. **next.config.ts**: `_dev` and `_webpack` parameters unused

### Medium Priority - Service Layer

10. **lib/services/user-service.ts**: `prismaClient` and `logger` assigned but never used
11. **lib/services/raw-query-service.ts**: `prismaClient` and `logger` assigned but never used
12. **lib/services/profile-service.ts**: `logger` assigned but never used
13. **lib/store/userStore.ts**: `details` parameter unused
14. **lib/utils.ts**: `password` variable assigned but never used

### Low Priority - Test Files & Mocks

15. **tests/** directory: 35+ unused variables in test files (parameters, error objects, etc.)
16. **examples/batched-logging-example.ts**: 8 unused parameters
17. **lib/auth/**mocks**/**: Multiple unused parameters in mock functions

## 📁 Unused/Example Files

### 1. Examples Directory

- **examples/batched-logging-example.ts**: Example file that imports non-existent modules and has many unused variables
  - Status: Can be removed or moved to documentation
  - Contains mock implementations for demonstration only

### 2. Form Components

- **components/forms/ExampleForm.tsx**: Example form component using custom form fields
  - Status: Template/example code - may be kept for reference or removed if not needed

### 3. Deprecated Services

- **lib/db/user-service.ts**: Marked as deprecated, replaced by `lib/services/user-service.ts`
- **lib/db/raw-query-service.ts**: Marked as deprecated, replaced by `lib/services/raw-query-service.ts`
  - Status: These can be safely removed as they're marked deprecated and forward calls to new implementations

### 4. Backward Compatibility

- **lib/theme.ts**: Simple re-export file for backward compatibility
  - Status: Keep for now as it serves a purpose

## 📦 Unused Dependencies

### Direct Dependencies to Remove

1. **react-hot-toast** (`^2.5.2`): No imports found in codebase
   - The project uses a custom `Toaster` component with MUI instead
   - Safe to remove

### DevDependencies to Review

1. **@types/supertest** (`^6.0.3`): No supertest usage found
   - Safe to remove
2. **supertest** (`^7.1.0`): No imports or usage found
   - Safe to remove
3. **rimraf** (`^6.0.1`): Not used in any npm scripts
   - Safe to remove (Next.js handles cleanup with built-in commands)

### Keep (Still Used)

- **bcryptjs**: Used in auth, seeding, and tests ✓
- **react-icons**: Used for Google OAuth icon ✓
- **zustand**: Used for client state management ✓
- **husky**: Used for git hooks (`.husky/` directory exists) ✓
- **server-only**: Used in profile actions ✓

## 🧹 Unused Type Definitions

### types/index.ts

- Multiple HTTP status code constants (OK, CREATED, ACCEPTED, etc.) defined but never used
- 14 unused status code exports
- Status: Can be removed or kept for future API development

## 🔧 Recommended Cleanup Actions

### Phase 1: Remove Unused Dependencies

```bash
npm uninstall react-hot-toast @types/supertest supertest rimraf
```

### Phase 2: Remove Deprecated Files

- Delete `lib/db/user-service.ts`
- Delete `lib/db/raw-query-service.ts`
- Delete `examples/batched-logging-example.ts`

### Phase 3: Fix Unused Variables (ESLint Auto-fix)

```bash
npm run lint:fix
```

### Phase 4: Manual Variable Cleanup

- Review and fix the 142 unused variables identified by ESLint
- Focus on production code first, then tests
- Use underscore prefix for intentionally unused parameters (e.g., `_session`, `_error`)

### Phase 5: Consider Removing

- `components/forms/ExampleForm.tsx` (if not needed as reference)
- Unused HTTP status constants in `types/index.ts`

## 📊 Cleanup Impact

### Bundle Size Reduction

- Removing `react-hot-toast`: ~40KB
- Removing `supertest` + types: ~200KB (dev only)
- Total estimated dev dependency reduction: ~240KB

### Code Quality

- Removing 142 unused variables will eliminate ESLint warnings
- Cleaner codebase with fewer distractions
- Better maintainability

### Maintenance

- Fewer dependencies to update and maintain
- Reduced security surface area
- Cleaner package.json

## ⚠️ Cautions

1. **Examples Directory**: Consider if `ExampleForm.tsx` serves as important documentation
2. **Type Definitions**: HTTP status constants might be used in future API development
3. **Test Files**: Some unused variables in tests might be intentional for readability
4. **Deprecated Services**: Ensure all references have been migrated before deletion

## 🎯 Next Steps

1. Run the dependency removal commands
2. Delete deprecated files
3. Run ESLint with fix to handle simple cases
4. Manually review and fix remaining unused variables
5. Update imports/exports as needed
6. Run full test suite to ensure nothing breaks
7. Update documentation if needed
