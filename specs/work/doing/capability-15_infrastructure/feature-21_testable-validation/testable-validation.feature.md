# Feature: Testable Validation

## Observable Outcome

The validation script (`scripts/run/validate.ts`) is fully testable:

- All validation steps accept dependency injection interfaces
- Pure functions separate from subprocess spawning
- 80%+ test coverage with Level 1 + Level 2 tests
- Zero `any` types in validation logic
- `scripts/**/*` included in TypeScript checking

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `docs/testing/standards.md` for level definitions.

### Level Assignment

| Component                  | Level | Justification                                     |
| -------------------------- | ----- | ------------------------------------------------- |
| `buildEslintArgs()`        | 1     | Pure function constructing CLI argument arrays    |
| `buildTypeScriptArgs()`    | 1     | Pure function selecting tsconfig based on scope   |
| `parseStdinJson()`         | 1     | Pure async parser for hook input                  |
| `validateAndExpandFiles()` | 1     | Pure function expanding paths to TypeScript files |
| `getValidationDirs()`      | 1     | Pure tsconfig parser and directory filter         |
| ESLint validation step     | 2     | Integration with real ESLint binary on fixtures   |
| TypeScript validation      | 2     | Integration with real tsc binary on fixtures      |
| Circular dependency check  | 2     | Integration with real madge binary on fixtures    |

### Escalation Rationale

- **1 → 2**: Unit tests verify argument construction logic (arrays, flags, file paths correct), but Level 2 verifies real validation tools accept those arguments and produce expected output on fixture projects

## Feature Integration Tests (Level 2)

### Test Harness

Uses `withTestEnv()` with fixture projects:

- `FIXTURES.WITH_TYPE_ERRORS` - Known TypeScript errors
- `FIXTURES.WITH_LINT_ERRORS` - Known ESLint violations
- `FIXTURES.WITH_CIRCULAR_DEPS` - Known circular imports

### Integration Test: ESLint Step

```typescript
// tests/integration/validation/eslint-step.integration.test.ts
describe("ESLint Validation Step", () => {
  it("GIVEN fixture with lint errors WHEN validating THEN detects errors", async () => {
    await withTestEnv(
      { fixture: FIXTURES.WITH_LINT_ERRORS },
      async ({ path }) => {
        const context: ValidationContext = {
          projectRoot: path,
          scope: "full",
          scopeConfig: await getTypeScriptScope("full"),
          enabledValidations: { ESLINT: true },
          isFileSpecificMode: false,
        };

        const result = await validateESLint(context);

        expect(result.success).toBe(false);
        expect(result.error).toContain("ESLint");
      },
    );
  });
});
```

## Capability Contribution

This feature enables the entire validation infrastructure capability:

- Provides testable validation steps for capability-level E2E tests
- Establishes dependency injection pattern for all validation tools
- Enables regression testing of validation logic

## Completion Criteria

- [ ] All Level 1 tests pass
- [ ] All Level 2 tests pass
- [ ] Test coverage ≥80% for scripts/run/validate.ts
- [ ] ADR-001 implementation complete
- [ ] All stories completed (21, 32, 43)
- [ ] No mocking used (DI pattern throughout)
- [ ] Zero `any` types without justification

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
