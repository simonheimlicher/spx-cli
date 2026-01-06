# Story: Status Rollup

## Functional Requirements

### FR1: Aggregate status from children

```gherkin
GIVEN parent with children having different statuses
WHEN building tree with status rollup
THEN parent status reflects aggregate of children
```

Rules:

- Any child IN_PROGRESS → parent IN_PROGRESS
- All children DONE → parent DONE
- All children OPEN → parent OPEN
- Mixed DONE/OPEN → parent IN_PROGRESS

#### Files created/modified

1. `src/tree/build.ts` [modify]: Add `rollupStatus()` function

## Testing Strategy

### Level Assignment

| Component          | Level | Justification      |
| ------------------ | ----- | ------------------ |
| Status aggregation | 1     | Pure boolean logic |
| Rollup rules       | 1     | Pure function      |

## Unit Tests (Level 1)

```typescript
// test/unit/tree/build.test.ts (continued)
describe("buildTree - Status Rollup", () => {
  it("GIVEN all children DONE WHEN rolling up status THEN parent is DONE", () => {
    // Given
    const workItems = [
      {
        ...createWorkItem({ kind: "capability", number: 20, slug: "test" }),
        path: "/specs/capability-21_test",
        status: undefined,
      },
      {
        ...createWorkItem({ kind: "feature", number: 32, slug: "feat1" }),
        path: "/specs/capability-21_test/feature-32_feat1",
        status: "DONE",
      },
      {
        ...createWorkItem({ kind: "feature", number: 43, slug: "feat2" }),
        path: "/specs/capability-21_test/feature-43_feat2",
        status: "DONE",
      },
    ];

    // When
    const tree = buildTree(workItems);

    // Then
    expect(tree.capabilities[0].status).toBe("DONE");
  });

  it("GIVEN any child IN_PROGRESS WHEN rolling up status THEN parent is IN_PROGRESS", () => {
    // Given
    const workItems = [
      {
        ...createWorkItem({ kind: "capability", number: 20, slug: "test" }),
        path: "/specs/capability-21_test",
        status: undefined,
      },
      {
        ...createWorkItem({ kind: "feature", number: 32, slug: "feat1" }),
        path: "/specs/capability-21_test/feature-32_feat1",
        status: "DONE",
      },
      {
        ...createWorkItem({ kind: "feature", number: 43, slug: "feat2" }),
        path: "/specs/capability-21_test/feature-43_feat2",
        status: "IN_PROGRESS",
      },
    ];

    // When
    const tree = buildTree(workItems);

    // Then
    expect(tree.capabilities[0].status).toBe("IN_PROGRESS");
  });

  it("GIVEN mixed DONE and OPEN WHEN rolling up status THEN parent is IN_PROGRESS", () => {
    // Given
    const workItems = [
      {
        ...createWorkItem({ kind: "capability", number: 20, slug: "test" }),
        path: "/specs/capability-21_test",
        status: undefined,
      },
      {
        ...createWorkItem({ kind: "feature", number: 32, slug: "feat1" }),
        path: "/specs/capability-21_test/feature-32_feat1",
        status: "DONE",
      },
      {
        ...createWorkItem({ kind: "feature", number: 43, slug: "feat2" }),
        path: "/specs/capability-21_test/feature-43_feat2",
        status: "OPEN",
      },
    ];

    // When
    const tree = buildTree(workItems);

    // Then
    expect(tree.capabilities[0].status).toBe("IN_PROGRESS");
  });
});
```

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] Status rollup rules implemented correctly
- [ ] 100% type coverage
