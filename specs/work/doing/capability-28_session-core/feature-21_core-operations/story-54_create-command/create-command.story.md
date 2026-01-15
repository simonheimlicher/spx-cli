# Story: Create Command

## Functional Requirements

### FR1: Create session from stdin content

```gherkin
GIVEN session content piped to stdin
WHEN createSession(content) is called
THEN a new session file is created in todo directory with timestamp ID
```

#### Files created/modified

1. `src/session/create.ts` [new]: Session creation logic

### FR2: Generate unique timestamp-based ID

```gherkin
GIVEN the current time is 2026-01-13T08:01:05
WHEN createSession() is called
THEN the session file is named 2026-01-13_08-01-05.md
```

#### Files created/modified

1. `src/session/create.ts` [modify]: Use timestamp utils

### FR3: Ensure directories exist

```gherkin
GIVEN .spx/sessions/todo directory does not exist
WHEN createSession() is called
THEN directory is created before writing file
```

#### Files created/modified

1. `src/session/create.ts` [modify]: Add directory creation

### FR4: Return session ID on success

```gherkin
GIVEN valid session content
WHEN createSession() completes
THEN the generated session ID is returned for confirmation
```

#### Files created/modified

1. `src/session/create.ts` [modify]: Return value

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component          | Level | Justification                         |
| ------------------ | ----- | ------------------------------------- |
| ID generation      | 1     | Uses timestamp utils (already tested) |
| Path construction  | 1     | Pure function: config → path          |
| Content validation | 1     | Pure function: string → valid/invalid |

### When to Escalate

This story stays at Level 1 because:

- Logic for constructing paths and validating content is pure
- Actual file writing tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/create.test.ts
import { describe, expect, it } from "vitest";
import { buildSessionPath, validateSessionContent } from "../../../src/session/create";

describe("buildSessionPath", () => {
  it("GIVEN config and ID WHEN built THEN returns correct path", () => {
    // Given
    const config = { todoDir: ".spx/sessions/todo" };
    const sessionId = "2026-01-13_08-01-05";

    // When
    const result = buildSessionPath(sessionId, config);

    // Then
    expect(result).toBe(".spx/sessions/todo/2026-01-13_08-01-05.md");
  });
});

describe("validateSessionContent", () => {
  it("GIVEN valid markdown WHEN validated THEN returns valid", () => {
    // Given
    const content = `---
id: test
---
# Content`;

    // When
    const result = validateSessionContent(content);

    // Then
    expect(result.valid).toBe(true);
  });

  it("GIVEN empty content WHEN validated THEN returns invalid", () => {
    // Given
    const content = "";

    // When
    const result = validateSessionContent(content);

    // Then
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Timestamp Format](./../../decisions/adr-32_timestamp-format.md) - ID format
2. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Where to create

## Quality Requirements

### QR1: Atomic Creation

**Requirement:** Session creation should be atomic (write to temp, rename)
**Target:** No partial files on failure
**Validation:** Integration tests verify atomicity

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Session created in todo directory
- [ ] ID follows timestamp format specification
- [ ] Missing directories created automatically
