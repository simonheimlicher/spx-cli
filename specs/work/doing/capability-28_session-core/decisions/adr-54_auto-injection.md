# ADR: Session Auto-Injection

## Problem

When an AI agent picks up a session, it needs context from multiple files: specs, source code, and previous work. Currently, agents must manually read each file, consuming tokens and time on repetitive operations.

## Context

- **Business**: Faster context loading = faster time-to-productivity. Agents waste time reading files that were already known at handoff creation.
- **Technical**: Session files use YAML front matter with `specs:` and `files:` arrays listing relevant paths. The `yaml` npm package provides robust parsing.

## Decision

**Auto-inject file contents listed in YAML front matter when picking up a session.**

Session YAML front matter structure:

```yaml
---
id: 2026-01-13_08-01-05
priority: high
tags: [feature, cli]
branch: feature/session-management
specs:
  - specs/work/doing/capability-28_session/session.prd.md
  - specs/work/doing/capability-28_session/decisions/adr-21_session-directory-structure.md
files:
  - src/session/index.ts
  - src/session/types.ts
created_at: 2026-01-13T08:01:05-08:00
working_directory: /Users/dev/project
---
```

Pickup command output:

```
Session claimed: 2026-01-13_08-01-05

=== Session Content ===
[session markdown content]

=== Injected Files ===

--- specs/work/doing/capability-28_session/session.prd.md ---
[file content]

--- src/session/index.ts ---
[file content]

[Warning: File not found: src/session/types.ts]
```

## Rationale

**Alternatives considered:**

1. **No auto-injection** (agent reads files manually)
   - Rejected: Wastes tokens and time on predictable operations

2. **Store file contents in session** (inline everything at creation)
   - Rejected: Sessions become huge, stale if files changed

3. **Require all files exist** (fail on missing)
   - Rejected: Too strict; files may have been deleted/renamed

**Why warn-and-continue:**

- **Graceful degradation**: Missing files don't block pickup
- **Clear feedback**: User sees exactly what loaded and what didn't
- **Fresh content**: Always reads current file state, not stale snapshot
- **Explicit dependencies**: YAML lists make context requirements visible

## Trade-offs Accepted

- **Files may have changed**: Injected content may differ from handoff time
  - Mitigation: Acceptable; agent sees current state, handoff describes past context
- **Large output**: Many files = lots of text to stdout
  - Mitigation: CLI truncates at reasonable limit; user can use `--no-inject` flag
- **Missing files are warnings only**: Agent may miss context if files deleted
  - Mitigation: Warning is prominent; user can investigate

## Testing Strategy

### Level Coverage

| Level           | Question Answered                              | Scope                                     |
| --------------- | ---------------------------------------------- | ----------------------------------------- |
| 1 (Unit)        | Does YAML parsing extract specs/files arrays?  | Front matter parsing                      |
| 2 (Integration) | Does file injection work with real filesystem? | Read files, handle missing, format output |

### Escalation Rationale

- **1 → 2**: Unit tests verify YAML parsing; integration tests verify file reading with fixtures

### Test Harness

| Level | Harness              | Location/Dependency               |
| ----- | -------------------- | --------------------------------- |
| 2     | Temp session fixture | Creates session + spec/code files |

### Behaviors Verified

**Level 1 (Unit):**

- `parseSessionFrontMatter(content)` extracts `specs` and `files` arrays
- `parseSessionFrontMatter(content)` returns empty arrays if fields missing
- `parseSessionFrontMatter(content)` handles malformed YAML gracefully

**Level 2 (Integration):**

- All listed files injected with content and headers
- Missing files produce warnings, don't abort operation
- Empty `specs`/`files` arrays produce no injection section
- Output format is clear and parseable (file path in header)

## Validation

### How to Recognize Compliance

You're following this decision if:

- `spx session pickup` outputs injected file contents after session content
- Missing files produce warnings, not errors
- YAML front matter `specs:` and `files:` arrays drive injection

### MUST

- Parse YAML front matter using `yaml` npm package
- Output each file with clear delimiter showing its path
- Continue pickup even if some files are missing
- Show warning for each missing file

### NEVER

- Fail pickup because a listed file doesn't exist
- Inject files not listed in front matter
- Cache file contents (always read fresh)
