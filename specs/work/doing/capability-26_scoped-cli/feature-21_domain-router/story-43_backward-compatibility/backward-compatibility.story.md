# Story: Backward Compatibility Layer

## Functional Requirements

### FR1: Add root command aliases

```gherkin
GIVEN existing users running old commands
WHEN we introduce domain-scoped architecture
THEN preserve old command syntax for smooth migration
```

#### Files created/modified

1. `src/cli.ts` [modify]: Add root-level aliases for status and next commands

**Implementation**:

```typescript
// src/cli.ts (additions after domain registration)

// Backward compatibility: Root command aliases (deprecated)
program
  .command("status")
  .description("(deprecated) Use 'spx spec status' instead")
  .option("--json", "Output as JSON")
  .option("--format <format>", "Output format (text|json|markdown|table)")
  .action(async (options: { json?: boolean; format?: string }) => {
    // Show deprecation warning to stderr
    console.warn("⚠️  Deprecated: Use 'spx spec status' instead");
    console.warn("   This alias will be removed in v2.0.0\n");

    // Delegate to spec domain status command
    try {
      let format: OutputFormat = "text";
      if (options.json) {
        format = "json";
      } else if (options.format) {
        const validFormats = ["text", "json", "markdown", "table"];
        if (validFormats.includes(options.format)) {
          format = options.format as OutputFormat;
        } else {
          console.error(
            `Error: Invalid format "${options.format}". Must be one of: ${
              validFormats.join(", ")
            }`,
          );
          process.exit(1);
        }
      }

      const { statusCommand } = await import("./commands/spec/status.js");
      const output = await statusCommand({ cwd: process.cwd(), format });
      console.log(output);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program
  .command("next")
  .description("(deprecated) Use 'spx spec next' instead")
  .action(async () => {
    // Show deprecation warning to stderr
    console.warn("⚠️  Deprecated: Use 'spx spec next' instead");
    console.warn("   This alias will be removed in v2.0.0\n");

    // Delegate to spec domain next command
    try {
      const { nextCommand } = await import("./commands/spec/next.js");
      const output = await nextCommand({ cwd: process.cwd() });
      console.log(output);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });
```

### FR2: Implement deprecation warnings

```gherkin
GIVEN user running deprecated command
WHEN command executes
THEN show clear warning directing to new syntax
```

#### Files created/modified

1. `src/cli.ts` [modify]: Add deprecation warnings to stderr (shown in FR1 implementation)

**Warning Format**:

- Output to **stderr** (not stdout) so it doesn't interfere with command output
- Clear symbol: ⚠️
- New command suggestion: "Use 'spx spec <command>' instead"
- Timeline: "This alias will be removed in v2.0.0"

### FR3: Verify zero breaking changes

```gherkin
GIVEN existing user workflows
WHEN running old commands
THEN all functionality works identically
```

#### Testing focus

- Old commands produce same output
- All options work (--json, --format)
- Exit codes match
- Only difference is deprecation warning on stderr

## Testing Strategy

### Level Assignment

| Component            | Level | Justification                                            |
| -------------------- | ----- | -------------------------------------------------------- |
| Alias delegation     | 2     | Requires real Commander.js to verify command routing     |
| Deprecation warnings | 2     | Requires real stderr output verification                 |
| Option passing       | 2     | Requires real CLI execution with all option combinations |

### Escalation Rationale

**1 → 2**: Must verify in real environment:

- Commander.js parses both old and new command syntax
- Warnings output to stderr (not stdout)
- Dynamic imports work correctly
- Options pass through alias layer

## Integration Tests (Level 2)

