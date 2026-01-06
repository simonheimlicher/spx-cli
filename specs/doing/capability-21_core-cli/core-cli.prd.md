# Product Requirements Document (PRD)

## spx — Spec Workflow CLI & MCP Server

## Status of this Document: DoR Checklist

| DoR checkbox            | Description                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [ ] **Outcome**         | Reduce spec status analysis from 1-2 minutes to <100ms, eliminate token cost for deterministic operations         |
| [ ] **Test Evidence**   | CLI returns accurate status for all work item states (DONE/IN PROGRESS/OPEN) with JSON output for MCP consumption |
| [ ] **Assumptions**     | Users have Node.js runtime or can use single-binary distribution; spec directory follows established conventions  |
| [ ] **Dependencies**    | TypeScript, Commander.js or oclif, MCP SDK for server mode                                                        |
| [ ] **Pre-Mortem**      | Name collision with Microsoft Azure Speech CLI; spec convention drift across projects                             |
| [ ] **Deployment Plan** | npm package, brew formula, single-binary releases, MCP server registration                                        |

## Problem Statement

### Customer Problem

```
As an AI coding agent user, I am frustrated by slow and expensive spec status analysis
because the current LLM skill uses probabilistic inference for deterministic file operations,
which prevents me from getting instant project status and wastes thousands of tokens per query.
```

### Current Customer Pain

- **Symptom**: Spec workflow skill takes 1-2 minutes and consumes excessive tokens
- **Root Cause**: Using LLM for deterministic tasks (directory walking, pattern matching, file existence checks)
- **Customer Impact**: Slow feedback loops, context window pollution, delayed decision-making
- **Business Impact**: Unnecessary API costs, reduced productivity, friction in AI-assisted development

## Solution Design

### Customer Solution

```
Implement a lightweight CLI tool (spx) that performs spec status analysis in <100ms
through native file system operations, resulting in instant project visibility
and clean MCP tool integration for AI agents.
```

### Customer Journey Context

- **Before**: Invoke LLM skill → Wait 1-2 min → Receive status report → Resume work
- **During**: `spx status --json` provides instant, deterministic results; MCP server exposes same capability to agents
- **After**: Instant status checks, zero token cost for facts, LLM reserved for interpretation and decisions

## Expected Outcome

### Measurable Outcome

```
Users will receive spec status in <100ms with zero token cost,
leading to faster iteration cycles and reduced API spend,
proven by 1000x speed improvement and 100% token elimination for status queries.
```

### Evidence of Success (BDD Tests)

- [ ] `Response Time: Current 60-120s → Target <100ms (1000x improvement)`
- [ ] `Token Cost: Current ~2000 tokens → Target 0 tokens (100% reduction)`
- [ ] `Accuracy: Current ~99% → Target 100% (deterministic correctness)`
- [ ] `Integration: MCP tool callable by Claude Code and other agents`

## Scope

### In Scope (MVP)

- Deterministic scan of a specs tree rooted at `specs/` (or `--root` override)
- Identify work items by directory naming patterns:
  - `capability-NN_slug/`
  - `feature-NN_slug/`
  - `story-NN_slug/`
- Determine status using the "tests directory state" rule:
  - Missing/empty `tests/` → **OPEN**
  - `tests/` has files but no `DONE.md` → **IN PROGRESS**
  - `tests/DONE.md` exists → **DONE**
- Render hierarchical report from capabilities → features → stories
- Output formats:
  - `text` (human-friendly tree)
  - `json` (agents/automation)
  - `md` (copy/paste into specs/docs)
  - `table` (compact overview)
- Context-aware discovery: read `specs/templates/structure.yaml` for custom patterns if present
- Stable sorting by `(kindOrder, number, slug)` for deterministic output

### Explicit Non-Goals (MVP)

- Modifying project structure ("analyze and report", not "fix")
- Editing artifacts (requirements/decisions/work items)
- Deep parsing of markdown contents beyond basic metadata
- Enforcing or generating work items/templates (optional later)

## End-to-End Tests

### Complete User Journey Test

