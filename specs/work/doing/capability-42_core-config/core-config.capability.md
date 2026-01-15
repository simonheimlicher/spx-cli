# Capability: Configurable Directory Structure

## Success Metric

**Quantitative Target:**

- **Baseline**: 0% configuration flexibility (hardcoded paths in CLI source)
- **Target**: 100% path customization support (all directory paths configurable)
- **Measurement**: Products successfully override directory structure via `.spx/config.json` and all spx commands respect custom paths

## Testing Strategy

> Capabilities require **all three levels** to prove end-to-end value delivery.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component           | Level | Justification                                                       |
| ------------------- | ----- | ------------------------------------------------------------------- |
| Config schema       | 1     | Unit tests verify schema validation logic without external systems  |
| Config merge logic  | 1     | Unit tests verify default + override merge without file I/O         |
| Path resolution     | 1     | Unit tests verify path joining logic with mock config               |
| Config file loading | 2     | Integration tests verify reading actual `.spx/config.json` files    |
| Scanner integration | 2     | Integration tests verify scanner uses resolved paths                |
| Full CLI commands   | 3     | E2E tests verify `spx status` works with custom directory structure |

### Escalation Rationale

- **1 → 2**: Level 2 adds confidence that config files are correctly parsed from disk and integrated with the scanner. Unit tests cannot verify file I/O or scanner coupling.
- **2 → 3**: Level 3 adds confidence that the complete user workflow (edit config → run command → get results) delivers value. Integration tests cannot verify the full CLI command execution flow with real project structures.

## Capability E2E Tests (Level 3)

These tests verify the **complete user journey** delivers value.

### E2E1: Custom directory structure configuration

```typescript
// tests/e2e/core-config.e2e.test.ts
describe("Capability: Configurable Directory Structure", () => {
  it("GIVEN product with custom specs structure WHEN user creates config THEN spx respects custom paths", async () => {
    // Given: Product with custom specs structure
    const projectDir = await setupTestProject({
      specsRoot: "docs/specifications",
      workDir: "active",
      statusDirs: ["in-progress", "backlog", "completed"],
    });

    await fs.writeFile(
      path.join(projectDir, ".spx/config.json"),
      JSON.stringify({
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
      }),
    );

    // When: User runs spx status
    const result = await exec("spx status --json", { cwd: projectDir });

    // Then: spx finds work items in custom locations
    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);
    expect(status.product.specsRoot).toBe("docs/specifications");
    expect(status.capabilities.length).toBeGreaterThan(0);

    // Verify spx scanned custom paths
    expect(status.product.workDir).toBe("active");
    expect(status.product.statusDirs).toEqual({
      doing: "in-progress",
      backlog: "backlog",
      done: "completed",
    });
  });
});
```

### E2E2: Default fallback behavior

```typescript
describe("Capability: Configurable Directory Structure", () => {
  it("GIVEN no config file WHEN user runs spx THEN spx uses embedded defaults", async () => {
    // Given: Product with no .spx/config.json
    const projectDir = await setupTestProject({
      useDefaults: true,
    });

    // When: User runs spx status
    const result = await exec("spx status --json", { cwd: projectDir });

    // Then: spx uses embedded defaults
    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);
    expect(status.product.specsRoot).toBe("specs");
    expect(status.product.workDir).toBe("work");
    expect(status.product.statusDirs).toEqual({
      doing: "doing",
      backlog: "backlog",
      done: "archive",
    });
  });
});
```

### E2E3: Invalid configuration produces helpful errors

```typescript
describe("Capability: Configurable Directory Structure", () => {
  it("GIVEN invalid config WHEN user runs spx THEN spx shows clear error", async () => {
    // Given: Product with invalid config (non-existent path)
    const projectDir = await setupTestProject();

    await fs.writeFile(
      path.join(projectDir, ".spx/config.json"),
      JSON.stringify({
        specs: {
          root: "does-not-exist",
        },
      }),
    );

    // When: User runs spx status
    const result = await exec("spx status", { cwd: projectDir });

    // Then: spx shows clear error message
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Specs root 'does-not-exist' not found");
    expect(result.stderr).toMatch(/check.*path.*exists/i); // Suggests fix
  });
});
```

## System Integration

This capability provides **foundational configuration infrastructure** for the entire spx CLI:

### Integration Points

1. **Config Resolution Layer**
   - All CLI commands depend on config resolution to get directory paths
   - Config system loads `.spx/config.json`, merges with defaults, validates paths
   - Exposes resolved config to scanner and reporter modules

2. **Scanner Integration**
   - Scanner uses `config.specs.root` instead of hardcoded `"specs"`
   - Scanner uses `config.specs.work.dir` for work items location
   - Scanner uses `config.specs.work.statusDirs` for doing/backlog/done directories

3. **Session Domain Integration**
   - Session commands use `config.sessions.dir` for session handoff files location
   - Default: `.spx/sessions` (configurable via config.json)

4. **Command Integration**
   - `spx status`: Uses resolved paths to find and classify work items
   - `spx spec next`: Uses resolved paths to find next work item by BSP ordering
   - `spx validate`: Uses resolved paths to validate product structure
   - `spx session` commands: Use resolved sessions.dir for handoff files
   - All future commands: Automatically benefit from configurable paths

5. **Error Reporting**
   - Error messages reference actual configured paths, not assumed defaults
   - Validation errors suggest corrective actions based on config

### Coordination with Other Capabilities

- **Capability 21 (Core CLI)**: Config system integrates with existing scanner and status commands
- **Session Domain (MVP)**: Config system provides `sessions.dir` configuration for session handoff files
- **Future Marketplace Domain**: Config system will extend to support marketplace directory paths
- **Future Claude Domain**: Config system will integrate with Claude settings management

## Completion Criteria

- [ ] All Level 1 tests pass (config schema validation, merge logic, path resolution)
- [ ] All Level 2 tests pass (config file loading, scanner integration)
- [ ] All Level 3 E2E tests pass (custom paths, defaults, error handling)
- [ ] Success metric achieved: 100% path customization support
- [ ] Backward compatibility maintained: products without config file work with defaults
- [ ] Performance requirement met: config resolution adds <10ms overhead to `spx status`

**Note**: To see current features in this capability, use `ls` or `find` to list feature directories (e.g., `feature-*`) within this capability's folder.
