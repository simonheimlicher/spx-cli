# Story: [Story Name]

## Functional Requirements

### FR1: [Behavioral requirement]

```gherkin
GIVEN [context/precondition]
WHEN [action/event]
THEN [expected outcome/behavior]
```

#### Files created/modified

1. `src/config/loader.ts` [modify]: Add config merging logic
2. `src/runners/lhci.ts` [new]: LHCI runner implementation

### FR2: [Additional functional requirement if needed]

```gherkin
GIVEN [context/precondition]
WHEN [action/event]
THEN [expected outcome/behavior]
```

#### Files created/modified

1. `src/cli.ts` [modify]: Add CLI command handling

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See `context/4-testing-standards.md` for level definitions.

### Level Assignment

| Component            | Level | Justification                   |
| -------------------- | ----- | ------------------------------- |
| Command building     | 1     | Pure function, no external deps |
| Config parsing       | 1     | Pure function with Zod          |
| Error message format | 1     | Pure function                   |

### When to Escalate

This story stays at Level 1 because:

- [Reason why Level 2 is not needed, e.g., "We're testing command construction, not Hugo execution"]

If you find yourself needing real binaries, consider:

1. Is this actually a feature-level concern? → Move test to feature
2. Can DI provide sufficient confidence? → Keep at Level 1

## Unit Tests (Level 1)

```typescript
// test/unit/{module}/{file}.test.ts
import { describe, it, expect, vi } from "vitest";
import { createTestConfig } from "../../fixtures/factories";

describe("[Module/Function]", () => {
  /**
   * Level 1: Pure function tests with DI
   */

  it("GIVEN [precondition] WHEN [action] THEN [outcome]", () => {
    // Given
    const input = createTestConfig({
      /* overrides */
    });

    // When
    const result = functionUnderTest(input);

    // Then
    expect(result).toEqual(expectedOutput);
  });

  it("GIVEN [error condition] WHEN [action] THEN [descriptive error]", async () => {
    // Given
    const mockDeps = {
      execa: vi.fn().mockRejectedValue(new Error("command not found")),
    };

    // When/Then
    await expect(functionUnderTest(input, mockDeps)).rejects.toThrow("Hugo is not installed");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `specs/decisions/adr-001_project-architecture.md` - Overall architecture decisions
2. `specs/doing/capability-NN_{slug}/decisions/` - Capability-specific decisions (if applicable)

## Quality Requirements

### QR1: Type Safety

**Requirement:** All functions must have TypeScript type annotations
**Target:** 100% type coverage
**Validation:** `npm run typecheck` passes with no errors

### QR2: Error Handling

**Requirement:** All external tool failures must be caught and reported with actionable messages
**Target:** Zero unhandled rejections
**Validation:** Unit tests verify error paths with DI

### QR3: Dependency Injection

**Requirement:** External dependencies must be injectable for testing
**Target:** No `vi.mock()` in unit tests
**Validation:** All tests use DI pattern

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] No mocking of external systems (DI used instead)
- [ ] Test data uses factories, not hardcoded values
- [ ] BDD structure (GIVEN/WHEN/THEN) in all tests

## Documentation

1. `README.md` (update if user-facing changes)
2. JSDoc comments on public APIs
