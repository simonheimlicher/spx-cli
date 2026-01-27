# spx

Fast, deterministic CLI tool for spec workflow management.

> **Note**: This tool will be published to a registry when it reaches a more mature state. For now, install directly from GitHub.

## What is spx?

**spx** scans your project's `specs/` directory and provides instant status analysis of work items (capabilities, features, stories). It replaces slow, token-expensive LLM-based status checks with deterministic filesystem operations completing in under 100ms.

### Key Benefits

- **Fast**: Scan entire spec tree in <100ms vs 1-2 minutes with LLM
- **Deterministic**: Reliable DONE/IN PROGRESS/OPEN classification
- **Zero token cost**: No LLM calls for status checks
- **Multiple formats**: Text, JSON, Markdown, Table output

## Installation

### From GitHub (Latest)

```bash
# Clone and install
git clone https://github.com/simonheimlicher/spx-cli.git
cd spx-cli
pnpm install
pnpm run build
pnpm link --global  # Makes 'spx' available globally
```

### From Registry (Coming Soon)

```bash
# Will be available when published
pnpm add -g spx
```

## Usage

```bash
# Get project status
spx spec status

# Get status as JSON (for scripts/agents)
spx spec status --json

# Choose output format
spx spec status --format markdown
spx spec status --format table

# Find next work item to work on
spx spec next
```

### Example Output

```
$ spx spec status

capability-21_core-cli [IN PROGRESS]
├── feature-21_pattern-matching [DONE]
│   ├── story-21_parse-capability-names [DONE]
│   ├── story-32_parse-feature-names [DONE]
│   └── story-43_parse-story-names [DONE]
├── feature-32_directory-walking [IN PROGRESS]
│   ├── story-21_recursive-walk [DONE]
│   └── story-32_pattern-filter [OPEN]
└── feature-43_status-determination [OPEN]
```

## Status Determination

Status is computed deterministically from the `tests/` directory:

| Condition                           | Status          |
| ----------------------------------- | --------------- |
| No `tests/` directory or empty      | **OPEN**        |
| `tests/` has files but no `DONE.md` | **IN PROGRESS** |
| `tests/DONE.md` exists              | **DONE**        |

## Session Management

Manage work sessions for agent handoffs and task queuing:

```bash
# Create a handoff session (reads content with frontmatter from stdin)
cat << 'EOF' | spx session handoff
---
priority: high
---
# Implement feature X
EOF
# Output:
# Created handoff session <HANDOFF_ID>2026-01-15_08-30-00</HANDOFF_ID>
# <SESSION_FILE>/path/to/.spx/sessions/todo/2026-01-15_08-30-00.md</SESSION_FILE>

# Or create empty session and edit the file directly
spx session handoff
# Then edit the <SESSION_FILE> path returned

# List all sessions
spx session list

# Claim the highest priority session
spx session pickup --auto
# Output: Claimed session <PICKUP_ID>2026-01-15_08-30-00</PICKUP_ID>

# Release session back to queue
spx session release

# Show session content
spx session show <session-id>

# Delete a session
spx session delete <session-id>
```

Sessions are stored in `.spx/sessions/` with priority-based ordering (high → medium → low) and FIFO within the same priority. Commands output parseable `<PICKUP_ID>`, `<HANDOFF_ID>`, and `<SESSION_FILE>` tags for automation.

See [Session Recipes](docs/how-to/session/common-tasks.md) for detailed usage patterns.

## Work Item Structure

spx expects work items in `specs/doing/` following this pattern:

```
specs/doing/
└── capability-NN_{slug}/
    ├── {slug}.capability.md
    └── feature-NN_{slug}/
        ├── {slug}.feature.md
        └── story-NN_{slug}/
            ├── {slug}.story.md
            └── tests/
                └── DONE.md  # Present when complete
```

Numbers use [BSP (Binary Space Partitioning)](https://en.wikipedia.org/wiki/Binary_space_partitioning) for easy insertion: start with 21, 32, 43... and insert between existing items.

## Code Validation

Run code quality checks through `spx validation`:

```bash
# Full validation pipeline (circular deps → ESLint → TypeScript)
spx validation all

# Individual checks
spx validation lint           # ESLint
spx validation lint --fix     # ESLint with auto-fix
spx validation typescript     # TypeScript type checking
spx validation circular       # Circular dependency detection
spx validation knip           # Unused code detection

# Production scope only (excludes tests/scripts)
spx validation all --scope production
spx validation lint --scope production
```

All commands support `--quiet` for CI and `--json` for machine-readable output.

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run validation (required before commits)
pnpm run validate   # or: spx validation all

# Build
pnpm run build

# Run locally
node bin/spx.js spec status
```

## Technical Stack

- **TypeScript** - Type-safe implementation
- **Commander.js** - CLI framework
- **Vitest** - Testing framework
- **tsup** - Build tool
- **ESLint 9** - Linting with flat config

## Architecture

```
src/
├── scanner/     # Directory walking, pattern matching
├── status/      # DONE/IN PROGRESS/OPEN state machine
├── reporter/    # Output formatting (text, json, md, table)
├── tree/        # Hierarchical tree building
└── commands/    # CLI command implementations
```

## License

MIT
