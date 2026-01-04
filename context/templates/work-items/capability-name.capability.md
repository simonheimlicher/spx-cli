# Capability: [Capability Name]

## Success Metric

**Quantitative Target:**

- **Baseline**: [Current measurable state]
- **Target**: [Expected improvement]
- **Measurement**: [How progress will be tracked]

## Testing Strategy

> Capabilities require **all three levels** to prove end-to-end value delivery.
> See [4-testing-standards.md](/context/4-testing-standards.md) for level definitions.

### Level Assignment

| Component       | Level | Justification                          |
| --------------- | ----- | -------------------------------------- |
| [Component 1]   | 1     | [Why this level is minimum sufficient] |
| [Component 2]   | 2     | [Why this level is minimum sufficient] |
| [Full workflow] | 3     | [Why E2E verification is needed]       |

### Escalation Rationale

- **1 → 2**: [What confidence does Level 2 add that Level 1 cannot provide?]
- **2 → 3**: [What confidence does Level 3 add that Level 2 cannot provide?]

## Capability E2E Tests (Level 3)

These tests verify the **complete user journey** delivers value.

### E2E1: [Primary user journey test]

```typescript
// tests/e2e/[capability-name].e2e.test.ts
describe("Capability: [Name]", () => {
  it("GIVEN [preconditions] WHEN [user action] THEN [value delivered]", async () => {
    // Given: [Full environment setup]
    // When: [Complete workflow execution]
    // Then: [Value verification]
  });
});
```

### E2E2: [Alternative scenario if needed]

```typescript
describe("Capability: [Name]", () => {
  it("GIVEN [alternative scenario] WHEN [action] THEN [expected behavior]", async () => {
    // ...
  });
});
```

## System Integration

[How this capability integrates with the overall system and coordination with other capabilities]

## Completion Criteria

- [ ] All Level 1 tests pass (via feature/story completion)
- [ ] All Level 2 tests pass (via feature completion)
- [ ] All Level 3 E2E tests pass
- [ ] Success metric achieved

**Note**: To see current features in this capability, use `ls` or `find` to list feature directories (e.g., `feature-*`) within this capability's folder.