```typescript
describe("Feature: spx status", () => {
  test("returns accurate hierarchical status in under 100ms", async () => {
    const startTime = Date.now();

    const result = await exec("spx status --json");

    const elapsed = Date.now() - startTime;

    // Performance requirement
    expect(elapsed).toBeLessThan(100);

    // Correctness requirements
    const status = JSON.parse(result.stdout);
    expect(status.summary).toHaveProperty("done");
    expect(status.summary).toHaveProperty("inProgress");
    expect(status.summary).toHaveProperty("open");

    // Verify known fixture states
    expect(findWorkItem(status, "story-32_migrate-lhci-script").status).toBe("DONE");
    expect(findWorkItem(status, "story-76_config-command").status).toBe("OPEN");
  });
});
```

## Integration Tests

```gherkin
Feature: spx CLI

  Scenario: Status report generation
    Given a specs directory with work items in various states
    When user runs "spx status"
    Then output shows hierarchical status tree
    And DONE items have tests/DONE.md present
    And IN PROGRESS items have test files but no DONE.md
    And OPEN items have empty or missing tests directory

  Scenario: JSON output for MCP consumption
    Given a specs directory with work items
    When user runs "spx status --json"
    Then output is valid JSON
    And structure matches MCP tool response schema
    And can be parsed by AI agents without transformation

  Scenario: Single work item status
    Given a specs directory with capability-32_core-cli
    When user runs "spx status capability-32"
    Then output shows only that capability and descendants
    And response time is under 50ms

  Scenario: Next work item recommendation
    Given a specs directory with mixed status items
    When user runs "spx next"
    Then output shows lowest-numbered OPEN or IN PROGRESS item
    And respects implicit ordering (lower numbers first)

  Scenario: Context-aware discovery
    Given specs/templates/structure.yaml defines a non-default specs root
    When the CLI scans the project
    Then it should use the context-defined root and patterns
    And print warnings if context discovery fails
```

## Key CLI Commands

### Core Commands

- **`spx status [item] [--format text|json|md|table] [--root <path>]`**
  - Primary command: scan + report
  - `[item]` - Optional work item filter (e.g., `capability-32`)
  - Returns hierarchical status tree

- **`spx next [--scope capability|feature] [--root <path>]`**
  - Return the next OPEN/IN PROGRESS item by ordering (lowest-number first)
  - Respects implicit work item ordering

- **`spx tree [--root <path>]`**
  - Visual tree without status computation (fast navigation)

- **`spx done <item> [--root <path>]`**
  - Create `tests/DONE.md` for specified work item

### Quality & Initialization

- **`spx validate [--root <path>]`**
  - Validate naming patterns, ordering, required folders/files
  - Exit non-zero on violations (CI/CD integration)

- **`spx init [--root <path>]`**
  - Initialize specs directory structure with conventions

- **`spx explain <path-to-item>`**
  - Explain why an item is OPEN/IN PROGRESS/DONE (rule-based, minimal)

## Data Model

### Work Item

- `kind`: `"capability" | "feature" | "story"`
- `number`: integer parsed from directory name
- `slug`: full directory name (e.g., `story-32_lighthouse-runner`)
- `path`: absolute or repo-relative path
- `status`: `"OPEN" | "IN_PROGRESS" | "DONE"`
- `children`: nested work items (capability → features → stories)

### JSON Output (Stable Contract)

```typescript
{
  "project": {
    "name"?: string,
    "root": string,
    "specsRoot": string
  },
  "summary": {
    "done": number,
    "inProgress": number,
    "open": number
  },
  "capabilities": WorkItem[]  // capabilities with nested children
}
```

## Dependencies

### Work Item Dependencies

- [ ] None — greenfield project

### Customer-Facing Dependencies

- [ ] **Documentation**: README, `spx.sh` landing page, `--help` output
- [ ] **Distribution**: npm package, Homebrew formula, GitHub releases with binaries

### Technical Dependencies

- [ ] **Runtime**: Node.js 18+ (or Bun for single-binary compilation)
- [ ] **CLI Framework**: Commander.js (lightweight) or oclif (plugin support)
- [ ] **MCP SDK**: `@modelcontextprotocol/sdk` for server mode
- [ ] **Testing**: Vitest, temp directory fixtures

## Architecture

### Layering (for CLI now, MCP later)

1. **Core library** (`spx-core`)
   - Pure functions for scanning, parsing names, computing statuses, ordering, rendering models
2. **CLI adapter**
   - Argument parsing, formatting, exit codes, printing
3. **(Future) MCP server adapter**
   - Exposes `status/next/validate/explain` as tools using the same core library

### Proposed Architecture

