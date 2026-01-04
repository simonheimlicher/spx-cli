# Workflow: From Vision to Validated Code

## Overview

This workflow transforms unbounded vision into validated, working code through a fractal decomposition process:

1. **Requirements** (PRD/TRD) - Unbounded "wishful thinking" catalyst
2. **Decisions** (ADR) - Constrain architecture
3. **Work Items** (Capability/Feature/Story) - Sized, testable implementation

```
┌─────────────────────────────────────────────────────────────┐
│                   REQUIREMENTS (Catalyst)                   │
│  PRD/TRD - Unbounded wishful thinking                       │
│  "What if we could..." at ANY level                         │
│  No tests, no size limit, no state assessment               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼ User evaluates value
                          │
                          ▼ Decomposition begins
┌─────────────────────────────────────────────────────────────┐
│                       DECISIONS                             │
│  ADR (architecture)                                         │
│  "HOW we build it" - at project, capability, or feature     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      WORK ITEMS                             │
│  Capability ──► Feature ──► Story                           │
│  (E2E tests)   (Integration)  (Unit tests)                  │
│  Sized, bounded, state-assessed (OPEN/IN PROGRESS/DONE)     │
└─────────────────────────────────────────────────────────────┘
```

**Fractal Nature**: Requirements can spawn decomposition at any level:

- Project-level TRD → Multiple capabilities
- Capability-level PRD → Multiple features
- Feature-level TRD → Multiple stories

---

## Phase 1: Requirements (Catalyst)

**PRD and TRD are unbounded "wishful thinking" that catalyze decomposition.**

### TRD - Technical Requirements Document

- **Audience**: Developers, system designers
- **Focus**: What the system could do
- **Size**: **Unbounded** - no size constraints
- **No tests, no state assessment** - pure vision
- **Location**: Anywhere decomposition begins (project root, capability/, feature/)

Example at capability level (`specs/doing/capability-21_core-cli/core-cli.prd.md`):

```
The system should provide instant spec status analysis:
- Scan entire spec tree in <100ms
- Deterministic classification based on tests/ directory state
- Multiple output formats for humans and agents
- Replace slow LLM-based status checks
```

**Output**: A vision document that says WHAT and WHY, not HOW or WHEN.

**Key Difference from Work Items**:

- Requirements are NOT assessed via OPEN/IN PROGRESS/DONE
- User evaluates value BEFORE committing to decomposition
- Work items only created AFTER user decides requirements have value

---

## Phase 2: Decisions (Constraints)

**ADRs constrain the vision into something implementable.**

### ADR - Architecture Decision Record

- **Purpose**: Technical decisions - HOW to build it
- **Constrains**: Implementation approach
- **Enables future flexibility**

Example:

```
ADR-001: Caddy for Static File Serving

Decision: Use Caddy to serve Hugo builds instead of Hugo's dev server.

Consequences:
- Consistent static file serving behavior
- Avoids Hugo server quirks with draft/future content
- Requires Caddy as a dependency
- Enables accurate production-like measurements

Trade-off: Extra dependency for consistent behavior.
```

### ADR Scope Levels

ADRs can live at three levels:

| Level          | Location                   | Example                                    |
| -------------- | -------------------------- | ------------------------------------------ |
| **Project**    | `specs/decisions/`         | "Use Zod for runtime validation"           |
| **Capability** | `capability-NN/decisions/` | "Context-aware pattern discovery"          |
| **Feature**    | `feature-NN/decisions/`    | "JSON output schema for MCP compatibility" |

Narrower scope inherits from broader. Stories don't have ADRs—they inherit from their parent feature
and capability.

**Output**: Decisions that constrain the vision into a sized, implementable plan.

---

## Phase 3: Work Items (Implementation)

**Capabilities, Features, and Stories are SIZED containers with TESTS.**

### Capability (E2E Scenario)

- **Size**: Substantial work, multiple features
- **Test**: End-to-end scenario proving the capability works
- **Definition**: When E2E test passes, capability is DONE

Write the E2E test FIRST:

```typescript
describe("Capability: Core CLI", () => {
  it("GIVEN spx installed WHEN running status command THEN returns accurate results", async () => {
    // Given: Specs repository with work items
    const repoDir = "tests/fixtures/sample-repo";

    // When: Run spx status
    const { exitCode, stdout } = await execa("npx", ["spx", "status", "--json"], {
      cwd: repoDir,
    });

    // Then: Status returned correctly
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toHaveProperty("summary");
  });
});
```

**This test won't run yet. That's the point.**

### Feature (Atomic Functionality)

- **Size**: Specific capability, multiple stories
- **Test**: Integration scenario proving components work together
- **Definition**: When integration tests pass, feature is DONE

```typescript
describe("Feature: LHCI Runner", () => {
  it("GIVEN URL set configured WHEN running LHCI THEN audits each URL", async () => {
    const config = createTestConfig({
      url_sets: { critical: ["/", "/about/"] },
    });

    const result = await runLhci(config, mockDeps);

    expect(mockDeps.execa).toHaveBeenCalledWith("npx", ["lhci", "collect"], expect.anything());
  });
});
```

### Story (Atomic Deployable Unit)

