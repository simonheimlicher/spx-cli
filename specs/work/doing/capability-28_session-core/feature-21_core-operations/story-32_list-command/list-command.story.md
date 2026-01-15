# Story: List Command

## Functional Requirements

### FR1: List sessions from all status directories

```gherkin
GIVEN sessions exist in todo and doing directories
WHEN listSessions() is called
THEN sessions from both directories are returned with status
```

#### Files created/modified

1. `src/session/list.ts` [new]: Session listing logic
2. `src/session/types.ts` [new]: Session type definitions

### FR2: Sort by priority then timestamp

```gherkin
GIVEN sessions with different priorities and timestamps
WHEN listSessions() is called
THEN sessions are sorted: high priority first, then by timestamp descending
```

#### Files created/modified

1. `src/session/list.ts` [modify]: Add sorting logic

### FR3: Parse YAML front matter for metadata

```gherkin
GIVEN a session file with YAML front matter containing priority and tags
WHEN listing sessions
THEN metadata is extracted and included in session info
```

#### Files created/modified

1. `src/session/list.ts` [modify]: Add front matter parsing

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component          | Level | Justification                    |
| ------------------ | ----- | -------------------------------- |
| Sorting logic      | 1     | Pure function: sessions → sorted |
| Front matter parse | 1     | Pure function: string → metadata |
| Type definitions   | 1     | Types only, no runtime behavior  |

### When to Escalate

This story stays at Level 1 because:

- Sorting and parsing are pure functions
- File reading is tested at feature level (integration)

## Unit Tests (Level 1)

```typescript
// tests/unit/session/list.test.ts
import { describe, expect, it } from "vitest";
import { parseSessionMetadata, sortSessions } from "../../../src/session/list";
import { createSession } from "../../fixtures/factories";

describe("sortSessions", () => {
  it("GIVEN sessions with different priorities WHEN sorted THEN high first", () => {
    // Given
    const sessions = [
      createSession({ id: "a", priority: "low" }),
      createSession({ id: "b", priority: "high" }),
      createSession({ id: "c", priority: "medium" }),
    ];

    // When
    const result = sortSessions(sessions);

    // Then
    expect(result.map(s => s.id)).toEqual(["b", "c", "a"]);
  });

  it("GIVEN sessions with same priority WHEN sorted THEN newest first", () => {
    // Given
    const sessions = [
      createSession({ id: "2026-01-10_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-13_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-11_10-00-00", priority: "high" }),
    ];

    // When
    const result = sortSessions(sessions);

    // Then
    expect(result.map(s => s.id)).toEqual([
      "2026-01-13_10-00-00",
      "2026-01-11_10-00-00",
      "2026-01-10_10-00-00",
    ]);
  });
});

describe("parseSessionMetadata", () => {
  it("GIVEN YAML front matter WHEN parsed THEN extracts metadata", () => {
    // Given
    const content = `---
id: test
priority: high
tags: [bug, urgent]
---
# Content`;

    // When
    const result = parseSessionMetadata(content);

    // Then
    expect(result).toEqual({
      id: "test",
      priority: "high",
      tags: ["bug", "urgent"],
    });
  });

  it("GIVEN no front matter WHEN parsed THEN returns defaults", () => {
    // Given
    const content = "# Just content";

    // When
    const result = parseSessionMetadata(content);

    // Then
    expect(result).toEqual({
      priority: "medium",
      tags: [],
    });
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Directory layout

## Quality Requirements

### QR1: Type Safety

**Requirement:** Session type must be fully typed
**Target:** No `any` types in session interfaces
**Validation:** `npm run typecheck` passes

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Sorting handles all priority combinations
- [ ] YAML parsing handles missing fields gracefully
- [ ] Types exported for use by other modules
