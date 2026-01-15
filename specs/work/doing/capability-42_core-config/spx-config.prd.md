# PRD: Core Configuration System

> **Purpose**: Make spx directory paths configurable through a unified config system, enabling products to customize specs and sessions layout while maintaining tool compatibility.
>
> - Addresses inconsistency between hardcoded CLI paths and actual product layouts
> - Enables smooth migration from flat structure (specs/doing) to nested structure (specs/work/doing)
> - Establishes foundation for configurable sessions directory (.spx/sessions)
> - Foundation for future scope system (user/product/local) similar to gh CLI config patterns
> - Spawns capability-42_core-config with features for default config and product overrides

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

Solo developers and teams using spx CLI who need to reorganize their specs directory structure or adapt spx to existing product conventions.

**What** problem do they face?

```
As an spx user, I am frustrated by hardcoded directory paths in spx CLI
because CLI paths are fixed in code and don't match my product layout,
which prevents me from reorganizing specs/ or adapting spx to legacy products.
```

### Current Customer Pain

- **Symptom**: spx CLI fails to find work items after reorganizing specs/ folder structure
- **Root Cause**: Directory paths hardcoded in CLI source code with no override mechanism
- **Customer Impact**: Cannot migrate from `specs/doing` to `specs/work/doing` without breaking tools
- **Business Impact**: spx adoption blocked in products with existing conventions

### Customer Solution

```
Implement a config.json configuration system that enables users to override default directory paths
through product-level configuration (.spx/config.json), resulting in flexible specs and sessions
organization without breaking spx tooling.
```

### Customer Journey Context

- **Before**: spx only works with hardcoded defaults; reorganizing specs/ breaks all commands
- **During**: User creates `.spx/config.json` to override paths; spx respects custom structure
- **After**: User can reorganize specs and sessions freely; spx adapts to product conventions automatically

### User Assumptions

| Assumption Category  | Specific Assumption                           | Impact on Product Design                      |
| -------------------- | --------------------------------------------- | --------------------------------------------- |
| User Context         | Users understand JSON configuration files     | Config uses JSON format like package.json     |
| User Goals           | Users want explicit control over structure    | Prefer explicit `.spx/config.json` over magic |
| Technical Capability | Users can edit JSON and understand file paths | Clear error messages when paths are invalid   |

## Expected Outcome

### Measurable Outcome

```
Users will successfully override spx directory structure leading to 100% compatibility
with custom specs layouts and zero migration friction when reorganizing folders,
proven by spx commands working correctly with both default and overridden paths.
```

### Evidence of Success

| Metric                    | Current              | Target              | Improvement                             |
| ------------------------- | -------------------- | ------------------- | --------------------------------------- |
| Configuration Flexibility | 0% (hardcoded paths) | 100% (configurable) | Full path customization support         |
| Migration Success Rate    | 0% (breaks tooling)  | 100% (seamless)     | Zero breakage when reorganizing specs   |
| Product Compatibility     | Single layout only   | Any layout          | Works with existing product conventions |
| Config Discovery Time     | N/A                  | <5 seconds          | Clear defaults, easy override           |

## Acceptance Tests

### Complete User Journey Test

```typescript
// E2E test - spx respects custom directory structure
describe("Feature: Configurable Specs Structure", () => {
  test("spx status works with custom directory structure", async () => {
    // Given: Product with custom specs structure
    const projectDir = await setupTestProject({
      specsRoot: "docs/specifications",
      workDir: "active",
      statusDirs: ["in-progress", "backlog", "completed"],
    });

    await fs.writeFile(
      path.join(projectDir, ".spx/config.json"),
      JSON.stringify({
        specs: {
          root: "docs/specifications",
          work: {
            dir: "active",
            statusDirs: {
              doing: "in-progress",
              backlog: "backlog",
              done: "completed",
            },
          },
        },
      }),
    );

    // When: User runs spx status
    const result = await exec("spx status --json", { cwd: projectDir });

    // Then: spx finds work items in custom locations
    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);
    expect(status.product.specsRoot).toBe("docs/specifications");
    expect(status.capabilities.length).toBeGreaterThan(0);

    // Verify spx scanned custom paths
    expect(status.product.workDir).toBe("active");
    expect(status.product.statusDirs).toEqual({
      doing: "in-progress",
      backlog: "backlog",
      done: "completed",
    });
  });

  test("spx falls back to defaults when no config file exists", async () => {
    // Given: Product with no .spx/config.json
    const projectDir = await setupTestProject({
      useDefaults: true,
    });

    // When: User runs spx status
    const result = await exec("spx status --json", { cwd: projectDir });

    // Then: spx uses embedded defaults
    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);
    expect(status.product.specsRoot).toBe("specs");
    expect(status.product.workDir).toBe("work");
    expect(status.product.statusDirs).toEqual({
      doing: "doing",
      backlog: "backlog",
      done: "archive",
    });
  });
});
```

