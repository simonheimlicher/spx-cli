# spx

Fast, deterministic CLI tool for spec workflow management.

> **Note**: This tool will be published to the NPM registry when it reaches a more mature state. For now, install directly from GitHub.

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
npm install
npm run build
npm link  # Makes 'spx' available globally
```

### From npm (Coming Soon)

```bash
# Will be available when published
npm install -g spx
```

## Usage

```bash
# Get project status
spx status

# Get status as JSON (for scripts/agents)
spx status --json

# Choose output format
spx status --format markdown
spx status --format table

# Find next work item to work on
spx next
```

### Example Output

```
$ spx status

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
# Create a session (reads content from stdin)
echo "# Implement feature X" | spx session create --priority high

# List all sessions
spx session list

# Claim the highest priority session
spx session pickup --auto

# Release session back to queue
spx session release

# Show session content
spx session show <session-id>

# Delete a session
spx session delete <session-id>
```

Sessions are stored in `.spx/sessions/` with priority-based ordering (high → medium → low) and FIFO within the same priority.

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

## Development

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Run validation (required before commits)
npm run validate

# Build
npm run build

# Run locally
node bin/spx.js status
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
