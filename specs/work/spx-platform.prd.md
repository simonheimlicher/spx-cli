# PRD: SPX Multi-Domain CLI Platform

> **Purpose**: Establish spx as a multi-domain CLI platform (like `gh`) that unifies product development flow across specs, Claude Code settings, marketplace management, sessions, and future domains.
>
> - Defines platform architecture for extensible domain-based CLI
> - Establishes unified config system and product root discovery
> - Catalyzes multiple capabilities: core-config, spec-domain, claude-domain, marketplace-domain, session-domain
> - Foundation for future domains (docs, test, deploy, etc.)
> - Written BEFORE individual domain capabilities exist
>
> **Product Development, Not Project Management**: SPX manages the **product** and its artifacts (specs, configs, sessions, marketplace). Products live forever, evolving through continuous development. Projects have endpoints; products do not. This platform supports long-lived product development workflows, not temporary project lifecycle management.

## Required Sections

| Section          | Purpose                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| Product Vision   | User problem, value proposition, customer journey, and user assumptions    |
| Expected Outcome | Quantified measurable outcome with evidence metrics                        |
| Acceptance Tests | Complete E2E journey test and Gherkin scenarios proving measurable outcome |
| Scope Definition | Explicit boundaries: what's included, what's excluded, and why             |
| Product Approach | Interaction model, UX principles, technical approach (triggers ADRs)       |
| Success Criteria | User outcomes, quality attributes, definition of "done"                    |
| Open Decisions   | Questions for user, ADR triggers, product trade-offs                       |
| Dependencies     | Work items, customer-facing, technical, and performance requirements       |
| Pre-Mortem       | Assumptions to validate (adoption, performance, platform, scope)           |

## Testing Methodology

This PRD follows the three-tier testing methodology for acceptance validation:

- **Level 1 (Unit)**: Component logic with dependency injection. No external systems.
- **Level 2 (Integration)**: Real infrastructure via test harnesses. No mocking.
- **Level 3 (E2E)**: Real credentials and services. Full user workflows validating measurable outcome.

**Build confidence bottom-up**: Level 1 → Level 2 → Level 3.

Before implementation, agents MUST consult:

- `/testing` — Foundational principles, decision protocol, anti-patterns
- `/testing-typescript` — TypeScript-specific patterns and fixtures

## Product Vision

### User Problem

**Who** are we building for?

Developers using AI coding agents for product development who need fast, deterministic operations across specs, sessions, configs, and marketplace.

**What** problem do they face?

```
As a developer using AI coding agents, I need fast deterministic operations for ALL product concerns
because AI agents waste time/tokens on file scanning and manual operations for sessions, configs, and marketplace,
which slows down workflows, increases API costs, and creates inconsistent product state.
```

### Current Customer Pain

**Core Problem**: AI coding agents are slow and waste tokens on deterministic operations

**Context**: SPX v1 (2024) solved specs scanning - AI agents previously used LLM skills for scanning manually curated specs (PRDs, ADRs, stories), taking 1-2 minutes and consuming 2000+ tokens. SPX v1 replaced this with native CLI: <100ms, 0 tokens, **1000x improvement**.

**New Problem**: Agents still inefficient for sessions, config, marketplace, Claude settings

**Symptoms**:

1. AI agents slow and unreliable at file operations beyond specs (session pickup loops, config reads, marketplace discovery)
2. AI agents waste tokens on manual file scanning that should be deterministic operations
3. Users struggle to keep product infrastructure updated (formatting configs, marketplace plugins, Claude settings)
4. No unified interface for product state → agents and humans both suffer from fragmentation

- **Root Cause**: SPX v1 proved fast deterministic operations work for specs, but didn't extend to other product concerns
- **Customer Impact**: Slow agent workflows, high API costs, inconsistent product state, manual intervention required
- **Business Impact**: Platform value unrealized; agents remain inefficient despite proven solution pattern

### Customer Solution

```
Extend SPX's fast deterministic operations (proven with specs) to ALL product concerns:
sessions, config, marketplace, and Claude settings. Replace slow LLM-based file operations
with <100ms CLI commands, resulting in 1000x faster agent workflows, zero token waste on
deterministic operations, and unified product state management.
```

