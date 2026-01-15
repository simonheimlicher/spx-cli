# Feature: Default Config Structure

## Observable Outcome

All spx CLI commands read directory paths from a single centralized TypeScript constant (`DEFAULT_CONFIG`), eliminating hardcoded path strings scattered throughout the codebase and establishing a foundation for config override functionality.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component                 | Level | Justification                                           |
| ------------------------- | ----- | ------------------------------------------------------- |
| Config schema definition  | 1     | Pure types, can verify with type checking               |
| Config constant structure | 1     | Pure data structure, no external dependencies           |
| Path resolution logic     | 1     | Pure function accepting config, returns resolved paths  |
| Scanner integration       | 2     | Verifies scanner reads from config, not hardcoded paths |
| CLI command integration   | 2     | Verifies `spx status` uses config-resolved paths        |

### Escalation Rationale

- **1 → 2**: Level 1 proves config structure is type-safe and path resolution logic works. Level 2 adds confidence that scanner and CLI commands actually consume the config instead of hardcoded strings, verified by running real `spx status` command with real directory structures.

## Feature Integration Tests (Level 2)

These tests verify that **real CLI commands read from the default config** as expected.

### FI1: Scanner uses default config paths

```typescript
// tests/integration/default-config-scanner.integration.test.ts
describe("Feature: Default Config Structure", () => {
  it("GIVEN project with default structure WHEN scanner runs THEN it finds work items using DEFAULT_CONFIG paths", async () => {
    // Given: Real project with specs/work/doing structure
    const projectDir = await createTestProject({
      useDefaultStructure: true,
    });

    // When: Scanner scans the project
    const scanner = createScanner(projectDir);
    const workItems = await scanner.scan();

    // Then: Scanner used DEFAULT_CONFIG.specs.root ("specs")
    //       Scanner used DEFAULT_CONFIG.specs.work.dir ("work")
    //       Scanner used DEFAULT_CONFIG.specs.work.statusDirs.doing ("doing")
    expect(workItems.length).toBeGreaterThan(0);

    // Verify paths match DEFAULT_CONFIG
    const { DEFAULT_CONFIG } = await import("@/config/defaults");
    const expectedPath = path.join(
      projectDir,
      DEFAULT_CONFIG.specs.root,
      DEFAULT_CONFIG.specs.work.dir,
      DEFAULT_CONFIG.specs.work.statusDirs.doing,
    );

    // All found work items should be under expected path
    for (const item of workItems) {
      expect(item.path).toContain(expectedPath);
    }
  });
});
```

### FI2: CLI commands use default config paths

```typescript
describe("Feature: Default Config Structure - CLI Integration", () => {
  it("GIVEN no custom config WHEN spx status runs THEN output reflects DEFAULT_CONFIG paths", async () => {
    // Given: Project without .spx/config.json
    const projectDir = await createTestProject({
      useDefaultStructure: true,
      includeConfigFile: false,
    });

    // When: Run spx status --json
    const result = await exec("spx status --json", { cwd: projectDir });

    // Then: Status output shows default config was used
    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);

    const { DEFAULT_CONFIG } = await import("@/config/defaults");
    expect(status.config.specs.root).toBe(DEFAULT_CONFIG.specs.root);
    expect(status.config.specs.work.dir).toBe(DEFAULT_CONFIG.specs.work.dir);
    expect(status.config.specs.work.statusDirs).toEqual(
      DEFAULT_CONFIG.specs.work.statusDirs,
    );
  });
});
```

### FI3: No hardcoded paths remain in scanner

```typescript
describe("Feature: Default Config Structure - Refactoring Verification", () => {
  it("GIVEN scanner source code WHEN searching for hardcoded paths THEN none are found", async () => {
    // This is a meta-test to ensure refactoring is complete
    // Fails if someone adds hardcoded paths back

    const scannerFiles = await glob("src/scanner/**/*.ts");
    const hardcodedPatterns = [
      /"specs"/, // Hardcoded specs directory
      /"work"/, // Hardcoded work directory
      /"doing"/, // Hardcoded doing directory
      /"backlog"/, // Hardcoded backlog directory
      /"archive"/, // Hardcoded archive directory
    ];

    for (const file of scannerFiles) {
      const content = await fs.readFile(file, "utf-8");
      for (const pattern of hardcodedPatterns) {
        expect(content).not.toMatch(pattern);
      }
    }
  });
});
```

## Capability Contribution

This feature establishes the foundation for Capability 42 (Configurable Directory Structure) by:

1. **Centralizing config**: Creates single source of truth for all directory paths
2. **Type safety**: TypeScript const ensures config structure is validated at compile time
3. **Enabling overrides**: Provides the base config structure that Feature 31 (test harness) and future features can override
4. **Refactoring scanner**: Removes hardcoded paths from scanner, making it injectable and testable

Feature 31 (test harness) depends on this feature to provide the default config schema that tests can override.

## Completion Criteria

- [ ] All Level 1 tests pass (config schema, path resolution logic)
- [ ] All Level 2 integration tests pass (scanner integration, CLI integration, no hardcoded paths)
- [ ] DEFAULT_CONFIG constant exported from `src/config/defaults.ts`
- [ ] Scanner refactored to accept config via constructor injection
- [ ] All hardcoded path strings removed from scanner and CLI commands
- [ ] TypeScript types defined for config structure

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
