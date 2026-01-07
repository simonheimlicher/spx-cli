# Product Requirements Document (PRD)

## spx scoped-cli — Domain-Scoped CLI Architecture

## Status of this Document: DoR Checklist

| DoR checkbox            | Description                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| [x] **Outcome**         | Developers can use domain-scoped commands (spx spec, spx claude) with zero breaking changes during migration |
| [x] **Test Evidence**   | E2E tests verify scoped commands work, root aliases show deprecation warnings, new domains can be added      |
| [x] **Assumptions**     | Commander.js supports nested commands; users accept deprecation warnings during transition period            |
| [x] **Dependencies**    | capability-21_core-cli must be DONE; Commander.js CLI framework already in use                               |
| [x] **Pre-Mortem**      | User confusion during migration; documentation drift; alias removal breaks scripts                           |
| [x] **Deployment Plan** | Single npm release (v0.2.0) with scoped commands + aliases; document migration path                          |

## Problem Statement

### Customer Problem

```
As a spx CLI maintainer, I am frustrated by flat command structure limiting extensibility
because adding new command domains (claude, marketplace) creates namespace collisions and poor UX,
which prevents me from shipping capability-32 (claude-marketplace management).
```

### Current Customer Pain

- **Symptom**: Only two root commands (`status`, `next`); nowhere to add `claude init` or `marketplace sync`
- **Root Cause**: No namespace/domain architecture; all commands compete for root-level names
- **Customer Impact**: Cannot extend CLI without breaking changes or naming conflicts
- **Business Impact**: Blocks capability-32 (marketplace management); limits long-term CLI evolution

## Solution Design

### Customer Solution

```
Implement domain-scoped CLI architecture where commands are grouped by domain (spec, claude, marketplace),
using Commander.js nested commands, resulting in extensible namespace structure
and smooth migration path via deprecated root aliases.
```

### Customer Journey Context

- **Before**: Users run `spx status`, `spx next` (flat structure)
- **During**: Users can run `spx spec status` (new) or `spx status` (deprecated alias with warning)
- **After**: Users adopt `spx spec status`; aliases removed in v2.0; new domains (`claude`, `marketplace`) available

## Expected Outcome

### Measurable Outcome

```
Developers will use domain-scoped commands for all operations,
leading to extensible CLI supporting 3+ domains without namespace conflicts,
proven by zero breaking changes during migration and successful addition of claude/marketplace domains.
```

### Evidence of Success (BDD Tests)

- [x] `Command Structure: Current 2 root commands → Target 3+ domains (spec, claude, marketplace)`
- [x] `Backward Compatibility: Current 100% → Target 100% (root aliases work with warnings)`
- [x] `Extensibility: Current blocked → Target ready (capability-32 can add domains)`
- [x] `User Migration: Deprecation warnings guide users to new commands`

## Scope

### In Scope (MVP)

- Domain-scoped architecture using Commander.js nested commands
- Three domains defined:
  - `spec` - Manage spec workflow (status, next, list, validate)
  - `claude` - User-facing plugin management (init, update, status)
  - `marketplace` - Developer-facing marketplace (status, update, reset, version)
- Backward compatibility: Root aliases (`spx status` → `spx spec status`) with deprecation warnings
- Infrastructure for adding new domains (router pattern, domain registration)
- Help text organized by domain
- Migration documentation in README

### Explicit Non-Goals (MVP)

