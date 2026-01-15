# Story: Delete Command

## Functional Requirements

### FR1: Delete session by ID

```gherkin
GIVEN a session exists in todo or doing directory
WHEN deleteSession(id) is called
THEN the session file is removed from filesystem
```

#### Files created/modified

1. `src/session/delete.ts` [new]: Session deletion logic

### FR2: Find session across directories

```gherkin
GIVEN session ID that could be in any status directory
WHEN deleteSession(id) is called
THEN session is found and deleted regardless of status
```

#### Files created/modified

1. `src/session/delete.ts` [modify]: Add cross-directory search

### FR3: Handle non-existent session

```gherkin
GIVEN session ID that does not exist
WHEN deleteSession(id) is called
THEN SessionNotFound error is thrown
```

#### Files created/modified

1. `src/session/delete.ts` [modify]: Add error handling
2. `src/session/errors.ts` [new]: Session error types

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component       | Level | Justification                      |
| --------------- | ----- | ---------------------------------- |
| Path resolution | 1     | Pure function: id → possible paths |
| Error types     | 1     | Type definitions only              |

### When to Escalate

This story stays at Level 1 because:

- Path construction is deterministic
- Actual file deletion tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/delete.test.ts
import { describe, expect, it } from "vitest";
import { resolveDeletePath } from "../../../src/session/delete";
import { SessionNotFoundError } from "../../../src/session/errors";

describe("resolveDeletePath", () => {
  it("GIVEN session ID and found path WHEN resolved THEN returns path", () => {
    // Given
    const sessionId = "2026-01-13_08-01-05";
    const existingPaths = [".spx/sessions/doing/2026-01-13_08-01-05.md"];

    // When
    const result = resolveDeletePath(sessionId, existingPaths);

    // Then
    expect(result).toBe(".spx/sessions/doing/2026-01-13_08-01-05.md");
  });

  it("GIVEN session ID not found WHEN resolved THEN throws SessionNotFound", () => {
    // Given
    const sessionId = "nonexistent";
    const existingPaths: string[] = [];

    // When/Then
    expect(() => resolveDeletePath(sessionId, existingPaths))
      .toThrow(SessionNotFoundError);
  });
});

describe("SessionNotFoundError", () => {
  it("GIVEN session ID WHEN created THEN has descriptive message", () => {
    // When
    const error = new SessionNotFoundError("test-id");

    // Then
    expect(error.message).toContain("test-id");
    expect(error.message).toContain("not found");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Where to look for sessions

## Quality Requirements

### QR1: Clear Error Messages

**Requirement:** Errors must include session ID and actionable guidance
**Target:** All errors have structured messages
**Validation:** Error message tests

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Session deleted regardless of status directory
- [ ] Clear error when session not found
- [ ] Error types exported for CLI handling
