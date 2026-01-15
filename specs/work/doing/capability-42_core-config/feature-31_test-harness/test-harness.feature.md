# Feature: Config Test Harness

## Observable Outcome

Tests can create isolated temporary project structures with custom `.spx/config.json` files using a `withConfig` context manager pattern, enabling deterministic testing of config loading, validation, and product root discovery across different directory layouts and git repository configurations.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component                  | Level | Justification                                                 |
| -------------------------- | ----- | ------------------------------------------------------------- |
| withConfig context manager | 1     | Pure test utility, no external system dependencies            |
| Temp directory creation    | 1     | Uses Node.js fs.mkdtemp, can verify in isolation              |
| Cleanup logic              | 1     | Pure function, can verify with mocked fs                      |
| Git repo simulation        | 2     | Requires real `git init` to test discovery logic              |
| Config file detection      | 2     | Requires real file I/O to test `.spx/config.json` loading     |
| Product root discovery     | 2     | Requires real directory structure to test git-based discovery |

### Escalation Rationale

- **1 → 2**: Level 1 proves the test harness API is correct and cleanup logic works. Level 2 adds confidence that the harness correctly simulates real project structures including git repositories, config files, and directory layouts that config loading code will encounter in production.

## Feature Integration Tests (Level 2)

These tests verify that **the test harness creates realistic project structures** for testing config functionality.

### FI1: withConfig creates isolated project with config file

```typescript
// tests/integration/test-harness-config.integration.test.ts
import { withConfig } from "@test/helpers/with-config";

describe("Feature: Config Test Harness", () => {
  it("GIVEN custom config WHEN using withConfig THEN isolated project created with config file", async () => {
    await withConfig(
      {
        specs: {
          root: "docs/specifications",
          work: {
            dir: "active",
            statusDirs: {
              doing: "in-progress",
              backlog: "backlog",
              done: "completed",
            },
          },
        },
      },
      async ({ projectDir, config }) => {
        // Then: Project directory exists in tmpdir
        expect(projectDir).toContain(tmpdir());

        // Config file exists at .spx/config.json
        const configPath = path.join(projectDir, ".spx/config.json");
        expect(await fs.pathExists(configPath)).toBe(true);

        // Config file contains provided config
        const fileContent = await fs.readJSON(configPath);
        expect(fileContent.specs.root).toBe("docs/specifications");
        expect(fileContent.specs.work.dir).toBe("active");

        // Context provides parsed config
        expect(config.specs.root).toBe("docs/specifications");
      },
    );

    // Cleanup happens automatically - verify temp directory removed
    // (tested in unit tests, integration test verifies cleanup runs)
  });
});
```

### FI2: withConfig supports git repository simulation

```typescript
describe("Feature: Config Test Harness - Git Repo Support", () => {
  it("GIVEN git: true WHEN using withConfig THEN .git directory created", async () => {
    await withConfig(
      {
        specs: { root: "specs" },
      },
      { git: true },
      async ({ projectDir, isGitRepo }) => {
        // Then: .git directory exists
        const gitDir = path.join(projectDir, ".git");
        expect(await fs.pathExists(gitDir)).toBe(true);

        // isGitRepo helper confirms it
        expect(isGitRepo).toBe(true);

        // Can run git commands
        const { stdout } = await exec("git rev-parse --git-dir", {
          cwd: projectDir,
        });
        expect(stdout.trim()).toBe(".git");
      },
    );
  });

  it("GIVEN git: false WHEN using withConfig THEN no .git directory", async () => {
    await withConfig(
      {
        specs: { root: "specs" },
      },
      { git: false },
      async ({ projectDir, isGitRepo }) => {
        // Then: No .git directory
        const gitDir = path.join(projectDir, ".git");
        expect(await fs.pathExists(gitDir)).toBe(false);

        // isGitRepo helper confirms it
        expect(isGitRepo).toBe(false);
      },
    );
  });
});
```

### FI3: withConfig creates specs directory structure

