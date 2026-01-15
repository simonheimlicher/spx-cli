# Story: CLI Integration

## Functional Requirements

### FR1: Implement `spx claude settings consolidate` command (preview by default)

```gherkin
GIVEN spx CLI with claude domain
WHEN running `spx claude settings consolidate`
THEN preview consolidation results without modifying files
AND show instructions to use --write or --output-file
```

#### Files created/modified

1. `src/cli.ts` [modify]: Register claude domain
2. `src/domains/claude/index.ts` [modify]: Claude domain registration with command options
3. `src/commands/claude/settings/consolidate.ts` [modify]: Replace dryRun with write/outputFile logic
4. `src/lib/claude/settings/reporter.ts` [modify]: Show instructions in preview mode
5. `tsup.config.ts` [modify]: Externalize execa to fix ESM bundling

### FR2: Support explicit write mode

```gherkin
GIVEN spx CLI
WHEN running `spx claude settings consolidate --write`
THEN create backup and modify global settings file
AND show confirmation message with paths
```

#### Files created/modified

1. `src/domains/claude/index.ts` [modify]: Add --write option
2. `src/commands/claude/settings/consolidate.ts` [modify]: Implement write logic with backup

### FR3: Support output-file mode for inspection

```gherkin
GIVEN spx CLI
WHEN running `spx claude settings consolidate --output-file /path/to/file`
THEN write merged settings to specified file
AND show instructions to review and optionally copy to global settings
```

#### Files created/modified

1. `src/domains/claude/index.ts` [modify]: Add --output-file option with mutual exclusion validation
2. `src/commands/claude/settings/consolidate.ts` [modify]: Implement output-file logic
3. `src/lib/claude/permissions/types.ts` [modify]: Add outputPath to ConsolidationResult

### FR4: Support custom root directory

```gherkin
GIVEN spx CLI
WHEN running `spx claude settings consolidate --root /custom/path`
THEN scan custom directory instead of default ~/Code
```

#### Files created/modified

1. `src/domains/claude/index.ts` [existing]: Pass root option to consolidateCommand

### FR5: Support custom global settings path

```gherkin
GIVEN spx CLI
WHEN running `spx claude settings consolidate --global-settings /custom/settings.json`
THEN read from custom settings file for merging
```

#### Files created/modified

1. `src/domains/claude/index.ts` [existing]: Pass globalSettings option to consolidateCommand

## Testing Strategy

> Stories require **Level 1** to prove core logic works, but CLI integration requires **Level 2**.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component           | Level | Justification                            |
| ------------------- | ----- | ---------------------------------------- |
| Command routing     | 2     | Requires Commander.js                    |
| CLI option parsing  | 2     | Integration with CLI framework           |
| End-to-end workflow | 2     | Requires real spx binary and file system |

### When to Escalate

This story uses Level 2 because:

- We're testing the full CLI command execution path through Commander.js
- We need to verify command routing, option parsing, and stdout output
- Integration tests validate the complete user experience

## Integration Tests (Level 2)

