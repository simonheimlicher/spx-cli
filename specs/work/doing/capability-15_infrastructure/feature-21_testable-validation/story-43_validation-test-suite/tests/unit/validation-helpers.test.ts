/**
 * Level 1: Unit tests for validation helper functions
 * Story: story-43_validation-test-suite
 *
 * Tests pure functions and helper utilities in validation module.
 * Per ADR-001: Pure functions testable at Level 1 with DI.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createFileSpecificTsconfig, type TypeScriptDeps, validationEnabled } from "@/validation";

/**
 * Create test dependencies with proper type casting.
 * These partial implementations satisfy the interface while focusing on test behavior.
 * Uses double assertion (as unknown as T) since test mocks have simpler signatures.
 */
function createTestDeps(overrides: {
  mkdtemp?: (prefix: string) => Promise<string>;
  writeFileSync?: (path: string, content: string) => void;
  rmSync?: (path: string) => void;
  existsSync?: () => boolean;
  mkdirSync?: () => void;
}): TypeScriptDeps {
  return {
    mkdtemp: overrides.mkdtemp as unknown as TypeScriptDeps["mkdtemp"],
    writeFileSync: (overrides.writeFileSync ?? (() => {})) as unknown as TypeScriptDeps["writeFileSync"],
    rmSync: (overrides.rmSync ?? (() => {})) as unknown as TypeScriptDeps["rmSync"],
    existsSync: (overrides.existsSync ?? (() => true)) as unknown as TypeScriptDeps["existsSync"],
    mkdirSync: (overrides.mkdirSync ?? (() => undefined)) as unknown as TypeScriptDeps["mkdirSync"],
  };
}

describe("validationEnabled()", () => {
  // Store original env and restore after each test
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = {
      TYPESCRIPT_VALIDATION_ENABLED: process.env.TYPESCRIPT_VALIDATION_ENABLED,
      ESLINT_VALIDATION_ENABLED: process.env.ESLINT_VALIDATION_ENABLED,
      KNIP_VALIDATION_ENABLED: process.env.KNIP_VALIDATION_ENABLED,
    };
  });

  afterEach(() => {
    // Restore original env
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  describe("GIVEN default enabled validation", () => {
    it("WHEN no env var set THEN returns true (default enabled)", () => {
      delete process.env.TYPESCRIPT_VALIDATION_ENABLED;

      const result = validationEnabled("TYPESCRIPT", { TYPESCRIPT: true });

      expect(result).toBe(true);
    });

    it("WHEN explicitly disabled via env THEN returns false", () => {
      process.env.TYPESCRIPT_VALIDATION_ENABLED = "0";

      const result = validationEnabled("TYPESCRIPT", { TYPESCRIPT: true });

      expect(result).toBe(false);
    });

    it("WHEN explicitly enabled via env THEN returns true", () => {
      process.env.ESLINT_VALIDATION_ENABLED = "1";

      const result = validationEnabled("ESLINT", { ESLINT: true });

      expect(result).toBe(true);
    });
  });

  describe("GIVEN default disabled validation", () => {
    it("WHEN no env var set THEN returns false (default disabled)", () => {
      delete process.env.KNIP_VALIDATION_ENABLED;

      const result = validationEnabled("KNIP", { KNIP: false });

      expect(result).toBe(false);
    });

    it("WHEN explicitly enabled via env THEN returns true", () => {
      process.env.KNIP_VALIDATION_ENABLED = "1";

      const result = validationEnabled("KNIP", { KNIP: false });

      expect(result).toBe(true);
    });

    it("WHEN explicitly disabled via env THEN returns false", () => {
      process.env.KNIP_VALIDATION_ENABLED = "0";

      const result = validationEnabled("KNIP", { KNIP: false });

      expect(result).toBe(false);
    });
  });

  describe("GIVEN no defaults provided", () => {
    it("WHEN no env var and no default THEN defaults to enabled", () => {
      delete process.env.TYPESCRIPT_VALIDATION_ENABLED;

      const result = validationEnabled("TYPESCRIPT");

      expect(result).toBe(true);
    });
  });
});

describe("createFileSpecificTsconfig()", () => {
  describe("GIVEN files to validate", () => {
    it("WHEN creating config THEN returns path and cleanup function", async () => {
      let tempDir = "";
      let writtenContent = "";

      const mockDeps = createTestDeps({
        mkdtemp: async (prefix: string) => {
          tempDir = `${prefix}test123`;
          return tempDir;
        },
        writeFileSync: (_path: string, content: string) => {
          writtenContent = content;
        },
      });

      const result = await createFileSpecificTsconfig("full", ["src/index.ts"], mockDeps);

      expect(result.tempDir).toBe(tempDir);
      expect(result.configPath).toContain("tsconfig.json");
      expect(typeof result.cleanup).toBe("function");

      // Verify the config content
      const config = JSON.parse(writtenContent);
      expect(config.extends).toContain("tsconfig.json");
      expect(config.files).toBeDefined();
      expect(config.files.length).toBe(1);
      expect(config.compilerOptions.noEmit).toBe(true);
    });

    it("WHEN cleanup called THEN removes temp directory", async () => {
      let removedPath = "";

      const mockDeps = createTestDeps({
        mkdtemp: async () => "/tmp/test123",
        rmSync: (path: string) => {
          removedPath = path;
        },
      });

      const result = await createFileSpecificTsconfig("full", ["src/index.ts"], mockDeps);
      result.cleanup();

      expect(removedPath).toBe("/tmp/test123");
    });

    it("WHEN production scope THEN extends production tsconfig", async () => {
      let writtenContent = "";

      const mockDeps = createTestDeps({
        mkdtemp: async () => "/tmp/test123",
        writeFileSync: (_path: string, content: string) => {
          writtenContent = content;
        },
      });

      await createFileSpecificTsconfig("production", ["src/index.ts"], mockDeps);

      const config = JSON.parse(writtenContent);
      expect(config.extends).toContain("tsconfig.production.json");
    });

    it("WHEN multiple files THEN includes all in config", async () => {
      let writtenContent = "";

      const mockDeps = createTestDeps({
        mkdtemp: async () => "/tmp/test123",
        writeFileSync: (_path: string, content: string) => {
          writtenContent = content;
        },
      });

      await createFileSpecificTsconfig("full", ["src/a.ts", "src/b.ts", "tests/c.test.ts"], mockDeps);

      const config = JSON.parse(writtenContent);
      expect(config.files.length).toBe(3);
    });

    it("WHEN cleanup fails THEN does not throw", async () => {
      const mockDeps = createTestDeps({
        mkdtemp: async () => "/tmp/test123",
        rmSync: () => {
          throw new Error("Cleanup failed");
        },
      });

      const result = await createFileSpecificTsconfig("full", ["src/index.ts"], mockDeps);

      // Should not throw
      expect(() => result.cleanup()).not.toThrow();
    });
  });
});
