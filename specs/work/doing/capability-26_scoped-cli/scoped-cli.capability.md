# Capability: Scoped CLI Architecture

## Success Metric

**Quantitative Target:**

- **Baseline**: 2 root-level commands (`status`, `next`), no namespace extensibility
- **Target**: Domain-scoped architecture supporting 3+ domains (`spec`, `claude`, `marketplace`)
- **Measurement**:
  - All existing commands work under `spec` domain
  - Root aliases functional with deprecation warnings
  - Infrastructure ready for capability-32 to add new domains

## Testing Strategy

> Capabilities require **all three levels** to prove end-to-end value delivery.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component           | Level | Justification                                                        |
| ------------------- | ----- | -------------------------------------------------------------------- |
| Domain router logic | 1     | Pure command routing, can verify logic without process execution     |
| CLI integration     | 2     | Must verify Commander.js parses nested commands and routes correctly |
| Full user journey   | 3     | Must verify installed binary works with real user workflows          |

### Escalation Rationale

- **1 → 2**: Unit tests prove routing logic works, but Level 2 verifies Commander.js correctly parses nested commands and passes options
- **2 → 3**: Integration tests prove individual commands work, but Level 3 verifies complete workflows (status → next → work) across migration period

## Capability E2E Tests (Level 3)

These tests verify the **complete user journey** delivers value.

### E2E1: Scoped commands work for existing workflows

```typescript
// tests/e2e/scoped-cli.e2e.test.ts
describe("Capability: Scoped CLI Architecture", () => {
  it("GIVEN existing spec workflow WHEN user runs scoped commands THEN status and next work correctly", async () => {
    // Given: Project with specs directory (existing fixture)
    const tempProject = await createTempProject();

    // When: User runs new scoped commands
    const statusResult = await exec("spx spec status --json", {
      cwd: tempProject,
    });
    const nextResult = await exec("spx spec next", { cwd: tempProject });

    // Then: Commands return correct results
    expect(statusResult.exitCode).toBe(0);
    const status = JSON.parse(statusResult.stdout);
    expect(status.summary).toHaveProperty("done");

    expect(nextResult.exitCode).toBe(0);
    expect(nextResult.stdout).toContain("story-");
  });
});
```

### E2E2: Backward compatibility with root aliases

```typescript
describe("Capability: Scoped CLI Architecture - Backward Compatibility", () => {
  it("GIVEN existing users WHEN they run old root commands THEN commands work with deprecation warning", async () => {
    // Given: Project setup
    const tempProject = await createTempProject();

    // When: User runs old command
    const result = await exec("spx status", { cwd: tempProject });

    // Then: Command works + shows warning
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("deprecated");
    expect(result.stderr).toContain("spx spec status");
    expect(result.stdout).toContain("capability-"); // Shows status output
  });
});
```

### E2E3: New domains ready for extension

```typescript
describe("Capability: Scoped CLI Architecture - Extensibility", () => {
  it("GIVEN domain infrastructure WHEN new domain added THEN commands route correctly", async () => {
    // Given: Mock domain added to CLI
    // (This test validates the infrastructure, actual domains added in capability-32)

    // When: User runs help to see domains
    const result = await exec("spx --help");

    // Then: Domain structure visible
    expect(result.stdout).toContain("spx spec");
    expect(result.stdout).toContain("Manage spec workflow");
  });
});
```

## System Integration

This capability refactors the CLI foundation to support multiple command domains:

- Unblocks **capability-32** (claude-marketplace) which needs `claude` and `marketplace` domains
- Maintains backward compatibility with existing users of capability-21
- Establishes pattern for future domain additions (e.g., `config`, `doctor`)

## Completion Criteria

- [ ] All Level 1 tests pass (via feature/story completion)
- [ ] All Level 2 tests pass (via feature completion)
- [ ] All Level 3 E2E tests pass
- [ ] Success metric achieved (3+ domains supported)
- [ ] Existing commands work under `spec` domain
- [ ] Root aliases functional with warnings
- [ ] Documentation updated to show new command structure

**Note**: To see current features in this capability, use `ls` or `find` to list feature directories (e.g., `feature-*`) within this capability's folder.
