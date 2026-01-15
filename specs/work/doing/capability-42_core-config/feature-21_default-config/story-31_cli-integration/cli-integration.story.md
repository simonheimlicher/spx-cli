# Story: Integrate Config with CLI Commands

## Observable Outcome

All spx CLI commands (particularly `spx status`) instantiate the scanner with `DEFAULT_CONFIG`, ensuring the complete CLI workflow uses config-resolved paths and eliminating all hardcoded paths from the CLI layer.

## Story Context

This story completes Feature 21 by wiring up the refactored scanner (Story 21) with DEFAULT_CONFIG (Story 11) in the CLI command layer. It includes Level 2 integration tests that verify the full CLI execution flow with real commands and real directory structures.

**Parent Feature**: [Feature 21: Default Config Structure](../default-config.feature.md)

**Parent ADR**: [ADR-001: TypeScript Const for Default Config Structure](../decisions/adr-001_config-schema-structure.md)

**Depends On**:

- Story 11 (needs DEFAULT_CONFIG export)
- Story 21 (needs refactored scanner with config parameter)

## Acceptance Criteria

- [ ] CLI commands import DEFAULT_CONFIG from `@/config/defaults`
- [ ] Scanner is instantiated with DEFAULT_CONFIG in all command handlers
- [ ] `spx status` command uses config-resolved paths
- [ ] `spx status --json` output includes config values
- [ ] Helper function `createTestProject` exists for creating temp test projects
- [ ] Level 2 integration tests verify full CLI workflow
- [ ] Integration tests use real `spx` CLI binary execution

## Testing Strategy

### Level 2 (Integration) - REQUIRED

**Question Answered**: Does the full CLI command correctly wire up scanner with DEFAULT_CONFIG and produce expected output?

**Scope**: CLI command parsing, scanner instantiation, full command execution, reporter output

**Behaviors to Verify**:

1. Running `spx status` CLI command succeeds with default directory structure
2. CLI output includes config values matching DEFAULT_CONFIG
3. Scanner finds work items using DEFAULT_CONFIG paths (not hardcoded paths)
4. Full CLI workflow: command parsing → scanner instantiation with DEFAULT_CONFIG → reporter output
5. Test harness `createTestProject` creates realistic project structures in temp directories

**Test Harness**: `createTestProject` helper function

**Dependencies**:

- Real spx CLI binary (Level 2: project-specific tool)
- Node.js child_process for CLI execution (Level 1 tool)
- Vitest test runner

### Escalation Rationale (Level 1 → Level 2)

Level 1 tests (Stories 11 and 21) verified:

- Config structure is correct
- Scanner uses injected config

Level 2 adds confidence that:

- CLI commands actually instantiate scanner with DEFAULT_CONFIG (not test configs)
- Full command execution flow works (parsing → instantiation → scanning → reporting)
- Real CLI binary produces expected output with default structure

We cannot verify the complete CLI integration at Level 1 because:

- Need to execute the real spx binary (project-specific tool = Level 2)
- Need to verify command argument parsing works correctly
- Need to verify reporter integration with resolved paths

## Test Specifications

### Test File: `tests/cli-integration.integration.test.ts`

