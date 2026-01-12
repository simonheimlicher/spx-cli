# Feature: Status Determination

## Observable Outcome

Each work item's status is determined from its `tests/` directory state:

- **OPEN**: No `tests/` directory or empty
- **IN PROGRESS**: `tests/` has test files but no `DONE.md`
- **DONE**: `tests/DONE.md` exists

Status determination is deterministic (no LLM calls) and fast (<1ms per work item).

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component         | Level | Justification                   |
| ----------------- | ----- | ------------------------------- |
| State machine     | 1     | Pure function, boolean logic    |
| DONE.md detection | 2     | Requires real filesystem checks |
| tests/ inspection | 2     | Requires real directory reading |

### Escalation Rationale

- **1 → 2**: Unit tests prove state machine logic, but Level 2 verifies real filesystem operations work correctly

## Feature Integration Tests (Level 2)

```typescript
// test/integration/status/state.integration.test.ts
describe("Feature: Status Determination", () => {
  it("GIVEN work item with no tests dir WHEN determining status THEN returns OPEN", async () => {
    const workItem = { path: "test/fixtures/work-items/open-item" };
    const status = await determineStatus(workItem);
    expect(status).toBe("OPEN");
  });

  it("GIVEN work item with tests but no DONE.md WHEN determining status THEN returns IN_PROGRESS", async () => {
    const workItem = { path: "test/fixtures/work-items/in-progress-item" };
    const status = await determineStatus(workItem);
    expect(status).toBe("IN_PROGRESS");
  });

  it("GIVEN work item with DONE.md WHEN determining status THEN returns DONE", async () => {
    const workItem = { path: "test/fixtures/work-items/done-item" };
    const status = await determineStatus(workItem);
    expect(status).toBe("DONE");
  });
});
```

## Capability Contribution

Status determination enables:

- **Feature 54** (Tree Building) needs status for each work item
- **Feature 65** (Output Formatting) needs status for display
- **Feature 76** (CLI) needs status for `next` command

## Completion Criteria

- [ ] All Level 1 tests pass
- [ ] All Level 2 integration tests pass
- [ ] All 4 stories completed
- [ ] Deterministic status calculation
- [ ] Performance: <1ms per work item
- [ ] 100% type coverage

**Proposed Stories**:

- story-21: Implement state machine
- story-32: Detect tests/ directory
- story-43: Parse DONE.md
- story-54: Edge cases (symlinks, permissions)