### User Scenarios (Gherkin Format)

```gherkin
Feature: Configurable Specs Directory Structure

  Scenario: User overrides specs root location
    Given a product with specs in "docs/specifications" instead of "specs"
    When user creates .spx/config.json with custom root path
    Then spx status finds work items in custom location
    And all spx commands respect the custom root
    And no work items are missed due to path mismatch

  Scenario: User overrides work status directory names
    Given a project using "in-progress", "backlog", "completed" instead of defaults
    When user configures custom status directory names in config
    Then spx status correctly classifies work items by custom directories
    And spx spec next recommends work from correct status directories
    And BSP ordering is preserved across custom directory names

  Scenario: User migrates from flat to nested structure
    Given a product with specs/doing (flat structure)
    When user reorganizes to specs/work/doing (nested structure)
    And user updates .spx/config.json to reflect new structure
    Then spx finds all work items in new locations
    And no work items are lost or misclassified
    And spx status output matches previous structure's output

  Scenario: New project uses defaults without configuration
    Given a fresh product with no .spx/config.json
    When user runs spx init or spx status
    Then spx uses embedded defaults automatically
    And user can opt-in to custom paths by creating config file
    And spx provides clear guidance on where to configure paths

  Scenario: Invalid configuration produces helpful errors
    Given a product with .spx/config.json containing invalid paths
    When user runs spx status
    Then spx shows clear error message indicating which path is invalid
    And spx suggests corrective actions (check path exists, fix typo)
    And spx does not crash or produce confusing errors
```

### Scenario Detail (Given/When/Then)

**Scenario: User overrides specs root location**

- **Given**: Product has specs in `docs/specifications/` with work items in `docs/specifications/work/doing/`
- **When**: User creates `.spx/config.json` with `{ "specs": { "root": "docs/specifications" } }`
- **Then**: Running `spx status` finds capabilities, features, stories in custom location

**Scenario: Config validation catches invalid configuration**

- **Given**: User creates `.spx/config.json` with non-existent path `{ "specs": { "root": "does-not-exist" } }`
- **When**: User runs `spx status`
- **Then**: spx shows error "Specs root 'does-not-exist' not found" with suggestion to check path

**Scenario: Partial overrides merge with defaults**

- **Given**: User creates `.spx/config.json` overriding only `root`, not `work.dir` or `statusDirs`
- **When**: User runs `spx status`
- **Then**: spx uses custom root with default work directory and status directory names

## Scope Definition

### What's Included

This deliverable unit includes:

- ✅ Default config embedded in spx CLI (replaces structure.yaml)
- ✅ Product-level config via `.spx/config.json`
- ✅ Config merge: product overrides + defaults
- ✅ Configuration validation with helpful error messages
- ✅ Schema definition for config.json structure
- ✅ Config resolution: read project config, merge with defaults, validate paths exist

### What's Explicitly Excluded

| Excluded Capability                         | Rationale                                                         |
| ------------------------------------------- | ----------------------------------------------------------------- |
| User-level config (~/.spx/config.json)      | Out of scope: This PRD addresses product-level configuration only |
| Local-level config (.spx/config.local.json) | Out of scope: Local overrides are separate capability             |
| Managed config (system-level)               | Out of scope: Enterprise-level config is separate capability      |
| Config UI or interactive commands           | Out of scope: This PRD addresses file-based configuration only    |
| Config inheritance/cascading                | Out of scope: Complex scope hierarchies are separate capabilities |

### Scope Boundaries Rationale

**Why these boundaries?**

This capability focuses on product-level configuration to enable directory customization. User-level, local-level, and managed configurations represent distinct capabilities with their own requirements for scope precedence, conflict resolution, and security. Interactive config commands (`spx config get/set`) belong to the config-domain capability. This PRD establishes the foundational config system that these future capabilities can build upon.

## Product Approach

### Interaction Model

- **Interface Type**: Configuration file (`.spx/config.json`) + CLI reading behavior
- **Invocation Pattern**: Passive - spx reads config at startup, user edits JSON manually (future: `spx config` commands)
- **User Mental Model**: "Like package.json or tsconfig.json - project config file that spx respects"

### User Experience Principles

1. **Defaults work without config**: Fresh projects use embedded defaults automatically
2. **Explicit overrides**: Creating `.spx/config.json` explicitly opts into custom paths
3. **Fail fast with clarity**: Invalid paths produce clear errors, not confusing failures
4. **Progressive disclosure**: Simple overrides (just root) work; full customization available if needed

### High-Level Technical Approach

**Data Model:**

