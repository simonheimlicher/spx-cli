# Story: Release Command

## Functional Requirements

### FR1: Move claimed session back to todo

```gherkin
GIVEN a session exists in doing directory (claimed by current agent)
WHEN releaseSession(id) is called
THEN the session file is moved back to todo directory
```

#### Files created/modified

1. `src/session/release.ts` [new]: Session release logic

### FR2: Find current session in doing directory

```gherkin
GIVEN agent has one or more sessions in doing
WHEN releaseSession() is called without ID
THEN the most recent session in doing is released
```

#### Files created/modified

1. `src/session/release.ts` [modify]: Add auto-detection

### FR3: Handle release of non-claimed session

```gherkin
GIVEN session ID that is not in doing directory
WHEN releaseSession(id) is called
THEN SessionNotClaimed error is thrown
```

#### Files created/modified

1. `src/session/release.ts` [modify]: Add validation
2. `src/session/errors.ts` [modify]: Add SessionNotClaimed error

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component            | Level | Justification                           |
| -------------------- | ----- | --------------------------------------- |
| Path construction    | 1     | Pure function: id → source/target paths |
| Error classification | 1     | Pure function: fs error → domain error  |

### When to Escalate

This story stays at Level 1 because:

- Path logic and error mapping are pure functions
- Actual file movement tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/release.test.ts
import { describe, expect, it } from "vitest";
import { buildReleasePaths, findCurrentSession } from "../../../src/session/release";

describe("buildReleasePaths", () => {
  it("GIVEN session ID and config WHEN built THEN returns doing→todo paths", () => {
    // Given
    const config = {
      todoDir: ".spx/sessions/todo",
      doingDir: ".spx/sessions/doing",
    };
    const sessionId = "2026-01-13_08-01-05";

    // When
    const result = buildReleasePaths(sessionId, config);

    // Then
    expect(result).toEqual({
      source: ".spx/sessions/doing/2026-01-13_08-01-05.md",
      target: ".spx/sessions/todo/2026-01-13_08-01-05.md",
    });
  });
});

describe("findCurrentSession", () => {
  it("GIVEN multiple sessions in doing WHEN found THEN returns most recent", () => {
    // Given
    const doingSessions = [
      { id: "2026-01-10_08-00-00" },
      { id: "2026-01-13_08-00-00" },
      { id: "2026-01-11_08-00-00" },
    ];

    // When
    const result = findCurrentSession(doingSessions);

    // Then
    expect(result.id).toBe("2026-01-13_08-00-00");
  });

  it("GIVEN empty doing directory WHEN found THEN returns null", () => {
    // Given
    const doingSessions: Array<{ id: string }> = [];

    // When
    const result = findCurrentSession(doingSessions);

    // Then
    expect(result).toBeNull();
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Directory layout
2. [Atomic Session Claiming](./../../decisions/adr-43_atomic-claiming.md) - Reverse operation

## Quality Requirements

### QR1: Symmetric with Pickup

**Requirement:** Release should be exact reverse of pickup
**Target:** Same atomicity guarantees
**Validation:** Integration tests verify round-trip

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Session moved from doing to todo
- [ ] Auto-detection works when no ID provided
- [ ] Clear error when session not in doing
