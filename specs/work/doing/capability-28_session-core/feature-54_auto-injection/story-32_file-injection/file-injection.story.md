# Story: File Injection

## Functional Requirements

### FR1: Read and format files for injection

```gherkin
GIVEN array of file paths from YAML front matter
WHEN injectFiles(paths) is called
THEN file contents are read and formatted with delimiters
```

#### Files created/modified

1. `src/session/inject.ts` [new]: File injection logic

### FR2: Format output with clear delimiters

```gherkin
GIVEN file content from path/to/file.ts
WHEN formatted for output
THEN output includes "--- path/to/file.ts ---" header followed by content
```

#### Files created/modified

1. `src/session/inject.ts` [modify]: Add formatting

### FR3: Warn on missing files, continue with others

```gherkin
GIVEN paths where some files exist and some don't
WHEN injectFiles(paths) is called
THEN existing files are injected, missing files produce warnings
```

#### Files created/modified

1. `src/session/inject.ts` [modify]: Add missing file handling

### FR4: Support --no-inject flag

```gherkin
GIVEN session pickup with --no-inject flag
WHEN pickup executes
THEN file injection step is skipped entirely
```

#### Files created/modified

1. `src/session/pickup.ts` [modify]: Add inject flag handling

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component          | Level | Justification                      |
| ------------------ | ----- | ---------------------------------- |
| Output formatting  | 1     | Pure function: content → formatted |
| Injection decision | 1     | Pure function: flags → boolean     |

### When to Escalate

This story stays at Level 1 because:

- Formatting is pure string manipulation
- Actual file reading tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/inject.test.ts
import { describe, expect, it } from "vitest";
import { formatInjectedFile, formatInjectionSection, shouldInject } from "../../../src/session/inject";

describe("formatInjectedFile", () => {
  it("GIVEN file path and content WHEN formatted THEN includes header", () => {
    // Given
    const path = "src/example.ts";
    const content = "const x = 1;";

    // When
    const result = formatInjectedFile(path, content);

    // Then
    expect(result).toContain("--- src/example.ts ---");
    expect(result).toContain("const x = 1;");
  });
});

describe("formatInjectionSection", () => {
  it("GIVEN multiple files WHEN formatted THEN includes section header", () => {
    // Given
    const files = [
      { path: "a.ts", content: "// a" },
      { path: "b.ts", content: "// b" },
    ];

    // When
    const result = formatInjectionSection(files);

    // Then
    expect(result).toContain("=== Injected Files ===");
    expect(result).toContain("--- a.ts ---");
    expect(result).toContain("--- b.ts ---");
  });

  it("GIVEN empty files array WHEN formatted THEN returns empty string", () => {
    // Given
    const files: Array<{ path: string; content: string }> = [];

    // When
    const result = formatInjectionSection(files);

    // Then
    expect(result).toBe("");
  });

  it("GIVEN files with warnings WHEN formatted THEN includes warnings", () => {
    // Given
    const files = [{ path: "exists.ts", content: "// content" }];
    const warnings = [{ path: "missing.ts", error: "File not found" }];

    // When
    const result = formatInjectionSection(files, warnings);

    // Then
    expect(result).toContain("[Warning: File not found: missing.ts]");
  });
});

describe("shouldInject", () => {
  it("GIVEN no flags WHEN checked THEN returns true (default)", () => {
    // Given
    const options = {};

    // When
    const result = shouldInject(options);

    // Then
    expect(result).toBe(true);
  });

  it("GIVEN --no-inject flag WHEN checked THEN returns false", () => {
    // Given
    const options = { noInject: true };

    // When
    const result = shouldInject(options);

    // Then
    expect(result).toBe(false);
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Auto-Injection](./../../decisions/adr-54_auto-injection.md) - Injection behavior

## Quality Requirements

### QR1: Clear Output Format

**Requirement:** Injected content must have unambiguous delimiters
**Target:** File paths clearly visible in output
**Validation:** Output parsing in tests

### QR2: Graceful Missing Files

**Requirement:** Missing files must not fail operation
**Target:** Warnings collected, operation continues
**Validation:** Integration tests with mixed existing/missing

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Files formatted with clear delimiters
- [ ] Missing files produce warnings, not errors
- [ ] --no-inject flag works correctly
- [ ] Empty injection list produces no output section