- Config schema defines all configurable paths
- Default config embedded in spx CLI source code
- Config filename is a named constant (e.g., `CONFIG_FILENAME = "config.json"`) for easy future changes
- Product config loaded from `.spx/config.json` if exists
  - ⚠️ **ADR Trigger**: Config format? (Flat vs nested, JSON vs YAML, schema validation approach)

**Key Capabilities:**

- **Config resolution**: Load product config, merge with defaults, validate existence of paths
  - ⚠️ **ADR Trigger**: Merge strategy? (Deep merge, shallow merge, explicit override-only)
- **Path validation**: Check that configured paths exist and are directories
  - ⚠️ **ADR Trigger**: Validation timing? (Eager at load vs lazy at use, fail vs warn)
- **Default generation**: Hardcode defaults in CLI (replace structure.yaml dependency)
  - ⚠️ **ADR Trigger**: Hardcoded vs generated from YAML vs runtime constants

**Integration Points:**

- Scanner uses config-resolved paths instead of hardcoded paths
- All CLI commands (status, next, validate) use config resolution layer
- Error messages reference actual configured paths, not assumed defaults

**Configuration Schema:**

```jsonc
{
  "specs": {
    "root": "specs", // Base directory for all specs
    "work": {
      "dir": "work", // Work items container
      "statusDirs": {
        "doing": "doing", // Active work
        "backlog": "backlog", // Future work
        "done": "archive", // Completed work (embedded default)
      },
    },
    "decisions": "decisions", // Product-level ADRs
    "templates": "templates", // Templates location (optional)
  },
  "sessions": {
    "dir": ".spx/sessions", // Session handoff files location
  },
}
```

- ⚠️ **ADR Trigger**: What else should be configurable? (Patterns, BSP range, test graduation paths)

**Product Root Discovery** (NOT Configurable):

Product root is DISCOVERED automatically, not configured in `.spx/config.json`. This is a critical design constraint:

- **Why not configurable?** Circular dependency: spx needs to find the product root to locate `.spx/config.json`. Cannot configure root in a file that requires root to find.
- **Discovery methods**:
  1. **Git-based** (primary): Walk up from `$PWD` looking for `.git` directory
  2. **Fallback**: Use `$PWD` if no git repository found
  3. **Override**: Respect `SPX_PRODUCT_ROOT` environment variable if set
- **Configuration scope**: All paths in `.spx/config.json` are relative to the discovered product root
- **Example**: If productRoot is `/Users/dev/myproduct`, then `specs.root: "docs/specifications"` resolves to `/Users/dev/myproduct/docs/specifications`

This discovery mechanism is implemented in the platform layer (not this capability) and provides `ProductContext.root` to all domains.

### Product-Specific Constraints

| Constraint                                    | Impact on Product                                                  | Impact on Testing                              |
| --------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| Backward compatibility with existing products | Must support both flat (specs/doing) and nested (specs/work/doing) | Fixtures for both structures                   |
| Embedded defaults are source of truth         | Config overrides paths only, not patterns or status rules          | Validate patterns still work with custom paths |
| CLI performance (<100ms)                      | Config resolution must be fast (no complex merging logic)          | Benchmark config load + path resolution        |

### Technical Assumptions

- **Architecture Assumption**: Scanner refactoring to inject resolved paths is straightforward
- **Performance Assumption**: JSON parsing + path existence checks add <10ms overhead
- **Compatibility Assumption**: Existing products without config file continue to work with defaults
- **Validation Assumption**: Path validation catches 95%+ of configuration errors

## Success Criteria

### User Outcomes

| Outcome                                          | Success Indicator                                            |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Users successfully override specs structure      | spx commands work with custom paths from `.spx/config.json`  |
| Users understand how to configure paths          | Clear error messages guide users to fix invalid config       |
| Users can migrate specs without breaking tooling | Zero manual workarounds needed when reorganizing directories |

### Quality Attributes

| Attribute       | Target                                                       | Measurement Approach                                |
| --------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| **Usability**   | Zero-config defaults, explicit overrides                     | Fresh projects work without config file             |
| **Performance** | Config resolution adds <10ms overhead                        | Benchmark spx status with and without custom config |
| **Reliability** | Invalid configuration never causes data loss/silent failures | All error cases tested, fail-fast validation        |
| **Clarity**     | Error messages show exact problem and fix                    | Test invalid configs, verify error messages         |

### Definition of "Done"

This deliverable unit is complete when:

1. spx status works with both default and custom directory structures
2. `.spx/config.json` overrides are respected for all spx commands
3. Invalid configuration produces clear, actionable error messages
4. Existing products without config file continue to work (backward compatibility)
5. Config schema is documented and validated
6. Tests cover default config, overrides, merge logic, and validation

## Open Decisions

### Questions Requiring User Input

