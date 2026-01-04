# Workflow: From Vision to Validated Code

## Overview

This workflow transforms a naive vision into validated, working code through three phases:

1. **Requirements** (PRD/TRD) - Capture the vision
2. **Decisions** (ADR) - Constrain architecture
3. **Work Items** (Capability/Feature/Story) - Sized, testable implementation

```
┌─────────────────────────────────────────────────────────────┐
│                      REQUIREMENTS                           │
│  PRD (user-focused)              TRD (system-focused)       │
│  "What users want"               "What system needs"        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
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
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Requirements (Vision)

**PRD and TRD capture the vision without implementation constraints.**

### TRD - Technical Requirements Document

- **Audience**: Developers, system designers
- **Focus**: What the system needs to do
- **Size**: Unbounded - can be any scope
- **No tests** - it's just vision

Example:

```
The system must:
- Build Hugo sites to temp directory for consistent measurement
- Serve static files via Caddy for auditing
- Run LHCI collect, assert, and upload commands
- Support URL sets from configuration
- Generate JSON reports with scores
```

**Output**: A vision document that says WHAT and WHY, not HOW or WHEN.

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

| Level          | Location                   | Example                                     |
| -------------- | -------------------------- | ------------------------------------------- |
| **Project**    | `specs/decisions/`         | "Use Zod for runtime validation"            |
| **Capability** | `capability-NN/decisions/` | "Context-aware pattern discovery"           |
| **Feature**    | `feature-NN/decisions/`    | "JSON output schema for MCP compatibility"  |

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
describe('Capability: Core CLI', () => {
  it('GIVEN spx installed WHEN running status command THEN returns accurate results', async () => {
    // Given: Specs repository with work items
    const repoDir = 'test/fixtures/sample-repo';

    // When: Run spx status
    const { exitCode, stdout } = await execa('npx', ['spx', 'status', '--json'], {
      cwd: repoDir,
    });

    // Then: Status returned correctly
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toHaveProperty('summary');
  });
});
```

**This test won't run yet. That's the point.**

### Feature (Atomic Functionality)

- **Size**: Specific capability, multiple stories
- **Test**: Integration scenario proving components work together
- **Definition**: When integration tests pass, feature is DONE

```typescript
describe('Feature: LHCI Runner', () => {
  it('GIVEN URL set configured WHEN running LHCI THEN audits each URL', async () => {
    const config = createTestConfig({
      url_sets: { critical: ['/', '/about/'] },
    });

    const result = await runLhci(config, mockDeps);

    expect(mockDeps.execa).toHaveBeenCalledWith('npx', ['lhci', 'collect'], expect.anything());
  });
});
```

### Story (Atomic Deployable Unit)

- **Size**: Single sprint, independently deployable
- **Test**: Makes feature/E2E tests go RED → GREEN
- **Definition**: Story N assumes stories 1..N-1 are complete

**Stories are ORDERED. Each builds on the previous.**

| Order | Story               | Enables            | Test Status        |
| ----- | ------------------- | ------------------ | ------------------ |
| 1     | Config loader       | Config parsed      | Compiles           |
| 2     | Hugo build to temp  | Build works        | 🟢 Config feature  |
| 3     | Caddy server        | Server starts      | Compiles           |
| 4     | LHCI runner         | Audits run         | 🟢 LHCI feature    |
| 5     | CLI integration     | Full flow works    | 🟢 **E2E**         |

**Each story's value = moving tests from RED to GREEN.**

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
    └── DONE.md                                 # State 3: Complete
```

| State | `tests/` Directory           | Meaning          | Next Action                 |
| ----- | ---------------------------- | ---------------- | --------------------------- |
| 1     | Missing or empty             | Work not started | Write failing tests (RED)   |
| 2     | Has test files, no `DONE.md` | Work in progress | Implement code (GREEN)      |
| 3     | Has `DONE.md`                | Complete         | Verify or move on           |

### Completion by Work Item Level

| Level          | Own Tests   | `DONE.md` Proves                  | Child Verification                  |
| -------------- | ----------- | --------------------------------- | ----------------------------------- |
| **Story**      | Unit        | Tests pass, requirements met      | N/A                                 |
| **Feature**    | Integration | Integration tests pass            | All `story-*/tests/DONE.md` exist   |
| **Capability** | E2E         | E2E tests pass                    | All `feature-*/tests/DONE.md` exist |

### Test Graduation

> **🚨 CRITICAL INVARIANT: The production test suite (`test/`) MUST ALWAYS PASS.**
>
> This is the deployment gate. A failing test in `test/` means the codebase is undeployable.

#### Why Two Test Locations Exist

| Location             | Name                 | May Fail? | Purpose                                |
| -------------------- | -------------------- | --------- | -------------------------------------- |
| `specs/.../tests/`   | **Progress tests**   | YES       | TDD red-green cycle during development |
| `test/`              | **Regression tests** | NO        | Protect working functionality          |

**Progress tests** live in `specs/` because they are allowed to fail during development. This is TDD: write failing tests first (RED), implement until they pass (GREEN), then graduate.

**Regression tests** live in `test/` and must always pass. They prevent breaking changes to working functionality.

> **⚠️ NEVER write tests directly in `test/`** — this would break CI until implementation is complete. Always write progress tests in `specs/.../tests/` first, then graduate them.

#### Graduation Process

When a work item is complete, tests graduate from specs to the production test suite:

1. **Refactor code to production quality** - No TODOs, fully typed
2. **Move tests** from `specs/doing/.../story-XX/tests/` → `test/{unit,integration,e2e}/`
3. **Create DONE.md** documenting graduation

---

See [1-structure.md](./1-structure.md) for directory layout, naming conventions, and BSP numbering.
