# Product Requirements Document (PRD): `spx.sh`

## Status of this Document: DoR Checklist

| DoR checkbox            | Description |
| ----------------------- | ----------- |
| [ ] **Outcome**         | **Measurable Outcome:** Replace LLM-driven “spec status” analysis with a deterministic CLI that runs locally and returns stable results fast (human + agent consumable). |
| [ ] **Test Evidence**   | Golden-output tests over fixture `specs/` trees prove correct DONE/IN PROGRESS/OPEN classification and correct hierarchy rendering. |
| [ ] **Assumptions**     | The project uses the “tests directory state → status” model; work items follow `capability-NN_…/feature-NN_…/story-NN_…`; numbering implies ordering; context overrides are optional. |
| [ ] **Dependencies**    | Node.js runtime; filesystem access; (optional) Git for incremental mode; (future) MCP SDK if exposing as server. |
| [ ] **Pre-Mortem**      | Cross-platform path quirks, large trees performance, cache invalidation, ambiguous/missing conventions, users expecting the CLI to “fix” structure. |
| [ ] **Deployment Plan** | Ship as a small, installable CLI (`npm`/`npx`), with predictable outputs (`text`, `json`, `md`) and a stable core library to later reuse in an MCP server wrapper. |

## Problem Statement

### Customer Problem

```
As a developer using a specs-driven workflow, I am frustrated by spending tokens and time on deterministic status analysis
because an LLM repeatedly re-discovers the same filesystem-derived facts, which prevents fast, stable “what’s the state?” feedback
and makes agent workflows more expensive than necessary.
```

### Current Customer Pain

- **Symptom**: Status analysis via an LLM skill takes ~1–2 minutes and burns tokens for a task that is purely deterministic.
- **Root Cause**: The status computation depends on filesystem traversal and simple rules, but is executed through a generative model each time.
- **Customer Impact**: Slow feedback loop; higher cost; inconsistent outputs if prompts drift; harder to integrate into scripts/CI/agents.
- **Business Impact**: Not applicable (internal tool / personal workflow).

## Solution Design

### Customer Solution

```
Implement a local CLI (`spx.sh`) that scans the specs tree, computes work-item statuses deterministically,
and emits stable reports in human-readable and machine-readable formats,
enabling both humans and AI agents to retrieve only the minimal required summary without re-parsing the entire project each time.
```

### Customer Journey Context

- **Before**: Run an LLM “spec-workflow” skill → it reads files + walks `specs/` → returns a status report (slow + token-heavy).
- **During**: Run `spx.sh status` (or equivalent) locally → near-instant scan (with optional caching) → outputs `text/json/md`.
- **After**: Agents call the CLI (or MCP tool backed by the same core) to obtain minimal structured status and proceed with coding/review work.

## Expected Outcome

### Measurable Outcome

```
User replaces LLM status analysis calls with the CLI for routine checks,
leading to a reduction in end-to-end “status check” latency from minutes to sub-second
and reducing LLM token usage for this task to ~0,
proven by local benchmarks and CI tests over a representative fixture tree.
```

### Evidence of Success (BDD Tests)

- [ ] `Performance: Median status run time <= 200ms on a representative repo (warm cache); <= 1s cold scan`
- [ ] `Correctness: 100% agreement with fixture expectations for DONE/IN PROGRESS/OPEN classification`
- [ ] `Stability: Deterministic output across runs (no nondeterministic ordering)`
- [ ] `Machine Interface: JSON schema remains backward compatible across patch versions`

## End-to-End Tests

### Complete User Journey Test

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";

const execFileAsync = promisify(execFile);

describe("spx.sh: status report user journey", () => {
  test("scans fixture tree and emits deterministic JSON + markdown", async () => {
    // Given: a fixture repository with a specs tree
    const repoRoot = path.resolve(__dirname, "fixtures", "repo-basic");
    const cli = path.resolve(__dirname, "..", "..", "dist", "spx.js");

    // When: user asks for JSON output
    const { stdout: jsonOut } = await execFileAsync("node", [cli, "status", "--root", repoRoot, "--format", "json"]);
    const data = JSON.parse(jsonOut);

    // Then: counts and tree match expectation
    expect(data.summary).toEqual({ done: 6, inProgress: 2, open: 3 });
    expect(data.capabilities[0].slug).toBe("capability-32_core-cli");

    // When: user asks for markdown output
    const { stdout: mdOut } = await execFileAsync("node", [cli, "status", "--root", repoRoot, "--format", "md"]);
    // Then: markdown contains stable headings and entries
    expect(mdOut).toContain("## Project Status:");
    expect(mdOut).toContain("capability-32_core-cli");
    expect(mdOut).toContain("DONE");
  });
});
```

## Integration Tests

```gherkin
Feature: spx.sh status analysis

  Scenario: Classify work item status from tests directory state
    Given a story has a tests directory with files but no DONE.md
    When the CLI scans the specs tree
    Then the story should be marked IN PROGRESS

  Scenario: Hierarchical ordering by numbering
    Given a feature contains story-32_foo and story-54_bar
    When the CLI renders the tree
    Then story-32_foo should appear before story-54_bar

  Scenario: Context override discovery
    Given context/1-structure.md defines a non-default specs root
    When the CLI scans the project
    Then it should use the context-defined root and patterns
