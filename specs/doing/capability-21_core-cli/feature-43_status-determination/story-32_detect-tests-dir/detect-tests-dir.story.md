# Story: Detect Tests Directory

## Functional Requirements

### FR1: Check if tests/ directory exists

```gherkin
GIVEN a work item path
WHEN checking for tests directory
THEN return true if tests/ exists, false otherwise
```

#### Files created/modified

1. `src/status/state.ts` [modify]: Add `hasTestsDirectory()` function

### FR2: Check if tests/ directory is empty

```gherkin
GIVEN a tests/ directory
WHEN checking if empty
THEN return true if no files (except DONE.md), false if has test files
```

#### Files created/modified

1. `src/status/state.ts` [modify]: Add `isTestsDirectoryEmpty()` function

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component             | Level | Justification                       |
| --------------------- | ----- | ----------------------------------- |
| Directory existence   | 2     | Requires real filesystem check      |
| Directory empty check | 2     | Requires reading directory contents |

### When to Escalate

This story uses Level 2 because:

- Must check real filesystem for directory existence
- Must read directory to determine if empty
- Cannot reliably test without real filesystem

## Integration Tests (Level 2)

```typescript
// test/integration/status/state.integration.test.ts
import { hasTestsDirectory, isTestsDirectoryEmpty } from "@/status/state";
import path from "path";
import { describe, expect, it } from "vitest";

describe("hasTestsDirectory", () => {
  /**
   * Level 2: Integration tests with real filesystem
   */

  it("GIVEN work item with tests dir WHEN checking THEN returns true", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/with-tests",
    );

    // When
    const result = await hasTestsDirectory(workItemPath);

    // Then
    expect(result).toBe(true);
  });

  it("GIVEN work item without tests dir WHEN checking THEN returns false", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/no-tests",
    );

    // When
    const result = await hasTestsDirectory(workItemPath);

    // Then
    expect(result).toBe(false);
  });
});

describe("isTestsDirectoryEmpty", () => {
  it("GIVEN empty tests dir WHEN checking THEN returns true", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/empty-tests/tests",
    );

    // When
    const result = await isTestsDirectoryEmpty(testsPath);

    // Then
    expect(result).toBe(true);
  });

  it("GIVEN tests dir with test files WHEN checking THEN returns false", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/with-tests/tests",
    );

    // When
    const result = await isTestsDirectoryEmpty(testsPath);

    // Then
    expect(result).toBe(false);
  });

  it("GIVEN tests dir with only DONE.md WHEN checking THEN returns true", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/only-done/tests",
    );

    // When
    const result = await isTestsDirectoryEmpty(testsPath);

    // Then
    expect(result).toBe(true); // DONE.md doesn't count as "has tests"
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `docs/code/typescript.md` - TypeScript standards
2. `docs/testing/standards.md`- Testing with Vitest

## Quality Requirements

### QR1: Async Operations

**Requirement:** Filesystem operations must be async
**Target:** Use fs/promises for async I/O
**Validation:** Functions return Promises

### QR2: Error Handling

**Requirement:** Handle ENOENT and permission errors gracefully
**Target:** Return false for ENOENT, throw for permission errors
**Validation:** Integration tests verify error cases

### QR3: DONE.md Exclusion

**Requirement:** DONE.md alone doesn't count as "has tests"
**Target:** Empty dir logic excludes DONE.md from count
**Validation:** Integration test verifies only-DONE.md case

## Completion Criteria

- [ ] All Level 2 integration tests pass
- [ ] Async filesystem operations
- [ ] Error handling for edge cases
- [ ] DONE.md correctly excluded from "has tests" check
- [ ] BDD structure (GIVEN/WHEN/THEN) in all tests
- [ ] 100% type coverage

## Documentation

1. JSDoc comments on filesystem functions
2. Error handling behavior documented
3. Examples of edge cases
