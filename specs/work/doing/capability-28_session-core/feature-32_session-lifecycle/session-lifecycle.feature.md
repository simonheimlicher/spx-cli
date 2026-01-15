# Feature: Session Lifecycle

## Observable Outcome

Users can atomically claim sessions with `spx session pickup` and release them with `spx session release`, with concurrent pickup attempts correctly serialized.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component             | Level | Justification                          |
| --------------------- | ----- | -------------------------------------- |
| Path construction     | 1     | Pure function: config → paths          |
| Error type mapping    | 1     | Pure function: fs error → domain error |
| Atomic claiming       | 2     | Needs real fs.rename atomicity         |
| Concurrent claim test | 2     | Needs real concurrent operations       |

### Escalation Rationale

- **1 → 2**: Unit tests verify path logic and error mapping; integration tests verify that `fs.rename()` is truly atomic under concurrent access

## Feature Integration Tests (Level 2)

These tests verify that **atomic claiming** works as expected.

### FI1: Successful pickup moves session

```typescript
// tests/integration/session/session-lifecycle.integration.test.ts
describe("Feature: Session Lifecycle", () => {
  it("GIVEN session in todo WHEN pickup THEN session moves to doing", async () => {
    // Given: Session in todo directory
    const { sessionsDir } = await createTempSessionsDir();
    const sessionId = await createSession(sessionsDir, { content: testContent });

    // When: Pickup session
    await pickupSession(sessionsDir, sessionId);

    // Then: Session in doing, not in todo
    expect(await fileExists(path.join(sessionsDir, "doing", `${sessionId}.md`))).toBe(true);
    expect(await fileExists(path.join(sessionsDir, "todo", `${sessionId}.md`))).toBe(false);
  });
});
```

### FI2: Concurrent pickup - only one succeeds

```typescript
describe("Feature: Session Lifecycle", () => {
  it("GIVEN one session WHEN two concurrent pickups THEN exactly one succeeds", async () => {
    // Given: One session in todo
    const { sessionsDir } = await createTempSessionsDir();
    const sessionId = await createSession(sessionsDir, { content: testContent });

    // When: Two concurrent pickups
    const results = await Promise.allSettled([
      pickupSession(sessionsDir, sessionId),
      pickupSession(sessionsDir, sessionId),
    ]);

    // Then: Exactly one succeeds
    const successes = results.filter(r => r.status === "fulfilled");
    const failures = results.filter(r => r.status === "rejected");
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
  });
});
```

### FI3: Release moves session back

```typescript
describe("Feature: Session Lifecycle", () => {
  it("GIVEN claimed session WHEN release THEN session returns to todo", async () => {
    // Given: Claimed session in doing
    const { sessionsDir } = await createTempSessionsDir();
    const sessionId = await createSession(sessionsDir, { content: testContent });
    await pickupSession(sessionsDir, sessionId);

    // When: Release session
    await releaseSession(sessionsDir, sessionId);

    // Then: Session back in todo
    expect(await fileExists(path.join(sessionsDir, "todo", `${sessionId}.md`))).toBe(true);
    expect(await fileExists(path.join(sessionsDir, "doing", `${sessionId}.md`))).toBe(false);
  });
});
```

### FI4: Pickup with --auto selects highest priority

```typescript
describe("Feature: Session Lifecycle", () => {
  it("GIVEN sessions with different priorities WHEN pickup --auto THEN highest priority claimed", async () => {
    // Given: Sessions with different priorities
    const { sessionsDir } = await createTempSessionsDir();
    await createSession(sessionsDir, { content: lowPriorityContent, priority: "low" });
    const highId = await createSession(sessionsDir, { content: highPriorityContent, priority: "high" });

    // When: Auto-pickup
    const claimed = await pickupSession(sessionsDir, { auto: true });

    // Then: High priority session claimed
    expect(claimed.id).toBe(highId);
  });
});
```

## Capability Contribution

This feature enables the core session workflow:

- **Atomic claiming** prevents race conditions when multiple agents run simultaneously
- **Release** allows sessions to be returned if work is interrupted
- **Auto-pickup** enables priority-based session selection

Depends on: [Core Operations](./../feature-21_core-operations/core-operations.feature.md) for filesystem primitives

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 integration tests pass
- [ ] `spx session pickup <id>` atomically claims session
- [ ] `spx session pickup --auto` claims highest priority session
- [ ] `spx session release` returns session to todo
- [ ] Concurrent pickups correctly serialize (only one succeeds)

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
