# Session Management Recipes

This guide covers common workflows for managing work sessions with `spx session`.

## Overview

Sessions provide a priority-based queue for managing work handoffs between agent contexts. Each session is a markdown file stored in `.spx/sessions/` with YAML front matter for metadata.

```
.spx/sessions/
├── todo/      # Available sessions
├── doing/     # Currently claimed sessions
└── archive/   # Completed sessions
```

## Command Reference

| Command                    | Description                           |
| -------------------------- | ------------------------------------- |
| `spx session list`         | List all sessions grouped by status   |
| `spx session show <id>`    | Display session content and metadata  |
| `spx session pickup [id]`  | Claim a session (move to doing)       |
| `spx session release [id]` | Release session back to todo          |
| `spx session create`       | Create new session (reads from stdin) |
| `spx session delete <id>`  | Permanently remove a session          |

### Common Options

All commands support:

- `--sessions-dir <path>` - Use custom sessions directory instead of `.spx/sessions/`

## Creating Sessions

### From Stdin (Recommended)

The create command reads content from stdin, making it easy to pipe content:

```bash
# Simple echo
echo "# Fix login bug" | spx session create --priority high

# Multi-line with heredoc
cat << 'EOF' | spx session create --priority high --tags "feature,api"
# Implement User Authentication

## Context
- Using JWT tokens for stateless auth
- Need login, logout, and refresh endpoints

## Acceptance Criteria
- [ ] POST /auth/login returns JWT
- [ ] POST /auth/logout invalidates token
- [ ] POST /auth/refresh rotates token

## Files to Modify
- src/auth/routes.ts
- src/auth/middleware.ts
- src/auth/jwt.ts
EOF
```

### From File

```bash
# Redirect file content
spx session create --priority medium < task-description.md

# Or with cat
cat task-description.md | spx session create --priority high
```

### With Priority and Tags

```bash
# High priority with tags
echo "# Urgent fix" | spx session create --priority high --tags "bug,urgent"

# Medium priority (default)
echo "# Feature work" | spx session create

# Low priority
echo "# Nice to have" | spx session create --priority low --tags "enhancement"
```

### Quick Session (No Content)

If no stdin is provided, creates a session with default placeholder content:

```bash
spx session create --priority medium
```

## Listing Sessions

### All Sessions

```bash
spx session list
```

Output:

```
DOING:
  2026-01-15_08-30-00 [high] (bug, urgent)

TODO:
  2026-01-15_09-00-00 [high] (feature)
  2026-01-14_14-00-00 [medium]
  2026-01-13_10-00-00 [low] (enhancement)

ARCHIVE:
  (no sessions)
```

### Filter by Status

```bash
spx session list --status todo
spx session list --status doing
spx session list --status archive
```

### JSON Output

```bash
spx session list --json
```

## Claiming Sessions

### Claim Specific Session

```bash
spx session pickup 2026-01-15_09-00-00
```

### Auto-Claim Highest Priority

The `--auto` flag claims the highest priority available session (FIFO within same priority):

```bash
spx session pickup --auto
```

Output:

```
Claimed session: 2026-01-15_09-00-00

Status: doing
Priority: high
Tags: feature
────────────────────────────────────────

# Implement User Authentication
...
```

### Handling Conflicts

If another agent claims a session first, you'll get:

```
Error: Session not available: 2026-01-15_09-00-00. It may have been claimed by another agent.
```

Use `--auto` to automatically try the next available session.

## Releasing Sessions

### Release Specific Session

```bash
spx session release 2026-01-15_09-00-00
```

### Release Current Session

Without an ID, releases the most recent session in doing:

```bash
spx session release
```

## Viewing Sessions

```bash
spx session show 2026-01-15_09-00-00
```

Output:

```
Status: todo
Priority: high
Tags: feature, api
────────────────────────────────────────

---
priority: high
tags: [feature, api]
---
# Implement User Authentication

## Context
...
```

## Deleting Sessions

```bash
spx session delete 2026-01-15_09-00-00
```

## Workflows

### Basic Agent Handoff

1. **End of context**: Create session with remaining work

```bash
cat << 'EOF' | spx session create --priority high
# Continue: API Implementation

## Completed
- [x] Set up routes
- [x] Add authentication middleware

## Remaining
- [ ] Implement rate limiting
- [ ] Add request validation

## Current State
Working in src/api/routes.ts, line 45
EOF
```

2. **New context**: Pickup and continue

```bash
spx session pickup --auto
```

### Priority Queue Management

```bash
# Add urgent bug fix
echo "# Fix: Login timeout" | spx session create --priority high --tags "bug"

# Add feature work
echo "# Feature: Dark mode" | spx session create --priority medium --tags "feature"

# Add nice-to-have
echo "# Refactor: Clean up utils" | spx session create --priority low

# Process in priority order
spx session pickup --auto  # Gets high priority first
```

### Multi-Agent Coordination

When multiple agents work concurrently:

```bash
# Agent 1: Create tasks
echo "# Task A" | spx session create --priority high
echo "# Task B" | spx session create --priority high
echo "# Task C" | spx session create --priority medium

# Agent 2: Claim available work
spx session pickup --auto  # Atomically claims one task

# Agent 3: Also claims work
spx session pickup --auto  # Gets different task (atomic)
```

The atomic claim operation ensures no two agents get the same session.

## Session File Format

Sessions are markdown files with YAML front matter:

```markdown
---
priority: high
tags: [feature, api]
---

# Session Title

Session content in markdown...
```

### Supported Front Matter Fields

| Field      | Type                | Description                      |
| ---------- | ------------------- | -------------------------------- |
| `priority` | `high\|medium\|low` | Queue priority (default: medium) |
| `tags`     | `string[]`          | Free-form tags for filtering     |
| `branch`   | `string`            | Associated git branch            |
| `specs`    | `string[]`          | Spec files to auto-inject        |
| `files`    | `string[]`          | Code files to auto-inject        |

## Tips

1. **Use high priority sparingly** - Reserve for truly urgent items
2. **Include context** - Future agents need to understand the work
3. **List completed vs remaining** - Makes handoffs seamless
4. **Add file references** - Point to specific locations in code
5. **Use tags for filtering** - Group related sessions
