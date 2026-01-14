# Story: YAML Parsing

## Functional Requirements

### FR1: Extract YAML front matter from session content

```gherkin
GIVEN session content with YAML front matter between --- delimiters
WHEN parseFrontMatter(content) is called
THEN a structured object is returned with parsed fields
```

#### Files created/modified

1. `src/session/frontmatter.ts` [new]: YAML front matter parsing

### FR2: Extract specs and files arrays

```gherkin
GIVEN YAML front matter with specs: and files: arrays
WHEN parseFrontMatter(content) is called
THEN arrays are extracted as string arrays
```

#### Files created/modified

1. `src/session/frontmatter.ts` [modify]: Add array extraction

### FR3: Handle missing or malformed front matter

```gherkin
GIVEN session content without YAML front matter
WHEN parseFrontMatter(content) is called
THEN default values are returned (empty arrays)
```

#### Files created/modified

1. `src/session/frontmatter.ts` [modify]: Add fallback handling

### FR4: Validate file paths are strings

```gherkin
GIVEN YAML with non-string values in specs: array
WHEN parseFrontMatter(content) is called
THEN non-strings are filtered out with warning
```

#### Files created/modified

1. `src/session/frontmatter.ts` [modify]: Add type validation

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component          | Level | Justification                    |
| ------------------ | ----- | -------------------------------- |
| Front matter parse | 1     | Pure function: string → object   |
| Array extraction   | 1     | Pure function: object → arrays   |
| Type validation    | 1     | Pure function: values → filtered |

### When to Escalate

This story stays at Level 1 because:

- All parsing is pure string manipulation
- Uses `yaml` npm package (trusted external library)

## Unit Tests (Level 1)

```typescript
// tests/unit/session/frontmatter.test.ts
import { describe, expect, it } from "vitest";
import { extractFilePaths, parseFrontMatter } from "../../../src/session/frontmatter";

describe("parseFrontMatter", () => {
  it("GIVEN valid YAML front matter WHEN parsed THEN returns object", () => {
    // Given
    const content = `---
id: test-session
priority: high
specs:
  - path/to/spec.md
files:
  - src/code.ts
---
# Session Content`;

    // When
    const result = parseFrontMatter(content);

    // Then
    expect(result).toEqual({
      id: "test-session",
      priority: "high",
      specs: ["path/to/spec.md"],
      files: ["src/code.ts"],
    });
  });

  it("GIVEN content without front matter WHEN parsed THEN returns defaults", () => {
    // Given
    const content = "# Just markdown content";

    // When
    const result = parseFrontMatter(content);

    // Then
    expect(result).toEqual({
      specs: [],
      files: [],
    });
  });

  it("GIVEN malformed YAML WHEN parsed THEN returns defaults with warning", () => {
    // Given
    const content = `---
invalid: yaml: content: here
---
# Content`;

    // When
    const result = parseFrontMatter(content);

    // Then
    expect(result.specs).toEqual([]);
    expect(result.files).toEqual([]);
    expect(result.parseError).toBeDefined();
  });
});

describe("extractFilePaths", () => {
  it("GIVEN array with strings WHEN extracted THEN returns strings", () => {
    // Given
    const input = ["path/one.md", "path/two.ts"];

    // When
    const result = extractFilePaths(input);

    // Then
    expect(result).toEqual(["path/one.md", "path/two.ts"]);
  });

  it("GIVEN array with non-strings WHEN extracted THEN filters them out", () => {
    // Given
    const input = ["valid.md", 123, null, "also-valid.ts", { not: "a string" }];

    // When
    const result = extractFilePaths(input);

    // Then
    expect(result).toEqual(["valid.md", "also-valid.ts"]);
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Auto-Injection](./../../decisions/adr-54_auto-injection.md) - Front matter structure

## Quality Requirements

### QR1: Graceful Degradation

**Requirement:** Parsing errors must not crash, return defaults instead
**Target:** No exceptions from parse function
**Validation:** Fuzz testing with invalid inputs

### QR2: Use Standard Library

**Requirement:** Use `yaml` npm package, not custom parser
**Target:** No hand-rolled YAML parsing
**Validation:** Import check in code review

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Valid YAML parsed correctly
- [ ] Missing front matter returns defaults
- [ ] Malformed YAML returns defaults with error info
- [ ] Non-string paths filtered out
