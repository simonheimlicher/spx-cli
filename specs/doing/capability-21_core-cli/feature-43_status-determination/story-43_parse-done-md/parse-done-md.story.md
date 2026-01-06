# Story: Parse DONE.md

## Functional Requirements

### FR1: Check if DONE.md exists

```gherkin
GIVEN a tests/ directory path
WHEN checking for DONE.md
THEN return true if DONE.md exists, false otherwise
```

#### Files created/modified

1. `src/status/state.ts` [modify]: Add `hasDoneMd()` function

### FR2: Validate DONE.md file

```gherkin
GIVEN a DONE.md file
WHEN validating
THEN verify it's a regular file (not directory or symlink)
```

#### Files created/modified

1. `src/status/state.ts` [modify]: Add file type validation

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component            | Level | Justification                  |
| -------------------- | ----- | ------------------------------ |
| DONE.md detection    | 2     | Requires real filesystem check |
| File type validation | 2     | Requires real file stat        |

### When to Escalate

This story uses Level 2 because:

- Must check real filesystem for file existence
- Must verify file type (not directory)
- Cannot reliably test without real filesystem

## Integration Tests (Level 2)

```typescript
// test/integration/status/state.integration.test.ts (continued)
import { hasDoneMd } from "@/status/state";
import path from "path";
import { describe, expect, it } from "vitest";

describe("hasDoneMd", () => {
  /**
   * Level 2: Integration tests with real filesystem
   */

  it("GIVEN tests dir with DONE.md WHEN checking THEN returns true", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-item/tests",
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(true);
  });

  it("GIVEN tests dir without DONE.md WHEN checking THEN returns false", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/in-progress/tests",
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(false);
  });

  it("GIVEN DONE.md as directory (not file) WHEN checking THEN returns false", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-is-dir/tests",
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(false); // Directory doesn't count
  });

  it("GIVEN DONE.md with different case WHEN checking THEN returns false", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/wrong-case/tests",
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(false); // Case-sensitive
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `docs/code/typescript.md` - TypeScript standards
2. `docs/testing/standards.md`- Testing with Vitest

## Quality Requirements

### QR1: Case Sensitivity

**Requirement:** DONE.md must be exact case
**Target:** `DONE.md` not `done.md` or `Done.md`
**Validation:** Integration test verifies case sensitivity

### QR2: File Type Check

**Requirement:** Must be regular file, not directory
**Target:** Use `fs.stat()` to verify file type
**Validation:** Integration test with directory named DONE.md

### QR3: Error Handling

**Requirement:** Handle missing file gracefully
**Target:** Return false for ENOENT, don't throw
**Validation:** Integration test verifies missing file returns false

## Completion Criteria

- [ ] All Level 2 integration tests pass
- [ ] Case-sensitive file check
- [ ] File type validation (not directory)
- [ ] Error handling for missing files
- [ ] BDD structure (GIVEN/WHEN/THEN) in all tests
- [ ] 100% type coverage

## Documentation

1. JSDoc comments on `hasDoneMd` function
2. Case sensitivity requirement documented
3. File type validation explained
