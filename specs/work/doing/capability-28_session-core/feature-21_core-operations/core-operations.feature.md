# Feature: Core Session Operations

## Observable Outcome

Users can list, show, create, and delete sessions using `spx session` commands, with all operations completing in <100ms.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component                    | Level | Justification                                   |
| ---------------------------- | ----- | ----------------------------------------------- |
| Timestamp generation/parsing | 1     | Pure functions, no I/O                          |
| Session listing logic        | 1     | Pure function: directory contents → sorted list |
| Session file read/write      | 2     | Needs real filesystem                           |
| Directory structure creation | 2     | Needs real filesystem                           |

### Escalation Rationale

- **1 → 2**: Unit tests verify sorting and formatting logic; integration tests verify real filesystem operations (mkdir, readdir, writeFile, unlink)

## Feature Integration Tests (Level 2)

These tests verify that **real filesystem operations** work as expected.

### FI1: Create and list sessions

```typescript
// tests/integration/session/core-operations.integration.test.ts
describe("Feature: Core Session Operations", () => {
  it("GIVEN empty sessions directory WHEN create session THEN session appears in list", async () => {
    // Given: Empty .spx/sessions/todo/ directory
    const { sessionsDir } = await createTempSessionsDir();

    // When: Create session
    const sessionId = await createSession(sessionsDir, { content: testContent });

    // Then: Session appears in list
    const sessions = await listSessions(sessionsDir);
    expect(sessions).toContainEqual(
      expect.objectContaining({ id: sessionId, status: "todo" }),
    );
  });
});
```

### FI2: Show session content

```typescript
describe("Feature: Core Session Operations", () => {
  it("GIVEN session exists WHEN show session THEN full content returned", async () => {
    // Given: Session with known content
    const { sessionsDir } = await createTempSessionsDir();
    const sessionId = await createSession(sessionsDir, { content: testContent });

    // When: Show session
    const content = await showSession(sessionsDir, sessionId);

    // Then: Content matches
    expect(content).toContain("# Test Session");
  });
});
```

### FI3: Delete session

```typescript
describe("Feature: Core Session Operations", () => {
  it("GIVEN session exists WHEN delete session THEN session removed from filesystem", async () => {
    // Given: Session exists
    const { sessionsDir } = await createTempSessionsDir();
    const sessionId = await createSession(sessionsDir, { content: testContent });

    // When: Delete session
    await deleteSession(sessionsDir, sessionId);

    // Then: Session not in list
    const sessions = await listSessions(sessionsDir);
    expect(sessions.map(s => s.id)).not.toContain(sessionId);
  });
});
```

## Capability Contribution

This feature provides the foundational file operations that all other session features depend on:

- **Session lifecycle** (feature-32) uses create/delete for claiming workflow
- **Advanced operations** (feature-43) uses list/delete for prune/archive
- **Auto-injection** (feature-54) uses show to read session content

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 integration tests pass
- [ ] `spx session list` works with empty and populated directories
- [ ] `spx session show <id>` displays full session content
- [ ] `spx session create --stdin` creates session with timestamp ID
- [ ] `spx session delete <id>` removes session file

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
