# Feature: Pattern Matching

## Observable Outcome

Work item directory names are correctly parsed into structured data:

- `capability-21_core-cli` → `{ kind: "capability", number: 20, slug: "core-cli" }`
- `feature-21_pattern-matching` → `{ kind: "feature", number: 21, slug: "pattern-matching" }`
- `story-32_validate-bsp` → `{ kind: "story", number: 32, slug: "validate-bsp" }`

Invalid patterns are rejected with clear error messages.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `context/4-testing-standards.md` for level definitions.

### Level Assignment

| Component      | Level | Justification                            |
| -------------- | ----- | ---------------------------------------- |
| Regex patterns | 1     | Pure functions, no external dependencies |
| BSP validation | 1     | Pure number range checking               |
| Kind detection | 1     | Pure string matching                     |
| Test factories | 1     | Pure data generation functions           |

### Escalation Rationale

- **1 → 2**: Not needed for this feature. Pattern matching is pure logic with no filesystem operations. All confidence can be gained from unit tests with dependency injection.

## Feature Integration Tests (Level 2)

This feature does not require Level 2 tests because:

- Pattern matching is purely computational (regex + validation)
- No filesystem operations
- No external tool dependencies
- Unit tests with comprehensive test factories provide full confidence

Integration testing will occur in Feature 32 (Directory Walking), which will use these pattern matching functions with real filesystem operations.

## Capability Contribution

Pattern matching is the foundation for all other features:

- **Feature 32** (Directory Walking) uses these patterns to filter directories
- **Feature 43** (Status Determination) relies on correct work item identification
- **Feature 54** (Tree Building) depends on kind detection for hierarchy assembly

## Completion Criteria

- [ ] All Level 1 tests pass
- [ ] All 5 stories completed (21, 32, 43, 54, 65)
- [ ] Test factory pattern established for future features
- [ ] No mocking used (DI pattern throughout)
- [ ] 100% type coverage

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
