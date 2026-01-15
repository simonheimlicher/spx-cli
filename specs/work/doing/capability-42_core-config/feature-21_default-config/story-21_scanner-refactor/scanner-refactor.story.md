# Story: Refactor Scanner for Dependency Injection

## Observable Outcome

The scanner accepts config as a constructor parameter (dependency injection pattern) and uses config properties for all directory paths, completely eliminating hardcoded path strings from scanner code.

## Story Context

This story refactors the existing scanner to use the DEFAULT_CONFIG from Story 11. It replaces all hardcoded path strings (`"specs"`, `"work"`, `"doing"`, etc.) with references to an injected config object, enabling future config override functionality.

**Parent Feature**: [Feature 21: Default Config Structure](../default-config.feature.md)

**Parent ADR**: [ADR-001: TypeScript Const for Default Config Structure](../decisions/adr-001_config-schema-structure.md)

**Depends On**: Story 11 (config schema must exist)

## Acceptance Criteria

- [ ] Scanner constructor accepts `config: SpxConfig` parameter
- [ ] All references to `"specs"` replaced with `config.specs.root`
- [ ] All references to `"work"` replaced with `config.specs.work.dir`
- [ ] All references to status dirs replaced with `config.specs.work.statusDirs.*`
- [ ] Scanner uses path.join with config values for path construction
- [ ] Level 1 tests verify scanner uses injected config correctly
- [ ] Meta-test verifies no hardcoded paths remain in scanner source files

## Testing Strategy

### Level 1 (Unit) - REQUIRED

**Question Answered**: Does the scanner correctly use injected config for all path operations?

**Scope**: Scanner constructor, path resolution logic, config usage verification

**Behaviors to Verify**:

1. Scanner accepts config via constructor (dependency injection)
2. Scanner uses `config.specs.root` when constructing paths
3. Scanner uses `config.specs.work.dir` when constructing paths
4. Scanner uses `config.specs.work.statusDirs.*` for status directories
5. Scanner finds work items when given custom config values (test with non-default paths)
6. No hardcoded path strings remain in scanner source files (meta-test)

**Test Harness**: Temporary directories with test fixtures in `os.tmpdir()`

**Dependencies**:

- Node.js fs built-ins (Level 1)
- Vitest test runner

## Test Specifications

### Test File: `tests/scanner-di.unit.test.ts`