```typescript
// specs/doing/capability-26_scoped-cli/feature-21_domain-router/story-43_backward-compatibility/tests/backward-compatibility.integration.test.ts
import { createFixtureTree } from "@/tests/fixtures/factories";
import { execa } from "execa";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("Backward Compatibility Layer", () => {
  describe("status alias", () => {
    it("GIVEN old status command WHEN running THEN shows deprecation warning", async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "spx-test-"));
      await createFixtureTree({
        root: tempDir,
        capabilities: [{ number: 20, slug: "core-cli", status: "DONE" }],
      });

      try {
        const { stdout, stderr, exitCode } = await execa("node", [
          "bin/spx.js",
          "status",
        ], {
          cwd: tempDir,
        });

        // Verify command works
        expect(exitCode).toBe(0);
        expect(stdout).toContain("capability-21_core-cli");

        // Verify deprecation warning
        expect(stderr).toContain("⚠️");
        expect(stderr).toContain("Deprecated");
        expect(stderr).toContain("spx spec status");
        expect(stderr).toContain("v2.0.0");
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it("GIVEN old status --json WHEN running THEN works with warning", async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "spx-test-"));
      await createFixtureTree({
        root: tempDir,
        capabilities: [{ number: 20, slug: "core-cli", status: "DONE" }],
      });

      try {
        const { stdout, stderr, exitCode } = await execa("node", [
          "bin/spx.js",
          "status",
          "--json",
        ], {
          cwd: tempDir,
        });

        expect(exitCode).toBe(0);
        expect(stderr).toContain("Deprecated");

        // Verify JSON output still works
        const result = JSON.parse(stdout);
        expect(result).toHaveProperty("capabilities");
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it("GIVEN old status --format markdown WHEN running THEN works with warning", async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "spx-test-"));
      await createFixtureTree({
        root: tempDir,
        capabilities: [{ number: 20, slug: "core-cli", status: "DONE" }],
      });

      try {
        const { stdout, stderr, exitCode } = await execa("node", [
          "bin/spx.js",
          "status",
          "--format",
          "markdown",
        ], {
          cwd: tempDir,
        });

        expect(exitCode).toBe(0);
        expect(stderr).toContain("Deprecated");
        expect(stdout).toContain("##"); // Markdown header
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("next alias", () => {
    it("GIVEN old next command WHEN running THEN shows deprecation warning", async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "spx-test-"));
      await createFixtureTree({
        root: tempDir,
        capabilities: [
          { number: 20, slug: "core-cli", status: "DONE" },
          { number: 32, slug: "mcp-server", status: "OPEN" },
        ],
      });

      try {
        const { stdout, stderr, exitCode } = await execa("node", [
          "bin/spx.js",
          "next",
        ], {
          cwd: tempDir,
        });

        // Verify command works
        expect(exitCode).toBe(0);
        expect(stdout).toContain("Next work item:");

        // Verify deprecation warning
        expect(stderr).toContain("⚠️");
        expect(stderr).toContain("Deprecated");
        expect(stderr).toContain("spx spec next");
        expect(stderr).toContain("v2.0.0");
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("zero breaking changes", () => {
    it("GIVEN old and new commands WHEN comparing output THEN identical except warnings", async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "spx-test-"));
      await createFixtureTree({
        root: tempDir,
        capabilities: [{ number: 20, slug: "core-cli", status: "DONE" }],
      });

      try {
        // Run old command
        const oldResult = await execa("node", [
          "bin/spx.js",
          "status",
          "--json",
        ], {
          cwd: tempDir,
        });

        // Run new command
        const newResult = await execa("node", [
          "bin/spx.js",
          "spec",
          "status",
          "--json",
        ], {
          cwd: tempDir,
        });

        // Verify outputs are identical
        expect(oldResult.stdout).toBe(newResult.stdout);
        expect(oldResult.exitCode).toBe(newResult.exitCode);

        // Verify only old command has warning
        expect(oldResult.stderr).toContain("Deprecated");
        expect(newResult.stderr).toBe("");
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("help text", () => {
    it("GIVEN root help WHEN viewing THEN shows both old and new commands", async () => {
      const { stdout } = await execa("node", ["bin/spx.js", "--help"]);

      // New domain structure
      expect(stdout).toContain("spec");
      expect(stdout).toContain("Manage spec workflow");

      // Deprecated aliases (with deprecation note)
      expect(stdout).toContain("status");
      expect(stdout).toContain("deprecated");
      expect(stdout).toContain("next");
    });
  });

  describe("error handling", () => {
    it("GIVEN invalid format in alias WHEN running THEN shows error", async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "spx-test-"));

      try {
        const { stderr, exitCode } = await execa(
          "node",
          ["bin/spx.js", "status", "--format", "invalid"],
          {
            cwd: tempDir,
            reject: false,
          },
        );

        expect(exitCode).toBe(1);
        expect(stderr).toContain("Invalid format");
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
```

## Completion Criteria

- [ ] All Level 2 integration tests pass
- [ ] Root `status` command works with deprecation warning
- [ ] Root `next` command works with deprecation warning
- [ ] All command options work through aliases (--json, --format)
- [ ] Warnings output to stderr (not stdout)
- [ ] Old and new commands produce identical output
- [ ] Help text shows both old (deprecated) and new commands
- [ ] Exit codes match between old and new commands
- [ ] Error handling works through alias layer
- [ ] Zero breaking changes verified
- [ ] 100% type coverage

## Implementation Notes

### Why Level 2?

This story requires **real CLI execution** to verify:

- Deprecation warnings appear in stderr (not stdout)
- Dynamic imports work correctly
- Commander.js routes both old and new syntax
- Options pass through correctly
- Output streams are correctly separated (stdout vs stderr)

### Design Decisions

1. **Stderr for warnings**: Deprecation warnings go to stderr so they don't pollute:
   - JSON output (users parsing stdout)
   - Pipeline operations (users piping to other commands)
   - Automation scripts (can suppress stderr)

2. **Dynamic imports**: Use `await import()` to avoid circular dependencies and reduce initial bundle size

3. **Same functionality**: Aliases delegate to exact same command implementations, ensuring behavior parity

4. **Clear timeline**: "v2.0.0" gives users specific target for migration

### Migration Path

**Phase 1** (v0.2.0 - this story):

- Old commands work with warnings
- New commands work without warnings
- Documentation shows new syntax

**Phase 2** (v1.x):

- Documentation only shows new syntax
- Warnings remain
- Aliases still functional

**Phase 3** (v2.0.0):

- Remove aliases
- Only scoped commands remain

### Stderr vs Stdout

```bash
# Deprecation warning doesn't break JSON parsing
spx status --json > output.json 2>/dev/null

# Users can silence warnings if needed
spx status 2>/dev/null

# Or see only warnings for audit
spx status >/dev/null
```

### Testing Strategy

Tests verify the **contract**:

1. Old commands work identically to new commands
2. Only difference is deprecation warning in stderr
3. All edge cases (options, errors) work through alias layer
