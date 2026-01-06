# Story: Parse Capability Names

## Functional Requirements

### FR1: Parse valid capability directory names

```gherkin
GIVEN a directory name matching the capability pattern
WHEN parsing the work item name
THEN extract kind, number, and slug correctly
```

#### Files created/modified

1. `src/types.ts` [new]: Define `WorkItem` and `WorkItemKind` types
2. `src/scanner/patterns.ts` [new]: Implement `parseWorkItemName()` function

### FR2: Reject invalid capability patterns

```gherkin
GIVEN a directory name that doesn't match the capability pattern
WHEN parsing the work item name
THEN return an error with a descriptive message
```

#### Files created/modified

1. `src/scanner/patterns.ts` [modify]: Add pattern validation and error handling

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component                     | Level | Justification                   |
| ----------------------------- | ----- | ------------------------------- |
| Capability name regex parsing | 1     | Pure function, no external deps |
| Number extraction             | 1     | Pure function                   |
| Slug extraction               | 1     | Pure function                   |
| Error message generation      | 1     | Pure function                   |

### When to Escalate

This story stays at Level 1 because:

- We're testing regex pattern matching and string parsing, not filesystem operations
- No external tools or dependencies required
- Pure function behavior can be fully verified with unit tests

If you find yourself needing real directories, this is actually a Feature 32 concern (Directory Walking).

## Unit Tests (Level 1)

```typescript
// test/unit/scanner/patterns.test.ts
import { describe, expect, it } from "vitest";
import { parseWorkItemName } from "../../../src/scanner/patterns";

describe("parseWorkItemName - Capabilities", () => {
  /**
   * Level 1: Pure function tests for capability pattern matching
   */

  it("GIVEN valid capability name WHEN parsing THEN extracts kind, number, and slug", () => {
    // Given
    const dirName = "capability-21_core-cli";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result).toEqual({
      kind: "capability",
      number: 20,
      slug: "core-cli",
    });
  });

  it("GIVEN capability with multi-word slug WHEN parsing THEN preserves kebab-case", () => {
    // Given
    const dirName = "capability-30_mcp-server-integration";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("mcp-server-integration");
  });

  it("GIVEN capability with uppercase letters WHEN parsing THEN rejects pattern", () => {
    // Given
    const dirName = "capability-21_CoreCLI";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("Invalid work item name");
  });

  it("GIVEN capability with invalid number WHEN parsing THEN rejects pattern", () => {
    // Given
    const dirName = "capability-5_too-low";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow(
      "BSP number must be between 10 and 99",
    );
  });

  it("GIVEN non-capability pattern WHEN parsing THEN returns error", () => {
    // Given
    const dirName = "random-directory";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("Invalid work item name");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `docs/code/typescript.md` - TypeScript standards
2. `docs/testing/standards.md`- Testing with Vitest

## Quality Requirements

### QR1: Type Safety

**Requirement:** All functions must have TypeScript type annotations
**Target:** 100% type coverage
**Validation:** `npm run typecheck` passes with no errors

### QR2: Error Handling

**Requirement:** Invalid patterns must produce actionable error messages
**Target:** Every error includes the invalid input and expected format
**Validation:** Unit tests verify error messages

### QR3: Dependency Injection

**Requirement:** No external dependencies for this pure function
**Target:** Zero dependencies in `parseWorkItemName`
**Validation:** Function signature accepts only string parameter

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] No mocking used (pure function)
- [ ] BDD structure (GIVEN/WHEN/THEN) in all tests
- [ ] TypeScript types defined (`WorkItem`, `WorkItemKind`)
- [ ] Error messages are descriptive and actionable

## Documentation

1. JSDoc comments on `parseWorkItemName` function
2. Type definitions exported from `src/types.ts`
