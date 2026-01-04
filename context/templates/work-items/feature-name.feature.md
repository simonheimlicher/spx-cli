# Feature: [Feature Name]

## Observable Outcome

[Specific, measurable change that this feature creates in the user's or system's world]

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `context/4-testing-standards.md` for level definitions.

### Level Assignment

| Component        | Level | Justification                     |
| ---------------- | ----- | --------------------------------- |
| [Logic/parsing]  | 1     | Pure function, can verify with DI |
| [Tool execution] | 2     | Needs real binary (Hugo/Caddy)    |

### Escalation Rationale

- **1 → 2**: [What confidence does Level 2 add? e.g., "Unit tests prove our command-building logic, but Level 2 verifies Hugo accepts the commands"]

## Feature Integration Tests (Level 2)

These tests verify that **real tools work together** as expected.

### FI1: [Primary integration test]

```typescript
// test/integration/[feature-name].integration.test.ts
import { hugoAvailable } from "./conftest";

describe.skipIf(!hugoAvailable())("Feature: [Name]", () => {
  it("GIVEN [real environment] WHEN [feature action] THEN [integrated behavior verified]", async () => {
    // Given: [Real binaries, temp directories]
    // When: [Feature execution with real tools]
    // Then: [Observable outcome verified]
  });
});
```

### FI2: [Error handling integration test]

```typescript
describe.skipIf(!hugoAvailable())("Feature: [Name] - Error Handling", () => {
  it("GIVEN [error condition] WHEN [feature action] THEN [graceful failure]", async () => {
    // ...
  });
});
```

## Capability Contribution

[How this feature contributes to parent capability success and integration points with other capability features]

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 integration tests pass
- [ ] Escalation rationale documented

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