- **Size**: Single sprint, independently deployable
- **Test**: Makes feature/E2E tests go RED → GREEN
- **Definition**: Story N assumes stories 1..N-1 are complete

**Stories are ORDERED. Each builds on the previous.**

| Order | Story              | Enables         | Test Status       |
| ----- | ------------------ | --------------- | ----------------- |
| 1     | Config loader      | Config parsed   | Compiles          |
| 2     | Hugo build to temp | Build works     | 🟢 Config feature |
| 3     | Caddy server       | Server starts   | Compiles          |
| 4     | LHCI runner        | Audits run      | 🟢 LHCI feature   |
| 5     | CLI integration    | Full flow works | 🟢 **E2E**        |

**Each story's value = moving tests from RED to GREEN.**

### Inserting New Stories

When you discover a missing story between existing stories, use BSP numbering to insert without renumbering:

**Example**: Insert a story between story-18 and story-32:

```
new_number = floor((18 + 32) / 2) = 25
→ Create story-25 between story-18 and story-32
```

This preserves existing story numbers and maintains stable references throughout the codebase.

**See [1-structure.md](./1-structure.md#insertion-rules) for complete BSP insertion rules** including:

- Case 1: First story in empty feature (use position 18)
- Case 2: Insert between siblings (BSP midpoint)
- Case 3: Append after last sibling (BSP to upper bound)

---

## Key Principles

### Requirements Are Immutable

- **Work items exist to cover requirements**, not to describe existing code
- Whether code exists, is missing, or deviates is irrelevant to whether a work item should exist
- Requirements don't adapt to code—code adapts to requirements

### Tests Are Requirements (at Work Item Level)

- PRD/TRD have no tests - they're vision
- Capabilities have E2E tests - they define DONE
- Features have integration tests - they define component behavior
- Stories make tests go RED → GREEN

### Stories Are Incremental, Not Independent

- Story N assumes stories 1..N-1 are complete
- Each story adds value ON TOP of previous work
- Value = tests moving from RED to GREEN

### Write Tests Before Code

- Capability: E2E test scenario first
- Feature: Integration test scenarios first
- Story: Implement to make tests pass

### No Explicit References Between Work Items

- A feature MUST NOT reference its stories
- A capability MUST NOT reference its features
- Dependencies are encoded in hierarchy and numbering only
- If a requirement appears uncovered, CREATE a new child work item

---

## Work Item Completion

Work item completion is determined by the presence of `DONE.md` in the work item's `tests/` directory.

### Three-State Model

```
work-item/
├── work-item.{story|feature|capability}.md    # Requirements (immutable)
└── tests/                                      # State indicator
    ├── (empty or missing)                      # State 1: Not started
    ├── *.test.ts                               # State 2: In progress
    └── DONE.md                                 # State 3: Complete (*.test.ts may be absent if graduated)
```

| State | `tests/` Directory                  | Meaning                                | Next Action               |
| ----- | ----------------------------------- | -------------------------------------- | ------------------------- |
| 1     | Missing OR empty (no files)         | Work not started                       | Write failing tests (RED) |
| 2     | Has \*.test.ts files, no `DONE.md`  | Work in progress                       | Implement code (GREEN)    |
| 3     | Has `DONE.md` (tests may be absent) | Complete - tests graduated to `tests/` | Verify or move on         |

### Completion by Work Item Level

| Level          | Own Tests   | `DONE.md` Proves             | Child Verification                  |
| -------------- | ----------- | ---------------------------- | ----------------------------------- |
| **Story**      | Unit        | Tests pass, requirements met | N/A                                 |
| **Feature**    | Integration | Integration tests pass       | All `story-*/tests/DONE.md` exist   |
| **Capability** | E2E         | E2E tests pass               | All `feature-*/tests/DONE.md` exist |

### Test Graduation

> **🚨 CRITICAL INVARIANT: The production test suite (`tests/`) MUST ALWAYS PASS.**
>
> This is the deployment gate. A failing test in `tests/` means the codebase is undeployable.

#### Why Two Test Locations Exist

| Location           | Name                 | May Fail? | Purpose                                |
| ------------------ | -------------------- | --------- | -------------------------------------- |
| `specs/.../tests/` | **Progress tests**   | YES       | TDD red-green cycle during development |
| `tests/`           | **Regression tests** | NO        | Protect working functionality          |

**Progress tests** live in `specs/` because they are allowed to fail during development. This is TDD: write failing tests first (RED), implement until they pass (GREEN), then graduate.

**Regression tests** live in `tests/` and must always pass. They prevent breaking changes to working functionality.

> **⚠️ NEVER write tests directly in `tests/`** — this would break CI until implementation is complete. Always write progress tests in `specs/.../tests/` first, then graduate them.

#### Graduation Process

When a work item is complete, tests graduate from specs to the production test suite:

1. **Refactor code to production quality** - No TODOs, fully typed
2. **Move tests** from `specs/doing/.../story-XX/tests/` → `tests/{unit,integration,e2e}/`
3. **Create DONE.md** documenting graduation

---

See [1-structure.md](./1-structure.md) for directory layout, naming conventions, and BSP numbering.
