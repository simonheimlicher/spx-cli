# Feature: Output Formatting

## Observable Outcome

Tree structure is formatted into multiple output formats:

- **Text**: Human-readable tree for terminal display
- **JSON**: Structured data for MCP tools and automation
- **Markdown**: Documentation-ready format
- **Table**: Compact tabular overview

All formats support the same tree structure with consistent data.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component          | Level | Justification           |
| ------------------ | ----- | ----------------------- |
| Text formatter     | 1     | Pure string rendering   |
| JSON formatter     | 1     | Pure data serialization |
| Markdown formatter | 1     | Pure string rendering   |
| Table formatter    | 1     | Pure string rendering   |

### Escalation Rationale

- **1 → 2**: Unit tests prove formatters work, Level 2 verifies with real tree data

## Feature Integration Tests (Level 2)

```typescript
// test/integration/reporter/format.integration.test.ts
describe("Feature: Output Formatting", () => {
  it("GIVEN tree structure WHEN formatting as text THEN renders tree correctly", async () => {
    const tree = await buildTreeFromFixture("test/fixtures/repos/simple");
    const output = formatText(tree);

    expect(output).toContain("capability-21");
    expect(output).toContain("  feature-32");
    expect(output).toContain("    story-21");
  });

  it("GIVEN tree structure WHEN formatting as JSON THEN produces valid JSON", async () => {
    const tree = await buildTreeFromFixture("test/fixtures/repos/simple");
    const output = formatJSON(tree);

    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed.capabilities).toBeDefined();
  });
});
```

## Capability Contribution

Output formatting is the final step before presentation:

- **Feature 76** (CLI Integration) uses formatters for command output
- **Feature 87** (E2E) verifies all output formats work end-to-end

## Completion Criteria

- [ ] All Level 1 tests pass
- [ ] All Level 2 integration tests pass
- [ ] All 4 stories completed (one per format)
- [ ] All formats render same data consistently
- [ ] JSON is valid and parseable
- [ ] 100% type coverage

**Proposed Stories**:

- story-21: Text formatter (tree view)
- story-32: JSON formatter (for MCP)
- story-43: Markdown formatter (for docs)
- story-54: Table formatter (compact view)