| Question                                                  | Option A        | Option B              | Trade-offs                                 | Recommendation         |
| --------------------------------------------------------- | --------------- | --------------------- | ------------------------------------------ | ---------------------- |
| Should config support path expansion (e.g., ~, env vars)? | Yes (flexible)  | No (explicit only)    | A = convenient but complexity, B = simple  | Option B (recommended) |
| How to handle config.json parse errors?                   | Fail with error | Ignore + use defaults | A = fail-fast, B = forgiving but confusing | Option A (fail-fast)   |

### Decisions Triggering ADRs

| Decision Topic             | Key Question                                     | Options to Evaluate                                    | Triggers                   |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------ | -------------------------- |
| Config merge strategy      | Deep merge vs shallow merge vs override-only?    | Deep recursive / Shallow top-level / Explicit override | `/architecting-typescript` |
| Default config generation  | Runtime parse structure.yaml vs compile-time?    | Dynamic parsing / Code generation / Hardcoded          | `/architecting-typescript` |
| Path validation timing     | Validate at config load vs lazy at path use?     | Eager validation / Lazy validation / Hybrid            | `/architecting-typescript` |
| Schema validation approach | JSON Schema validation vs runtime type checking? | JSON Schema / Zod / Manual validation                  | `/architecting-typescript` |

### Product Trade-offs

| Trade-off                 | Option A                   | Option B                  | Impact                                                 |
| ------------------------- | -------------------------- | ------------------------- | ------------------------------------------------------ |
| Configuration file format | JSON (structure.json)      | YAML (structure.yaml)     | A = familiar (package.json), B = allows comments       |
| Validation strictness     | Fail on unknown properties | Ignore unknown properties | A = catches typos, B = forward-compatible              |
| Config scope              | Product-only               | User + Product            | A = simpler, B = more flexible but complex merge logic |

## Dependencies

### Work Item Dependencies

No prerequisite capabilities. This is foundational configuration infrastructure.

### Customer-Facing Dependencies

| Dependency Type   | Specific Need                                 | Impact If Missing                              |
| ----------------- | --------------------------------------------- | ---------------------------------------------- |
| **Documentation** | Config schema reference, migration guide      | Users don't know how to configure custom paths |
| **Examples**      | Sample `.spx/config.json` for common patterns | Users copy-paste incorrect configuration       |

### Technical Dependencies

| Dependency | Version/Constraint | Purpose                  | Availability       |
| ---------- | ------------------ | ------------------------ | ------------------ |
| Node.js    | >=18.0.0           | Runtime environment      | Assumed available  |
| TypeScript | >=5.0              | Type-safe config parsing | Project dependency |

### Performance Requirements

| Requirement Area    | Target                               | Measurement Approach                   |
| ------------------- | ------------------------------------ | -------------------------------------- |
| **Config Load**     | <5ms to load and parse config.json   | Benchmark JSON.parse + validation      |
| **Path Resolution** | <5ms to resolve all configured paths | Benchmark path.join operations         |
| **Total Overhead**  | <10ms added to spx status execution  | Compare spx status with/without config |

## Pre-Mortem Analysis

### Assumption: Users will understand nested JSON configuration

- **Likelihood**: High - JSON configuration is standard in dev tools (package.json, tsconfig.json)
- **Impact**: Medium - if users struggle, they'll misconfigure and hit errors
- **Mitigation**: Provide clear examples, schema documentation, validation with helpful errors

### Assumption: Config resolution adds negligible performance overhead

- **Likelihood**: High - JSON parsing and path operations are fast
- **Impact**: High - if overhead is significant, violates <100ms spx status requirement
- **Mitigation**: Benchmark early, cache resolved config, avoid complex merge logic

### Assumption: Product-level config is sufficient

- **Likelihood**: High - immediate pain is product reorganization, not user-level defaults
- **Impact**: Medium - if users need user-level config immediately, product-level scope is insufficient
- **Mitigation**: Design config system extensible to scopes, add user/local capabilities

### Assumption: Backward compatibility with no config file is maintainable

- **Likelihood**: Medium - as features grow, maintaining two code paths (config vs defaults) adds complexity
- **Impact**: High - breaking existing products would force migration, harm adoption
- **Mitigation**: Comprehensive tests for default behavior, config as optional layer over defaults

## Readiness Criteria

This PRD is ready for implementation when:

1. ✅ Product vision clearly articulates the problem (hardcoded paths block reorganization)
2. ✅ Measurable outcome is quantified (100% custom layout compatibility)
3. ✅ E2E test exists showing spx respects custom config
4. ✅ Scenarios cover override, defaults, validation, migration
5. ✅ Scope defines product-level configuration
6. ✅ Product approach identifies ADR triggers (merge strategy, validation, defaults)
7. ✅ Success criteria define user outcomes and quality attributes
8. ✅ Open decisions list questions and ADR topics
9. ✅ Dependencies document prerequisites and performance targets
10. ✅ Pre-mortem validates assumptions (user understanding, performance, scope sufficiency)
