# Capability: Core CLI

## Success Metric

**Quantitative Target:**

- **Baseline**: Manual status checks take 1-2 minutes with LLM calls (~$0.01-0.05 per check)
- **Target**: Deterministic status analysis in <100ms with zero token cost
- **Measurement**: Performance benchmarks in E2E tests; cost = $0 per invocation

## Testing Strategy

> Capabilities require **all three levels** to prove end-to-end value delivery.
> See `context/4-testing-standards.md` for level definitions.

### Level Assignment

| Component            | Level | Justification                                           |
| -------------------- | ----- | ------------------------------------------------------- |
| Pattern matching     | 1     | Pure functions, regex operations                        |
| Directory scanning   | 2     | Needs real filesystem operations                        |
| Status determination | 2     | Needs real file structure and DONE.md detection         |
| Tree building        | 1     | Pure data structure assembly                            |
| Output formatting    | 1     | Pure rendering functions                                |
| CLI integration      | 2     | Needs Commander.js framework                            |
| Full workflow        | 3     | Needs complete environment + performance validation     |

### Escalation Rationale

- **1 → 2**: Unit tests prove our parsing and state logic, but Level 2 verifies real filesystem operations work correctly (directory walking, file detection, cross-platform paths)
- **2 → 3**: Integration tests prove components work together, but Level 3 verifies the complete CLI workflow delivers value within performance targets (<100ms for 50 work items)

## Capability E2E Tests (Level 3)

These tests verify the **complete user journey** delivers value.

### E2E1: Fast Status Analysis

```typescript
// test/e2e/core-cli.e2e.test.ts
describe("Capability: Core CLI", () => {
  it("GIVEN fixture repo with 50 work items WHEN running spx status --json THEN completes in <100ms", async () => {
    // Given: Fixture repo with realistic work item structure
    const fixtureRoot = "test/fixtures/repos/sample-50-items";

    // When: Execute full CLI workflow
    const startTime = Date.now();
    const { stdout, exitCode } = await execa("node", ["dist/bin/spx.js", "status", "--json"], {
      cwd: fixtureRoot,
    });
    const elapsed = Date.now() - startTime;

    // Then: Performance target met and valid output delivered
    expect(exitCode).toBe(0);
    expect(elapsed).toBeLessThan(100);

    const result = JSON.parse(stdout);
    expect(result).toHaveProperty("summary");
    expect(result.summary).toMatchObject({
      done: expect.any(Number),
      inProgress: expect.any(Number),
      open: expect.any(Number),
    });
  });
});
```

### E2E2: Multiple Output Formats

```typescript
describe("Capability: Core CLI - Output Formats", () => {
  it("GIVEN fixture repo WHEN requesting different formats THEN all formats render correctly", async () => {
    const fixtureRoot = "test/fixtures/repos/sample-10-items";

    // JSON format
    const jsonResult = await execa("node", ["dist/bin/spx.js", "status", "--json"], { cwd: fixtureRoot });
    expect(() => JSON.parse(jsonResult.stdout)).not.toThrow();

    // Text format (default)
    const textResult = await execa("node", ["dist/bin/spx.js", "status"], { cwd: fixtureRoot });
    expect(textResult.stdout).toContain("specs/doing/");

    // Table format
    const tableResult = await execa("node", ["dist/bin/spx.js", "status", "--format", "table"], { cwd: fixtureRoot });
    expect(tableResult.stdout).toMatch(/\|.*\|/); // Contains table borders
  });
});
```

## System Integration

This capability is foundational - it provides the core functionality that future capabilities will build upon:

- **Capability 30 (MCP Server)**: Will expose these CLI operations as MCP tools
- **Future capabilities**: Will use the scanner and status components as building blocks

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 tests pass (via feature completion)
- [ ] All Level 3 E2E tests pass
- [ ] Success metric achieved: <100ms for 50 work items
- [ ] All 7 features completed (21, 32, 43, 54, 65, 76, 87)

**Note**: To see current features in this capability, use `ls` or `find` to list feature directories (e.g., `feature-*`) within this capability's folder.