```typescript
describe("Feature: Config Test Harness - Directory Structure", () => {
  it("GIVEN directory structure options WHEN using withConfig THEN structure created", async () => {
    await withConfig(
      {
        specs: {
          root: "specs",
          work: {
            dir: "work",
            statusDirs: {
              doing: "doing",
              backlog: "backlog",
              done: "archive",
            },
          },
        },
      },
      {
        createStructure: true,
        workItems: [
          {
            level: "capability",
            bsp: 10,
            slug: "test-capability",
            status: "doing",
          },
        ],
      },
      async ({ projectDir, config }) => {
        // Then: Specs structure exists
        const specsDir = path.join(projectDir, config.specs.root);
        expect(await fs.pathExists(specsDir)).toBe(true);

        // Work directory exists
        const workDir = path.join(specsDir, config.specs.work.dir);
        expect(await fs.pathExists(workDir)).toBe(true);

        // Doing directory exists
        const doingDir = path.join(
          workDir,
          config.specs.work.statusDirs.doing,
        );
        expect(await fs.pathExists(doingDir)).toBe(true);

        // Work item directory exists
        const capabilityDir = path.join(
          doingDir,
          "capability-10_test-capability",
        );
        expect(await fs.pathExists(capabilityDir)).toBe(true);
      },
    );
  });
});
```

### FI4: Automatic cleanup removes all temp files

```typescript
describe("Feature: Config Test Harness - Cleanup", () => {
  it("GIVEN withConfig execution WHEN callback completes THEN temp directory removed", async () => {
    let capturedProjectDir: string;

    await withConfig(
      { specs: { root: "specs" } },
      async ({ projectDir }) => {
        capturedProjectDir = projectDir;
        // Verify directory exists during callback
        expect(await fs.pathExists(projectDir)).toBe(true);
      },
    );

    // Then: Directory removed after callback
    expect(await fs.pathExists(capturedProjectDir!)).toBe(false);
  });

  it("GIVEN error in callback WHEN withConfig execution fails THEN cleanup still happens", async () => {
    let capturedProjectDir: string;

    await expect(
      withConfig({ specs: { root: "specs" } }, async ({ projectDir }) => {
        capturedProjectDir = projectDir;
        throw new Error("Test error");
      }),
    ).rejects.toThrow("Test error");

    // Then: Directory removed even after error
    expect(await fs.pathExists(capturedProjectDir!)).toBe(false);
  });
});
```

## Capability Contribution

This feature enables testing of Capability 42 (Configurable Directory Structure) by:

1. **Isolation**: Each test runs in isolated tmpdir, preventing cross-test contamination
2. **Realistic structures**: Creates actual file system structures matching production projects
3. **Git simulation**: Supports testing product root discovery logic (git-based and fallback)
4. **Config variations**: Enables testing all config scenarios (custom paths, defaults, overrides, invalid configs)
5. **Automatic cleanup**: Prevents disk clutter and ensures clean test environment

Depends on Feature 21 (default config) to provide the config schema structure that the test harness validates and uses.

## Pattern Inspiration

Follows the `withTestEnv` pattern from CraftFinal:

- **Context manager**: Provides setup, execution context, and automatic cleanup
- **Overload signatures**: TypeScript overloads for flexible API (config only, config + options)
- **Resource tracking**: Tracks all created resources for cleanup in finally block
- **Type-safe context**: Provides strongly-typed context object with helper properties

**Simplified for single level**: Unlike `withTestEnv` which handles 5 infrastructure levels, `withConfig` focuses solely on config testing needs.

## Completion Criteria

- [ ] All Level 1 tests pass (context manager API, cleanup logic)
- [ ] All Level 2 integration tests pass (git repo creation, config file creation, directory structure, cleanup verification)
- [ ] `withConfig` exported from `tests/helpers/with-config.ts`
- [ ] Automatic cleanup using try-finally pattern
- [ ] Git repository simulation support
- [ ] Directory structure creation support
- [ ] Type-safe context with projectDir, config, isGitRepo properties
- [ ] Safety checks prevent cleanup outside tmpdir (path traversal protection)

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
