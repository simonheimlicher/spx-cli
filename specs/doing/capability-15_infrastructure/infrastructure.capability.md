# Capability: Infrastructure

## Success Metric

**Quantitative Target:**

- **Baseline**: Validation script with 0% test coverage, untested validation logic, no type checking on scripts/
- **Target**: ≥80% test coverage, all validation steps testable with dependency injection, scripts/ included in type checking
- **Measurement**: Coverage reports from `npm run test:coverage`, TypeScript errors = 0

## Testing Strategy

> Capabilities require **all three levels** to prove end-to-end value delivery.
> See `docs/testing/standards.md` for level definitions.

### Level Assignment

| Component         | Level | Justification                                     |
| ----------------- | ----- | ------------------------------------------------- |
| Argument builders | 1     | Pure functions constructing CLI args              |
| File parsers      | 1     | Pure string/JSON parsing logic                    |
| Scope resolution  | 1     | Pure tsconfig parsing and directory filtering     |
| Validation steps  | 2     | Integration with real tsc, ESLint, madge binaries |
| Full validation   | 3     | Complete validation workflow on real project      |

### Escalation Rationale

- **1 → 2**: Unit tests prove argument construction logic is correct, but Level 2 verifies real tools (tsc, ESLint) accept those arguments and produce expected output
- **2 → 3**: Integration tests prove individual validation steps work, but Level 3 verifies the complete validation workflow catches real errors in the project

## Capability E2E Tests (Level 3)

These tests verify the **complete validation workflow** works end-to-end.

### E2E1: Full Validation Workflow

```typescript
// test/e2e/validation-infrastructure.e2e.test.ts
describe("Capability: Validation Infrastructure", () => {
  it("GIVEN project with known errors WHEN running validation THEN all error types detected", async () => {
    await withTestEnv({ fixture: FIXTURES.WITH_ERRORS }, async ({ path }) => {
      // When: Run full validation
      const result = await execa("npx", ["tsx", "scripts/run/validate.ts"], {
        cwd: path,
        reject: false,
      });

      // Then: Validation fails and reports all error types
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("TypeScript");
      expect(result.stderr).toContain("ESLint");
      expect(result.stderr).toContain("circular");
    });
  });
});
```

### E2E2: Validation Performance

```typescript
describe("Capability: Validation Infrastructure - Performance", () => {
  it("GIVEN clean project WHEN running validation THEN completes in reasonable time", async () => {
    const startTime = Date.now();

    const result = await execa("npm", ["run", "validate"], {
      cwd: process.cwd(),
    });

    const elapsed = Date.now() - startTime;

    expect(result.exitCode).toBe(0);
    expect(elapsed).toBeLessThan(10000); // 10 seconds
  });
});
```

## System Integration

This capability is **pseudo-enduring infrastructure**:

- All capabilities depend on validation passing before commit
- Pre-commit hooks rely on validation infrastructure
- CI/CD pipelines use validation as quality gate

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 tests pass (via feature completion)
- [ ] All Level 3 E2E tests pass
- [ ] Success metric achieved: ≥80% test coverage
- [ ] `scripts/**/*` included in tsconfig.json
- [ ] All features completed (21)

**Note**: This capability is pseudo-enduring - the capability directory stays in `doing/` permanently, but individual features within it complete normally and graduate their tests. New infrastructure work continues to be added as new features.
