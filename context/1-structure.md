# Project Structure

## Directory Layout

```
spx/
├── CLAUDE.md                    # AI agent entry point
├── context/                     # Methodology documentation
│   ├── CLAUDE.md                # Agent orchestration guide
│   ├── 1-structure.md           # This file
│   ├── 2-workflow.md            # TRD → Capability → Feature → Story flow
│   ├── 3-coding-standards.md   # TypeScript standards
│   ├── 4-testing-standards.md   # Testing with Vitest
│   ├── 5-commit-standards.md    # Commit message format
│   └── templates/               # Document templates
│       ├── decisions/
│       │   └── adr.md
│       └── work-items/
│           ├── capability.md
│           ├── feature.md
│           ├── story.md
│           └── DONE.md
├── specs/                       # Work tracking
│   ├── requirements/            # TRD files
│   ├── decisions/               # Project-level ADRs
│   ├── doing/                   # Active work items
│   └── archive/                 # Completed work
├── src/                         # Source code
│   ├── index.ts                 # Main export
│   ├── cli.ts                   # CLI argument parsing
│   ├── scanner/                 # Directory walking and work item discovery
│   │   ├── index.ts
│   │   ├── walk.ts              # Directory traversal
│   │   ├── patterns.ts          # Work item pattern matching
│   │   └── scan.ts              # Main scanning logic
│   ├── status/                  # Status determination
│   │   ├── index.ts
│   │   ├── state.ts             # DONE/IN PROGRESS/OPEN state machine
│   │   └── context.ts           # Context discovery (context/1-structure.md)
│   ├── reporter/                # Output formatting
│   │   ├── index.ts
│   │   ├── text.ts              # Text tree output
│   │   ├── json.ts              # JSON for MCP/automation
│   │   ├── markdown.ts          # Markdown report
│   │   └── table.ts             # Table format
│   └── mcp/                     # MCP server adapter
│       └── server.ts            # MCP tool exposure
├── bin/                         # CLI entry point
│   └── spx.js
├── test/                        # Tests
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Specs Directory Structure

```
specs/
├── requirements/                       # Vision documents
│   └── {name}.trd.md
├── decisions/                          # Project-level ADRs
│   └── adr-{NNN}_{slug}.md
├── doing/                              # Active work items
│   └── capability-{NN}_{slug}/
│       ├── {slug}.capability.md
│       ├── decisions/
│       │   └── adr-{NNN}_{slug}.md
│       └── feature-{NN}_{slug}/
│           ├── {slug}.feature.md
│           └── story-{NN}_{slug}/
│               ├── {slug}.story.md
│               └── DONE.md
└── archive/                            # Completed capabilities
```

---

## Smart Numbering: Binary Space Partitioning (BSP)

BSP assigns numbers to work items while maintaining the ability to insert new items without renumbering.

### Range

Two-digit prefixes in range [10, 99] for work items at all hierarchy levels.

### Initial Distribution Formula

When inserting N items into range [10, 99]: `spacing = (99 - 10) // (N + 1)`

**Worked examples:**

- **2 items**: `spacing = 89 // 3 = 29` → positions 39, 68
- **3 items**: `spacing = 89 // 4 = 22` → positions 32, 54, 76
- **4 items**: `spacing = 89 // 5 = 17` → positions 27, 44, 61, 78

---

## Work Item State Model

| State           | Indicator         | Meaning          |
| --------------- | ----------------- | ---------------- |
| **OPEN**        | No DONE.md        | Work not started |
| **IN PROGRESS** | Tests, no DONE.md | Work underway    |
| **DONE**        | DONE.md exists    | Complete         |

---

## Source Code Organization

### src/scanner/

Directory walking and work item discovery:

- `walk.ts` - Filesystem traversal, directory enumeration
- `patterns.ts` - Pattern matching for capability/feature/story naming conventions
- `scan.ts` - Main scanning orchestration

### src/status/

Status determination logic:

- `state.ts` - DONE/IN PROGRESS/OPEN state machine based on tests/ directory
- `context.ts` - Context discovery (reading context/1-structure.md for custom patterns)

### src/reporter/

Output formatters for different consumers:

- `text.ts` - Human-readable tree for terminal
- `json.ts` - JSON for MCP tools and automation
- `markdown.ts` - Documentation-ready format
- `table.ts` - Compact tabular overview

### src/mcp/

MCP server adapter:

- `server.ts` - MCP tool exposure for status, next, validate, explain commands
