# Capability 20 Decomposition Proposal

## Session Context & Status

### Current State

- ✅ **CLAUDE.md updated** - Root entry point now describes spx project
- ✅ **Context files updated** - All context/\*.md files now use spx examples
- ✅ **PRD canonicalized** - Merged both PRDs into [core-cli.prd.md](./core-cli.prd.md)
- ✅ **Tech stack confirmed** - TypeScript, Vitest, Commander.js, Zod, 3-level testing, DI
- 📋 **This proposal** - Ready for user review and approval

### Key Decisions Made

1. **Progressive risk reduction** - Features ordered smallest→largest technical hurdle
2. **Test infrastructure building** - Each feature adds test capability (unit → integration → E2E)
3. **BSP numbering** - 7 features: 21, 32, 43, 54, 65, 76, 87
4. **Minimal functionality** - Each feature proves feasibility, not completeness
5. **MCP server** - Future capability (not in Capability 20)

### Next Steps

1. **User reviews this proposal** - Confirm feature breakdown and ordering
2. **Create capability-21_core-cli.capability.md** - E2E test definition
3. **Create feature-21_pattern-matching/** - First feature directory
4. **Begin story decomposition** - Break Feature 21 into stories
5. **Start TDD cycle** - Write failing tests, implement, graduate

### Important Files

- **PRD**: [specs/doing/capability-21_core-cli/core-cli.prd.md](./core-cli.prd.md)
- **Archived PRD**: [spx-inspiration.PRD.archived.md](./spx-inspiration.PRD.archived.md)
- **Root context**: [CLAUDE.md](/Users/shz/Code/spx/root/CLAUDE.md)
- **Agent orchestration**: [context/CLAUDE.md](/Users/shz/Code/spx/root/context/CLAUDE.md)
- **Testing standards**: [context/4-testing-standards.md](/Users/shz/Code/spx/root/context/4-testing-standards.md)

### Questions to Confirm

1. ✅ Feature ordering: smallest→largest hurdle - **CONFIRMED**
2. ✅ Test infrastructure progression - **CONFIRMED**
3. ⏳ Minimal functionality per feature - **PENDING USER REVIEW**
4. ⏳ Performance timing (Feature 87 last) - **PENDING USER REVIEW**
5. ✅ MCP server as future capability - **CONFIRMED**

---

## Strategy: Progressive Risk Reduction + Test Infrastructure Building

Each feature tackles progressively larger technical hurdles while building integration test capabilities. By the end, we have both complete functionality AND a comprehensive integration test suite.

## Technical Hurdles (Smallest → Largest)

1. **Pattern matching** (Pure functions, regex) - ✅ Most testable, lowest risk
2. **Directory walking** (Filesystem I/O) - ⚠️ External dependency, moderate risk
3. **Status determination** (State machine + file checks) - ⚠️ Logic + I/O combined
4. **Tree building** (Data structures, ordering) - ⚠️ Complex state management
5. **Output formatting** (Multiple formats) - ⚠️ Rendering logic
6. **CLI integration** (Commander.js) - ⚠️ External framework
7. **Performance** (Sub-100ms target) - 🔴 Strict requirement, optimization needed
8. **MCP server** (Future) - 🔴 External protocol, most complex

---

## Feature Breakdown (BSP Numbering)

**7 features**: `spacing = (99 - 10) // (7 + 1) = 11` → positions: **21, 32, 43, 54, 65, 76, 87**

### Feature 21: Pattern Matching & Basic Fixtures

**Technical Hurdle**: Work item name parsing (regex, pure functions)
**Risk Level**: ✅ Lowest - Pure functions, no I/O
**Test Infrastructure Added**: Basic unit test fixtures, test data factories

#### What We Validate

- Regex patterns work for capability-NN_slug format
- BSP number extraction (10-99 range)
- Slug validation (kebab-case)
- Kind detection (capability/feature/story)

#### Minimal Functionality

```typescript
// Parse work item directory names
parseWorkItemName("capability-21_core-cli")
  → { kind: "capability", number: 20, slug: "core-cli" }

// Validate BSP numbering
isValidBSPNumber(20) → true
isValidBSPNumber(5) → false
```

#### Test Infrastructure

- **Unit test factory pattern** for work item names
- **Fixture generators** for test data
- **Property-based testing** for edge cases

#### Success Criteria

- [ ] All pattern variations parsed correctly
- [ ] Invalid patterns rejected with clear errors
- [ ] Unit tests run in <5ms
- [ ] Test factory pattern established

---

### Feature 32: Directory Walking & Temp Fixtures

**Technical Hurdle**: Filesystem traversal (directory enumeration)
**Risk Level**: ⚠️ Moderate - Requires real filesystem operations
**Test Infrastructure Added**: Temp directory fixtures, real filesystem integration tests

#### What We Validate

- Node.js `fs` APIs work for our use case
- Directory traversal handles nested structures
- Filtering by pattern works on real filesystem
- Cross-platform path handling (Windows/macOS/Linux)

#### Minimal Functionality

```typescript
// Walk specs directory, find work item directories
walkDirectory("/path/to/specs/doing")
  → ["capability-21_core-cli", "feature-10_status"]

// Filter by pattern
filterWorkItemDirs(entries, "capability")
  → ["capability-21_core-cli"]
```

#### Test Infrastructure

- **Temp directory creation** with `mkdtemp`
- **Fixture tree builder** (create realistic specs structures)
- **Integration test pattern** for real filesystem operations
- **Cleanup helpers** for temp directories

#### Success Criteria

- [ ] Walks real directory structures correctly
- [ ] Handles nested capability/feature/story hierarchy
- [ ] Works on Windows/macOS/Linux paths
- [ ] Integration tests use real temp directories
- [ ] Cleanup always succeeds (no leaked temp dirs)

---

### Feature 43: Status Determination & State Fixtures

**Technical Hurdle**: State machine logic + file existence checks
**Risk Level**: ⚠️ Moderate - Logic + I/O combined
**Test Infrastructure Added**: Status state fixtures (OPEN/IN_PROGRESS/DONE scenarios)

#### What We Validate

- File existence checks work reliably
- State machine logic is correct
- DONE.md detection works
- Edge cases handled (empty tests/, missing tests/, etc.)

#### Minimal Functionality

```typescript
// Determine status from tests/ directory state
determineStatus("/path/to/capability-21_core-cli")
  → "DONE" (tests/DONE.md exists)

determineStatus("/path/to/feature-10_status")
  → "IN_PROGRESS" (tests/*.test.ts exists, no DONE.md)

determineStatus("/path/to/story-20_init")
  → "OPEN" (tests/ empty or missing)
```

#### Test Infrastructure

- **Status state fixtures** (all three states)
- **DONE.md template** for fixtures
- **Test file generators** (\*.test.ts)
- **State transition testing** (OPEN → IN_PROGRESS → DONE)

#### Success Criteria

- [ ] All three states detected correctly
- [ ] Edge cases handled (symlinks, permissions, etc.)
- [ ] Deterministic results (no filesystem race conditions)
- [ ] Integration tests cover all state transitions
- [ ] Performance: <10ms per status check

---

### Feature 54: Hierarchical Tree Building & Complex Fixtures

**Technical Hurdle**: Data structure assembly, ordering, parent-child relationships
**Risk Level**: ⚠️ Moderate-High - Complex state management
**Test Infrastructure Added**: Multi-level fixtures, tree validation helpers

#### What We Validate

- Parent-child relationships built correctly
- BSP ordering works (capabilities → features → stories)
- Tree traversal algorithms work
- Summary counts are accurate

#### Minimal Functionality

```typescript
// Build hierarchical tree from flat directory list
buildTree(workItems)
  → {
      capabilities: [
        {
          kind: "capability",
          number: 20,
          children: [
            { kind: "feature", number: 10, children: [...stories] }
          ]
        }
      ],
      summary: { done: 5, inProgress: 2, open: 3 }
    }
```

#### Test Infrastructure

- **Multi-level fixture builder** (capability with nested features/stories)
- **Tree validation helpers** (assert tree structure correct)
- **Summary calculation validators**
- **Ordering verification** (BSP sorting)

#### Success Criteria

- [ ] Tree structure matches directory hierarchy
- [ ] BSP ordering maintained at all levels
- [ ] Summary counts accurate
- [ ] Handles missing children (capability with no features)
- [ ] Performance: <50ms for 50 work items

---

### Feature 65: Output Formatting & Golden File Testing

**Technical Hurdle**: Multiple output formats (JSON, text, markdown, table)
**Risk Level**: ⚠️ Moderate - Rendering logic, format validation
**Test Infrastructure Added**: Golden file testing, output validators

#### What We Validate

- JSON output is valid and parseable
- Text tree renders correctly
- Markdown format is valid
- Table format is readable

#### Minimal Functionality

```typescript
// Format as JSON (for MCP)
formatJSON(tree) → '{"summary":{"done":5},...}'

// Format as text tree
formatText(tree) → `
specs/doing/
├── capability-21_core-cli [DONE]
│   └── feature-10_status [IN_PROGRESS]
`

// Format as markdown
formatMarkdown(tree) → "## Status\n\n- ✅ capability-21_core-cli..."

// Format as table
formatTable(tree) → "| Item | Status | Children |..."
```

#### Test Infrastructure

- **Golden file testing** (snapshot testing for outputs)
- **JSON schema validation**
- **Output format validators** (markdown lint, JSON parse)
- **Diff helpers** for output comparison

#### Success Criteria

- [ ] JSON output parseable by JSON.parse()
- [ ] Text tree visually correct (manual verification)
- [ ] Markdown passes markdown linter
- [ ] Table format renders in terminals
- [ ] Golden files capture expected output
- [ ] Performance: <5ms per format

---

### Feature 76: CLI Integration & E2E Tests

**Technical Hurdle**: Commander.js integration, argument parsing, exit codes
**Risk Level**: ⚠️ Moderate-High - External framework, user interface
**Test Infrastructure Added**: CLI E2E test pattern, command invocation helpers

#### What We Validate

- Commander.js works as expected
- Arguments parsed correctly
- Exit codes correct (0 success, 1 validation error)
- Help text renders
- Unknown commands handled

#### Minimal Functionality

```bash
# Status command with format option
spx status --format json

# Filter by work item
spx status capability-21

# Next command
spx next

# Help
spx --help
```

#### Test Infrastructure

- **CLI invocation helpers** (execa wrappers)
- **Exit code validators**
- **stdout/stderr capture and validation**
- **E2E test pattern** for full command execution

#### Success Criteria

- [ ] All commands work end-to-end
- [ ] Arguments parsed correctly
- [ ] Exit codes match spec (0/1/2)
- [ ] Help text displays
- [ ] Error messages clear and actionable
- [ ] E2E tests run in <1s per command

---

### Feature 87: Performance Optimization & Benchmarking

**Technical Hurdle**: Meet <100ms target for typical repos (~50 work items)
**Risk Level**: 🔴 High - Strict performance requirement
**Test Infrastructure Added**: Performance benchmarking, profiling tools

#### What We Validate

- Current performance baseline
- Bottlenecks identified
- Optimizations effective
- Performance regression testing works

#### Minimal Functionality

```typescript
// Measure performance
const start = Date.now();
const result = await spx.status();
const elapsed = Date.now() - start;

assert(elapsed < 100); // Must be under 100ms
```

#### Test Infrastructure

- **Performance benchmarking suite**
- **Profiling integration** (--prof flag)
- **Performance regression tests** (fail if >100ms)
- **Fixture scaling** (test with 10, 50, 100 work items)

#### Success Criteria

- [ ] <100ms for 50 work items (cold)
- [ ] <50ms for 50 work items (warm, if caching added)
- [ ] Performance tests in CI
- [ ] Bottlenecks documented and addressed
- [ ] No unnecessary file reads

---

## Feature Sequencing Rationale

| Feature | Technical Hurdle                  | Test Infrastructure Built             | Why This Order                                           |
| ------- | --------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| 21      | Pattern matching (pure functions) | Unit test factories                   | Lowest risk, establishes test patterns                   |
| 32      | Directory walking (filesystem)    | Temp directories, integration tests   | Next simplest, proves filesystem operations work         |
| 43      | Status determination (state)      | Status state fixtures (DONE.md, etc.) | Builds on dir walking, adds state logic                  |
| 54      | Tree building (data structures)   | Multi-level fixtures, tree validators | Combines previous features into complex structure        |
| 65      | Output formatting (rendering)     | Golden files, output validators       | Uses tree from Feature 54, adds presentation layer       |
| 76      | CLI integration (framework)       | E2E tests, command invocation         | Combines all previous features into user interface       |
| 87      | Performance (optimization)        | Benchmarking, profiling               | Final validation that everything works at required speed |

---

## Test Infrastructure Progression

```
Feature 21: Unit test factories
  ↓
Feature 32: + Temp directory fixtures
  ↓
Feature 43: + Status state fixtures (DONE.md scenarios)
  ↓
Feature 54: + Multi-level tree fixtures
  ↓
Feature 65: + Golden file testing
  ↓
Feature 76: + E2E CLI tests
  ↓
Feature 87: + Performance benchmarking
  ↓
COMPLETE INTEGRATION TEST SUITE ✅
```

By Feature 87, we have:

- ✅ Unit test factories for all data types
- ✅ Integration tests with real filesystem
- ✅ Complex multi-level fixtures
- ✅ Golden file validation
- ✅ E2E CLI tests
- ✅ Performance regression tests

---

## Success Metrics Per Feature

Each feature must achieve:

1. **Technical Feasibility**: Proves the technical approach works
2. **Test Coverage**: Adds integration test capability
3. **Performance**: Meets speed expectations for that component
4. **Quality**: No compromise on code quality (types, DI, BDD)

---

## Story Sizing Within Features

Each feature will have 3-5 stories:

1. **Setup story**: Test infrastructure, fixtures, scaffolding
2. **Core logic stories**: Implement minimal functionality (1-2 stories)
3. **Edge cases story**: Handle error scenarios, edge cases
4. **Integration story**: Integrate with previous features

This keeps stories small (single session) while building features incrementally.

---

## Questions for Confirmation

1. **Feature ordering**: Does this smallest→largest hurdle sequence make sense?
2. **Test infrastructure**: Is the progressive test capability building the right approach?
3. **Minimal functionality**: Should we truly keep each feature minimal (just enough to validate), or add more completeness?
4. **Performance**: Should Feature 87 be last, or should we measure performance earlier?
5. **MCP server**: Should this be a future capability (Capability 30), or fold into this capability?

---

## Next Steps

Once approved:

1. **Create capability-21_core-cli.capability.md** with E2E test
2. **Create feature-21_pattern-matching/** with integration tests
3. **Begin story decomposition** for Feature 21
4. **Establish test infrastructure** (fixture patterns, helpers)
5. **Start TDD cycle** (write failing tests, implement, graduate)
