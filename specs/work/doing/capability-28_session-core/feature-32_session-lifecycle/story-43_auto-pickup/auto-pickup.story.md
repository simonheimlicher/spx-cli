# Story: Auto Pickup

## Functional Requirements

### FR1: Select highest priority available session

```gherkin
GIVEN multiple sessions in todo with different priorities
WHEN pickupSession({ auto: true }) is called
THEN the highest priority session is claimed
```

#### Files created/modified

1. `src/session/pickup.ts` [modify]: Add auto-selection logic

### FR2: Fall back to timestamp when priorities equal

```gherkin
GIVEN multiple sessions with same priority
WHEN pickupSession({ auto: true }) is called
THEN the oldest session (FIFO) is claimed
```

#### Files created/modified

1. `src/session/pickup.ts` [modify]: Add tie-breaking logic

### FR3: Handle empty todo gracefully

```gherkin
GIVEN no sessions in todo directory
WHEN pickupSession({ auto: true }) is called
THEN NoSessionsAvailable error is thrown
```

#### Files created/modified

1. `src/session/pickup.ts` [modify]: Add empty handling
2. `src/session/errors.ts` [modify]: Add NoSessionsAvailable error

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component          | Level | Justification                       |
| ------------------ | ----- | ----------------------------------- |
| Priority selection | 1     | Pure function: sessions → selected  |
| Tie-breaking logic | 1     | Pure function: timestamp comparison |

### When to Escalate

This story stays at Level 1 because:

- Selection logic is pure
- Actual claiming tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/auto-pickup.test.ts
import { describe, expect, it } from "vitest";
import { selectBestSession } from "../../../src/session/pickup";
import { createSession } from "../../fixtures/factories";

describe("selectBestSession", () => {
  it("GIVEN sessions with different priorities WHEN selected THEN returns highest priority", () => {
    // Given
    const sessions = [
      createSession({ id: "low-1", priority: "low" }),
      createSession({ id: "high-1", priority: "high" }),
      createSession({ id: "medium-1", priority: "medium" }),
    ];

    // When
    const result = selectBestSession(sessions);

    // Then
    expect(result.id).toBe("high-1");
  });

  it("GIVEN sessions with same priority WHEN selected THEN returns oldest (FIFO)", () => {
    // Given
    const sessions = [
      createSession({ id: "2026-01-13_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-10_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-12_10-00-00", priority: "high" }),
    ];

    // When
    const result = selectBestSession(sessions);

    // Then
    expect(result.id).toBe("2026-01-10_10-00-00"); // Oldest first (FIFO)
  });

  it("GIVEN empty list WHEN selected THEN returns null", () => {
    // Given
    const sessions: ReturnType<typeof createSession>[] = [];

    // When
    const result = selectBestSession(sessions);

    // Then
    expect(result).toBeNull();
  });

  it("GIVEN only one session WHEN selected THEN returns that session", () => {
    // Given
    const sessions = [createSession({ id: "only-one", priority: "low" })];

    // When
    const result = selectBestSession(sessions);

    // Then
    expect(result.id).toBe("only-one");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Atomic Session Claiming](./../../decisions/adr-43_atomic-claiming.md) - Claiming mechanism

## Quality Requirements

### QR1: Deterministic Selection

**Requirement:** Same input sessions must always select same session
**Target:** No randomness in selection
**Validation:** Repeated calls with same input return same result

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] High priority sessions selected first
- [ ] Tie-breaking uses oldest timestamp (FIFO)
- [ ] Clear error when no sessions available