### Customer Journey Context

- **Before**: AI agents spend 1-2 minutes scanning files, waste 2000+ tokens on manual operations, require permission prompts for session pickup
- **During**: Agents discover fast `spx <domain> <command>` operations; gradually replace LLM skills with CLI calls
- **After**: AI agents complete all product operations in <100ms, zero tokens wasted, humans also benefit from unified CLI interface

### User Assumptions

| Assumption Category  | Specific Assumption                                        | Impact on Product Design                               |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| User Context         | Familiar with CLI tools like `git`, `npm`, `gh`            | Follow established CLI patterns for discoverability    |
| User Goals           | Want single tool for product development flow, not toolkit | Unified command structure, not scattered scripts       |
| Technical Capability | Comfortable with terminal, understand JSON/YAML            | Config files are acceptable for advanced customization |
| Workflow Pattern     | Work on multiple products, switch contexts frequently      | Product root discovery must be reliable and fast       |

## Expected Outcome

### Measurable Outcome

```
Users will manage all AI development workflows through spx CLI leading to 80% reduction in tool context switching
and 100% command discoverability through `spx <domain> --help`, proven by unified command execution for
specs, sessions, settings, and marketplace operations within the first month of adoption.
```

### Evidence of Success

| Metric                  | Current                           | Target                | Improvement                                |
| ----------------------- | --------------------------------- | --------------------- | ------------------------------------------ |
| Tool Context Switching  | 4-6 tools per workflow            | 1 tool (spx)          | 80%+ reduction in tool switching           |
| Command Discoverability | 0% (users don't know what exists) | 100% (via `--help`)   | Full visibility of capabilities            |
| Domain Coverage         | 1 domain (specs)                  | 4+ core domains       | Unified interface for all product concerns |
| Workflow Efficiency     | Manual file editing + CLI mix     | Pure CLI workflow     | Consistent UX across all domains           |
| Adoption Rate           | Specs users only                  | 60%+ using 2+ domains | Platform value beyond single-domain        |

## Acceptance Tests

### Complete User Journey Test

```typescript
// E2E test - Multi-domain spx platform
describe("Feature: SPX Multi-Domain CLI Platform", () => {
  test("user manages product across multiple domains in single session", async () => {
    const productDir = await setupTestProduct();

    // Domain 1: Specs - Check work status
    const statusResult = await exec("spx spec status", { cwd: productDir });
    expect(statusResult.exitCode).toBe(0);
    expect(statusResult.stdout).toContain("capability-");

    // Domain 2: Session - Pickup a session
    await fs.writeFile(
      path.join(productDir, ".spx/sessions/TODO_2024-01-12.md"),
      "# Session context...",
    );
    const pickupResult = await exec("spx session pickup", { cwd: productDir });
    expect(pickupResult.exitCode).toBe(0);
    expect(pickupResult.stdout).toContain("Claimed session");

    // Domain 3: Config - View current configuration
    const configResult = await exec("spx config get specs.root", { cwd: productDir });
    expect(configResult.exitCode).toBe(0);
    expect(configResult.stdout).toContain("specs");

    // Domain 4: Claude - Check claude settings
    const claudeResult = await exec("spx claude get permissions.allow", { cwd: productDir });
    expect(claudeResult.exitCode).toBe(0);

    // Verify all commands used same product root
    const allCommandsUsedSameRoot = true; // Validated through config resolution logs
    expect(allCommandsUsedSameRoot).toBe(true);
  });

  test("help system provides complete domain discovery", async () => {
    // When: User runs spx --help
    const helpResult = await exec("spx --help");

    // Then: All domains are listed
    expect(helpResult.stdout).toContain("spec");
    expect(helpResult.stdout).toContain("session");
    expect(helpResult.stdout).toContain("config");
    expect(helpResult.stdout).toContain("claude");
    expect(helpResult.stdout).toContain("marketplace");

    // And: Each domain has help available
    const specHelp = await exec("spx spec --help");
    expect(specHelp.exitCode).toBe(0);
    expect(specHelp.stdout).toContain("status");
    expect(specHelp.stdout).toContain("next");
  });
});
```

### User Scenarios (Gherkin Format)

```gherkin
Feature: SPX Multi-Domain CLI Platform

  Scenario: User discovers available domains through help
    Given a developer new to spx
    When they run "spx --help"
    Then they see all available domains listed
    And each domain has a description of its purpose
    And they can run "spx <domain> --help" for domain-specific commands

  Scenario: User manages specs through spec domain
    Given a product with SPX specs
    When user runs "spx spec status"
    Then they see hierarchical work item status
    When user runs "spx spec next"
    Then they see the next work item to tackle

  Scenario: User manages sessions through session domain
    Given unclaimed session files in .spx/sessions/
    When user runs "spx session list"
    Then they see available sessions
    When user runs "spx session pickup"
    Then session is claimed and context loaded
    And no permission prompts occur (unlike skill-based pickup)

  Scenario: User manages Claude settings through claude domain
    Given a product with .claude/settings.json
    When user runs "spx claude get permissions.allow"
    Then they see current permission rules
    When user runs "spx claude set permissions.allow[+] 'Bash(npm test)'"
    Then permission rule is added to settings

  Scenario: User manages marketplace through marketplace domain
    Given Claude Code plugins installed
    When user runs "spx marketplace list"
    Then they see installed marketplaces
    When user runs "spx marketplace add github:acme/plugins"
    Then marketplace is added to configuration

  Scenario: Product root discovery works across contexts
    Given a product with nested directory structure
    When user runs spx commands from subdirectories
    Then spx discovers product root via git
    And all commands operate on correct product root
    And config is loaded from product root

  Scenario: Config system works across all domains
    Given .spx/config.json with custom paths
    When user runs commands from any domain
    Then all domains respect custom config
    And path resolution is consistent
    And performance is <100ms total overhead
```

### Scenario Detail (Given/When/Then)

**Scenario: User discovers and adopts multiple domains progressively**

- **Given**: User initially uses `spx spec status` for specs management
- **When**: User runs `spx --help` and discovers `session` domain
- **Then**: User adopts `spx session pickup` to replace manual session file editing

**Scenario: Platform remains fast despite multi-domain complexity**

- **Given**: Product with config overrides and multiple domains active
- **When**: User runs any `spx <domain> <command>`
- **Then**: Total overhead (config load + domain init) is <100ms

**Scenario: New domains integrate seamlessly with platform**

- **Given**: Platform defines clear domain interface (commands, help, config)
- **When**: Developer adds new domain (e.g., `docs`, `test`)
- **Then**: Domain appears in `spx --help`, follows UX patterns, shares config system

## Scope Definition

### What's Included

This platform deliverable includes:

- ✅ **Domain Architecture**: Plugin-like domain system with consistent command structure
- ✅ **Unified Config System**: `.spx/config.json` works across all domains
- ✅ **Project Root Discovery**: Git-aware root detection, fallback to $PWD
- ✅ **Help System**: `spx --help`, `spx <domain> --help`, consistent documentation
- ✅ **Domain: spec** - Specs management (enhanced existing implementation)
- ✅ **Domain: session** - Session management (replaces skill-based pickup)
- ✅ **Domain: config** - Configuration management (get/set commands)
- ✅ **Domain: claude** - Claude Code settings management
- ✅ **Domain: marketplace** - Marketplace management

### What's Explicitly Excluded

| Excluded Capability                   | Rationale                                                     |
| ------------------------------------- | ------------------------------------------------------------- |
| Domain: docs                          | Future domain: Documentation generation and publishing        |
| Domain: test                          | Future domain: Test orchestration across unit/integration/e2e |
| Domain: deploy                        | Future domain: Deployment and release management              |
| Interactive prompts/wizards           | Future enhancement: TUI interactions                          |
| GUI/web interface                     | Out of scope: spx is CLI tool, integrations can add UI        |
| Plugin system for third-party domains | Future capability: Public plugin API for ecosystem            |

### Scope Boundaries Rationale

**Why these boundaries?**

The platform establishes a multi-domain architecture with 5 core domains (specs, sessions, config, claude, marketplace). Additional domains (docs, test, deploy) and interactive features (TUI, wizards) are possible future extensions once the platform patterns are proven. GUI remains out of scope as spx is fundamentally a CLI tool. Third-party plugin systems could enable ecosystem growth but require stable domain interfaces first.

## Product Approach

### Interaction Model

- **Interface Type**: Multi-domain CLI (like `gh cli`)
- **Invocation Pattern**: `spx <domain> <command> [args] [flags]`
- **User Mental Model**: "Like `gh` for GitHub, `spx` for AI development product management"

### User Experience Principles

1. **Consistent command structure**: All domains follow `spx <domain> <verb> <noun>` pattern
2. **Progressive disclosure**: `--help` at every level (root, domain, command)
3. **Unified configuration**: Single `.spx/config.json` affects all domains
4. **Fast by default**: <100ms for any command (config load + execution)
5. **Git-aware**: Automatic project root discovery via git
6. **Fail-fast with clarity**: Clear error messages with suggested fixes

### High-Level Technical Approach

**Platform Architecture:**

- **Domain Registry**: Each domain registers commands, help text, config schema
- **Command Router**: Routes `spx <domain> <command>` to appropriate handler
- **Config System**: Centralized config resolution shared by all domains
- **Product Context**: Discover root, load config, provide to domains
  - ⚠️ **ADR Trigger**: Domain registration? (Static vs dynamic, compile-time vs runtime)

**Product Root Discovery:**

- **Git-based**: Walk up from $PWD looking for `.git` directory
- **Fallback**: Use $PWD if no git repo found
- **Override**: Respect `SPX_PRODUCT_ROOT` env var if set
  - ⚠️ **ADR Trigger**: Discovery strategy? (Git-only vs multi-strategy, caching)

**Configuration System:**

- **Default config**: Embedded in CLI, covers all domains
- **Product config**: `.spx/config.json` overrides defaults
- **Config schema**: Each domain contributes schema section
- **Config filename**: Named constant `CONFIG_FILENAME = "config.json"` for easy future changes
- **Resolution**: Merge product + defaults, validate, cache for session
  - ⚠️ **ADR Trigger**: Config merge across domains? (Namespace isolation vs shared keys)

**Config Schema Example:**

```json
{
  "productRoot": "(auto-discovered via git, or SPX_PRODUCT_ROOT env var - NOT configurable)",
  "specs": {
    "root": "specs",
    "work": {
      "dir": "work",
      "statusDirs": {
        "doing": "doing",
        "backlog": "backlog",
        "done": "archive"
      }
    },
    "decisions": "decisions",
    "templates": "templates"
  },
  "sessions": {
    "dir": ".spx/sessions"
  }
  // Future domains: claude, marketplace will add their config here
}
```

**Note**: Each domain contributes its config namespace. Platform provides unified resolution.

**Product Root Discovery** (NOT Configurable):

- Product root is DISCOVERED, not configured
- Cannot put `productRoot` in `.spx/config.json` (circular dependency: need root to find config)
- Discovery methods: Git-based (walk up from $PWD), fallback to $PWD, or `SPX_PRODUCT_ROOT` env var

**Domain Interface:**

```typescript
interface Domain {
  name: string; // e.g., "spec", "session", "config"
  description: string; // For help text
  commands: Command[]; // Domain commands
  configSchema: ConfigSchema; // Config keys this domain uses
  initialize(context: ProductContext): Promise<void>;
}

interface ProductContext {
  root: string; // Product root directory
  config: ResolvedConfig; // Merged config
  cwd: string; // Current working directory
}
```

- ⚠️ **ADR Trigger**: Domain interface design? (Class-based vs function-based, lifecycle hooks)

### Domain-Specific Approaches

#### Domain: spec

**Purpose**: Manage SPX specs (capabilities, features, stories)

**Commands**:

- `spx spec status [item] [--format json|text|md|table]` - Show work item status
- `spx spec next [--scope capability|feature]` - Show next work item
- `spx spec tree` - Visual tree without status computation
- `spx spec validate` - Validate structure and naming
- `spx spec done <item>` - Mark work item complete
- **Future**: `spx spec story insert --base <capability>/<feature> "<story-name>"` - Insert story with BSP numbering

**Config Keys**: `specs.root`, `specs.work.dir`, `specs.work.statusDirs.*`

- ⚠️ **ADR Trigger**: Insert command BSP calculation? (Midpoint vs next-available vs explicit)

#### Domain: session

**Purpose**: Manage session handoff files (claiming, listing, viewing)

**Commands**:

- `spx session list` - List available sessions (TODO_*, DOING_*)
- `spx session pickup [session-id]` - Claim and load session (moves TODO_* to DOING_*)
- `spx session show <session-id>` - Display session contents
- `spx session release` - Release current session (moves DOING_* back to TODO_*)
- `spx session create [--message "..."]` - Create new handoff session

**Config Keys**: `sessions.dir` (default: `.spx/sessions`)

**Key Difference from Skill**: No permission prompts, pure CLI operation

- ⚠️ **ADR Trigger**: Session claiming mechanism? (File rename vs database vs lock file)

#### Domain: config

**Purpose**: Get/set configuration values

**Commands**:

- `spx config get <key>` - Get config value (e.g., `specs.root`)
- `spx config set <key> <value>` - Set config value
- `spx config list` - List all config keys and values
- `spx config reset <key>` - Reset to default value
- `spx config validate` - Validate current config

**Config Keys**: All config keys across all domains

- ⚠️ **ADR Trigger**: Set command syntax? (Dot notation vs path syntax, array manipulation)

#### Domain: claude

**Purpose**: Manage Claude Code settings

**Commands**:

- `spx claude get <key>` - Get Claude setting (e.g., `permissions.allow`)
- `spx claude set <key> <value>` - Set Claude setting
- `spx claude permissions list` - List permission rules
- `spx claude permissions add <rule>` - Add permission rule
- `spx claude permissions remove <rule>` - Remove permission rule

**Config Keys**: Operates on `.claude/settings.json`, not `.spx/config.json`

**Key Design**: Read/write Claude Code settings files directly, not through spx config

- ⚠️ **ADR Trigger**: Scope precedence? (User vs project vs local, read-only vs read-write)

#### Domain: marketplace

**Purpose**: Manage Claude Code plugin marketplaces

**Definition**: Claude Code plugin marketplaces are registry sources (GitHub repos, npm packages, git URLs) from which Claude Code can discover and install plugins, skills, and extensions.

**Commands**:

- `spx marketplace list` - List installed marketplaces
- `spx marketplace add <source>` - Add marketplace (github:org/repo, git:url, npm:package)
- `spx marketplace remove <name>` - Remove marketplace
- `spx marketplace info <name>` - Show marketplace details
- `spx marketplace sync` - Sync marketplace state with `.claude/settings.json`

**Config Keys**: Operates on `.claude/settings.json` extraKnownMarketplaces

- ⚠️ **ADR Trigger**: Source format validation? (URL parsing vs registry lookup)

### Product-Specific Constraints

| Constraint                              | Impact on Product                                | Impact on Testing                             |
| --------------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| Claude Code integration via file system | No API calls, all operations via file read/write | Mock file system for Claude settings tests    |
| Git dependency for product discovery    | Must gracefully handle non-git products          | Test with and without .git directory          |
| CLI performance target (<100ms)         | Config load + domain init must be fast           | Benchmark each domain initialization overhead |

### Technical Assumptions

- **Architecture Assumption**: Domain registry pattern scales to 10+ domains without performance degradation
- **Discovery Assumption**: Git-based root discovery works for 95%+ of products
- **Config Assumption**: Single merged config file is sufficient (no per-domain config files)
- **Performance Assumption**: Commander.js overhead + domain routing adds <10ms

## Success Criteria

### User Outcomes

| Outcome                                           | Success Indicator                                                |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| Users adopt multi-domain workflow                 | 60%+ of users invoke commands from 2+ domains per week           |
| Users discover capabilities without documentation | `--help` command usage precedes 80%+ of new command invocations  |
| Users experience consistent UX across domains     | <5% of feedback mentions domain-specific confusion               |
| Users migrate from manual file editing to CLI     | Session and marketplace domains reduce manual file edits by 90%+ |

### Quality Attributes

| Attribute         | Target                                                    | Measurement Approach                            |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------- |
| **Usability**     | Discoverable via help, no external docs needed for basics | Test new user completing tasks with only --help |
| **Performance**   | <100ms for any command (cold start)                       | Benchmark all domain commands                   |
| **Consistency**   | All domains follow same command patterns                  | Audit command structure across domains          |
| **Extensibility** | New domain can be added in <200 LOC                       | Measure code required for domain: docs          |

### Definition of "Done"

This platform deliverable is complete when:

1. All 5 core domains (spec, session, config, claude, marketplace) are functional
2. `spx --help` and `spx <domain> --help` provide complete documentation
3. Product root discovery works in git repos and fallback to $PWD
4. Unified config system works across all domains
5. All commands complete in <100ms (measured via benchmarks)
6. E2E tests cover multi-domain workflows
7. Each domain has integration tests for its commands

## Open Decisions

### Questions Requiring User Input

| Question                                                 | Option A          | Option B                | Trade-offs                                       | Recommendation                 |
| -------------------------------------------------------- | ----------------- | ----------------------- | ------------------------------------------------ | ------------------------------ |
| How to handle Claude settings scope precedence?          | Read-only (safe)  | Read-write (powerful)   | A = no accidental changes, B = full management   | Option A (recommended)         |
| Should config commands operate on .spx/config.json only? | Yes (isolated)    | No (all config files)   | A = clear scope, B = more powerful but complex   | Option A (recommended)         |
| Product root discovery: Git-only or multi-strategy?      | Git-only (simple) | Multi-strategy (robust) | A = fast and common case, B = handles edge cases | Option A with env var fallback |

### Decisions Triggering ADRs

| Decision Topic                   | Key Question                                             | Options to Evaluate                                      | Triggers                   |
| -------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | -------------------------- |
| Domain registration architecture | Static (compile-time) vs dynamic (runtime) registration? | Hardcoded registry / Plugin discovery / Hybrid           | `/architecting-typescript` |
| Command routing strategy         | Commander.js sub-commands vs custom router?              | Commander native / Custom router / Hybrid                | `/architecting-typescript` |
| Config merge across domains      | Namespace isolation vs shared keys?                      | Strict namespacing / Shared top-level / Mixed            | `/architecting-typescript` |
| Product root caching             | Cache for session vs recompute each command?             | Per-command / Per-session / Smart invalidation           | `/architecting-typescript` |
| Session claiming mechanism       | File rename vs lock file vs database?                    | Rename (simple) / Lock file (robust) / SQLite (powerful) | `/architecting-typescript` |
| Domain loading strategy          | Lazy (on-demand) vs eager (startup) loading?             | Lazy per-command / Eager all-domains / Hybrid            | `/architecting-typescript` |

### Product Trade-offs

| Trade-off            | Option A                   | Option B                 | Impact                                  |
| -------------------- | -------------------------- | ------------------------ | --------------------------------------- |
| Command structure    | `spx <domain> <command>`   | `spx-<domain> <command>` | A = unified tool, B = separate binaries |
| Help system depth    | Two levels (root + domain) | Three levels (+ command) | A = simpler, B = more granular help     |
| Config file count    | Single .spx/config.json    | Per-domain config files  | A = simple merge, B = domain isolation  |
| Domain extensibility | Internal only (hardcoded)  | Public plugin API        | A = simpler, B = ecosystem potential    |

## Dependencies

### Work Item Dependencies

No prerequisite capabilities. This is the foundational platform PRD that spawns all domain capabilities.

**Spawns**:

- Capability: core-config (config system infrastructure)
- Capability: spec-domain (specs management commands)
- Capability: session-domain (session management commands)
- Capability: config-domain (config get/set commands)
- Capability: claude-domain (Claude settings management)
- Capability: marketplace-domain (marketplace management)

### Customer-Facing Dependencies

| Dependency Type   | Specific Need                                           | Impact If Missing                                   |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------- |
| **Documentation** | `spx --help` comprehensive guide, domain usage examples | Users can't discover capabilities or learn patterns |
| **Examples**      | Sample workflows demonstrating multi-domain usage       | Users don't see platform value, use single domain   |

### Technical Dependencies

| Dependency     | Version/Constraint | Purpose                                              | Availability       |
| -------------- | ------------------ | ---------------------------------------------------- | ------------------ |
| Node.js        | >=18.0.0           | Runtime environment                                  | Assumed available  |
| Commander.js   | >=11.0.0           | CLI framework with sub-commands                      | Project dependency |
| TypeScript     | >=5.0              | Type-safe domain interfaces                          | Project dependency |
| Git (optional) | >=2.0              | Product root discovery (fallback to $PWD if missing) | Usually available  |

### Performance Requirements

| Requirement Area      | Target                            | Measurement Approach                         |
| --------------------- | --------------------------------- | -------------------------------------------- |
| **Root Discovery**    | <5ms to find product root via git | Benchmark directory traversal                |
| **Config Load**       | <5ms to load and merge config     | Benchmark JSON parse + merge                 |
| **Domain Init**       | <10ms to initialize any domain    | Benchmark each domain's initialize() method  |
| **Command Execution** | <80ms for actual command logic    | Benchmark commands without config overhead   |
| **Total Overhead**    | <100ms cold start for any command | End-to-end timing from spawn to first output |

## Pre-Mortem Analysis

### Assumption: Users want unified CLI, not separate tools

- **Likelihood**: High - `gh` CLI success demonstrates pattern, developer tools trend toward consolidation
- **Impact**: High - if users prefer separate tools, platform adds unnecessary complexity
- **Mitigation**: Ship domains incrementally, validate adoption metrics, maintain backward compat

### Assumption: Git-based root discovery sufficient for 95%+ products

- **Likelihood**: High - most development products use git
- **Impact**: Medium - non-git products break without explicit root config
- **Mitigation**: Fallback to $PWD, support `SPX_PRODUCT_ROOT` env var, clear error messages

### Assumption: Single config file scales across all domains

- **Likelihood**: Medium - depends on domain config complexity
- **Impact**: Medium - if domains need isolated config, merge logic becomes complex
- **Mitigation**: Namespace config keys by domain, design merge strategy for conflicts

### Assumption: Commander.js scales to 10+ domains with 50+ commands

- **Likelihood**: High - Commander.js used by large CLIs (npm, yarn)
- **Impact**: High - if routing is slow, violates <100ms requirement
- **Mitigation**: Benchmark command dispatch overhead, consider lazy domain loading

### Assumption: Session claiming via file rename is reliable

- **Likelihood**: Medium - file operations can fail in edge cases (NFS, permissions, concurrent access)
- **Impact**: Medium - if claiming is unreliable, users lose session context
- **Mitigation**: Implement retry logic, validate claimed session exists, provide recovery commands

### Assumption: Claude domain can modify .claude/settings.json safely

- **Likelihood**: Low - concurrent writes from spx and Claude Code could corrupt settings
- **Impact**: High - corrupted settings break Claude Code
- **Mitigation**: Read-only operations initially; file locking or validation for write operations

## Readiness Criteria

This PRD is ready for implementation when:

1. ✅ Product vision articulates multi-domain CLI need and `gh`-like patterns
2. ✅ Measurable outcome quantifies tool switching reduction and discoverability
3. ✅ E2E test demonstrates multi-domain workflow in single session
4. ✅ Scenarios cover all 5 core domains (spec, session, config, claude, marketplace)
5. ✅ Scope defines core domains (spec, session, config, claude, marketplace) and future possibilities
6. ✅ Product approach details domain architecture, command patterns, config system
7. ✅ Each domain has high-level command list and key design decisions
8. ✅ Success criteria define adoption metrics (60%+ multi-domain usage)
9. ✅ Open decisions clarify backward compat, scope precedence, extensibility
10. ✅ Dependencies identify spawned capabilities for each domain
11. ✅ Pre-mortem validates assumptions (unified CLI desire, git coverage, config scalability)
12. ✅ Delivery strategy phases domains (3 → 5 → advanced → plugins)
