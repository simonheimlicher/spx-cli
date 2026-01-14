# Story: Show Command

## Functional Requirements

### FR1: Display session content without claiming

```gherkin
GIVEN a session exists in todo or doing directory
WHEN showSession(id) is called
THEN the full session content is returned without moving the file
```

#### Files created/modified

1. `src/session/show.ts` [new]: Session display logic

### FR2: Find session across status directories

```gherkin
GIVEN a session ID that could be in todo, doing, or archive
WHEN showSession(id) is called
THEN the session is found regardless of status directory
```

#### Files created/modified

1. `src/session/show.ts` [modify]: Add cross-directory search

### FR3: Return structured output with metadata

```gherkin
GIVEN a session with YAML front matter
WHEN showSession(id) is called
THEN metadata and content are returned separately
```

#### Files created/modified

1. `src/session/show.ts` [modify]: Add metadata extraction

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component         | Level | Justification                       |
| ----------------- | ----- | ----------------------------------- |
| Path resolution   | 1     | Pure function: id → possible paths  |
| Output formatting | 1     | Pure function: content → structured |

### When to Escalate

This story stays at Level 1 because:

- Path construction is deterministic
- Actual file reading tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/show.test.ts
import { describe, expect, it } from "vitest";
import { formatShowOutput, resolveSessionPaths } from "../../../src/session/show";

describe("resolveSessionPaths", () => {
  it("GIVEN session ID WHEN resolved THEN returns paths in all directories", () => {
    // Given
    const config = {
      todoDir: ".spx/sessions/todo",
      doingDir: ".spx/sessions/doing",
      archiveDir: ".spx/sessions/archive",
    };

    // When
    const result = resolveSessionPaths("2026-01-13_08-01-05", config);

    // Then
    expect(result).toEqual([
      ".spx/sessions/todo/2026-01-13_08-01-05.md",
      ".spx/sessions/doing/2026-01-13_08-01-05.md",
      ".spx/sessions/archive/2026-01-13_08-01-05.md",
    ]);
  });
});

describe("formatShowOutput", () => {
  it("GIVEN session content WHEN formatted THEN includes metadata and body", () => {
    // Given
    const content = `---
id: test
priority: high
---
# Session Content
Work description here.`;

    // When
    const result = formatShowOutput(content, { status: "todo" });

    // Then
    expect(result).toContain("Status: todo");
    expect(result).toContain("Priority: high");
    expect(result).toContain("# Session Content");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Where to look for sessions

## Quality Requirements

### QR1: Read-Only Operation

**Requirement:** Show must never modify session files
**Target:** No file writes in show logic
**Validation:** Code review confirms no fs.write calls

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Session found regardless of status directory
- [ ] Output clearly shows status and metadata
- [ ] No file modifications occur
