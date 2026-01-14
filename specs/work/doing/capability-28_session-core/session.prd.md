# PRD: Session Management CLI

> **Purpose**: Defines the session management domain for SPX CLI, enabling AI agents to manage handoff sessions with <100ms deterministic operations instead of 1-2 minute skill-based workflows.

## Testing Methodology

This PRD follows the three-tier testing methodology for acceptance validation:

- **Level 1 (Unit)**: Component logic with dependency injection. No external systems.
- **Level 2 (Integration)**: Real infrastructure via test harnesses. No mocking.
- **Level 3 (E2E)**: Real credentials and services. Full user workflows validating measurable outcome.

Before implementation, agents MUST consult:

- `/testing` - Foundational principles, decision protocol, anti-patterns
- `/testing-typescript` - Language-specific patterns and fixtures

## Product Vision

### User Problem

**Who** are we building for? AI agents (Claude Code instances) that manage multiple projects and need to preserve context across sessions.

**What** problem do they face?

```
As an AI agent, I am frustrated by slow session management operations
because /pickup and /handoff skills take 1-2 minutes to execute,
which prevents me from quickly switching between tasks and preserving context.
```

### Current Customer Pain

- **Symptom**: Agents wait 60-120 seconds for skill-based session operations
- **Root Cause**: Skills execute in LLM context, processing markdown instructions and making multiple file reads
- **Customer Impact**: Context switches are slow; agents may skip handoffs to save time
- **Business Impact**: Lost context leads to duplicated work and inconsistent progress

### Customer Solution

```
Implement spx session CLI domain that enables AI agents to manage sessions
through fast, deterministic CLI commands, resulting in <100ms operations
and higher adoption of session preservation practices.
```

### Customer Journey Context

- **Before**: Agent runs `/handoff` skill (60-120s), parses markdown, writes files manually
- **During**: Agent learns `spx session` commands, adopts CLI-first workflow
- **After**: Agent uses `spx session create`, `spx session pickup` in <100ms each

### User Assumptions

| Assumption Category | Specific Assumption                                     | Impact on Product Design                    |
| ------------------- | ------------------------------------------------------- | ------------------------------------------- |
| User Context        | Agent runs in Claude Code environment with shell access | Commands must work via Bash tool            |
| User Goals          | Wants fast context preservation without manual file ops | Auto-injection reduces follow-up file reads |
| User Workflow       | Creates handoffs before context switches                | `create` command accepts stdin from skill   |

## Expected Outcome

### Measurable Outcome

```
Users will manage sessions via CLI leading to 95% reduction in session operation time
(from 60-120s to <100ms) and 50% increase in handoff adoption,
proven by operation timing benchmarks and session file creation frequency.
```

### Evidence of Success

| Metric                   | Current | Target | Improvement                            |
| ------------------------ | ------- | ------ | -------------------------------------- |
| Session operation time   | 60-120s | <100ms | 95%+ reduction in wait time            |
| Handoff adoption         | ~50%    | ~75%   | More agents preserve context           |
| Context restoration time | 2-3 min | <30s   | Auto-injection eliminates manual reads |

## Acceptance Tests

### Complete User Journey Test

```typescript
// tests/e2e/session.e2e.test.ts
describe("Capability: Session Management", () => {
  test("agent creates, lists, and picks up session in under 500ms total", async () => {
    const startTime = Date.now();

    // Create session
    const createResult = await exec("spx session create --stdin", {
      input: sessionContent,
    });
    expect(createResult.exitCode).toBe(0);
    const sessionId = createResult.stdout.match(/Created: (.+)/)?.[1];

    // List sessions
    const listResult = await exec("spx session list");
    expect(listResult.stdout).toContain(sessionId);
    expect(listResult.stdout).toContain("todo");

    // Pickup session
    const pickupResult = await exec(`spx session pickup ${sessionId}`);
    expect(pickupResult.exitCode).toBe(0);
    expect(pickupResult.stdout).toContain("Session claimed");

    // Verify timing
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(500); // All 3 operations under 500ms
  });
});
```

### User Scenarios (Gherkin Format)

