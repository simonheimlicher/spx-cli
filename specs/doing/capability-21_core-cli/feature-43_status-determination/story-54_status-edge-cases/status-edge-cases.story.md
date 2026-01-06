# Story: Status Edge Cases

## Functional Requirements

### FR1: Handle permission errors when checking status

```gherkin
GIVEN a work item with restricted permissions on tests/
WHEN determining status
THEN throw descriptive error
```

#### Files created/modified

1. `src/status/state.ts` [modify]: Add permission error handling

### FR2: Combine all checks into single status function

```gherkin
GIVEN a work item path
WHEN calling getWorkItemStatus()
THEN perform all checks and return final status
```

#### Files created/modified

1. `src/status/state.ts` [modify]: Add `getWorkItemStatus()` orchestration function

### FR3: Cache status checks for performance

```gherkin
GIVEN multiple status checks for same work item
WHEN checking status
THEN cache filesystem checks within single operation
```

#### Files created/modified

1. `src/status/state.ts` [modify]: Add caching strategy

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component            | Level | Justification                        |
| -------------------- | ----- | ------------------------------------ |
| Permission errors    | 2     | Requires real restricted permissions |
| Status orchestration | 2     | Integrates all filesystem checks     |
| Caching strategy     | 1     | Pure logic, but tested in Level 2    |

### When to Escalate

This story uses Level 2 for integration:

- Must test real permission errors
- Must verify complete status determination flow
- Caching tested as part of integration

## Integration Tests (Level 2)

```typescript
// test/integration/status/state.integration.test.ts (continued)
import { getWorkItemStatus } from "@/status/state";
import path from "path";
import { describe, expect, it } from "vitest";

describe("getWorkItemStatus", () => {
  /**
   * Level 2: Integration tests for complete status determination
   */

  it("GIVEN work item with no tests dir WHEN getting status THEN returns OPEN", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/open-item",
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then
    expect(status).toBe("OPEN");
  });

  it("GIVEN work item with tests but no DONE.md WHEN getting status THEN returns IN_PROGRESS", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/in-progress-item",
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then
    expect(status).toBe("IN_PROGRESS");
  });

  it("GIVEN work item with DONE.md WHEN getting status THEN returns DONE", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-item",
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then
    expect(status).toBe("DONE");
  });

  it("GIVEN work item with permission error WHEN getting status THEN throws descriptive error", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/restricted-item",
    );

    // When/Then
    await expect(getWorkItemStatus(workItemPath)).rejects.toThrow(
      /permission|EACCES/i,
    );
  });

  it("GIVEN non-existent work item WHEN getting status THEN throws error", async () => {
    // Given
    const workItemPath = "/path/that/does/not/exist";

    // When/Then
    await expect(getWorkItemStatus(workItemPath)).rejects.toThrow(
      /not found|ENOENT/i,
    );
  });
});

describe("Status determination performance", () => {
  it("GIVEN work item WHEN getting status multiple times THEN uses cached results", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-item",
    );

    // When
    const start = Date.now();
    await getWorkItemStatus(workItemPath);
    const firstTime = Date.now() - start;

    const start2 = Date.now();
    await getWorkItemStatus(workItemPath);
    const secondTime = Date.now() - start2;

    // Then: Second call should be faster (cached)
    // Note: This test may be flaky; consider removing if unreliable
    expect(secondTime).toBeLessThanOrEqual(firstTime);
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `docs/code/typescript.md` - TypeScript standards
2. `docs/testing/standards.md`- Testing with Vitest

## Quality Requirements

### QR1: Error Messages

**Requirement:** Errors include work item path in message
**Target:** Format: "Failed to determine status for {path}: {reason}"
**Validation:** Integration tests verify error message format

### QR2: Performance

**Requirement:** Status check completes quickly
**Target:** <5ms per work item (excluding first filesystem access)
**Validation:** Integration tests measure timing

### QR3: Caching Strategy

**Requirement:** Avoid redundant filesystem calls
**Target:** Single pass collects all needed data
**Validation:** Code review confirms efficient implementation

## Completion Criteria

- [ ] All Level 2 integration tests pass
- [ ] Complete status determination flow works
- [ ] Permission errors handled gracefully
- [ ] Performance target met (<5ms per item)
- [ ] BDD structure (GIVEN/WHEN/THEN) in all tests
- [ ] 100% type coverage

## Documentation

1. JSDoc comments on `getWorkItemStatus` function
2. Error handling behavior documented
3. Caching strategy explained
