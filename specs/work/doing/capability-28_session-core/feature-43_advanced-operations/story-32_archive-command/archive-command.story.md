# Story: Archive Command

## Functional Requirements

### FR1: Move session to archive directory

```gherkin
GIVEN a session exists in todo directory
WHEN archiveSession(id) is called
THEN the session is moved to archive directory
```

#### Files created/modified

1. `src/session/archive.ts` [new]: Session archiving logic

### FR2: Create archive directory if needed

```gherkin
GIVEN archive directory does not exist
WHEN archiveSession(id) is called
THEN archive directory is created before moving
```

#### Files created/modified

1. `src/session/archive.ts` [modify]: Add directory creation

### FR3: Archive from any source directory

```gherkin
GIVEN a session in doing directory
WHEN archiveSession(id) is called
THEN the session is moved to archive from doing
```

#### Files created/modified

1. `src/session/archive.ts` [modify]: Support multiple source directories

### FR4: Handle already archived session

```gherkin
GIVEN a session already in archive directory
WHEN archiveSession(id) is called
THEN SessionAlreadyArchived error is thrown
```

#### Files created/modified

1. `src/session/archive.ts` [modify]: Add duplicate check
2. `src/session/errors.ts` [modify]: Add SessionAlreadyArchived error

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component          | Level | Justification                        |
| ------------------ | ----- | ------------------------------------ |
| Path resolution    | 1     | Pure function: id → source paths     |
| Archive path build | 1     | Pure function: config → archive path |

### When to Escalate

This story stays at Level 1 because:

- Path logic is pure
- Actual file movement tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/archive.test.ts
import { describe, expect, it } from "vitest";
import { buildArchivePaths, findSessionForArchive } from "../../../src/session/archive";

describe("buildArchivePaths", () => {
  it("GIVEN session in todo WHEN built THEN returns todo→archive paths", () => {
    // Given
    const config = {
      todoDir: ".spx/sessions/todo",
      archiveDir: ".spx/sessions/archive",
    };
    const sessionId = "2026-01-13_08-01-05";
    const currentStatus = "todo";

    // When
    const result = buildArchivePaths(sessionId, currentStatus, config);

    // Then
    expect(result).toEqual({
      source: ".spx/sessions/todo/2026-01-13_08-01-05.md",
      target: ".spx/sessions/archive/2026-01-13_08-01-05.md",
    });
  });

  it("GIVEN session in doing WHEN built THEN returns doing→archive paths", () => {
    // Given
    const config = {
      doingDir: ".spx/sessions/doing",
      archiveDir: ".spx/sessions/archive",
    };
    const sessionId = "2026-01-13_08-01-05";
    const currentStatus = "doing";

    // When
    const result = buildArchivePaths(sessionId, currentStatus, config);

    // Then
    expect(result.source).toBe(".spx/sessions/doing/2026-01-13_08-01-05.md");
  });
});

describe("findSessionForArchive", () => {
  it("GIVEN session in todo WHEN found THEN returns todo location", () => {
    // Given
    const existingPaths = {
      todo: ".spx/sessions/todo/test.md",
      doing: null,
      archive: null,
    };

    // When
    const result = findSessionForArchive(existingPaths);

    // Then
    expect(result).toEqual({ status: "todo", path: ".spx/sessions/todo/test.md" });
  });

  it("GIVEN session already archived WHEN found THEN returns null with reason", () => {
    // Given
    const existingPaths = {
      todo: null,
      doing: null,
      archive: ".spx/sessions/archive/test.md",
    };

    // When
    const result = findSessionForArchive(existingPaths);

    // Then
    expect(result).toBeNull();
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Archive directory

## Quality Requirements

### QR1: Preserve Session Content

**Requirement:** Archive must not modify session content
**Target:** Byte-for-byte identical after archive
**Validation:** Hash comparison in integration tests

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Session moved to archive directory
- [ ] Works from both todo and doing
- [ ] Creates archive directory if missing
- [ ] Clear error when already archived