```typescript
// specs/doing/capability-33_claude-settings/feature-54_settings-consolidation/story-54_cli-integration/tests/integration/cli.integration.test.ts
import { execa } from "execa";
import { mkdir, mkdtemp, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("spx claude settings consolidate command", () => {
  let tempDir: string;
  let globalSettings: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spx-cli-test-"));
    globalSettings = join(tempDir, ".claude", "settings.json");

    // Create test project structure with local settings
    const project1 = join(tempDir, "project1");
    await mkdir(join(project1, ".claude"), { recursive: true });
    await writeFile(
      join(project1, ".claude", "settings.local.json"),
      JSON.stringify({
        permissions: {
          allow: ["Bash(git:*)", "Read(//tmp/**)"],
          deny: [],
          ask: [],
        },
      }),
    );

    const project2 = join(tempDir, "project2");
    await mkdir(join(project2, ".claude"), { recursive: true });
    await writeFile(
      join(project2, ".claude", "settings.local.json"),
      JSON.stringify({
        permissions: {
          allow: ["Bash(npm:*)"],
          deny: [],
          ask: [],
        },
      }),
    );
  });

  it("GIVEN projects with local settings WHEN running consolidate with --dry-run THEN previews changes", async () => {
    const { stdout, exitCode } = await execa(
      "node",
      [
        "bin/spx.js",
        "claude",
        "settings",
        "consolidate",
        "--dry-run",
        "--root",
        tempDir,
      ],
      {
        cwd: process.cwd(),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Found 2 settings files");
    expect(stdout).toContain("Bash(git:*)");
    expect(stdout).toContain("Bash(npm:*)");
    expect(stdout).toContain("Read(//tmp/**)");
    expect(stdout).toContain("Dry-run mode");
  });

  it("GIVEN projects with local settings WHEN running consolidate THEN merges and writes settings", async () => {
    const { stdout, exitCode } = await execa(
      "node",
      [
        "bin/spx.js",
        "claude",
        "settings",
        "consolidate",
        "--root",
        tempDir,
        `--globalSettings=${globalSettings}`,
      ],
      {
        cwd: process.cwd(),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Found 2 settings files");
    expect(stdout).toContain("Permissions added: 3");

    // Verify settings file was created
    const { readFile } = await import("fs/promises");
    const settings = JSON.parse(await readFile(globalSettings, "utf-8"));
    expect(settings.permissions.allow).toContain("Bash(git:*)");
    expect(settings.permissions.allow).toContain("Bash(npm:*)");
    expect(settings.permissions.allow).toContain("Read(//tmp/**)");
  });

  it("GIVEN empty directory WHEN running consolidate THEN shows no settings found", async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), "spx-cli-empty-"));

    const { stdout, exitCode } = await execa(
      "node",
      ["bin/spx.js", "claude", "settings", "consolidate", "--root", emptyDir],
      {
        cwd: process.cwd(),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("No settings files found");
  });

  it("GIVEN help flag WHEN running consolidate THEN shows usage", async () => {
    const { stdout, exitCode } = await execa(
      "node",
      ["bin/spx.js", "claude", "settings", "consolidate", "--help"],
      {
        cwd: process.cwd(),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Consolidate permissions");
    expect(stdout).toContain("--dry-run");
    expect(stdout).toContain("--root");
    expect(stdout).toContain("--global-settings");
  });

  it("GIVEN subsumable permissions WHEN running consolidate THEN removes subsumed", async () => {
    // Create project with narrow and broad permissions
    const project = join(tempDir, "project-subsume");
    await mkdir(join(project, ".claude"), { recursive: true });
    await writeFile(
      join(project, ".claude", "settings.local.json"),
      JSON.stringify({
        permissions: {
          allow: [
            "Bash(git:*)",
            "Bash(git status)",
            "Bash(git log:*)",
          ],
          deny: [],
          ask: [],
        },
      }),
    );

    const { stdout, exitCode } = await execa(
      "node",
      [
        "bin/spx.js",
        "claude",
        "settings",
        "consolidate",
        "--dry-run",
        "--root",
        tempDir,
      ],
      {
        cwd: process.cwd(),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Subsumed permissions removed:");
    expect(stdout).toContain("Bash(git status)");
    expect(stdout).toContain("Bash(git log:*)");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `specs/doing/capability-33_claude-settings/decisions/adr-001_subsumption-over-deduplication.md` - Subsumption algorithm
2. `specs/doing/capability-33_claude-settings/decisions/adr-002_security-first-conflict-resolution.md` - Deny wins over allow
3. `specs/doing/capability-33_claude-settings/decisions/adr-003_atomic-writes-with-temp-files.md` - Atomic write pattern

## Quality Requirements

### QR1: Type Safety

**Requirement:** All CLI commands must have TypeScript type annotations
**Target:** 100% type coverage
**Validation:** `npm run typecheck` passes with no errors

### QR2: Error Handling

**Requirement:** All CLI errors must be caught and reported with actionable messages
**Target:** Non-zero exit codes for failures
**Validation:** Integration tests verify error paths

### QR3: User Experience

**Requirement:** CLI output must be clear, concise, and formatted
**Target:** Dry-run shows preview, actual run shows confirmation
**Validation:** Integration tests verify stdout format

## Completion Criteria

- [ ] All Level 2 integration tests pass
- [ ] Command routing works through Commander.js
- [ ] All options (--dry-run, --root) are functional
- [ ] Help text is clear and accurate
- [ ] Exit codes are correct (0 for success, non-zero for failure)
- [ ] Output formatting matches user expectations
- [ ] 100% type coverage

## Documentation

1. Update `README.md` with `spx claude settings consolidate` usage examples
2. JSDoc comments on CLI command handlers in `src/domains/claude/index.ts`