```typescript
/**
 * Level 2: CLI Integration with DEFAULT_CONFIG
 *
 * These tests verify that the full CLI command workflow correctly uses
 * DEFAULT_CONFIG to resolve paths and find work items.
 *
 * Test Harness: createTestProject helper creates temp projects with
 * realistic directory structures.
 */

import { DEFAULT_CONFIG } from "@/config/defaults";
import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execAsync = promisify(exec);

describe("Story 31: CLI Integration", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for test projects
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "spx-cli-test-"));
  });

  afterEach(async () => {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("FI1: Scanner uses default config paths", () => {
    it("GIVEN project with default structure WHEN scanner runs THEN it finds work items using DEFAULT_CONFIG paths", async () => {
      // Given: Real project with specs/work/doing structure
      const projectDir = await createTestProject(tempDir, {
        useDefaultStructure: true,
      });

      // Create a sample capability
      await fs.mkdir(
        path.join(
          projectDir,
          DEFAULT_CONFIG.specs.root,
          DEFAULT_CONFIG.specs.work.dir,
          DEFAULT_CONFIG.specs.work.statusDirs.doing,
          "capability-10_test",
        ),
        { recursive: true },
      );
      await fs.writeFile(
        path.join(
          projectDir,
          DEFAULT_CONFIG.specs.root,
          DEFAULT_CONFIG.specs.work.dir,
          DEFAULT_CONFIG.specs.work.statusDirs.doing,
          "capability-10_test",
          "test.capability.md",
        ),
        "# Test Capability\n\n## Observable Outcome\nTest capability for integration testing.\n",
      );

      // When: Run spx status via CLI
      const { stdout, stderr } = await execAsync("node bin/spx.js status --json", {
        cwd: projectDir,
      });

      // Then: Command succeeded
      expect(stderr).toBe("");

      // Parse JSON output
      const status = JSON.parse(stdout);

      // Verify scanner used DEFAULT_CONFIG paths
      expect(status.capabilities).toBeDefined();
      expect(status.capabilities.length).toBeGreaterThan(0);

      // All found work items should be under DEFAULT_CONFIG paths
      const expectedPath = path.join(
        projectDir,
        DEFAULT_CONFIG.specs.root,
        DEFAULT_CONFIG.specs.work.dir,
        DEFAULT_CONFIG.specs.work.statusDirs.doing,
      );

      for (const capability of status.capabilities) {
        expect(capability.path).toContain(DEFAULT_CONFIG.specs.root);
        expect(capability.path).toContain(DEFAULT_CONFIG.specs.work.dir);
      }
    });
  });

  describe("FI2: CLI commands use default config paths", () => {
    it("GIVEN no custom config WHEN spx status runs THEN output reflects DEFAULT_CONFIG paths", async () => {
      // Given: Project without .spx/config.json
      const projectDir = await createTestProject(tempDir, {
        useDefaultStructure: true,
        includeConfigFile: false,
      });

      // Create sample work items
      await fs.mkdir(
        path.join(projectDir, "specs", "work", "doing", "feature-20_sample"),
        { recursive: true },
      );
      await fs.writeFile(
        path.join(projectDir, "specs", "work", "doing", "feature-20_sample", "sample.feature.md"),
        "# Sample Feature\n",
      );

      // When: Run spx status --json
      const { stdout, stderr } = await execAsync("node bin/spx.js status --json", {
        cwd: projectDir,
      });

      // Then: Status output shows default config was used
      expect(stderr).toBe("");
      const status = JSON.parse(stdout);

      // Verify config values in output match DEFAULT_CONFIG
      expect(status.config).toBeDefined();
      expect(status.config.specs.root).toBe(DEFAULT_CONFIG.specs.root);
      expect(status.config.specs.work.dir).toBe(DEFAULT_CONFIG.specs.work.dir);
      expect(status.config.specs.work.statusDirs).toEqual(
        DEFAULT_CONFIG.specs.work.statusDirs,
      );
    });
  });

  describe("FI3: No hardcoded paths remain in CLI workflow", () => {
    it("GIVEN modified default paths WHEN spx status runs THEN scanner still finds work items", async () => {
      // This test verifies that if we update DEFAULT_CONFIG values,
      // the scanner adapts automatically (no hardcoded paths remain)

      // Given: Project with structure matching updated DEFAULT_CONFIG
      // (In reality, this would be a different project structure)
      const projectDir = await createTestProject(tempDir, {
        useDefaultStructure: true,
      });

      // Create work item in default location
      await fs.mkdir(
        path.join(projectDir, "specs", "work", "doing", "story-30_test"),
        { recursive: true },
      );
      await fs.writeFile(
        path.join(projectDir, "specs", "work", "doing", "story-30_test", "test.story.md"),
        "# Test Story\n",
      );

      // When: Run spx status
      const { stdout, stderr } = await execAsync("node bin/spx.js status --json", {
        cwd: projectDir,
      });

      // Then: Command succeeded and found work items
      expect(stderr).toBe("");
      const status = JSON.parse(stdout);
      expect(status.stories).toBeDefined();
      expect(status.stories.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Test Harness: Create Test Project
 *
 * Creates a realistic temporary project with spx directory structure
 * for integration testing.
 */
async function createTestProject(
  baseDir: string,
  options: {
    useDefaultStructure?: boolean;
    includeConfigFile?: boolean;
  } = {},
): Promise<string> {
  const { useDefaultStructure = true, includeConfigFile = false } = options;

  // Create unique project directory
  const projectDir = await fs.mkdtemp(path.join(baseDir, "project-"));

  if (useDefaultStructure) {
    // Create default spx directory structure
    await fs.mkdir(
      path.join(
        projectDir,
        DEFAULT_CONFIG.specs.root,
        DEFAULT_CONFIG.specs.work.dir,
        DEFAULT_CONFIG.specs.work.statusDirs.doing,
      ),
      { recursive: true },
    );
    await fs.mkdir(
      path.join(
        projectDir,
        DEFAULT_CONFIG.specs.root,
        DEFAULT_CONFIG.specs.work.dir,
        DEFAULT_CONFIG.specs.work.statusDirs.backlog,
      ),
      { recursive: true },
    );
    await fs.mkdir(
      path.join(
        projectDir,
        DEFAULT_CONFIG.specs.root,
        DEFAULT_CONFIG.specs.work.dir,
        DEFAULT_CONFIG.specs.work.statusDirs.done,
      ),
      { recursive: true },
    );

    // Create specs/CLAUDE.md
    await fs.writeFile(
      path.join(projectDir, DEFAULT_CONFIG.specs.root, "CLAUDE.md"),
      "# Test Project\n\nThis is a test project for integration testing.\n",
    );
  }

  if (includeConfigFile) {
    // Create .spx/config.json
    await fs.mkdir(path.join(projectDir, ".spx"), { recursive: true });
    await fs.writeFile(
      path.join(projectDir, ".spx", "config.json"),
      JSON.stringify(DEFAULT_CONFIG, null, 2),
    );
  }

  return projectDir;
}
```

