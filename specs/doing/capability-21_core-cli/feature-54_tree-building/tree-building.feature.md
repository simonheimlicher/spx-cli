# Feature: Tree Building

## Observable Outcome

Work items are assembled into hierarchical tree structure:

- Parent-child relationships based on directory hierarchy
- Capabilities contain features contain stories
- Each level sorted by BSP number
- Aggregate status rolled up from children

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component            | Level | Justification                |
| -------------------- | ----- | ---------------------------- |
| Tree assembly        | 1     | Pure data structure building |
| Parent-child linking | 1     | Pure function over data      |
| Status rollup        | 1     | Pure aggregation function    |
| BSP sorting          | 1     | Pure comparison function     |

### Escalation Rationale

- **1 → 2**: Unit tests prove tree building logic works, Level 2 verifies with real work item data

## Feature Integration Tests (Level 2)

```typescript
// test/integration/tree/build.integration.test.ts
describe("Feature: Tree Building", () => {
  it("GIVEN flat work item list WHEN building tree THEN creates hierarchy", async () => {
    const workItems = await walkSpecs("test/fixtures/repos/simple");
    const tree = buildTree(workItems);

    expect(tree.capabilities).toHaveLength(1);
    expect(tree.capabilities[0].features).toHaveLength(2);
    expect(tree.capabilities[0].features[0].stories).toHaveLength(3);
  });

  it("GIVEN work items with statuses WHEN building tree THEN rolls up status", async () => {
    const workItems = await walkSpecs("test/fixtures/repos/mixed-status");
    const tree = buildTree(workItems);

    // Capability status should reflect child statuses
    expect(tree.capabilities[0].status).toBe("IN_PROGRESS");
  });
});
```

## Capability Contribution

Tree building enables:

- **Feature 65** (Output Formatting) needs tree structure for rendering
- **Feature 76** (CLI) needs tree for navigation commands
- **Feature 87** (E2E) verifies complete tree assembly

## Completion Criteria

- [ ] All Level 1 tests pass
- [ ] All Level 2 integration tests pass
- [ ] All 4 stories completed
- [ ] Correct parent-child relationships
- [ ] Status aggregation works
- [ ] 100% type coverage

**Proposed Stories**:

- story-21: Build parent-child relationships
- story-32: Sort by BSP number
- story-43: Aggregate status rollup
- story-54: Validate tree consistency
