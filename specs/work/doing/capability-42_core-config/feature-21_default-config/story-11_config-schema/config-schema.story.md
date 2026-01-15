# Story: Define Config Schema and DEFAULT_CONFIG Constant

## Observable Outcome

The spx CLI has a centralized TypeScript configuration schema (`SpxConfig` interface) and default configuration constant (`DEFAULT_CONFIG`) exported from `src/config/defaults.ts`, providing type-safe access to all directory paths with zero runtime overhead.

## Story Context

This story establishes the foundational config structure that Feature 21 requires. It creates the TypeScript types and constants that will replace hardcoded path strings throughout the codebase.

**Parent Feature**: [Feature 21: Default Config Structure](../default-config.feature.md)

**Parent ADR**: [ADR-001: TypeScript Const for Default Config Structure](../decisions/adr-001_config-schema-structure.md)

## Acceptance Criteria

- [ ] `SpxConfig` interface defined in `src/config/defaults.ts`
- [ ] `DEFAULT_CONFIG` constant defined with all required paths
- [ ] Config uses `as const satisfies SpxConfig` pattern for type safety
- [ ] Config includes specs.root, specs.work.dir, specs.work.statusDirs.*, sessions.dir
- [ ] All properties documented with JSDoc comments
- [ ] Config is exported and importable via `@/config/defaults`
- [ ] Level 1 tests verify config structure and type safety

## Testing Strategy

### Level 1 (Unit) - REQUIRED

**Question Answered**: Is the config structure type-safe and does it contain all required paths?

**Scope**: Config interface, default constant, type checking, exports

**Behaviors to Verify**:

1. Config object has all required properties (specs.root, specs.work.dir, specs.work.statusDirs.*, sessions.dir)
2. Config structure matches SpxConfig interface (TypeScript compilation enforces this)
3. Config uses const assertion for literal type inference
4. Config is exported and importable from @/config/defaults
5. All config properties have JSDoc documentation

**Test Harness**: None needed (pure TypeScript types and constants)

**Dependencies**: Vitest test runner only

## Test Specifications

### Test File: `tests/config-schema.unit.test.ts`

```typescript
/**
 * Level 1: Config Schema and Default Constant
 *
 * These tests verify that the config schema is correctly defined and the
 * DEFAULT_CONFIG constant is properly structured with all required paths.
 */

import { DEFAULT_CONFIG, SpxConfig } from "@/config/defaults";
import { describe, expect, it } from "vitest";

describe("Story 11: Config Schema", () => {
  describe("DEFAULT_CONFIG structure", () => {
    it("GIVEN DEFAULT_CONFIG WHEN accessing properties THEN has all required specs paths", () => {
      // Verify specs.root exists
      expect(DEFAULT_CONFIG.specs.root).toBeDefined();
      expect(typeof DEFAULT_CONFIG.specs.root).toBe("string");

      // Verify specs.work.dir exists
      expect(DEFAULT_CONFIG.specs.work.dir).toBeDefined();
      expect(typeof DEFAULT_CONFIG.specs.work.dir).toBe("string");

      // Verify specs.work.statusDirs exists
      expect(DEFAULT_CONFIG.specs.work.statusDirs.doing).toBeDefined();
      expect(DEFAULT_CONFIG.specs.work.statusDirs.backlog).toBeDefined();
      expect(DEFAULT_CONFIG.specs.work.statusDirs.done).toBeDefined();

      // Verify specs.decisions exists
      expect(DEFAULT_CONFIG.specs.decisions).toBeDefined();
      expect(typeof DEFAULT_CONFIG.specs.decisions).toBe("string");
    });

    it("GIVEN DEFAULT_CONFIG WHEN accessing sessions THEN has required sessions path", () => {
      expect(DEFAULT_CONFIG.sessions.dir).toBeDefined();
      expect(typeof DEFAULT_CONFIG.sessions.dir).toBe("string");
    });

    it("GIVEN DEFAULT_CONFIG WHEN checking values THEN matches expected defaults", () => {
      // Verify default values match ADR specification
      expect(DEFAULT_CONFIG.specs.root).toBe("specs");
      expect(DEFAULT_CONFIG.specs.work.dir).toBe("work");
      expect(DEFAULT_CONFIG.specs.work.statusDirs.doing).toBe("doing");
      expect(DEFAULT_CONFIG.specs.work.statusDirs.backlog).toBe("backlog");
      expect(DEFAULT_CONFIG.specs.work.statusDirs.done).toBe("archive");
      expect(DEFAULT_CONFIG.specs.decisions).toBe("decisions");
      expect(DEFAULT_CONFIG.sessions.dir).toBe(".spx/sessions");
    });
  });

  describe("SpxConfig type safety", () => {
    it("GIVEN SpxConfig interface WHEN assigning DEFAULT_CONFIG THEN types match", () => {
      // This test primarily verifies at compile-time via TypeScript
      // Runtime check ensures the cast is valid
      const config: SpxConfig = DEFAULT_CONFIG;

      expect(config).toBeDefined();
      expect(config.specs).toBeDefined();
      expect(config.sessions).toBeDefined();
    });

    it("GIVEN DEFAULT_CONFIG WHEN checking type inference THEN has literal types", () => {
      // Verify const assertion provides literal types (compile-time check)
      // At runtime, verify the object is frozen-like (readonly behavior)
      const specsRoot: "specs" = DEFAULT_CONFIG.specs.root;
      const workDir: "work" = DEFAULT_CONFIG.specs.work.dir;
      const doingDir: "doing" = DEFAULT_CONFIG.specs.work.statusDirs.doing;

      expect(specsRoot).toBe("specs");
      expect(workDir).toBe("work");
      expect(doingDir).toBe("doing");
    });
  });

  describe("Module exports", () => {
    it("GIVEN defaults module WHEN importing THEN exports DEFAULT_CONFIG", async () => {
      const module = await import("@/config/defaults");

      expect(module.DEFAULT_CONFIG).toBeDefined();
      expect(module.DEFAULT_CONFIG.specs).toBeDefined();
    });

    it("GIVEN defaults module WHEN importing THEN exports SpxConfig type", async () => {
      // Verify type is exported (compile-time check)
      // Runtime check that the module has the expected structure
      const module = await import("@/config/defaults");

      // TypeScript compilation will fail if SpxConfig isn't exported
      type ConfigType = typeof module.DEFAULT_CONFIG;
      const config: ConfigType = module.DEFAULT_CONFIG;

      expect(config).toBeDefined();
    });
  });
});
```

