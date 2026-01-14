# Story: Prune Command

## Functional Requirements

### FR1: Delete oldest sessions keeping N most recent

```gherkin
GIVEN 10 sessions in todo directory
WHEN pruneSessions({ keep: 5 }) is called
THEN the 5 oldest sessions are deleted, 5 newest remain
```

#### Files created/modified

1. `src/session/prune.ts` [new]: Session pruning logic

### FR2: Default to keeping 5 sessions

```gherkin
GIVEN 8 sessions in todo directory
WHEN pruneSessions() is called without arguments
THEN 3 oldest sessions are deleted, 5 newest remain
```

#### Files created/modified

1. `src/session/prune.ts` [modify]: Add default value

### FR3: Only prune todo directory, not doing

```gherkin
GIVEN sessions in both todo and doing directories
WHEN pruneSessions() is called
THEN only todo sessions are considered for pruning
```

#### Files created/modified

1. `src/session/prune.ts` [modify]: Scope to todo only

### FR4: Handle keep > available gracefully

```gherkin
GIVEN 3 sessions in todo and keep=5
WHEN pruneSessions({ keep: 5 }) is called
THEN no sessions are deleted (all 3 remain)
```

#### Files created/modified

1. `src/session/prune.ts` [modify]: Add boundary handling

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component           | Level | Justification                            |
| ------------------- | ----- | ---------------------------------------- |
| Sort by timestamp   | 1     | Pure function: sessions → sorted         |
| Select for deletion | 1     | Pure function: sorted + keep → to delete |

### When to Escalate

This story stays at Level 1 because:

- Selection logic is pure
- Actual file deletion tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/prune.test.ts
import { describe, expect, it } from "vitest";
import { selectSessionsToDelete } from "../../../src/session/prune";
import { createSession } from "../../fixtures/factories";

describe("selectSessionsToDelete", () => {
  it("GIVEN 10 sessions and keep=5 WHEN selected THEN returns 5 oldest", () => {
    // Given
    const sessions = Array.from({ length: 10 }, (_, i) => createSession({ id: `2026-01-${String(i + 1).padStart(2, "0")}_10-00-00` }));

    // When
    const result = selectSessionsToDelete(sessions, { keep: 5 });

    // Then
    expect(result).toHaveLength(5);
    expect(result.map(s => s.id)).toEqual([
      "2026-01-01_10-00-00",
      "2026-01-02_10-00-00",
      "2026-01-03_10-00-00",
      "2026-01-04_10-00-00",
      "2026-01-05_10-00-00",
    ]);
  });

  it("GIVEN 3 sessions and keep=5 WHEN selected THEN returns empty array", () => {
    // Given
    const sessions = [
      createSession({ id: "2026-01-01_10-00-00" }),
      createSession({ id: "2026-01-02_10-00-00" }),
      createSession({ id: "2026-01-03_10-00-00" }),
    ];

    // When
    const result = selectSessionsToDelete(sessions, { keep: 5 });

    // Then
    expect(result).toHaveLength(0);
  });

  it("GIVEN default keep WHEN selected THEN uses 5 as default", () => {
    // Given
    const sessions = Array.from({ length: 8 }, (_, i) => createSession({ id: `2026-01-${String(i + 1).padStart(2, "0")}_10-00-00` }));

    // When
    const result = selectSessionsToDelete(sessions); // No keep specified

    // Then
    expect(result).toHaveLength(3); // 8 - 5 = 3
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Directory layout
2. [Timestamp Format](./../../decisions/adr-32_timestamp-format.md) - Sorting by timestamp

## Quality Requirements

### QR1: Non-Destructive by Default

**Requirement:** Prune should show what will be deleted before acting
**Target:** CLI supports `--dry-run` flag
**Validation:** Dry run produces same selection without deletion

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Default keep=5 works correctly
- [ ] Only todo directory affected
- [ ] Handles edge cases (keep > available)