- Actually implementing `claude` and `marketplace` commands (that's capability-32)
- Removing root aliases (deferred to v2.0)
- Meta-command `spx status` that aggregates all domains (deferred to v0.3.0)
- Shell completion updates (can be added incrementally)

## End-to-End Tests

### Complete User Journey Test

```typescript
describe("Feature: spx spec domain", () => {
  test("existing commands work under spec domain", async () => {
    const tempDir = await createTempProject();

    // When: User runs scoped command
    const result = await exec("spx spec status --json", { cwd: tempDir });

    // Then: Command succeeds
    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);
    expect(status).toHaveProperty("capabilities");
    expect(status.summary).toHaveProperty("done");
  });
});

describe("Feature: Backward compatibility", () => {
  test("root aliases work with deprecation warnings", async () => {
    const tempDir = await createTempProject();

    // When: User runs old root command
    const result = await exec("spx status", { cwd: tempDir });

    // Then: Works but shows warning
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("⚠️");
    expect(result.stderr).toContain("deprecated");
    expect(result.stderr).toContain("spx spec status");
  });
});
```

## Integration Tests

```gherkin
Feature: Scoped CLI Architecture

  Scenario: Domain-scoped status command
    Given a project with specs directory
    When user runs "spx spec status"
    Then output shows hierarchical status tree
    And exit code is 0

  Scenario: Domain-scoped next command
    Given a project with work items
    When user runs "spx spec next"
    Then output shows next work item
    And exit code is 0

  Scenario: Root alias with deprecation warning
    Given a project with specs directory
    When user runs "spx status"
    Then command succeeds with output
    And stderr contains deprecation warning
    And warning suggests "spx spec status"

  Scenario: Help text shows domains
    Given spx CLI installed
    When user runs "spx --help"
    Then output lists available domains
    And shows "spec" domain description
    And shows "claude" domain description
    And shows "marketplace" domain description

  Scenario: Domain help text
    Given spx CLI installed
    When user runs "spx spec --help"
    Then output lists spec commands
    And shows "status", "next" commands
```

## Key Commands

### Spec Domain (Migrated from Root)

- **`spx spec status [--format text|json|markdown|table]`**
  - Get project status (migrated from `spx status`)
  - Same behavior, new namespace

- **`spx spec next`**
  - Find next work item (migrated from `spx next`)
  - Same behavior, new namespace

### Claude Domain (Infrastructure Only - Capability 32)

- **`spx claude init [--source <url>]`**
  - Install spx-claude marketplace (implemented in capability-32)

- **`spx claude update`**
  - Update marketplace from source (implemented in capability-32)

- **`spx claude status`**
  - Show installation status (implemented in capability-32)

### Marketplace Domain (Infrastructure Only - Capability 32)

- **`spx marketplace status [--json]`**
  - Show sync state (implemented in capability-32)

- **`spx marketplace update`**
  - Sync JSON from SKILL.md (implemented in capability-32)

### Root Aliases (Deprecated, Backward Compatibility)

- **`spx status`** → Delegates to `spx spec status` with warning
- **`spx next`** → Delegates to `spx spec next` with warning

## Data Model

### Domain Registration

```typescript
interface Domain {
  name: string; // "spec", "claude", "marketplace"
  description: string; // For help text
  commands: Command[]; // Commander.js commands
}

interface Command {
  name: string; // "status", "next", "init"
  description: string;
  options: CommandOption[];
  action: (options: any) => Promise<void>;
}
```

### CLI Structure (No Data Model Changes)

Existing data models for work items, status, etc. remain unchanged. This is purely a CLI routing refactor.

## Dependencies

### Work Item Dependencies

- [x] **capability-21_core-cli** - Must be DONE (provides core scanner, status, reporter)

### Blocks

- [ ] **capability-32_claude-marketplace** - Needs domain infrastructure to add `claude` and `marketplace` commands

### Technical Dependencies

- [x] **Commander.js** - Already in use, supports nested commands
- [x] **Node.js 18+** - Already required
- [ ] **Updated README** - Document new command structure

## Architecture

### Proposed Architecture

```
src/
├── cli.ts                      # Root program + domain routers
├── commands/
│   ├── spec/                   # Spec domain (migrated)
│   │   ├── index.ts            # Domain router
│   │   ├── status.ts           # Moved from commands/status.ts
│   │   └── next.ts             # Moved from commands/next.ts
│   ├── claude/                 # Claude domain (empty stubs for cap-32)
│   │   └── index.ts            # Domain router (stub)
│   └── marketplace/            # Marketplace domain (empty stubs)
│       └── index.ts            # Domain router (stub)
├── scanner/                    # Unchanged
├── status/                     # Unchanged
├── reporter/                   # Unchanged
└── tree/                       # Unchanged
```

### Commander.js Pattern

```typescript
// src/cli.ts
import { Command } from "commander";
import { createSpecCommands } from "./commands/spec/index.js";

const program = new Command();

program
  .name("spx")
  .description("Fast, deterministic CLI tool for spec workflow management")
  .version("0.2.0");

// Domain: spec
const specCmd = program
  .command("spec")
  .description("Manage spec workflow");

createSpecCommands(specCmd); // Adds status, next, etc.

// Domain: claude (stub for capability-32)
const claudeCmd = program
  .command("claude")
  .description("Manage Claude Code plugins");
// Commands will be added in capability-32

// Domain: marketplace (stub for capability-32)
const marketplaceCmd = program
  .command("marketplace")
  .description("Maintain marketplace (developers)");
// Commands will be added in capability-32

// Deprecated root aliases
program
  .command("status")
  .description("(deprecated) Use 'spx spec status' instead")
  .option("--json", "Output as JSON")
  .option("--format <format>", "Output format")
  .action((options) => {
    console.warn("⚠️  Deprecated: Use 'spx spec status' instead");
    console.warn("   This alias will be removed in v2.0.0\n");
    // Delegate to spec status
    import("./commands/spec/status.js").then(({ statusCommand }) => {
      return statusCommand({
        cwd: process.cwd(),
        format: options.json ? "json" : (options.format || "text"),
      });
    }).then(output => console.log(output))
      .catch(err => {
        console.error("Error:", err.message);
        process.exit(1);
      });
  });

program
  .command("next")
  .description("(deprecated) Use 'spx spec next' instead")
  .action(() => {
    console.warn("⚠️  Deprecated: Use 'spx spec next' instead");
    console.warn("   This alias will be removed in v2.0.0\n");
    // Delegate to spec next
    import("./commands/spec/next.js").then(({ nextCommand }) => {
      return nextCommand({ cwd: process.cwd() });
    }).then(output => console.log(output))
      .catch(err => {
        console.error("Error:", err.message);
        process.exit(1);
      });
  });

program.parse();
```

### Spec Domain Commands

```typescript
// src/commands/spec/index.ts
import { Command } from "commander";
import { nextCommand } from "./next.js";
import { statusCommand } from "./status.js";

export function createSpecCommands(specCmd: Command): void {
  specCmd
    .command("status")
    .description("Get project status")
    .option("--json", "Output as JSON")
    .option("--format <format>", "Output format (text|json|markdown|table)")
    .action(async (options) => {
      try {
        const format = options.json ? "json" : (options.format || "text");
        const output = await statusCommand({ cwd: process.cwd(), format });
        console.log(output);
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  specCmd
    .command("next")
    .description("Find next work item to work on")
    .action(async () => {
      try {
        const output = await nextCommand({ cwd: process.cwd() });
        console.log(output);
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });
}
```

## Pre-Mortem Analysis

### Risk: User confusion during migration period

- **Likelihood**: Medium — Some users won't see deprecation warnings in scripts
- **Impact**: Medium — Users might not migrate to new commands
- **Mitigation**:
  - Clear warnings in stderr (visible even in pipes)
  - Update README with migration guide
  - Keep aliases for 2+ major versions
  - Blog post/changelog announcement

### Risk: Scripts break when aliases removed

- **Likelihood**: High — Users have automation scripts
- **Impact**: High — Breaking change causes CI failures
- **Mitigation**:
  - Long deprecation period (v0.2.0 → v2.0.0)
  - Document migration in BREAKING_CHANGES.md
  - Provide migration script (find/replace)
  - Only remove in major version

### Risk: Documentation drift

- **Likelihood**: Medium — Multiple places to update
- **Impact**: Low — Confusing but not blocking
- **Mitigation**:
  - Update all docs in same PR
  - Checklist: README, CLAUDE.md, specs/CLAUDE.md, help text
  - Add note about aliases to CHANGELOG

### Risk: Commander.js nested command quirks

- **Likelihood**: Low — Commander.js is mature
- **Impact**: Medium — Unexpected parsing behavior
- **Mitigation**:
  - Add integration tests for edge cases
  - Test with actual CLI (not just unit tests)
  - Document any quirks in ADR

## Deployment Plan

### Structured around Features

This capability will be implemented through the following features:

1. **Feature: Spec Domain Migration**
   - Move existing commands under `spec` domain
   - Update command paths and imports
   - Verify existing tests still pass

2. **Feature: Domain Infrastructure**
   - Create domain router pattern
   - Add claude and marketplace domain stubs
   - Update help text organization

3. **Feature: Backward Compatibility**
   - Implement root aliases
   - Add deprecation warnings
   - Test alias delegation

4. **Feature: Documentation Update**
   - Update README with new command structure
   - Add migration guide
   - Update specs/CLAUDE.md examples

### Command Summary

```bash
# New canonical interface
spx spec status                    # Get project status
spx spec status --json             # JSON output
spx spec next                      # Find next work item

# Domain stubs (implemented in capability-32)
spx claude --help                  # Will show: Commands coming soon
spx marketplace --help             # Will show: Commands coming soon

# Deprecated aliases (backward compatibility)
spx status                         # Works, shows warning
spx next                           # Works, shows warning
```

### Success Criteria

- [x] `spx spec status` and `spx spec next` work identically to old commands
- [x] Root aliases work with clear deprecation warnings
- [x] `spx --help` shows organized domain structure
- [x] All existing tests pass without modification
- [x] README and docs updated
- [x] No breaking changes for current users
- [x] Infrastructure ready for capability-32 to add commands
