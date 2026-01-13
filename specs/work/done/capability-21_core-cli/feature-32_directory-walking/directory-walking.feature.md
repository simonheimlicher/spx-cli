# Feature: Directory Walking

## Observable Outcome

The `specs/` directory tree is recursively traversed to discover all work items:

- Walks directory tree starting from specs root
- Identifies capability/feature/story directories using pattern matching
- Returns list of discovered work items with full paths
- Handles filesystem edge cases (permissions, symlinks, missing directories)

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component              | Level | Justification                                    |
| ---------------------- | ----- | ------------------------------------------------ |
| Directory tree walking | 2     | Requires real filesystem operations              |
| Pattern filtering      | 1     | Pure function using Feature 21's pattern matcher |
| Path resolution        | 2     | Requires real path operations                    |
| Error handling         | 2     | Requires real filesystem errors                  |

### Escalation Rationale

- **1 → 2**: Unit tests prove our filtering logic, but Level 2 verifies real directory walking works correctly across platforms (Windows paths, symlinks, permissions)
- **2 → 3**: Not needed. Level 2 with real filesystem operations provides sufficient confidence.

## Feature Integration Tests (Level 2)

```typescript
// test/integration/scanner/walk.integration.test.ts
describe("Feature: Directory Walking", () => {
  it("GIVEN fixture repo with nested work items WHEN walking tree THEN discovers all items", async () => {
    // Given: Test fixture with known structure
    const fixtureRoot = "test/fixtures/repos/nested-structure";

    // When: Walk directory tree
    const workItems = await walkSpecs(fixtureRoot);

    // Then: All work items discovered
    expect(workItems).toHaveLength(12); // Known fixture count
    expect(workItems.map((w) => w.kind)).toContain("capability");
    expect(workItems.map((w) => w.kind)).toContain("feature");
    expect(workItems.map((w) => w.kind)).toContain("story");
  });

  it("GIVEN directory with permissions error WHEN walking THEN handles gracefully", async () => {
    // Given: Directory with restricted permissions
    const restrictedDir = "test/fixtures/repos/restricted";

    // When/Then: Handles error without crashing
    await expect(walkSpecs(restrictedDir)).rejects.toThrow(/permission/i);
  });
});
```

## Capability Contribution

Directory walking enables all subsequent features:

- **Feature 43** (Status Determination) needs discovered work items
- **Feature 54** (Tree Building) needs complete work item list
- **Feature 65** (Output Formatting) needs tree structure to format

## Completion Criteria

- [ ] All Level 1 tests pass
- [ ] All Level 2 integration tests pass
- [ ] All 4 stories completed (21, 32, 43, 54)
- [ ] Real filesystem operations work on macOS/Linux/Windows
- [ ] Error handling for edge cases (permissions, symlinks)
- [ ] 100% type coverage

**Note**: This feature depends on Feature 21 (Pattern Matching) being complete.
