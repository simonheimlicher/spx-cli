# Story: CLI Integration

## Functional Requirements

### FR1: Implement `spx session pickup` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session pickup <id>`
THEN atomically claim session and show content
```

#### Files created/modified

1. `src/domains/session/index.ts` [new]: Session domain registration
2. `src/commands/session/pickup.ts` [new]: Pickup command handler
3. `src/cli.ts` [modify]: Register session domain

### FR2: Implement `spx session pickup --auto` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session pickup --auto`
THEN claim highest priority session and show content
```

#### Files created/modified

1. `src/commands/session/pickup.ts` [modify]: Add auto mode

### FR3: Implement `spx session release` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session release [id]`
THEN return session to todo directory
```

#### Files created/modified

1. `src/commands/session/release.ts` [new]: Release command handler

### FR4: Implement `spx session list` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session list`
THEN show all sessions grouped by status
```

#### Files created/modified

1. `src/commands/session/list.ts` [new]: List command handler

### FR5: Implement `spx session show` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session show <id>`
THEN display session content
```

#### Files created/modified

1. `src/commands/session/show.ts` [new]: Show command handler

### FR6: Implement `spx session create` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session create`
THEN create new session in todo directory
```

#### Files created/modified

1. `src/commands/session/create.ts` [new]: Create command handler

### FR7: Implement `spx session delete` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session delete <id>`
THEN delete session file
```

#### Files created/modified

1. `src/commands/session/delete.ts` [new]: Delete command handler

## Testing Strategy

> Stories require **Level 2** for CLI integration testing.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component          | Level | Justification                            |
| ------------------ | ----- | ---------------------------------------- |
| Command routing    | 2     | Requires Commander.js                    |
| CLI option parsing | 2     | Integration with CLI framework           |
| End-to-end flow    | 2     | Requires real spx binary and file system |

### When to Escalate

This story uses Level 2 because:

- Testing the full CLI command execution path through Commander.js
- Verifying command routing, option parsing, and stdout output
- Integration tests validate the complete user experience

## Integration Tests (Level 2)

```typescript
// tests/cli-integration.test.ts
import { execa } from "execa";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("spx session commands", () => {
  let tempDir: string;
  let sessionsDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spx-session-cli-"));
    sessionsDir = join(tempDir, ".spx", "sessions");
    await mkdir(join(sessionsDir, "todo"), { recursive: true });
    await mkdir(join(sessionsDir, "doing"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("GIVEN session in todo WHEN pickup THEN shows session content", async () => {
    // Create session
    const sessionId = "2026-01-13_08-00-00";
    await writeFile(
      join(sessionsDir, "todo", `${sessionId}.md`),
      "# Test Session\n\nTest content",
    );

    const { stdout, exitCode } = await execa(
      "node",
      ["bin/spx.js", "session", "pickup", sessionId, "--sessions-dir", sessionsDir],
      { cwd: process.cwd() },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Test Session");
  });

  it("GIVEN no args WHEN list THEN shows sessions", async () => {
    const { stdout, exitCode } = await execa(
      "node",
      ["bin/spx.js", "session", "list", "--sessions-dir", sessionsDir],
      { cwd: process.cwd() },
    );

    expect(exitCode).toBe(0);
  });

  it("GIVEN help flag WHEN session THEN shows usage", async () => {
    const { stdout, exitCode } = await execa(
      "node",
      ["bin/spx.js", "session", "--help"],
      { cwd: process.cwd() },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("pickup");
    expect(stdout).toContain("release");
    expect(stdout).toContain("list");
  });
});
```

## Quality Requirements

### QR1: Type Safety

**Requirement:** All CLI commands must have TypeScript type annotations
**Target:** 100% type coverage
**Validation:** `npm run typecheck` passes

### QR2: Error Handling

**Requirement:** CLI errors must be caught and reported with actionable messages
**Target:** Non-zero exit codes for failures
**Validation:** Integration tests verify error paths

## Completion Criteria

- [ ] All Level 2 integration tests pass
- [ ] `spx session` shows help with all subcommands
- [ ] `spx session pickup <id>` claims and displays session
- [ ] `spx session pickup --auto` claims highest priority session
- [ ] `spx session release [id]` returns session to todo
- [ ] `spx session list` shows sessions by status
- [ ] `spx session show <id>` displays session content
- [ ] `spx session create` creates new session
- [ ] `spx session delete <id>` removes session
- [ ] All commands support `--sessions-dir` option for custom directory
