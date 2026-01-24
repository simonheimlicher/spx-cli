/**
 * Level 1: Unit tests for circular dependency validation
 * Story: story-43_validation-test-suite
 *
 * Tests validateCircularDependencies() with controlled deps (no real madge).
 * Per ADR-001: Pure functions with DI testable at Level 1.
 */

import { describe, expect, it } from "vitest";

import { type CircularDeps, type ScopeConfig, validateCircularDependencies, VALIDATION_SCOPES } from "@/validation";

/**
 * Create a mock madge function for testing.
 * Uses type assertion to satisfy the interface while focusing on test behavior.
 */
function createMockMadge(circularDeps: string[][] = []): CircularDeps["madge"] {
  return (async () => ({
    circular: () => circularDeps,
    circularGraph: () => ({}),
    depends: () => [],
    orphans: () => [],
    leaves: () => [],
    obj: () => ({}),
    warnings: () => ({ skipped: [] }),
    svg: async () => Buffer.from(""),
    image: async () => "",
    dot: async () => "",
  })) as unknown as CircularDeps["madge"];
}

const baseScopeConfig: ScopeConfig = {
  directories: ["src"],
  filePatterns: ["**/*.ts"],
  excludePatterns: ["node_modules/**"],
};

describe("validateCircularDependencies()", () => {
  describe("GIVEN no circular dependencies", () => {
    it("WHEN validating THEN returns success", async () => {
      const mockDeps: CircularDeps = {
        madge: createMockMadge([]),
      };

      const result = await validateCircularDependencies(VALIDATION_SCOPES.FULL, baseScopeConfig, mockDeps);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.circularDependencies).toBeUndefined();
    });
  });

  describe("GIVEN circular dependencies exist", () => {
    it("WHEN validating THEN returns failure with cycles", async () => {
      const cycles = [
        ["src/a.ts", "src/b.ts", "src/a.ts"],
        ["src/c.ts", "src/d.ts", "src/c.ts"],
      ];
      const mockDeps: CircularDeps = {
        madge: createMockMadge(cycles),
      };

      const result = await validateCircularDependencies(VALIDATION_SCOPES.FULL, baseScopeConfig, mockDeps);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("2");
      expect(result.error).toContain("circular");
      expect(result.circularDependencies).toEqual(cycles);
    });

    it("WHEN single cycle found THEN error message singular", async () => {
      const cycles = [["src/a.ts", "src/b.ts", "src/a.ts"]];
      const mockDeps: CircularDeps = {
        madge: createMockMadge(cycles),
      };

      const result = await validateCircularDependencies(VALIDATION_SCOPES.FULL, baseScopeConfig, mockDeps);

      expect(result.success).toBe(false);
      expect(result.error).toContain("1");
    });
  });

  describe("GIVEN empty directories", () => {
    it("WHEN validating THEN returns success (nothing to analyze)", async () => {
      const mockDeps: CircularDeps = {
        madge: createMockMadge([]),
      };
      const emptyScopeConfig: ScopeConfig = {
        directories: [],
        filePatterns: [],
        excludePatterns: [],
      };

      const result = await validateCircularDependencies(VALIDATION_SCOPES.FULL, emptyScopeConfig, mockDeps);

      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN madge throws error", () => {
    it("WHEN validating THEN returns failure with error message", async () => {
      const mockDeps: CircularDeps = {
        madge: async () => {
          throw new Error("Madge analysis failed");
        },
      };

      const result = await validateCircularDependencies(VALIDATION_SCOPES.FULL, baseScopeConfig, mockDeps);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Madge analysis failed");
      expect(result.circularDependencies).toBeUndefined();
    });

    it("WHEN non-Error thrown THEN converts to string", async () => {
      const mockDeps: CircularDeps = {
        madge: async () => {
          throw "String error";
        },
      };

      const result = await validateCircularDependencies(VALIDATION_SCOPES.FULL, baseScopeConfig, mockDeps);

      expect(result.success).toBe(false);
      expect(result.error).toBe("String error");
    });
  });

  describe("GIVEN production scope", () => {
    it("WHEN validating THEN uses production tsconfig", async () => {
      let usedTsConfig = "";
      const mockDeps: CircularDeps = {
        madge: (async (_paths: unknown, options: unknown) => {
          usedTsConfig = (options as { tsConfig?: string })?.tsConfig ?? "";
          return {
            circular: () => [],
            circularGraph: () => ({}),
            depends: () => [],
            orphans: () => [],
            leaves: () => [],
            obj: () => ({}),
            warnings: () => ({ skipped: [] }),
            svg: async () => Buffer.from(""),
            image: async () => "",
            dot: async () => "",
          };
        }) as unknown as CircularDeps["madge"],
      };

      await validateCircularDependencies(VALIDATION_SCOPES.PRODUCTION, baseScopeConfig, mockDeps);

      expect(usedTsConfig).toBe("tsconfig.production.json");
    });
  });

  describe("GIVEN exclude patterns", () => {
    it("WHEN validating THEN converts patterns to regex", async () => {
      let usedExcludeRegExp: RegExp[] = [];
      const mockDeps: CircularDeps = {
        madge: (async (_paths: unknown, options: unknown) => {
          usedExcludeRegExp = (options as { excludeRegExp?: RegExp[] })?.excludeRegExp ?? [];
          return {
            circular: () => [],
            circularGraph: () => ({}),
            depends: () => [],
            orphans: () => [],
            leaves: () => [],
            obj: () => ({}),
            warnings: () => ({ skipped: [] }),
            svg: async () => Buffer.from(""),
            image: async () => "",
            dot: async () => "",
          };
        }) as unknown as CircularDeps["madge"],
      };

      const scopeWithExcludes: ScopeConfig = {
        directories: ["src"],
        filePatterns: ["**/*.ts"],
        excludePatterns: ["node_modules/**/*", "dist/**/*"],
      };

      await validateCircularDependencies(VALIDATION_SCOPES.FULL, scopeWithExcludes, mockDeps);

      expect(usedExcludeRegExp.length).toBe(2);
      expect(usedExcludeRegExp[0]).toBeInstanceOf(RegExp);
    });
  });
});