```
spx/
├── src/
│   ├── cli.ts              # Command definitions (Commander.js)
│   ├── scanner/
│   │   ├── index.ts        # Scanner public API
│   │   ├── walk.ts         # Directory walking
│   │   └── patterns.ts     # Work item pattern matching
│   ├── status/
│   │   ├── index.ts        # Status public API
│   │   ├── state.ts        # DONE/IN PROGRESS/OPEN state machine
│   │   └── context.ts      # Context discovery (specs/templates/structure.yaml)
│   ├── reporter/
│   │   ├── index.ts        # Reporter public API
│   │   ├── text.ts         # Text tree output
│   │   ├── json.ts         # JSON output
│   │   ├── markdown.ts     # Markdown output
│   │   └── table.ts        # Table output
│   └── mcp/
│       └── server.ts       # MCP tool exposure
├── package.json
└── tsconfig.json
```

### Determinism Rules

- Stable sorting by `(kindOrder, number, slug)`
- No filesystem-order dependence
- Normalize path separators internally for cross-platform compatibility

### Performance Considerations

- **Target**: <100ms for typical project (~50 work items)
- **Strategy**: Avoid reading file contents unless required (status derivable from presence/absence only)
- **Optional caching** (Future): Cache keyed by directory mtimes and/or git diff to avoid rescanning unchanged subtrees
- **Incremental mode** (Future): Only rescan modified work items since last scan

## Pre-Mortem Analysis

### Risk: Name collision with Microsoft Azure Speech CLI (spx)

- **Likelihood**: Low — different domain, different audience
- **Impact**: Low — SEO differentiation via `spx.sh`, npm scoping options
- **Mitigation**: Own `spx.sh` domain, consider `@spx/cli` npm scope, clear positioning as spec workflow tool

### Risk: Spec convention drift across projects

- **Likelihood**: Medium — users may customize directory patterns
- **Impact**: Medium — CLI returns incorrect status for non-standard layouts
- **Mitigation**: Support `spx.config.json` for custom patterns, read `specs/templates/structure.yaml` if present, provide clear error messages

### Risk: MCP ecosystem immaturity

- **Likelihood**: Medium — MCP is evolving rapidly
- **Impact**: Low — CLI works standalone, MCP is additive
- **Mitigation**: Decouple CLI core from MCP layer, version MCP integration separately

### Risk: Single-binary distribution complexity

- **Likelihood**: Low — `bun build --compile` and `pkg` are mature
- **Impact**: Low — npm/npx fallback always available
- **Mitigation**: Start with npm distribution, add binaries in v1.1

### Risk: Cross-platform path and glob quirks

- **Likelihood**: Medium
- **Impact**: High — breaks matching on Windows
- **Mitigation**: Use `path` utilities; avoid brittle globbing; add fixtures for Windows-style separators

### Risk: Large repos make scans slow

- **Likelihood**: Medium
- **Impact**: Medium–High
- **Mitigation**: Avoid file reads; add incremental cache; provide `--scope` to limit traversal

## Deployment Plan

### Structured around descendant work items

1. **Capability: Core CLI** — Scanner, status logic, reporter with multiple output formats
2. **Feature: Status Command** — `spx status [item] [--format json|tree|table]`
3. **Feature: Navigation Commands** — `spx next`, `spx tree`
4. **Feature: Mutation Commands** — `spx done <item>`, `spx init`
5. **Feature: Validation Command** — `spx validate`, `spx explain`
6. **(Future) Feature: Incremental Performance** — Cache by mtime / git diff
7. **(Future) Capability: MCP Server** — Expose status and next as MCP tools

### Command Surface

```bash
spx status                    # Full hierarchical status report
spx status --json             # JSON for MCP/programmatic use
spx status capability-32      # Single item with descendants
spx next                      # Next actionable work item
spx tree                      # Visual tree without status
spx done story-76             # Create tests/DONE.md
spx init                      # Initialize specs directory structure
spx validate                  # Validate structure and naming
spx explain story-76          # Explain why item has its status
```

### Success Criteria

- [ ] `spx status` completes in <100ms for typical project (~50 work items)
- [ ] JSON output parseable by MCP clients without transformation
- [ ] Zero false positives/negatives on status detection
- [ ] Deterministic output across runs (no nondeterministic ordering)
- [ ] Cross-platform compatibility (Windows/macOS/Linux)
- [ ] Commands return sensible exit codes for CI/automation (`0` ok, `1` validation failed, etc.)
- [ ] Published to npm
- [ ] `spx.sh` documentation live at v1.0 release