```typescript
/**
 * Level 1: Scanner Dependency Injection
 *
 * These tests verify that the scanner correctly accepts and uses config
 * via constructor injection, replacing all hardcoded paths with config
 * references.
 */

import { SpxConfig } from "@/config/defaults";
import { Scanner } from "@/scanner";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Story 21: Scanner Dependency Injection", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for test fixtures
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "spx-scanner-test-"));
  });

  afterEach(async () => {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("Scanner constructor accepts config", () => {
    it("GIVEN custom config WHEN creating scanner THEN accepts config parameter", () => {
      const customConfig: SpxConfig = {
        specs: {
          root: "custom-specs",
          work: {
            dir: "custom-work",
            statusDirs: {
              doing: "active",
              backlog: "queue",
              done: "completed",
            },
          },
          decisions: "adrs",
        },
        sessions: {
          dir: ".custom/sessions",
        },
      };

      // Should not throw
      expect(() => new Scanner(tempDir, customConfig)).not.toThrow();
    });

    it("GIVEN scanner with config WHEN accessing THEN config is available", () => {
      const customConfig: SpxConfig = {
        specs: {
          root: "docs",
          work: {
            dir: "items",
            statusDirs: {
              doing: "in-progress",
              backlog: "backlog",
              done: "archive",
            },
          },
          decisions: "decisions",
        },
        sessions: {
          dir: ".spx/sessions",
        },
      };

      const scanner = new Scanner(tempDir, customConfig);

      // Verify scanner has access to config (internal state check)
      expect(scanner).toBeDefined();
    });
  });

  describe("Scanner uses config.specs.root", () => {
    it("GIVEN scanner with custom specs.root WHEN scanning THEN uses custom root path", async () => {
      // Given: Directory structure with custom specs root
      const customRoot = "documentation";
      await fs.mkdir(path.join(tempDir, customRoot, "work", "doing", "capability-10_test"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(tempDir, customRoot, "work", "doing", "capability-10_test", "test.capability.md"),
        "# Test Capability\n",
      );

      const customConfig: SpxConfig = {
        specs: {
          root: customRoot,
          work: {
            dir: "work",
            statusDirs: {
              doing: "doing",
              backlog: "backlog",
              done: "archive",
            },
          },
          decisions: "decisions",
        },
        sessions: {
          dir: ".spx/sessions",
        },
      };

      // When: Scanner scans with custom config
      const scanner = new Scanner(tempDir, customConfig);
      const workItems = await scanner.scan();

      // Then: Scanner found work items under custom root
      expect(workItems.length).toBeGreaterThan(0);
      expect(workItems[0].path).toContain(customRoot);
    });
  });

  describe("Scanner uses config.specs.work.dir", () => {
    it("GIVEN scanner with custom work.dir WHEN scanning THEN uses custom work directory", async () => {
      // Given: Directory structure with custom work directory
      const customWorkDir = "active-items";
      await fs.mkdir(
        path.join(tempDir, "specs", customWorkDir, "doing", "feature-20_test"),
        { recursive: true },
      );
      await fs.writeFile(
        path.join(tempDir, "specs", customWorkDir, "doing", "feature-20_test", "test.feature.md"),
        "# Test Feature\n",
      );

      const customConfig: SpxConfig = {
        specs: {
          root: "specs",
          work: {
            dir: customWorkDir,
            statusDirs: {
              doing: "doing",
              backlog: "backlog",
              done: "archive",
            },
          },
          decisions: "decisions",
        },
        sessions: {
          dir: ".spx/sessions",
        },
      };

      // When: Scanner scans with custom config
      const scanner = new Scanner(tempDir, customConfig);
      const workItems = await scanner.scan();

      // Then: Scanner found work items under custom work directory
      expect(workItems.length).toBeGreaterThan(0);
      expect(workItems[0].path).toContain(customWorkDir);
    });
  });

  describe("Scanner uses config.specs.work.statusDirs", () => {
    it("GIVEN scanner with custom statusDirs WHEN scanning THEN uses custom status directories", async () => {
      // Given: Directory structure with custom status directories
      await fs.mkdir(
        path.join(tempDir, "specs", "work", "in-progress", "story-30_test"),
        { recursive: true },
      );
      await fs.writeFile(
        path.join(tempDir, "specs", "work", "in-progress", "story-30_test", "test.story.md"),
        "# Test Story\n",
      );

      const customConfig: SpxConfig = {
        specs: {
          root: "specs",
          work: {
            dir: "work",
            statusDirs: {
              doing: "in-progress", // Custom status dir name
              backlog: "queue",
              done: "completed",
            },
          },
          decisions: "decisions",
        },
        sessions: {
          dir: ".spx/sessions",
        },
      };

      // When: Scanner scans with custom config
      const scanner = new Scanner(tempDir, customConfig);
      const workItems = await scanner.scan();

      // Then: Scanner found work items under custom status directory
      expect(workItems.length).toBeGreaterThan(0);
      expect(workItems[0].path).toContain("in-progress");
      expect(workItems[0].status).toBe("doing");
    });
  });

  describe("Scanner works with completely custom config", () => {
    it("GIVEN scanner with all custom paths WHEN scanning THEN finds work items correctly", async () => {
      // Given: Completely custom directory structure
      const customRoot = "docs/specifications";
      const customWorkDir = "active";
      const customDoingDir = "current";
      await fs.mkdir(
        path.join(tempDir, customRoot, customWorkDir, customDoingDir, "capability-42_custom"),
        { recursive: true },
      );
      await fs.writeFile(
        path.join(
          tempDir,
          customRoot,
          customWorkDir,
          customDoingDir,
          "capability-42_custom",
          "custom.capability.md",
        ),
        "# Custom Capability\n",
      );

      const customConfig: SpxConfig = {
        specs: {
          root: customRoot,
          work: {
            dir: customWorkDir,
            statusDirs: {
              doing: customDoingDir,
              backlog: "future",
              done: "finished",
            },
          },
          decisions: "adrs",
        },
        sessions: {
          dir: ".custom-spx/handoffs",
        },
      };

      // When: Scanner scans with completely custom config
      const scanner = new Scanner(tempDir, customConfig);
      const workItems = await scanner.scan();

      // Then: Scanner found work items using all custom paths
      expect(workItems.length).toBeGreaterThan(0);
      expect(workItems[0].path).toContain(customRoot);
      expect(workItems[0].path).toContain(customWorkDir);
      expect(workItems[0].path).toContain(customDoingDir);
    });
  });
});
```

