# Story: Parse Story Names

## Functional Requirements

### FR1: Parse valid story directory names

```gherkin
GIVEN a directory name matching the story pattern
WHEN parsing the work item name
THEN extract kind="story", number, and slug correctly
```

#### Files created/modified

1. `src/scanner/patterns.ts` [modify]: Extend `parseWorkItemName()` to handle story pattern

### FR2: Handle all three kinds uniformly

```gherkin
GIVEN capability, feature, and story directory names
WHEN parsing each work item name
THEN return consistent structure for all three kinds
```

#### Files created/modified

1. `src/scanner/patterns.ts` [modify]: Ensure uniform handling across all patterns

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component            | Level | Justification                 |
| -------------------- | ----- | ----------------------------- |
| Story name parsing   | 1     | Pure function, regex matching |
| Uniform structure    | 1     | Pure data transformation      |
| Pattern completeness | 1     | Pure logic verification       |

### When to Escalate

This story stays at Level 1 because:

- Completes the pattern matching trio (capability, feature, story)
- Same pure function logic as Stories 21 and 32
- No external dependencies

## Unit Tests (Level 1)

```typescript
// test/unit/scanner/patterns.test.ts (continued)
import { describe, expect, it } from "vitest";
import { parseWorkItemName } from "../../../src/scanner/patterns";

describe("parseWorkItemName - Stories", () => {
  /**
   * Level 1: Pure function tests for story pattern matching
   */

  it("GIVEN valid story name WHEN parsing THEN extracts kind, number, and slug", () => {
    // Given
    const dirName = "story-21_parse-capability-names";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result).toEqual({
      kind: "story",
      number: 21,
      slug: "parse-capability-names",
    });
  });

  it("GIVEN story with multi-word slug WHEN parsing THEN preserves kebab-case", () => {
    // Given
    const dirName = "story-54_validate-bsp-numbers-range";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("validate-bsp-numbers-range");
  });

  it("GIVEN story with invalid BSP number WHEN parsing THEN rejects pattern", () => {
    // Given
    const dirName = "story-05_too-low";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow(
      "BSP number must be between 10 and 99",
    );
  });
});

describe("parseWorkItemName - Complete Pattern Coverage", () => {
  it("GIVEN all three kinds WHEN parsing THEN returns consistent structure", () => {
    // Given
    const testCases = [
      { input: "capability-21_core-cli", expectedKind: "capability" },
      { input: "feature-21_pattern-matching", expectedKind: "feature" },
      { input: "story-32_parse-features", expectedKind: "story" },
    ];

    // When/Then
    testCases.forEach(({ input, expectedKind }) => {
      const result = parseWorkItemName(input);

      // Then: All have same structure
      expect(result).toHaveProperty("kind");
      expect(result).toHaveProperty("number");
      expect(result).toHaveProperty("slug");
      expect(result.kind).toBe(expectedKind);
    });
  });

  it("GIVEN work items with same number but different kinds WHEN parsing THEN distinguishes correctly", () => {
    // Given
    const capability = "capability-50_test";
    const feature = "feature-50_test";
    const story = "story-50_test";

    // When
    const capResult = parseWorkItemName(capability);
    const featResult = parseWorkItemName(feature);
    const storyResult = parseWorkItemName(story);

    // Then
    expect(capResult.kind).toBe("capability");
    expect(featResult.kind).toBe("feature");
    expect(storyResult.kind).toBe("story");
    expect(capResult.number).toBe(50);
    expect(featResult.number).toBe(50);
    expect(storyResult.number).toBe(50);
  });
});

describe("parseWorkItemName - Edge Cases", () => {
  it("GIVEN slug with single character WHEN parsing THEN accepts pattern", () => {
    // Given
    const dirName = "story-20_x";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("x");
  });

  it("GIVEN slug with numbers WHEN parsing THEN accepts pattern", () => {
    // Given
    const dirName = "feature-30_test-123-feature";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("test-123-feature");
  });

  it("GIVEN pattern with trailing slash WHEN parsing THEN still works", () => {
    // Given
    const dirName = "capability-21_core-cli";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.kind).toBe("capability");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `docs/code/typescript.md` - TypeScript standards
2. `docs/testing/standards.md`- Testing with Vitest

## Quality Requirements

### QR1: Type Safety

**Requirement:** `WorkItemKind` type must be complete union type
**Target:** `type WorkItemKind = "capability" | "feature" | "story"`
**Validation:** TypeScript enforces exhaustiveness

### QR2: Pattern Completeness

**Requirement:** All three work item kinds supported
**Target:** Single function handles all patterns
**Validation:** Unit tests cover all three kinds

### QR3: Consistent Structure

**Requirement:** All parsed results have identical structure
**Target:** Same properties for all kinds
**Validation:** Unit tests verify structure consistency

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] All three patterns (capability, feature, story) supported
- [ ] Consistent result structure across all kinds
- [ ] Edge cases handled (single-char slugs, numbers in slugs)
- [ ] BDD structure (GIVEN/WHEN/THEN) in all tests

## Documentation

1. JSDoc updated to reflect complete pattern support
2. Type definitions complete (`WorkItemKind` union type)
3. Examples show all three work item kinds
