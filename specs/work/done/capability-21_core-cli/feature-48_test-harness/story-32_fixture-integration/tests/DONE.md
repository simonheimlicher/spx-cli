# Story 32: Fixture Integration - DONE

## Summary

Integrated `withTestEnv()` with the ADR-003 fixture generator, enabling declarative fixture creation with automatic cleanup.

## What Was Built

**File**: `tests/helpers/with-test-env.ts` (extended from story-21)

### Fixture Mode

```typescript
await withTestEnv({ fixture: PRESETS.SHALLOW_50 }, async ({ path }) => {
  // path contains generated fixture with 50 work items
});
```

### Integration Points

- **`generateFixtureTree(config)`** - Pure function from `fixture-generator.ts`
- **`materializeFixture(tree)`** - I/O function from `fixture-writer.ts`
- **`fixture.cleanup()`** - Cleanup delegated to MaterializedFixture

### Key Behaviors

- Accepts `FixtureConfig` directly or via `PRESETS`
- Generates tree and materializes in single call
- Cleanup uses `MaterializedFixture.cleanup()`
- Fixture option takes precedence over `emptySpecs`

## Tests Graduated

Tests are in `tests/helpers/with-test-env.integration.test.ts`:

- `GIVEN fixture: PRESETS.MINIMAL WHEN called THEN creates fixture structure`
- `GIVEN fixture: PRESETS.MINIMAL WHEN completed THEN cleans up`
- `GIVEN fixture with custom config WHEN called THEN creates matching fixture`
- `GIVEN both fixture and emptySpecs WHEN called THEN fixture takes precedence`
- `GIVEN fixture callback throws WHEN called THEN still cleans up fixture`

## Acceptance Criteria Met

- [x] AC1: Fixture option accepts `FixtureConfig`
- [x] AC2: Preset support (MINIMAL, SHALLOW_50, etc.)
- [x] AC3: Custom config support
- [x] AC4: Fixture cleanup via `fixture.cleanup()`
- [x] AC5: Option priority (fixture > emptySpecs)

## Usage Example

```typescript
import { PRESETS } from "@test/helpers/fixture-generator";
import { withTestEnv } from "@test/helpers/with-test-env";

it("GIVEN 50 items WHEN status --json THEN succeeds", async () => {
  await withTestEnv({ fixture: PRESETS.SHALLOW_50 }, async ({ path }) => {
    const { exitCode } = await execa("node", [CLI_PATH, "status", "--json"], {
      cwd: path,
    });
    expect(exitCode).toBe(0);
  });
});
```
