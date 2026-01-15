# Story: Timestamp Utils

## Functional Requirements

### FR1: Generate session ID from current time

```gherkin
GIVEN the current system time
WHEN generateSessionId() is called
THEN a string in format YYYY-MM-DD_HH-mm-ss is returned
```

#### Files created/modified

1. `src/session/timestamp.ts` [new]: Timestamp generation and parsing utilities

### FR2: Parse session ID back to Date

```gherkin
GIVEN a valid session ID string "2026-01-13_08-01-05"
WHEN parseSessionId(id) is called
THEN a Date object representing 2026-01-13T08:01:05 is returned
```

#### Files created/modified

1. `src/session/timestamp.ts` [modify]: Add parsing function

### FR3: Handle invalid session ID format

```gherkin
GIVEN an invalid session ID string "invalid-format"
WHEN parseSessionId(id) is called
THEN null is returned (not an exception)
```

#### Files created/modified

1. `src/session/timestamp.ts` [modify]: Add format validation

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component         | Level | Justification                |
| ----------------- | ----- | ---------------------------- |
| generateSessionId | 1     | Pure function, deterministic |
| parseSessionId    | 1     | Pure function, string → Date |
| Format validation | 1     | Pure regex matching          |

### When to Escalate

This story stays at Level 1 because:

- All functions are pure with no I/O
- Date generation can be made deterministic by injecting time source

## Unit Tests (Level 1)

```typescript
// tests/unit/session/timestamp.test.ts
import { describe, expect, it } from "vitest";
import { generateSessionId, parseSessionId } from "../../../src/session/timestamp";

describe("generateSessionId", () => {
  it("GIVEN current time WHEN called THEN returns YYYY-MM-DD_HH-mm-ss format", () => {
    // Given
    const mockDate = new Date("2026-01-13T08:01:05");

    // When
    const result = generateSessionId({ now: () => mockDate });

    // Then
    expect(result).toBe("2026-01-13_08-01-05");
  });

  it("GIVEN single-digit components WHEN called THEN pads with zeros", () => {
    // Given
    const mockDate = new Date("2026-01-03T09:05:07");

    // When
    const result = generateSessionId({ now: () => mockDate });

    // Then
    expect(result).toBe("2026-01-03_09-05-07");
  });
});

describe("parseSessionId", () => {
  it("GIVEN valid ID WHEN parsed THEN returns correct Date", () => {
    // When
    const result = parseSessionId("2026-01-13_08-01-05");

    // Then
    expect(result).toEqual(new Date(2026, 0, 13, 8, 1, 5));
  });

  it("GIVEN invalid ID WHEN parsed THEN returns null", () => {
    // When
    const result = parseSessionId("invalid-format");

    // Then
    expect(result).toBeNull();
  });

  it("GIVEN ID without padding WHEN parsed THEN returns null", () => {
    // When
    const result = parseSessionId("2026-1-3_8-1-5");

    // Then
    expect(result).toBeNull();
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Timestamp Format](./../../decisions/adr-32_timestamp-format.md) - Format specification

## Quality Requirements

### QR1: Type Safety

**Requirement:** All functions must have TypeScript type annotations
**Target:** 100% type coverage
**Validation:** `npm run typecheck` passes with no errors

### QR2: Dependency Injection

**Requirement:** Time source must be injectable for deterministic testing
**Target:** No reliance on `Date.now()` directly
**Validation:** Tests pass with injected time

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Time source is injectable
- [ ] Format matches ADR specification exactly
- [ ] Invalid inputs return null, not exceptions
