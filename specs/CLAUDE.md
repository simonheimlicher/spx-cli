# specs/ Directory Guide

This guide covers navigating, reading status, and editing work items in the `specs/` directory.

---

## Navigating the `specs/` Directory

### **IMPORTANT:** Always invoke the `/understanding-specs` skill on the file within the `specs/` directory you will work on

> Summary of the structure of the `specs/` directory.

<structure_definition>

## SPX Framework Structure

The specs/ directory follows the SPX framework structure defined in `structure.yaml`.

### Three-Phase Transformation

1. **Requirements (PRD/TRD)** - Capture vision without implementation constraints
2. **Decisions (ADR)** - Constrain architecture with explicit trade-offs
3. **Work Items (Capability/Feature/Story)** - Sized, testable implementation containers

### Directory Structure

```
specs/
├── [product-name].prd.md          # Product-wide PRD 
├── decisions/                      # Product-wide ADRs (optional)
│   └── adr-NNN_{slug}.md
└── work/
    ├── backlog/
    ├── doing/
    │   └── capability-NN_{slug}/
    │       ├── {slug}.capability.md
    │       ├── {slug}.prd.md        # Optional: Capability-scoped PRD from which the capability spec in (`{slug}.capability.md`) is derived
    │       ├── {slug}.prd.md        # Optional: Capability-scoped TRD from which capability-scoped ADRs are derived
    │       ├── decisions/           # Optional: Capability-scoped ADRs
    │       ├── tests/
    │       └── feature-NN_{slug}/
    │           ├── {slug}.prd.md    # Optional: Feature-scoped PRD from which the feature spec in `{slug}.feature.md` is derived
    │           ├── {slug}.trd.md    # Optional: Feature-scoped TRD from which the feature-scoped ADRs are derived
    │           ├── {slug}.feature.md
    │           ├── decisions/       # Optional: Feature-scoped ADRs
    │           ├── tests/
    │           └── story-NN_{slug}/
    │               ├── {slug}.story.md
    │               └── tests/
    └── done/
```

### Work Item Hierarchy

- **Capability**: E2E scenario with product-wide impact
  - Tests graduate to `tests/e2e/`
  - Triggered by PRD
  - Contains features

- **Feature**: Integration scenario with specific functionality
  - Tests graduate to `tests/integration/`
  - Triggered by TRD
  - Contains stories

- **Story**: Unit-tested atomic implementation
  - Tests graduate to `tests/unit/`
  - No children
  - Atomic implementation unit

### Key Principles

- **PRD OR TRD** at same scope, never both
- **Requirements immutable** - code adapts to requirements, not vice versa
- **BSP numbering**: Two-digit (10-99), lower number = must complete first
- **Test graduation**: `specs/.../tests/` → `tests/{unit,integration,e2e}/`
- **Status rules**:
  - OPEN: No tests exist
  - IN_PROGRESS: Tests exist, no DONE.md
  - DONE: DONE.md exists

</structure_definition>

## READ: Status and What to Work On Next

<understanding_work_items>

### Three States

Status is determined by the `tests/` directory at each level:

| State           | `tests/` Directory           | Meaning          |
| --------------- | ---------------------------- | ---------------- |
| **OPEN**        | Missing OR empty             | Work not started |
| **IN_PROGRESS** | Has `*.test.*`, no `DONE.md` | Work underway    |
| **DONE**        | Has `DONE.md`                | Complete         |

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

**Example**:

```text
feature-48_test-harness [OPEN]        ← Was added after feature-87 but blocks it
feature-87_e2e-workflow [IN_PROGRESS] ← Was already started, then dependency discovered
```

**Next work item**: `feature-48_test-harness` → its first OPEN story.

</understanding_work_items>

---

## EDIT: Adding or Reordering Work Items

<managing_work_items>

<numbering_work_items>

### BSP Numbering

Two-digit prefixes in range **[10, 99]** encode dependency order.

### Creating New Items

#### Case 1: First Item (No Siblings)

Use position **21** (leaves room for ~10 items before/after):

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

</numbering_work_items>

<creating_work_items>
Every work item needs:

1. **Directory**: `NN_{slug}/`
2. **Definition file**: `{slug}.{capability|feature|story}.md`
3. **Tests directory**: `tests/` (create when starting work)

Optional:

- **Requirements document**: `{topic}.prd.md` or `{topic}.trd.md`
- **Decision Records**: `decisions/adr-NNN_{slug}.md`

</creating_work_items>

</managing_work_items>

**Templates**: Use `/managing-specs` skill to access templates.

### Marking Complete

1. Ensure all tests pass
2. Create `tests/DONE.md` with:
   - Summary of what was implemented
   - List of graduated tests (moved to production `tests/`)
   - Any notes for future reference

### Test Graduation

When a work item is DONE, its tests graduate from `specs/.../tests/` to the production test suite:

| From                                     | To                   |
| ---------------------------------------- | -------------------- |
| `specs/.../story-NN/tests/*.test.*`      | `tests/unit/`        |
| `specs/.../feature-NN/tests/*.test.*`    | `tests/integration/` |
| `specs/.../capability-NN/tests/*.test.*` | `tests/e2e/`         |

> ⚠️ **Never write tests directly in `tests/`** — this breaks CI until implementation is complete. Always write in `specs/.../tests/` first, then graduate.

---

## Creating Requirements

**For product requirements:**

- Invoke `/writing-prd` skill
- Creates PRDs with user value and measurable outcomes
- Catalyzes capability decomposition

**For technical requirements:**

- Invoke `/writing-trd` skill
- Creates TRDs with architecture and validation strategy
- Catalyzes feature decomposition

**For structure and templates:**

- Invoke `/managing-specs` skill
- Provides templates for PRD/TRD/ADR/work items
- Defines directory structure and conventions

**Before implementing any work item:**

- Invoke `/understanding-specs` skill
- Reads complete context hierarchy (capability → feature → story)
- Verifies all specification documents exist
- Fails fast if context is incomplete

---

## Session Management

Claude Code session handoffs are stored in:

```
.spx/sessions/
├── TODO_*.md      # Available for /pickup
└── DOING_*.md     # Currently claimed
```

Use `/handoff` to create session context for continuation.
Use `/pickup` to load and claim a handoff.

---

**For complete workflow methodology**, reference the SPX framework documentation (when available) or consult the `/managing-specs` skill for structure details.
