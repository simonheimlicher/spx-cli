# ADR 001: CLI Framework Selection

## Problem

spx requires both simple command execution (`spx status --json`) and interactive tree navigation (`spx browse`). We need a CLI framework that handles both modes elegantly without over-engineering the simple cases.

## Context

- **Business**: spx replaces an LLM-based spec workflow skill with a deterministic CLI, requiring <100ms response times for non-interactive commands
- **Technical**: TypeScript chosen for MCP SDK alignment; need command parsing + optional TUI capability; must support JSON output for MCP consumption

## Decision

**Use Commander.js for command routing and Ink for interactive modes.**

## Rationale

spx has two distinct interaction modes that benefit from specialized tools:

1. **Fire-and-forget commands** (status, next, done) — Commander handles these perfectly with minimal overhead. It's the industry standard, familiar to Node developers, and adds negligible startup time.

2. **Interactive navigation** (browse, tree exploration) — Ink provides full TUI capability with React's component model, enabling live-updating trees with keyboard navigation.

Alternatives considered:

- **Commander-only**: Would require bolting on interactivity later with unknown libraries, risking fragmentation.
- **oclif**: Heavy plugin architecture designed for large CLI suites; overkill for a focused tool.
- **Clack**: Beautiful for guided prompts but prompt-oriented, not app-oriented. Limited for persistent TUI with live updates.

The Commander + Ink combination keeps simple things simple while enabling complex interactivity without architectural changes. Clack may be added later for specific flows like `spx init`.

## Trade-offs Accepted

- **Two libraries instead of one**: Acceptable given clear separation of concerns — Commander owns routing, Ink owns rendering.
- **Ink requires React mental model**: Acceptable given its power for TUI and the ecosystem of primitives (select, spinner, text-input).
- **Larger bundle than Commander-only**: Mitigated by tree-shaking and lazy-loading Ink only when interactive mode is invoked.

## Testing Strategy

> Consult `typescript-testing` skill for patterns and harness guidance.

### Level Coverage

| Level           | Question Answered                                           | Scope                                               |
| --------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| 1 (Unit)        | Do command handlers produce correct output for valid input? | Individual command modules (`status.ts`, `next.ts`) |
| 2 (Integration) | Does the CLI parse args and route to correct handler?       | Commander program → handler → output                |
| 3 (E2E)         | Does the installed CLI binary work for real user workflows? | Full `spx` binary execution against fixture repos   |

### Escalation Rationale

- **1 → 2**: Unit tests verify handlers in isolation but cannot verify Commander's argument parsing, option handling, or subcommand routing. Integration tests execute the program entry point with real argv.
- **2 → 3**: Integration tests run in-process but cannot verify the built binary, shebang, PATH resolution, or real-world timing. E2E tests execute the actual installed `spx` command.

### Test Harness

| Level | Harness           | Location/Dependency                                                             |
| ----- | ----------------- | ------------------------------------------------------------------------------- |
| 2     | CLI test executor | `tests/harness/cli-executor.ts` — wraps `execa` with timeout and output capture |
| 3     | Fixture generator | ADR-003, `tests/harness/fixture-generator.ts` — generates realistic spec repos  |

### Behaviors Verified

**Level 1 (Unit):**

- Status command handler returns correct structure for given WorkItemTree
- JSON formatter produces valid, parseable JSON
- Text formatter produces expected tree rendering

**Level 2 (Integration):**

- `spx status --json` parses flags and invokes correct handler
- `spx status --format=table` routes to table formatter
- Unknown commands produce helpful error messages
- `--help` flag works on all commands

**Level 3 (E2E):**

- `spx status --json` completes in <100ms on 50-item fixture
- `spx browse` renders tree and responds to keyboard input
- Exit codes are correct (0 for success, 1 for error)

## Validation

### How to Recognize Compliance

You're following this decision if:

- Non-interactive commands use Commander directly with no Ink dependency
- Interactive commands use Ink components with Commander only for initial routing
- New commands default to non-interactive unless they require live updates

### MUST

- All non-interactive commands complete in <100ms
- JSON output is machine-parseable (no ANSI codes, no trailing output)
- Ink is lazy-loaded only when interactive mode is invoked

### NEVER

- Import Ink in non-interactive command paths
- Use `console.log` for output in commands (use the output formatter interface)
- Block the event loop in interactive mode (use async patterns)
