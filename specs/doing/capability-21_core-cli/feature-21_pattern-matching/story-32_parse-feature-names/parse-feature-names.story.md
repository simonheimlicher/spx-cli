# Story: Parse Feature Names

## Functional Requirements

### FR1: Parse valid feature directory names

```gherkin
GIVEN a directory name matching the feature pattern
WHEN parsing the work item name
THEN extract kind="feature", number, and slug correctly
```

#### Files created/modified

1. `src/scanner/patterns.ts` [modify]: Extend `parseWorkItemName()` to handle feature pattern

### FR2: Distinguish between capability and feature patterns

```gherkin
GIVEN both capability and feature directory names
WHEN parsing each work item name
THEN correctly identify the kind for each
```

#### Files created/modified

1. `src/scanner/patterns.ts` [modify]: Update pattern matching logic to detect kind

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component              | Level | Justification                 |
| ---------------------- | ----- | ----------------------------- |
| Feature name parsing   | 1     | Pure function, regex matching |
| Kind differentiation   | 1     | Pure string matching logic    |
| Pattern priority logic | 1     | Pure function                 |

### When to Escalate

This story stays at Level 1 because:

- Same parsing logic as Story 21, just extended to handle "feature-" prefix
- Pure regex and string operations
- No external dependencies

## Unit Tests (Level 1)

```typescript
// test/unit/scanner/patterns.test.ts (continued from Story 21)
import { describe, expect, it } from "vitest";
import { parseWorkItemName } from "../../../src/scanner/patterns";

describe("parseWorkItemName - Features", () => {
  /**
   * Level 1: Pure function tests for feature pattern matching
   */

  it("GIVEN valid feature name WHEN parsing THEN extracts kind, number, and slug", () => {
    // Given
    const dirName = "feature-21_pattern-matching";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result).toEqual({
      kind: "feature",
      number: 21,
      slug: "pattern-matching",
    });
  });

  it("GIVEN feature with multi-word slug WHEN parsing THEN preserves kebab-case", () => {
    // Given
    const dirName = "feature-32_directory-walking-integration";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("directory-walking-integration");
  });

  it("GIVEN capability and feature with same number WHEN parsing THEN distinguishes by kind", () => {
    // Given
    const capabilityName = "capability-21_core-cli";
    const featureName = "feature-20_some-feature";

    // When
    const capResult = parseWorkItemName(capabilityName);
    const featResult = parseWorkItemName(featureName);

    // Then
    expect(capResult.kind).toBe("capability");
    expect(featResult.kind).toBe("feature");
    expect(capResult.number).toBe(featResult.number);
  });

  it("GIVEN feature with invalid BSP number WHEN parsing THEN rejects pattern", () => {
    // Given
    const dirName = "feature-100_too-high";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow(
      "BSP number must be between 10 and 99",
    );
  });
});

describe("parseWorkItemName - Kind Detection", () => {
  it("GIVEN mixed work items WHEN parsing THEN correctly identifies each kind", () => {
    // Given
    const testCases = [
      { input: "capability-21_test", expectedKind: "capability" },
      { input: "feature-21_test", expectedKind: "feature" },
    ];

    // When/Then
    testCases.forEach(({ input, expectedKind }) => {
      const result = parseWorkItemName(input);
      expect(result.kind).toBe(expectedKind);
    });
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `docs/code/typescript.md` - TypeScript standards
2. `docs/testing/standards.md`- Testing with Vitest

## Quality Requirements

### QR1: Type Safety

**Requirement:** `WorkItemKind` type must include "feature"
**Target:** Type union includes all three kinds
**Validation:** `npm run typecheck` passes

### QR2: Pattern Consistency

**Requirement:** Feature pattern matches capability pattern structure
**Target:** Same regex structure, different prefix
**Validation:** Unit tests verify both patterns work identically

### QR3: No Code Duplication

**Requirement:** Single function handles both capability and feature patterns
**Target:** No separate parsing functions per kind
**Validation:** Code review confirms DRY principle

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] `parseWorkItemName` handles both capability and feature patterns
- [ ] Kind detection works correctly
- [ ] No code duplication between patterns
- [ ] BDD structure (GIVEN/WHEN/THEN) in all tests

## Documentation

1. JSDoc updated to reflect support for feature pattern
2. Examples in comments show both capability and feature usage