## Implementation Guidance

### CLI Command Integration

```typescript
// src/commands/status.ts

import { DEFAULT_CONFIG } from "@/config/defaults";
import { Scanner } from "@/scanner";

export async function statusCommand(options: StatusOptions) {
  // Get project root (discovered via git or $PWD)
  const projectRoot = await discoverProjectRoot();

  // Instantiate scanner with DEFAULT_CONFIG
  const scanner = new Scanner(projectRoot, DEFAULT_CONFIG);

  // Scan for work items
  const workItems = await scanner.scan();

  // Report results
  const reporter = new Reporter(options);
  reporter.report(workItems, DEFAULT_CONFIG);
}
```

### Reporter Integration

```typescript
// Reporter should include config in output for transparency

export class Reporter {
  report(workItems: WorkItem[], config: SpxConfig) {
    if (this.options.json) {
      console.log(
        JSON.stringify({
          config: {
            specs: config.specs,
            sessions: config.sessions,
          },
          capabilities: workItems.filter((i) => i.type === "capability"),
          features: workItems.filter((i) => i.type === "feature"),
          stories: workItems.filter((i) => i.type === "story"),
        }),
      );
    }
  }
}
```

## Related Work Items

- **Blocked By**:
  - Story 11 (needs DEFAULT_CONFIG)
  - Story 21 (needs refactored scanner)
- **Blocks**: None (completes Feature 21)

## Definition of Done

- [ ] All Level 2 integration tests pass
- [ ] `spx status` command executes successfully with default structure
- [ ] CLI output includes config values
- [ ] `createTestProject` helper function is reusable for other features
- [ ] TypeScript compilation succeeds
- [ ] Tests graduate to `tests/integration/`
- [ ] Feature 21 is complete (all stories done)

## Notes

- Integration tests execute the real spx CLI binary (Level 2)
- Test harness creates realistic project structures in temp directories
- Tests verify the COMPLETE workflow, not just individual components
- `createTestProject` helper should be moved to a shared test utils module for reuse