## Implementation Guidance

### File: `src/config/defaults.ts`

```typescript
/**
 * Default configuration for spx CLI
 *
 * This module defines the default directory structure and configuration
 * constants used throughout the spx CLI. All directory paths should reference
 * this configuration instead of using hardcoded strings.
 *
 * @module config/defaults
 */

/**
 * Configuration schema for spx CLI directory structure
 */
export interface SpxConfig {
  /**
   * Specifications directory configuration
   */
  specs: {
    /**
     * Base directory for all specification files
     * @default "specs"
     */
    root: string;

    /**
     * Work items organization
     */
    work: {
      /**
       * Container directory for all work items
       * @default "work"
       */
      dir: string;

      /**
       * Status-based subdirectories for work items
       */
      statusDirs: {
        /**
         * Active work directory
         * @default "doing"
         */
        doing: string;

        /**
         * Future work directory
         * @default "backlog"
         */
        backlog: string;

        /**
         * Completed work directory
         * @default "archive"
         */
        done: string;
      };
    };

    /**
     * Product-level architecture decision records directory
     * @default "decisions"
     */
    decisions: string;

    /**
     * Templates directory (optional)
     * @default "templates"
     */
    templates?: string;
  };

  /**
   * Session handoff files configuration
   */
  sessions: {
    /**
     * Directory for session handoff files
     * @default ".spx/sessions"
     */
    dir: string;
  };
}

/**
 * Default configuration constant
 *
 * This is the embedded default configuration that spx uses when no
 * .spx/config.json file exists in the product.
 *
 * DO NOT modify this constant at runtime - it should remain immutable.
 */
export const DEFAULT_CONFIG = {
  specs: {
    root: "specs",
    work: {
      dir: "work",
      statusDirs: {
        doing: "doing",
        backlog: "backlog",
        done: "archive",
      },
    },
    decisions: "decisions",
    templates: "templates",
  },
  sessions: {
    dir: ".spx/sessions",
  },
} as const satisfies SpxConfig;
```

## Related Work Items

- **Blocked By**: None (foundational story)
- **Blocks**:
  - Story 21: Scanner Refactor (needs config schema)
  - Story 31: CLI Integration (needs DEFAULT_CONFIG export)

## Definition of Done

- [ ] All Level 1 tests pass
- [ ] TypeScript compilation succeeds with strict type checking
- [ ] Config is exported and importable from other modules
- [ ] JSDoc documentation is complete for all properties
- [ ] No hardcoded path strings in src/config/defaults.ts
- [ ] Tests graduate to `tests/unit/config/`

## Notes

- This story has no external dependencies - only TypeScript types and constants
- The config structure matches the ADR-001 specification exactly
- Future stories will consume this config to eliminate hardcoded paths
