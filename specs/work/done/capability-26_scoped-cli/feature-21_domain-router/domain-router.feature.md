# Feature: Domain Router

## Observable Outcome

CLI commands work under domain namespaces with backward-compatible root aliases:

- `spx spec status` - Scoped command for spec workflow status
- `spx spec next` - Scoped command for next work item
- `spx status` - Root alias (deprecated, shows warning)
- `spx next` - Root alias (deprecated, shows warning)
- `spx --help` - Shows organized domain structure

Commander.js correctly parses nested commands and routes to appropriate handlers.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component                | Level | Justification                                           |
| ------------------------ | ----- | ------------------------------------------------------- |
| Domain routing logic     | 1     | Pure function mapping domains to command handlers       |
| Commander.js integration | 2     | Requires real Commander.js framework for nested parsing |
| Deprecation warnings     | 2     | Requires real stderr output verification                |
| Alias delegation         | 2     | Requires real command execution flow                    |

### Escalation Rationale

- **1 → 2**: Unit tests prove routing logic works, but Level 2 verifies Commander.js correctly parses `spx spec status` syntax and passes options through nested command structure
- **No Level 3**: E2E tests at capability level verify complete user workflows across migration period

## Feature Integration Tests (Level 2)

```typescript
// tests/integration/cli/domain-router.integration.test.ts
import { execa } from "execa";
import { describe, expect, it } from "vitest";

describe("Feature: Domain Router", () => {
  it("GIVEN spx CLI WHEN running scoped status command THEN outputs tree", async () => {
    const { stdout, exitCode } = await execa("node", [
      "bin/spx.js",
      "spec",
      "status",
    ], {
      cwd: "test/fixtures/repos/simple",
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("capability-");
  });

  it("GIVEN spx CLI WHEN running scoped next command THEN finds next item", async () => {
    const { stdout, exitCode } = await execa("node", [
      "bin/spx.js",
      "spec",
      "next",
    ], {
      cwd: "test/fixtures/repos/simple",
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Next work item:");
  });

  it("GIVEN spx CLI WHEN running root alias status THEN shows deprecation warning", async () => {
    const { stdout, stderr, exitCode } = await execa("node", [
      "bin/spx.js",
      "status",
    ], {
      cwd: "test/fixtures/repos/simple",
    });

    expect(exitCode).toBe(0);
    expect(stderr).toContain("Deprecated");
    expect(stderr).toContain("spx spec status");
    expect(stdout).toContain("capability-"); // Still works
  });

  it("GIVEN spx CLI WHEN running root alias next THEN shows deprecation warning", async () => {
    const { stdout, stderr, exitCode } = await execa("node", [
      "bin/spx.js",
      "next",
    ], {
      cwd: "test/fixtures/repos/simple",
    });

    expect(exitCode).toBe(0);
    expect(stderr).toContain("Deprecated");
    expect(stderr).toContain("spx spec next");
    expect(stdout).toContain("Next work item:"); // Still works
  });

  it("GIVEN spx CLI WHEN requesting help THEN shows domain structure", async () => {
    const { stdout, exitCode } = await execa("node", [
      "bin/spx.js",
      "--help",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("spec");
    expect(stdout).toContain("Manage spec workflow");
  });

  it("GIVEN spec domain WHEN requesting help THEN shows spec commands", async () => {
    const { stdout, exitCode } = await execa("node", [
      "bin/spx.js",
      "spec",
      "--help",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("status");
    expect(stdout).toContain("next");
  });
});
```

## Capability Contribution

This feature implements the complete domain-scoped architecture for capability-26:

- **Domain routing**: Maps domain names to command handlers
- **Spec domain**: Migrates existing commands under `spec` namespace
- **Backward compatibility**: Root aliases ensure zero breaking changes
- **Infrastructure**: Ready for capability-32 to add `claude` and `marketplace` domains

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 integration tests pass
- [ ] All 3 stories completed (domain router, spec domain, aliases)
- [ ] Scoped commands work (`spx spec status`, `spx spec next`)
- [ ] Root aliases work with warnings (`spx status`, `spx next`)
- [ ] Help text shows domain structure
- [ ] Zero breaking changes for existing users
- [ ] 100% type coverage

**Proposed Stories**:

- story-21: Domain router infrastructure (routing logic)
- story-32: Spec domain implementation (Commander.js integration)
- story-43: Backward compatibility layer (root aliases + warnings)
