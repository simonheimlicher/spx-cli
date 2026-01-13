# Feature: CLI Integration

## Observable Outcome

All features are wired together into CLI commands:

- `spx status` - Show project status tree
- `spx status --json` - Output as JSON
- `spx status --format [text|json|markdown|table]` - Specific format
- `spx next` - Find next work item to work on
- `spx validate` - Validate project structure

CLI uses Commander.js for argument parsing and follows Unix conventions.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `docs/testing/standards.md`for level definitions.

### Level Assignment

| Component        | Level | Justification                     |
| ---------------- | ----- | --------------------------------- |
| Command routing  | 2     | Requires Commander.js integration |
| Argument parsing | 2     | Requires Commander.js framework   |
| Output piping    | 2     | Requires real stdout handling     |
| Error handling   | 2     | Requires real process.exit        |

### Escalation Rationale

- **1 → 2**: CLI integration fundamentally requires the Commander.js framework
- **2 → 3**: Level 2 sufficient; E2E tests at Feature 87 verify complete flow

## Feature Integration Tests (Level 2)

```typescript
// test/integration/cli/commands.integration.test.ts
import { execa } from "execa";

describe("Feature: CLI Integration", () => {
  it("GIVEN spx CLI WHEN running status THEN outputs tree", async () => {
    const { stdout, exitCode } = await execa("node", ["bin/spx.js", "status"], {
      cwd: "test/fixtures/repos/simple",
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("capability-21");
  });

  it("GIVEN spx CLI WHEN running status --json THEN outputs valid JSON", async () => {
    const { stdout, exitCode } = await execa("node", [
      "bin/spx.js",
      "status",
      "--json",
    ], {
      cwd: "test/fixtures/repos/simple",
    });

    expect(exitCode).toBe(0);
    expect(() => JSON.parse(stdout)).not.toThrow();
  });

  it("GIVEN invalid command WHEN running THEN shows help", async () => {
    const { stderr, exitCode } = await execa(
      "node",
      ["bin/spx.js", "invalid"],
      {
        cwd: "test/fixtures/repos/simple",
        reject: false,
      },
    );

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("help");
  });
});
```

## Capability Contribution

CLI integration completes the user-facing interface:

- **Feature 87** (E2E) verifies complete CLI workflow with performance targets

## Completion Criteria

- [ ] All Level 2 integration tests pass
- [ ] All 4 stories completed
- [ ] All commands work correctly
- [ ] Error messages are helpful
- [ ] Follows Unix conventions
- [ ] 100% type coverage

**Proposed Stories**:

- story-21: Status command
- story-32: Next command (find next work item)
- story-43: Command options (--json, --format)
- story-54: Error handling & validation