### Test File: `tests/scanner-no-hardcoded-paths.unit.test.ts`

```typescript
/**
 * Meta-Test: Verify No Hardcoded Paths in Scanner
 *
 * This test ensures that the scanner refactoring is complete and no
 * hardcoded path strings remain in the scanner source code.
 */

import { glob } from "glob";
import * as fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Story 21: Scanner Has No Hardcoded Paths", () => {
  it("GIVEN scanner source files WHEN searching for hardcoded paths THEN none are found", async () => {
    // Find all scanner source files
    const scannerFiles = await glob("src/scanner/**/*.ts");

    // Patterns that indicate hardcoded paths
    const hardcodedPatterns = [
      /"specs"/, // Hardcoded specs directory
      /"work"/, // Hardcoded work directory
      /"doing"/, // Hardcoded doing directory
      /"backlog"/, // Hardcoded backlog directory
      /"archive"/, // Hardcoded archive directory (done dir)
      /"decisions"/, // Hardcoded decisions directory
    ];

    const violations: Array<{ file: string; line: number; content: string }> = [];

    // Check each file for hardcoded patterns
    for (const file of scannerFiles) {
      const content = await fs.readFile(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // Skip comments and imports
        if (line.trim().startsWith("//") || line.trim().startsWith("*") || line.trim().startsWith("import")) {
          return;
        }

        for (const pattern of hardcodedPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      });
    }

    // Assert no violations found
    if (violations.length > 0) {
      const violationDetails = violations
        .map((v) => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join("\n\n");

      throw new Error(
        `Found ${violations.length} hardcoded path(s) in scanner files:\n\n${violationDetails}\n\nAll paths must come from config parameter.`,
      );
    }

    expect(violations.length).toBe(0);
  });
});
```

## Implementation Guidance

### Scanner Constructor Refactoring

```typescript
// Before: Hardcoded paths
export class Scanner {
  constructor(private projectRoot: string) {}

  async scan() {
    const specsPath = path.join(this.projectRoot, "specs", "work", "doing");
    // ...
  }
}

// After: Dependency injection
export class Scanner {
  constructor(
    private projectRoot: string,
    private config: SpxConfig,
  ) {}

  async scan() {
    const specsPath = path.join(
      this.projectRoot,
      this.config.specs.root,
      this.config.specs.work.dir,
      this.config.specs.work.statusDirs.doing,
    );
    // ...
  }
}
```

### Path Construction Pattern

```typescript
// WRONG: Hardcoded strings
const workPath = path.join(root, "specs", "work");

// CORRECT: Config references
const workPath = path.join(root, this.config.specs.root, this.config.specs.work.dir);
```

## Related Work Items

- **Blocked By**: Story 11 (needs SpxConfig interface and DEFAULT_CONFIG)
- **Blocks**: Story 31 (CLI integration needs refactored scanner)

## Definition of Done

- [ ] All Level 1 unit tests pass
- [ ] Meta-test passes (no hardcoded paths in scanner)
- [ ] Scanner constructor signature updated with config parameter
- [ ] All hardcoded path strings replaced with config references
- [ ] TypeScript compilation succeeds
- [ ] Tests graduate to `tests/unit/scanner/`

## Notes

- Use dependency injection, not mocking - tests pass real config objects
- Meta-test ensures refactoring is complete and prevents regression
- All tests use `os.tmpdir()` for fixtures (Level 1 requirement)
- Scanner behavior should be identical, just using injected paths
