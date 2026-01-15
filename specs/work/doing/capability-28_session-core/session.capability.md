# Capability: Session Management

## Success Metric

**Quantitative Target:**

- **Baseline**: Session operations (pickup/handoff) take 60-120 seconds via skills
- **Target**: All session CLI commands complete in <100ms
- **Measurement**: Benchmark suite timing each command; CI enforces threshold

## Testing Strategy

> Capabilities require **all three levels** to prove end-to-end value delivery.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component                    | Level | Justification                              |
| ---------------------------- | ----- | ------------------------------------------ |
| Timestamp parsing/formatting | 1     | Pure functions, no I/O                     |
| Config path resolution       | 1     | Pure functions with injected config        |
| YAML front matter parsing    | 1     | Pure parsing, string in → object out       |
| Session file operations      | 2     | Real filesystem with temp directories      |
| Atomic claiming              | 2     | Concurrent fs.rename behavior verification |
| Auto-injection               | 2     | Real file reads with fixture files         |
| Full CLI workflow            | 3     | Complete create→list→pickup→release cycle  |

### Escalation Rationale

- **1 → 2**: Unit tests verify parsing logic; integration tests verify real filesystem behavior (atomicity, concurrency, error handling)
- **2 → 3**: Integration tests verify individual operations; E2E tests verify complete agent workflow with real CLI invocations

## Capability E2E Tests (Level 3)

These tests verify the **complete user journey** delivers value.

### E2E1: Complete session lifecycle

```typescript
// tests/e2e/session.e2e.test.ts
describe("Capability: Session Management", () => {
  it("GIVEN agent context WHEN create→list→pickup→release THEN full lifecycle works under 500ms", async () => {
    // Given: Agent has session content to preserve
    const sessionContent = `---
id: test-session
priority: high
tags: [test]
specs: []
files: []
---
# Test Session
Work in progress...`;

    const startTime = Date.now();

    // When: Create session
    const createResult = await execCli("session create --stdin", { input: sessionContent });
    expect(createResult.exitCode).toBe(0);
    const sessionId = createResult.stdout.match(/Created: (.+)/)?.[1];
    expect(sessionId).toBeDefined();

    // When: List sessions
    const listResult = await execCli("session list");
    expect(listResult.stdout).toContain(sessionId);
    expect(listResult.stdout).toContain("todo");

    // When: Pickup session
    const pickupResult = await execCli(`session pickup ${sessionId}`);
    expect(pickupResult.exitCode).toBe(0);
    expect(pickupResult.stdout).toContain("claimed");

    // When: Release session
    const releaseResult = await execCli("session release");
    expect(releaseResult.exitCode).toBe(0);

    // Then: Full lifecycle under 500ms
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(500);
  });
});
```

### E2E2: Auto-injection with real files

```typescript
describe("Capability: Session Management", () => {
  it("GIVEN session with specs/files WHEN pickup THEN content is injected", async () => {
    // Given: Session with file references
    const sessionContent = `---
id: inject-test
priority: medium
specs:
  - ${testSpecPath}
files:
  - ${testCodePath}
---
# Session with files`;

    await execCli("session create --stdin", { input: sessionContent });

    // When: Pickup with injection
    const result = await execCli("session pickup inject-test");

    // Then: File contents appear in output
    expect(result.stdout).toContain("=== Injected Files ===");
    expect(result.stdout).toContain(testSpecPath);
    expect(result.stdout).toContain(testSpecContent);
  });
});
```

### E2E3: Concurrent claiming atomicity

```typescript
describe("Capability: Session Management", () => {
  it("GIVEN multiple agents WHEN concurrent pickup THEN only one succeeds", async () => {
    // Given: One session available
    await execCli("session create --stdin", { input: sessionContent });

    // When: Two concurrent pickups
    const [result1, result2] = await Promise.all([
      execCli("session pickup --auto"),
      execCli("session pickup --auto"),
    ]);

    // Then: Exactly one succeeds
    const successes = [result1, result2].filter(r => r.exitCode === 0);
    expect(successes).toHaveLength(1);
  });
});
```

## System Integration

- **Config system**: Session directories configurable via `sessions.todo_dir`, `sessions.doing_dir`, `sessions.archive_dir`
- **Spec domain**: `spx spec status` footer shows "Sessions: N todo, M doing"
- **Skills**: `/handoff` skill pipes to `spx session create --stdin`; `/pickup` skill calls `spx session pickup`

## Completion Criteria

- [ ] All Level 1 tests pass (via feature/story completion)
- [ ] All Level 2 tests pass (via feature completion)
- [ ] All Level 3 E2E tests pass
- [ ] All 8 commands benchmarked at <100ms
- [ ] Success metric achieved (95%+ reduction in operation time)

**Note**: To see current features in this capability, use `ls` or `find` to list feature directories (e.g., `feature-*`) within this capability's folder.
