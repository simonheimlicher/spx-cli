# specs/ Directory Guide

This guide covers navigating, reading status, and editing work items in the `specs/` directory.

---

## Navigating the `specs/` Directory

### Directory Layout

The `specs/` directory has exactly four valid subdirectories. Anything else is invalid:

```
specs/
├── doing/                                   # Active work
├── backlog/                                 # Future work
├── archive/                                 # Completed work
└── templates/                               # Templates for new items
```

**Important**: There is no `specs/decisions/` directory. All architectural decisions (ADRs) live within capability or feature `decisions/` subdirectories.

### Three-Level Hierarchy (All Levels Work The Same)

```
specs/{doing,backlog,archive}/
└── NN_{capability-slug}/                    # Level 1 (TOP)
    ├── {slug}.capability.md                 # Work item definition
    ├── {topic}.prd.md                       # Optional: requirements catalyst
    ├── decisions/adr-NNN_{slug}.md          # Architectural decisions
    ├── tests/                               # E2E tests
    │   └── DONE.md                          # Completion marker
    │
    └── NN_{feature-slug}/                   # Level 2
        ├── {slug}.feature.md                # Work item definition
        ├── {topic}.trd.md                   # Optional: requirements catalyst
        ├── decisions/adr-NNN_{slug}.md      # Architectural decisions
        ├── tests/                           # Integration tests
        │   └── DONE.md                      # Completion marker
        │
        └── NN_{story-slug}/                 # Level 3 (BOTTOM)
            ├── {slug}.story.md              # Work item definition
            └── tests/                       # Unit tests
                └── DONE.md                  # Completion marker
```

### What Lives Where

| Level          | Work Item         | Optional Catalyst | Has Decisions? | Test Type   |
| -------------- | ----------------- | ----------------- | -------------- | ----------- |
| 1 (Capability) | `*.capability.md` | `*.prd.md`        | ✅ Yes         | E2E         |
| 2 (Feature)    | `*.feature.md`    | `*.trd.md`        | ✅ Yes         | Integration |
| 3 (Story)      | `*.story.md`      | ❌ None           | ❌ Inherits    | Unit        |

**Key insight**: There is nothing above capabilities. No `specs/project.prd.md`. Capabilities ARE the top level.

**Fractal nature**: PRD at capability level spawns features. TRD at feature level spawns stories. Stories are atomic—no children.

---

## READ: Status and What to Work On Next

### Three States

Status is determined by the `tests/` directory at each level:

| State           | `tests/` Directory            | Meaning          |
| --------------- | ----------------------------- | ---------------- |
| **OPEN**        | Missing OR empty              | Work not started |
| **IN_PROGRESS** | Has `*.test.ts`, no `DONE.md` | Work underway    |
| **DONE**        | Has `DONE.md`                 | Complete         |

### 🚨 BSP Numbers = Dependency Order

> **Lower BSP number = must complete FIRST.**
>
> You CANNOT work on item N until ALL items with numbers < N are DONE.

This applies at every level:

| If you see...                                   | It means...                                      |
| ----------------------------------------------- | ------------------------------------------------ |
| `feature-48` before `feature-87`                | feature-48 MUST be DONE before feature-87 starts |
| `story-21` before `story-32`                    | story-21 MUST be DONE before story-32 starts     |
| `feature-48 [OPEN]`, `feature-87 [IN_PROGRESS]` | **BUG**: Dependency violation                    |

### Finding the Next Work Item

```
1. List all work items in BSP order (capability → feature → story)
2. Return the FIRST item where status ≠ DONE
3. That item blocks everything after it
```

**Example** from `spx status`:

```
feature-48_test-harness [OPEN]
feature-87_e2e-workflow [IN_PROGRESS]    ← Should not have started!
```

**Next work item**: `feature-48_test-harness` → its first OPEN story.

### Quick Commands

```bash
# Get current status
spx status

# Find next work item (respects BSP dependencies)
spx next

# Get status as JSON
spx status --json
```

---

## EDIT: Adding or Reordering Work Items

### BSP Numbering

Two-digit prefixes in range **[10, 99]** encode dependency order.

### Creating New Items

#### Case 1: First Item (No Siblings)

Use position **21** (leaves room for ~10 items):

```
# First feature in a new capability
capability-21_foo/
└── feature-21_first-feature/
```

#### Case 2: Insert Between Siblings

Use midpoint: `new = floor((left + right) / 2)`

```
# Insert between feature-21 and feature-54
new = floor((21 + 54) / 2) = 37

feature-21_first/
feature-37_inserted/    ← NEW
feature-54_second/
```

#### Case 3: Append After Last

Use midpoint to upper bound: `new = floor((last + 99) / 2)`

```
# Append after feature-54
new = floor((54 + 99) / 2) = 76

feature-21_first/
feature-54_second/
feature-76_appended/    ← NEW
```

### Creating a Work Item

Every work item needs:

1. **Directory**: `NN_{slug}/`
2. **Definition file**: `{slug}.{capability|feature|story}.md`
3. **Tests directory**: `tests/` (create when starting work)

Optional:

- **Requirements catalyst**: `{topic}.prd.md` (capability) or `{topic}.trd.md` (feature)
- **Decisions**: `decisions/adr-NNN_{slug}.md`

**Templates**: See [templates/](templates/) for starter files.

### Marking Complete

1. Ensure all tests pass
2. Create `tests/DONE.md` with:
   - Summary of what was implemented
   - List of graduated tests (moved to `tests/`)
   - Any notes for future reference

### Test Graduation

When a work item is DONE, its tests graduate from `specs/.../tests/` to the production test suite:

| From                                      | To                   |
| ----------------------------------------- | -------------------- |
| `specs/.../story-NN/tests/*.test.ts`      | `tests/unit/`        |
| `specs/.../feature-NN/tests/*.test.ts`    | `tests/integration/` |
| `specs/.../capability-NN/tests/*.test.ts` | `tests/e2e/`         |

> ⚠️ **Never write tests directly in `tests/`** — this breaks CI until implementation is complete. Always write in `specs/.../tests/` first, then graduate.
