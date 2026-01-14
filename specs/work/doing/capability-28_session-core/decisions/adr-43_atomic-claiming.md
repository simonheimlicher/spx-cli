# ADR: Atomic Session Claiming

## Problem

Multiple AI agents may attempt to pick up sessions concurrently. Without atomic claiming, two agents could claim the same session, leading to duplicated work or conflicting changes.

## Context

- **Business**: Users may run multiple Claude Code instances. Each should work on different sessions.
- **Technical**: POSIX `rename()` is atomic within a filesystem. Node.js `fs.rename()` uses this syscall. The directory-based structure (see [Session Directory Structure](adr-21_session-directory-structure.md)) enables simple `mv` operations.

## Decision

**Use filesystem `rename()` to atomically move sessions between status directories.**

```typescript
// Claiming: todo → doing
await fs.rename(
  path.join(todoDir, sessionId + ".md"),
  path.join(doingDir, sessionId + ".md"),
);

// Releasing: doing → todo
await fs.rename(
  path.join(doingDir, sessionId + ".md"),
  path.join(todoDir, sessionId + ".md"),
);
```

## Rationale

**Alternatives considered:**

1. **Lock files** (`.lock` alongside each session)
   - Rejected: Stale locks if agent crashes, more files to manage

2. **Database transactions** (SQLite with row-level locking)
   - Rejected: Over-engineering for file-based workflow, external dependency

3. **Distributed lock service** (Redis, etcd)
   - Rejected: Massive over-engineering for local CLI tool

4. **Optimistic locking** (check-then-rename with retry)
   - Rejected: Race window still exists between check and rename

**Why atomic rename:**

- **Proven pattern**: Used by the existing `/pickup` skill (proven in production)
- **Zero race conditions**: OS guarantees exactly one rename succeeds
- **No cleanup needed**: Failed claimers simply get `ENOENT` error
- **No external dependencies**: Works with any POSIX filesystem
- **Self-documenting**: Session location IS its status

## Trade-offs Accepted

- **Cross-filesystem limitation**: `rename()` fails if source and target are on different filesystems
  - Mitigation: All session directories should be under `.spx/sessions/`
- **No queue ordering guarantee**: First-to-rename wins, not first-to-request
  - Mitigation: Acceptable; sessions are sorted by priority then timestamp, agents pick in order
- **Failure detection is implicit**: Claimers must catch `ENOENT` and try next session
  - Mitigation: Simple try/catch pattern; document in pickup implementation

## Testing Strategy

### Level Coverage

| Level           | Question Answered                     | Scope                             |
| --------------- | ------------------------------------- | --------------------------------- |
| 1 (Unit)        | Is the claiming logic correct?        | Path construction, error handling |
| 2 (Integration) | Does atomic rename work with real fs? | Concurrent claims, error recovery |

### Escalation Rationale

- **1 → 2**: Unit tests verify logic; integration tests verify atomicity with concurrent operations

### Test Harness

| Level | Harness          | Location/Dependency             |
| ----- | ---------------- | ------------------------------- |
| 2     | Temp directories | `os.tmpdir()` + cleanup fixture |

### Behaviors Verified

**Level 1 (Unit):**

- `claimSession(id)` constructs correct source and target paths
- `claimSession(id)` throws `SessionNotAvailable` when source doesn't exist
- `releaseSession(id)` constructs correct paths for reverse operation

**Level 2 (Integration):**

- Concurrent claims: Only one succeeds, others get `SessionNotAvailable`
- Successful claim: File exists in `doing/`, not in `todo/`
- Release after claim: File returns to `todo/`
- Claim non-existent session: Throws `SessionNotFound`
- Claim already-claimed session: Throws `SessionNotAvailable`

## Validation

### How to Recognize Compliance

You're following this decision if:

- Session claiming uses `fs.rename()` (not read-delete-write)
- Claim failures are handled by catching filesystem errors
- No lock files or external coordination mechanisms exist

### MUST

- Use `fs.rename()` for status transitions
- Catch `ENOENT` errors and convert to domain-specific errors
- Keep all session directories on the same filesystem

### NEVER

- Use read-then-write pattern for claiming (race condition)
- Use lock files for coordination
- Assume claim will succeed without error handling
