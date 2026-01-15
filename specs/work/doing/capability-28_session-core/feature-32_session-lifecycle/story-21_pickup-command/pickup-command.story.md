# Story: Pickup Command

## Functional Requirements

### FR1: Atomically claim session by moving to doing

```gherkin
GIVEN a session exists in todo directory
WHEN pickupSession(id) is called
THEN the session file is moved to doing directory atomically
```

#### Files created/modified

1. `src/session/pickup.ts` [new]: Session pickup/claiming logic

### FR2: Return session content after claiming

```gherkin
GIVEN session is successfully claimed
WHEN pickupSession(id) completes
THEN the session content is returned for display
```

#### Files created/modified

1. `src/session/pickup.ts` [modify]: Add content return

### FR3: Handle concurrent pickup gracefully

```gherkin
GIVEN another process claimed the session first
WHEN pickupSession(id) is called
THEN SessionNotAvailable error is thrown (not SessionNotFound)
```

#### Files created/modified

1. `src/session/pickup.ts` [modify]: Add race condition handling
2. `src/session/errors.ts` [modify]: Add SessionNotAvailable error

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component            | Level | Justification                           |
| -------------------- | ----- | --------------------------------------- |
| Path construction    | 1     | Pure function: id → source/target paths |
| Error classification | 1     | Pure function: fs error → domain error  |

### When to Escalate

This story stays at Level 1 because:

- Path logic and error mapping are pure functions
- Actual fs.rename atomicity tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/pickup.test.ts
import { describe, expect, it } from "vitest";
import { SessionNotAvailableError, SessionNotFoundError } from "../../../src/session/errors";
import { buildClaimPaths, classifyClaimError } from "../../../src/session/pickup";

describe("buildClaimPaths", () => {
  it("GIVEN session ID and config WHEN built THEN returns source and target", () => {
    // Given
    const config = {
      todoDir: ".spx/sessions/todo",
      doingDir: ".spx/sessions/doing",
    };
    const sessionId = "2026-01-13_08-01-05";

    // When
    const result = buildClaimPaths(sessionId, config);

    // Then
    expect(result).toEqual({
      source: ".spx/sessions/todo/2026-01-13_08-01-05.md",
      target: ".spx/sessions/doing/2026-01-13_08-01-05.md",
    });
  });
});

describe("classifyClaimError", () => {
  it("GIVEN ENOENT error WHEN classified THEN returns SessionNotAvailable", () => {
    // Given
    const error = Object.assign(new Error("ENOENT"), { code: "ENOENT" });

    // When
    const result = classifyClaimError(error, "test-id");

    // Then
    expect(result).toBeInstanceOf(SessionNotAvailableError);
  });

  it("GIVEN unknown error WHEN classified THEN rethrows", () => {
    // Given
    const error = new Error("Unknown error");

    // When/Then
    expect(() => classifyClaimError(error, "test-id")).toThrow("Unknown error");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Atomic Session Claiming](./../../decisions/adr-43_atomic-claiming.md) - Claiming mechanism
2. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Directory layout

## Quality Requirements

### QR1: Atomic Operation

**Requirement:** Claiming must use fs.rename, not read-delete-write
**Target:** Single syscall for claim operation
**Validation:** Code review confirms fs.rename usage

### QR2: Clear Error Distinction

**Requirement:** Distinguish "not found" from "already claimed"
**Target:** Different error types for different failure modes
**Validation:** Error type tests

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Session moved to doing directory atomically
- [ ] Session content returned after claim
- [ ] Clear error messages for both not-found and already-claimed