```gherkin
Feature: Session Management CLI

  Scenario: Agent creates and retrieves session
    Given an AI agent with context to preserve
    When the agent runs "spx session create --stdin" with session content
    Then a new session file is created in todo directory
    And the session ID is returned to stdout
    And the operation completes in under 100ms

  Scenario: Agent picks up highest priority session
    Given multiple TODO sessions with different priorities
    When the agent runs "spx session pickup --auto"
    Then the highest priority session is claimed
    And the session moves to doing directory
    And auto-injected file contents are printed to stdout

  Scenario: Agent handles missing session gracefully
    Given no session with ID "nonexistent" exists
    When the agent runs "spx session pickup nonexistent"
    Then an error message indicates session not found
    And the exit code is non-zero
```

### Scenario Detail (Given/When/Then)

**Scenario: Agent completes full session lifecycle**

- **Given** Agent has work context to preserve, `.spx/sessions/` directories exist
- **When** Agent runs `spx session create --stdin` piping session markdown
- **Then** Session file created in `todo/` with timestamp ID, confirmation printed

**Scenario: Agent picks up session with auto-injection**

- **Given** Session exists with `specs:` and `files:` in YAML front matter
- **When** Agent runs `spx session pickup <id>`
- **Then** Session moved to `doing/`, content printed, listed files injected to stdout

**Scenario: Agent releases session back to todo**

- **Given** Agent has claimed session in `doing/` directory
- **When** Agent runs `spx session release`
- **Then** Session moved back to `todo/`, available for other agents

## Scope Definition

### What's Included

- ✅ `spx session list` - List sessions with status, priority, timestamp, branch
- ✅ `spx session show <id>` - Display session content without claiming
- ✅ `spx session pickup [id]` - Atomically claim session, output with auto-injection
- ✅ `spx session create --stdin` - Create session from piped content
- ✅ `spx session release` - Release current session back to todo
- ✅ `spx session prune [--keep N]` - Delete old TODO sessions (default: keep 5)
- ✅ `spx session archive [pattern]` - Move sessions to archive directory
- ✅ `spx session delete <id>` - Remove specific session

### What's Explicitly Excluded

| Excluded Capability                 | Rationale                                                        |
| ----------------------------------- | ---------------------------------------------------------------- |
| Session content generation          | Skill captures conversation context; CLI handles file operations |
| Cross-project session sharing       | Adds complexity; sessions are project-local                      |
| Real-time session sync              | Over-engineering for local-first tool                            |
| Session merging/conflict resolution | Out of scope; one agent per session                              |

### Scope Boundaries Rationale

This release focuses on fast, deterministic file operations. Content generation remains in skills (which have conversation context). The CLI provides the "plumbing" that skills invoke for actual file I/O.

## Product Approach

### Interaction Model

- **Interface Type**: CLI commands under `spx session` namespace
- **Invocation Pattern**: `spx session <command> [args] [flags]`
- **User Mental Model**: "Like git stash but for AI conversation context"

### User Experience Principles

1. **Fast by default**: Every command completes in <100ms
2. **Fail loudly**: Clear error messages with actionable guidance
3. **Composable**: Commands work with pipes and scripts
4. **Discoverable**: `spx session --help` shows all commands

### High-Level Technical Approach

**Data Model:**

- Sessions are markdown files with YAML front matter
- Status determined by directory location (`todo/`, `doing/`, `archive/`)
- ⚠️ **ADR**: [Session Directory Structure](decisions/adr-21_session-directory-structure.md)

**Key Capabilities:**

- Atomic claiming via filesystem rename
- ⚠️ **ADR**: [Atomic Session Claiming](decisions/adr-43_atomic-claiming.md)
- Auto-injection of files listed in YAML front matter
- ⚠️ **ADR**: [Session Auto-Injection](decisions/adr-54_auto-injection.md)

**Integration Points:**

- Config integration: `sessions.todo_dir`, `sessions.doing_dir`, `sessions.archive_dir`
- Footer summary in `spx spec status`: "Sessions: N todo, M doing"

### Technical Assumptions

- **Architecture Assumption**: SPX multi-domain CLI model (`spx <domain> <command>`)
- **Performance Assumption**: <100ms achievable with synchronous fs operations
- **Integration Assumption**: Skills can pipe content to `spx session create --stdin`

## Success Criteria

### User Outcomes

