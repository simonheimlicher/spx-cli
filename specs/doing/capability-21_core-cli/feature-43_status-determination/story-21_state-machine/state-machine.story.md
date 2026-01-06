# Story: State Machine

## Functional Requirements

### FR1: Implement three-state status model

```gherkin
GIVEN work item metadata (has tests dir, has DONE.md)
WHEN determining status
THEN return OPEN, IN_PROGRESS, or DONE based on state
```

#### Files created/modified

1. `src/status/state.ts` [new]: Implement `WorkItemStatus` type and `determineStatus()` function
2. `src/types.ts` [modify]: Add `WorkItemStatus` type

### FR2: Pure state machine logic

```gherkin
GIVEN boolean flags (hasTestsDir, hasDoneMd, testsIsEmpty)
WHEN computing status
THEN return deterministic status without I/O
```

#### Files created/modified

1. `src/status/state.ts` [modify]: Pure function implementation

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component           | Level | Justification                |
| ------------------- | ----- | ---------------------------- |
| State machine logic | 1     | Pure function, boolean logic |
| Status enumeration  | 1     | Type definition              |
| State transitions   | 1     | Pure logic verification      |

### When to Escalate

This story stays at Level 1 because:

- State machine is pure boolean logic
- No filesystem I/O in this layer
- Deterministic computation from boolean inputs

## Unit Tests (Level 1)

```typescript
// test/unit/status/state.test.ts
import { determineStatus } from "@/status/state";
import { describe, expect, it } from "vitest";

describe("determineStatus", () => {
  /**
   * Level 1: Pure function tests for status state machine
   */

  it("GIVEN no tests dir WHEN determining status THEN returns OPEN", () => {
    // Given
    const flags = {
      hasTestsDir: false,
      hasDoneMd: false,
      testsIsEmpty: true,
    };

    // When
    const status = determineStatus(flags);

    // Then
    expect(status).toBe("OPEN");
  });

  it("GIVEN empty tests dir WHEN determining status THEN returns OPEN", () => {
    // Given
    const flags = {
      hasTestsDir: true,
      hasDoneMd: false,
      testsIsEmpty: true,
    };

    // When
    const status = determineStatus(flags);

    // Then
    expect(status).toBe("OPEN");
  });

  it("GIVEN tests dir with files but no DONE.md WHEN determining status THEN returns IN_PROGRESS", () => {
    // Given
    const flags = {
      hasTestsDir: true,
      hasDoneMd: false,
      testsIsEmpty: false,
    };

    // When
    const status = determineStatus(flags);

    // Then
    expect(status).toBe("IN_PROGRESS");
  });

  it("GIVEN tests dir with DONE.md WHEN determining status THEN returns DONE", () => {
    // Given
    const flags = {
      hasTestsDir: true,
      hasDoneMd: true,
      testsIsEmpty: false,
    };

    // When
    const status = determineStatus(flags);

    // Then
    expect(status).toBe("DONE");
  });

  it("GIVEN only DONE.md in empty tests dir WHEN determining status THEN returns DONE", () => {
    // Given
    const flags = {
      hasTestsDir: true,
      hasDoneMd: true,
      testsIsEmpty: true, // Only DONE.md, no other files
    };

    // When
    const status = determineStatus(flags);

    // Then
    expect(status).toBe("DONE");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `docs/code/typescript.md` - TypeScript standards
2. `docs/testing/standards.md`- Testing with Vitest

## Quality Requirements

### QR1: Type Safety

**Requirement:** Status must be strongly typed enum
**Target:** `type WorkItemStatus = "OPEN" | "IN_PROGRESS" | "DONE"`
**Validation:** TypeScript enforces exhaustive checking

### QR2: Determinism

**Requirement:** Same inputs always produce same output
**Target:** Pure function with no side effects
**Validation:** Unit tests verify deterministic behavior

### QR3: Complete Coverage

**Requirement:** All possible state combinations handled
**Target:** Truth table fully covered
**Validation:** Unit tests cover all 8 boolean combinations

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Pure function implementation (no I/O)
- [ ] WorkItemStatus type defined
- [ ] All state combinations tested
- [ ] BDD structure (GIVEN/WHEN/THEN) in all tests
- [ ] 100% type coverage

## Documentation

1. JSDoc comments on `determineStatus` function
2. Type definition for `WorkItemStatus`
3. Truth table documenting all states