```

## Scope

### In Scope (MVP)

- Deterministic scan of a specs tree rooted at `specs/` (or `--root` override)
- Identify work items by directory naming patterns:
  - `capability-NN_slug/`
  - `feature-NN_slug/`
  - `story-NN_slug/`
- Determine status using the “tests directory state” rule:
  - Missing/empty `tests/` → **OPEN**
  - `tests/` has files but no `DONE.md` → **IN PROGRESS**
  - `tests/DONE.md` exists → **DONE**
- Render hierarchical report from capabilities → features → stories
- Output formats:
  - `text` (human-friendly)
  - `json` (agents/automation)
  - `md` (copy/paste into specs/docs)

### Explicit Non-Goals (MVP)

- Modifying project structure (“analyze and report”, not “fix”)
- Editing artifacts (requirements/decisions/work items)
- Deep parsing of markdown contents beyond what is needed for basic metadata (optional later)
- Enforcing or generating work items/templates (optional later)

## Key CLI Commands

- `spx.sh status [--root <path>] [--format text|json|md]`
  - Primary command: scan + report
- `spx.sh next [--root <path>] [--scope capability|feature]`
  - Return the next OPEN/IN PROGRESS item by ordering (lowest-number first)
- `spx.sh validate [--root <path>]`
  - Validate naming patterns, ordering, required folders/files; exit non-zero on violations
- `spx.sh explain <path-to-item>`
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

- `project`: `{ name?: string, root: string, specsRoot: string }`
- `summary`: `{ done: number, inProgress: number, open: number }`
- `capabilities`: `WorkItem[]` (capabilities with nested children)

## Architecture

### Layering (for CLI now, MCP later)

1. **Core library** (`spx-core`)
   - Pure functions for scanning, parsing names, computing statuses, ordering, rendering models
2. **CLI adapter**
   - Argument parsing, formatting, exit codes, printing
3. **(Future) MCP server adapter**
   - Exposes `status/next/validate/explain` as tools using the same core library

### Determinism Rules

- Stable sorting by `(kindOrder, number, slug)`
- No filesystem-order dependence
- Normalize path separators internally

### Performance Considerations

- Optional cache keyed by directory mtimes (and/or git diff) to avoid rescanning unchanged subtrees
- Avoid reading file contents unless required (status should be derivable from presence/absence only)

## Dependencies

### Work Item Dependencies

- [ ] N/A (this PRD is for the CLI itself; it will be managed by its own specs tree in practice).

### Technical Dependencies

- [ ] Node.js LTS (runtime and build)
- [ ] TypeScript build toolchain
- [ ] Cross-platform path handling (Windows/macOS/Linux)
- [ ] Test runner (e.g., Vitest or Jest)
- [ ] Optional: Git integration for incremental mode (only if implemented)

## Pre-Mortem Analysis

### Assumption: Users expect “status” to reflect more than tests/DONE.md

- **Likelihood**: Medium
- **Impact**: Medium (misaligned expectations, “why is this OPEN?”)
- **Mitigation**: `spx.sh explain` shows the exact rule; docs emphasize the completion model.

### Assumption: Large repos make scans slow

- **Likelihood**: Medium
- **Impact**: Medium–High
- **Mitigation**: Avoid file reads; add incremental cache; provide `--scope` to limit traversal.

### Assumption: Cross-platform path and glob quirks break matching

- **Likelihood**: Medium
- **Impact**: High
- **Mitigation**: Use `path` utilities; avoid brittle globbing; add fixtures for Windows-style separators.

### Assumption: Context files differ or are missing

- **Likelihood**: Medium
- **Impact**: Medium
- **Mitigation**: Default conventions; “context discovery” is best-effort; print warnings but keep operating.

## Deployment Plan

### Structured around descendant work items (implementation plan)

1. **Capability 10: Core scanning + model**
   - Parse work item directories
   - Determine status from tests/DONE.md
   - Stable ordering
2. **Feature 20: Output formats**
   - `text` tree + summary
   - `json` stable schema
   - `md` report output
3. **Feature 30: Quality gates**
   - Fixtures + golden tests
   - `validate` command + exit codes
4. **Feature 40: “Next work” helpers**
   - `next` command, scope filters
   - `explain` command
5. **(Optional) Feature 50: Incremental performance**
   - Cache by mtime / git diff
6. **(Future) Capability 60: MCP server wrapper**
   - Reuse core library; expose tools

### Success Criteria

- Deterministic status output across runs
- Cold scan meets baseline performance target on representative repo
- JSON schema versioned and backward compatible across patch releases
- Commands return sensible exit codes for CI/automation (`0` ok, `1` validation failed, etc.)
