# AI Agent Context Guide: spx

## Quick Start for Agents

**Single Entry Point**: This document provides project overview and validation requirements.

### Finding Work

**Rule**: Lower BSP number = higher priority. Complete `feature-48` before `feature-87`, regardless of status.

```bash
# Get status and next item
node spx spec status
node spx spec next
```

Full rules: [`specs/CLAUDE.md`](specs/CLAUDE.md) · Templates: [`specs/templates/`](specs/templates/)

### Human-Readable Documentation

Standards documentation lives in `docs/` for human reference. Agent-specific instructions are in skills.

| Document                    | Contains                    |
| --------------------------- | --------------------------- |
| `docs/code/typescript.md`   | TypeScript coding standards |
| `docs/code/commits.md`      | Commit message format       |
| `docs/testing/standards.md` | Testing with Vitest         |

---

## 🚨 VALIDATION GATE (MANDATORY BEFORE COMMIT)

**NEVER commit without passing validation.** This is *non-negotiable*.

```bash
# Full validation pipeline (circular deps → ESLint → TypeScript)
pnpm run validate

# Quick verification before committing
pnpm run validate && pnpm test
```

### Pre-Commit Checklist

Before committing ANY changes:

- [ ] **`pnpm run validate`** passes (all 3 steps: circular deps, ESLint, TypeScript)
- [ ] **`pnpm test`** shows 0 failed tests
- [ ] **`pnpm run build`** succeeds

### Committing Changes

**ALWAYS use the `claude:committing-changes` skill to commit.** Never run raw git commands for commits.

```bash
# Correct: invoke the skill
/claude:committing-changes

# Wrong: manual git commands
git add . && git commit -m "..."
```

### Available Validation Commands

All validation runs through `spx validation` subcommands. Use pnpm scripts or call spx directly:

| pnpm Script                    | spx Command                             | Purpose                       |
| ------------------------------ | --------------------------------------- | ----------------------------- |
| `pnpm run validate`            | `spx validation all`                    | Full validation pipeline      |
| `pnpm run validate:production` | `spx validation all --scope production` | Production scope only         |
| `pnpm run lint`                | `spx validation lint`                   | ESLint only                   |
| `pnpm run lint:fix`            | `spx validation lint --fix`             | Auto-fix ESLint issues        |
| `pnpm run typecheck`           | `spx validation typescript`             | TypeScript only               |
| `pnpm run circular`            | `spx validation circular`               | Check circular dependencies   |
| `pnpm run knip`                | `spx validation knip`                   | Find unused code              |
| `pnpm run format`              | —                                       | Format code with Prettier     |
| `pnpm run format:check`        | —                                       | Check formatting (no changes) |

**Options available on all spx validation subcommands:**

- `--scope <scope>`: Validation scope (`full` or `production`)
- `--files <paths...>`: Specific files/directories to validate
- `--quiet`: Suppress progress output
- `--json`: Output results as JSON

---

## Finding Work Items

**Use the `spx` CLI to check project status:**

```bash
# Get current project status (fast, deterministic)
node spx spec status

# Find next work item
node spx spec next
```

**Why use spx:**

- Fast: <100ms vs minutes with manual searching
- Deterministic: Reliable DONE/IN PROGRESS/OPEN classification
- Accurate: Uses tests/DONE.md for status determination

**For work item details**: Read [`specs/CLAUDE.md`](specs/CLAUDE.md)

---

## Session Management

Use `spx session` to manage work handoffs between agent contexts.

### Core Workflow

```bash
# Create a handoff session (pipe content with frontmatter from stdin)
cat << 'EOF' | spx session handoff
---
priority: high
---
# Task: Implement feature X
EOF
# Output:
# Created handoff session <HANDOFF_ID>2026-01-15_08-30-00</HANDOFF_ID>
# <SESSION_FILE>/path/to/.spx/sessions/todo/2026-01-15_08-30-00.md</SESSION_FILE>

# List all sessions
spx session list

# Claim highest priority session
spx session pickup --auto
# Output: Claimed session <PICKUP_ID>2026-01-15_08-30-00</PICKUP_ID>

# Release session back to queue (if interrupted)
spx session release
```

### Creating Sessions with Content

Metadata (priority, tags) is specified via YAML frontmatter in the content.
This makes `spx session handoff` deterministic for permission pre-approval.

```bash
# From stdin with frontmatter (recommended for agents)
cat << 'EOF' | spx session handoff
---
priority: high
tags: [feature, api]
---
# Implement User Authentication

## Context
- Using JWT tokens
- Need login/logout endpoints

## Files to modify
- src/auth/login.ts
- src/auth/middleware.ts
EOF

# Quick session (adds default frontmatter: priority: medium)
echo "# My task" | spx session handoff
```

### Session Commands Reference

| Command                    | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `spx session list`         | List sessions by status (doing → todo → archive)  |
| `spx session show <id>`    | Display session content                           |
| `spx session pickup [id]`  | Claim session (use `--auto` for highest priority) |
| `spx session release [id]` | Return session to todo queue                      |
| `spx session handoff`      | Create handoff session (reads content from stdin) |
| `spx session delete <id>`  | Remove session                                    |

### Parseable Output Tags

Commands output XML-style tags for easy parsing by automation tools:

- **`<PICKUP_ID>session-id</PICKUP_ID>`** - Output by `spx session pickup`
- **`<HANDOFF_ID>session-id</HANDOFF_ID>`** - Output by `spx session handoff`
- **`<SESSION_FILE>/absolute/path</SESSION_FILE>`** - Output by `spx session handoff` (for direct file editing)

**Detailed recipes**: [`docs/how-to/session/common-tasks.md`](docs/how-to/session/common-tasks.md)

---

## Project Overview

**spx** is a fast, deterministic CLI tool for spec workflow management:

- **Instant spec status analysis** - <100ms deterministic scans
- **Work item scanning** - Discover and classify capabilities, features, stories
- **Multiple output formats** - Text, JSON, Markdown, Table

## Technical Stack

- **Language**: TypeScript
- **Build**: tsup
- **Testing**: Vitest
- **CLI**: Commander.js

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm run build

# Run CLI locally
node bin/spx.js --help
```

## Architecture

```
src/
├── scanner/          # Directory walking, pattern matching
├── status/           # DONE/IN PROGRESS/OPEN state machine
├── reporter/         # Output formatting (text, json, md, table)
└── mcp/              # MCP server adapter
```

### Status Determination

Status is computed from the `tests/` directory state:

- **OPEN**: Missing or empty `tests/` directory
- **IN PROGRESS**: `tests/` has files but no `DONE.md`
- **DONE**: `tests/DONE.md` exists
