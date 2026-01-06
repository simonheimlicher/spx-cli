# ADR 004: Test Environment Context Manager

## Problem

E2E and integration tests require temporary filesystem fixtures with varying complexity: bare directories, empty specs structures, or full generated fixtures. Current approach scatters `mkdtemp`/`rm` boilerplate across tests with manual try/finally cleanup, leading to inconsistent patterns and potential resource leaks.

## Context

- **Business**: Test reliability directly impacts development velocity. Leaked temp directories waste disk space; forgotten cleanup leads to flaky tests.
- **Technical**: TypeScript/Vitest environment. ADR-003 established `generateFixtureTree()` and `materializeFixture()` for fixture generation. Tests need three distinct environment types: bare temp dir, empty specs structure, full fixtures.

## Decision

**Implement a unified `withTestEnv()` context manager that handles setup and teardown automatically based on declarative options.**

```typescript
// Bare temp directory
await withTestEnv(async ({ path }) => { ... });

// Empty specs/doing structure
await withTestEnv({ emptySpecs: true }, async ({ path }) => { ... });

// Full fixture from preset
await withTestEnv({ fixture: PRESETS.SHALLOW_50 }, async ({ path }) => { ... });
```

## Rationale

The context manager pattern (borrowed from Python's `with` statement and Go's `defer`) guarantees cleanup regardless of test outcome. This is superior to:

1. **Manual try/finally** - Verbose, error-prone, inconsistent across tests
2. **Vitest afterEach hooks** - Requires test-level state management, doesn't compose well
3. **Separate helper functions** - Multiple imports, cognitive overhead choosing the right one

A single `withTestEnv()` function with options provides:

- **Declarative intent** - Options describe what's needed, not how to build it
- **Guaranteed cleanup** - Finally block always executes
- **Progressive complexity** - Simple tests use simple calls; complex tests add options
- **Type safety** - Overloads ensure correct usage at compile time

The pattern mirrors the more sophisticated `withTestEnv()` from CraftFinal but strips away levels, scenarios, and infrastructure detection - keeping only temp directory management.

## Trade-offs Accepted

- **Callback nesting**: Tests wrapped in async callback. Acceptable - this is idiomatic for resource management and keeps cleanup automatic.
- **Replaces existing patterns**: Tests using `materializeFixture()` directly will need migration. Mitigation: old API remains available; migration is optional but recommended.

## Testing Strategy

### Level Coverage

| Level           | Question Answered                    | Scope                         |
| --------------- | ------------------------------------ | ----------------------------- |
| 1 (Unit)        | Does option parsing work correctly?  | Overload resolution, defaults |
| 2 (Integration) | Does filesystem setup/teardown work? | Temp dir creation and cleanup |

### Escalation Rationale

- **1 → 2**: Unit tests verify option parsing logic; integration tests verify actual filesystem operations (mkdir, rm) succeed and cleanup occurs even on test failure.

### Test Harness

| Level | Harness           | Location/Dependency               |
| ----- | ----------------- | --------------------------------- |
| 2     | Self-bootstrapped | Uses raw `mkdtemp` to test itself |

### Behaviors Verified

**Level 1 (Unit):**

- Options object correctly selects environment type
- Default (no options) produces bare temp directory config
- `emptySpecs: true` produces specs structure config
- `fixture` option passes through to fixture generator

**Level 2 (Integration):**

- Bare temp directory is created and cleaned up
- Empty specs structure creates `specs/doing/` subdirectory
- Fixture option creates full fixture via `materializeFixture()`
- Cleanup runs even when callback throws
- Cleanup is idempotent (no error if already deleted)

## Validation

### How to Recognize Compliance

You're following this decision if:

- All new E2E/integration tests use `withTestEnv()` for temp directories
- No raw `mkdtemp` + manual cleanup appears in test files
- Test functions don't have try/finally blocks for directory cleanup

### MUST

- All temp directories MUST be created in `os.tmpdir()`, never in the repository
- Cleanup MUST execute regardless of test outcome (success, failure, or exception)
- Options MUST be type-safe - invalid combinations should fail at compile time

### NEVER

- NEVER use raw `mkdtemp` with manual `rm` in new tests
- NEVER rely on Vitest `afterEach` for temp directory cleanup (use `withTestEnv` instead)
- NEVER create temp directories outside `os.tmpdir()`
