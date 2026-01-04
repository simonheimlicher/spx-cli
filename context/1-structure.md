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
│       ├── requirements/
│       │   └── technical-change.trd.md
│       └── work-items/
│           ├── capability.md
│           ├── feature.md
│           ├── story.md
│           └── DONE.md
├── specs/                       # Work tracking
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
├── tests/                        # Tests
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
├── decisions/                          # Project-level ADRs
│   └── adr-{NNN}_{slug}.md
├── doing/                              # Active work items
│   └── capability-{NN}_{slug}/
│       ├── {slug}.capability.md
│       ├── {slug}.prd.md               # Optional: PRD/TRD catalyst at capability level
│       ├── decisions/
│       │   └── adr-{NNN}_{slug}.md
│       └── feature-{NN}_{slug}/
│           ├── {slug}.feature.md
│           ├── {slug}.trd.md           # Optional: TRD catalyst at feature level
│           └── story-{NN}_{slug}/
│               ├── {slug}.story.md
│               └── DONE.md
└── archive/                            # Completed capabilities
```

### Requirements vs Work Items

**Requirements (TRD/PRD)** are unbounded "wishful thinking":

- No size constraints, no tests
- Can appear at any level (project root, capability, feature)
- User evaluates value BEFORE decomposition begins
- **Not assessed** via the work item state model
- Catalyst that triggers creation of sized work items

**Work Items** (Capability/Feature/Story) are sized and testable:

- Bounded scope with tests
- Assessed via OPEN → IN PROGRESS → DONE state model
- Result of decomposing requirements into implementable chunks

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

### Insertion Rules

When adding new work items to an existing hierarchy, follow these three cases:

#### Case 1: Empty Space (No Existing Siblings)

**Rule**: Leave room for at least 10 items, even when adding just one.

**Formula**: Use initial distribution formula assuming N=10:

```
spacing = (99 - 10) / (10 + 1) = 89 / 11 ≈ 8
first_position = 10 + spacing = 18
```

**Example**: Adding the first feature to a new capability:

- Use position **18** (not 50 or an arbitrary midpoint)
- This leaves optimal space for 9 more features

#### Case 2: Insert Between Siblings

**Rule**: Use BSP midpoint between adjacent siblings.

**Formula**: `new_position = floor((left_sibling + right_sibling) / 2)`

**Example**: Insert feature between feature-18 and feature-32:

```
new_position = floor((18 + 32) / 2) = 25
```

**Collision handling**: If `floor(...)` produces an existing number, the space is exhausted:

- Review if the item truly belongs at this level
- Consider consolidating existing items if over-decomposed
- This is rare if Case 1 was followed initially

#### Case 3: Append After Last Sibling

**Rule**: Use BSP between last sibling and upper bound (99).

**Formula**: `new_position = floor((last_sibling + 99) / 2)`

**Example**: Append feature after feature-76:

```
new_position = floor((76 + 99) / 2) = floor(175 / 2) = 87
```

**Next append** after feature-87:

```
new_position = floor((87 + 99) / 2) = 93
```

### BSP Worked Example: Feature Evolution

1. **First feature** (Case 1): Use position **18**

   ```
   feature-18_initial-feature/
   ```

2. **Second feature appended** (Case 3): `floor((18 + 99) / 2) = 58`

   ```
   feature-18_initial-feature/
   feature-58_second-feature/
   ```

3. **Insert between** (Case 2): `floor((18 + 58) / 2) = 38`

   ```
   feature-18_initial-feature/
   feature-38_inserted-feature/
   feature-58_second-feature/
   ```

4. **Prepend before first** (Case 2 with lower bound): `floor((10 + 18) / 2) = 14`

   ```
   feature-14_prepended-feature/
   feature-18_initial-feature/
   feature-38_inserted-feature/
   feature-58_second-feature/
   ```

---

## Work Item State Model

| State           | Indicator                                  | Meaning                                |
| --------------- | ------------------------------------------ | -------------------------------------- |
| **OPEN**        | tests/ missing OR empty                    | Work not started                       |
| **IN PROGRESS** | tests/ has \*.test.ts files, no DONE.md    | Work underway                          |
| **DONE**        | tests/DONE.md exists (tests may be absent) | Complete - tests graduated to `tests/` |

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