| Outcome                       | Success Indicator                                           |
| ----------------------------- | ----------------------------------------------------------- |
| Agents adopt CLI for sessions | >80% of session operations use CLI, not manual file ops     |
| Context switches are fast     | Agents complete pickup in <1s including auto-injection read |
| Handoff adoption increases    | Session creation frequency increases after CLI deployment   |

### Quality Attributes

| Attribute       | Target                                   | Measurement Approach                     |
| --------------- | ---------------------------------------- | ---------------------------------------- |
| **Speed**       | <100ms for any command                   | Benchmark suite in CI                    |
| **Reliability** | Atomic claiming prevents race conditions | Integration tests with concurrent claims |
| **Usability**   | Zero config for basic operations         | Test with fresh project, no setup        |
| **Clarity**     | Clear error messages                     | Review all error paths have guidance     |

### Definition of "Done"

1. All 8 commands implemented and tested
2. Complete user journey E2E test passes
3. All commands complete in <100ms (benchmarked)
4. Error cases handled gracefully
5. `spx session --help` documents all commands

## Open Decisions

### Questions Requiring User Input

None identified - all major decisions resolved.

### Decisions Triggering ADRs

| Decision Topic      | Key Question                         | ADR                                                       |
| ------------------- | ------------------------------------ | --------------------------------------------------------- |
| Directory structure | Subdirectories vs. filename prefixes | [adr-21](decisions/adr-21_session-directory-structure.md) |
| Timestamp format    | Readable vs. ISO 8601                | [adr-32](decisions/adr-32_timestamp-format.md)            |
| Atomic claiming     | How to prevent race conditions       | [adr-43](decisions/adr-43_atomic-claiming.md)             |
| Auto-injection      | How to load context files            | [adr-54](decisions/adr-54_auto-injection.md)              |

### Product Trade-offs

| Trade-off          | Option A          | Option B        | Decision          |
| ------------------ | ----------------- | --------------- | ----------------- |
| Injection behavior | Print to stdout   | Metadata only   | Print to stdout   |
| Missing files      | Warn and continue | Fail hard       | Warn and continue |
| Priority sorting   | Priority-first    | Timestamp-first | Priority-first    |

## Dependencies

### Work Item Dependencies

| Dependency              | Status      | Rationale                               |
| ----------------------- | ----------- | --------------------------------------- |
| SPX multi-domain router | Complete    | Enables `spx session` command namespace |
| Config system           | In Progress | Provides `sessions.*` config keys       |

### Technical Dependencies

| Dependency   | Version/Constraint | Purpose                   | Availability        |
| ------------ | ------------------ | ------------------------- | ------------------- |
| Node.js      | >=18.0.0           | Runtime                   | Assumed available   |
| yaml         | ^2.0.0             | YAML front matter parsing | npm dependency      |
| Commander.js | ^12.0.0            | CLI framework             | Existing dependency |

### Performance Requirements

| Requirement Area    | Target                           | Measurement Approach        |
| ------------------- | -------------------------------- | --------------------------- |
| **Command latency** | <100ms for all commands          | Benchmark in CI             |
| **Cold start**      | <200ms including Node.js startup | Full CLI invocation timing  |
| **File injection**  | <500ms for 10 files              | Test with realistic session |

## Pre-Mortem Analysis

### Assumption: Agents will adopt CLI over manual file operations

- **Likelihood**: Medium - requires skill updates to call CLI
- **Impact**: High - low adoption means wasted effort
- **Mitigation**: Update /handoff skill to use `spx session create --stdin`

### Assumption: <100ms is achievable for all operations

- **Likelihood**: Low (likely achievable) - fs operations are fast
- **Impact**: Medium - slower ops reduce value proposition
- **Mitigation**: Benchmark during development; optimize hot paths if needed

### Assumption: Auto-injection improves agent productivity

- **Likelihood**: Medium - depends on file sizes and relevance
- **Impact**: Medium - unnecessary injection wastes tokens
- **Mitigation**: Add `--no-inject` flag; document when to skip

### Assumption: Subdirectory structure is cleaner than prefixes

- **Likelihood**: High (confident) - proven simpler in design
- **Impact**: Low - migration is one-time
- **Mitigation**: Provide migration command or auto-detect legacy format
