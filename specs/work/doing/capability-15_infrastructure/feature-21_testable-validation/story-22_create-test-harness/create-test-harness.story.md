# Story: Create Test Harness for Validation Tests

## Context

Story-43 (Write Comprehensive Test Suite) requires a test harness to run validation functions against isolated fixture projects. This story implements the infrastructure that Story-43 depends on.

**BSP Priority**: This story MUST have a lower BSP number than Story-43 because Story-43 depends on this infrastructure.

## Acceptance Criteria

- [ ] `withTestEnv()` harness implemented in `tests/harness/test-env.ts`
- [ ] Four minimal fixture projects created in `tests/fixtures/projects/`:
  - `with-type-errors/` - TypeScript compilation errors
  - `with-lint-errors/` - ESLint violations
  - `with-circular-deps/` - Circular dependencies
  - `clean-project/` - No errors
- [ ] Each fixture has minimal structure: `package.json`, config files, source files with intentional errors
- [ ] `withTestEnv()` creates isolated temp directories for each test
- [ ] `withTestEnv()` cleans up temp directories after tests
- [ ] Fixture constants exported for test consumption

## Implementation Tasks

1. Create `tests/harness/test-env.ts` with `withTestEnv()` function:
   - Accept `{ fixture: string }` and test callback
   - Create temp directory
   - Copy fixture project to temp directory
   - Run test callback with `{ path: string }` context
   - Clean up temp directory after test

2. Export fixture constants:

   ```typescript
   export const FIXTURES = {
     WITH_TYPE_ERRORS: "with-type-errors",
     WITH_LINT_ERRORS: "with-lint-errors",
     WITH_CIRCULAR_DEPS: "with-circular-deps",
     CLEAN_PROJECT: "clean-project",
   };
   ```

3. Create minimal fixture projects in `tests/fixtures/projects/`:

   **with-type-errors/**:
   - `package.json` - minimal package definition
   - `tsconfig.json` - TypeScript config
   - `src/has-type-error.ts` - intentional type error (e.g., string assigned to number)

   **with-lint-errors/**:
   - `package.json` - minimal package definition
   - `.eslintrc.json` or `eslint.config.js` - ESLint config
   - `src/has-lint-error.ts` - intentional lint violations (unused vars, var keyword)

   **with-circular-deps/**:
   - `package.json` - minimal package definition
   - `tsconfig.json` - TypeScript config
   - `src/a.ts` - imports b.ts
   - `src/b.ts` - imports a.ts

   **clean-project/**:
   - `package.json` - minimal package definition
   - `tsconfig.json` - TypeScript config
   - `.eslintrc.json` or `eslint.config.js` - ESLint config
   - `src/clean.ts` - no errors

4. Write tests for `withTestEnv()`:
   - Verify temp directory is created
   - Verify fixture files are copied
   - Verify cleanup happens after test
   - Verify context provides correct path

## Testing Strategy

**Level 1 (Unit):**

- Test `withTestEnv()` creates temp directories
- Test `withTestEnv()` copies fixture files correctly
- Test `withTestEnv()` cleans up after tests
- Test `withTestEnv()` handles errors gracefully

**Level 2 (Integration):**

- Verify each fixture project has expected errors:
  - Run `tsc` on `with-type-errors` → should fail
  - Run `eslint` on `with-lint-errors` → should fail
  - Run `madge` on `with-circular-deps` → should detect cycle
  - Run all tools on `clean-project` → should pass

## Definition of Done

- `withTestEnv()` harness implemented and tested
- Four fixture projects created with minimal structure
- Fixture projects verified to have expected behaviors (errors in error fixtures, clean in clean fixture)
- All harness tests passing
- Documentation in code explains fixture structure and usage
- Changes committed with passing CI

## Related Stories

- **Blocks**: Story-43 (Write Comprehensive Test Suite) - depends on this infrastructure
- **Depends on**: Story-32 (Extract Pure Functions) - validation functions must be testable

## Notes

- Keep fixtures minimal - just enough to run validation tools
- Fixtures should NOT be realistic project structures
- Each fixture should demonstrate ONE type of validation failure
- Clean fixture should pass ALL validation steps
