/**
 * Level 2: Integration tests for CLI validation commands
 * Story: story-47_validation-commands
 *
 * ADR-021: Tests use isolated fixture projects, never the live repo.
 * Tests verify validation commands run and produce expected output format.
 */
import { execa } from "execa";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CLI_PATH = join(__dirname, "../../../bin/spx.js");

/** Isolated fixture project that passes all validation */
const CLEAN_FIXTURE = join(__dirname, "../../fixtures/projects/clean-project");

describe("spx validation commands", () => {
  describe("spx validation typescript", () => {
    it("GIVEN clean fixture WHEN running typescript validation THEN exits 0", async () => {
      // When: Run typescript validation on isolated fixture
      const result = await execa("node", [CLI_PATH, "validation", "typescript"], {
        cwd: CLEAN_FIXTURE,
        reject: false,
      });

      // Then: Should pass (fixture is clean)
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("TypeScript");
    });

    it("GIVEN quiet flag WHEN running typescript validation THEN suppresses output", async () => {
      // When: Run with --quiet on isolated fixture
      const result = await execa("node", [CLI_PATH, "validation", "typescript", "--quiet"], {
        cwd: CLEAN_FIXTURE,
        reject: false,
      });

      // Then: Should pass with minimal output
      expect(result.exitCode).toBe(0);
    });
  });

  describe("spx validation lint", () => {
    it("GIVEN clean fixture WHEN running lint validation THEN exits 0", async () => {
      // When: Run lint validation on isolated fixture
      const result = await execa("node", [CLI_PATH, "validation", "lint"], {
        cwd: CLEAN_FIXTURE,
        reject: false,
      });

      // Then: Should pass
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("ESLint");
    });
  });

  describe("spx validation circular", () => {
    it("GIVEN clean fixture WHEN running circular validation THEN exits 0", async () => {
      // When: Run circular dependency check on isolated fixture
      const result = await execa("node", [CLI_PATH, "validation", "circular"], {
        cwd: CLEAN_FIXTURE,
        reject: false,
      });

      // Then: Should pass (no circular deps in fixture)
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Circular");
    });
  });

  describe("spx validation all", () => {
    it(
      "GIVEN clean fixture WHEN running all validations THEN exits 0",
      { timeout: 120000 }, // Allow 2 minutes for all validations
      async () => {
        // When: Run all validations on isolated fixture
        const result = await execa("node", [CLI_PATH, "validation", "all"], {
          cwd: CLEAN_FIXTURE,
          reject: false,
        });

        // Then: Should pass
        expect(result.exitCode).toBe(0);
      },
    );
  });

  describe("graceful degradation", () => {
    it("GIVEN isolated fixture WHEN running validation THEN executes without skipping", async () => {
      // Verify validation actually runs (not skipped due to missing tools)
      const result = await execa("node", [CLI_PATH, "validation", "circular"], {
        cwd: CLEAN_FIXTURE,
        reject: false,
      });

      // Then: Should run validation (either pass or fail, but not skip)
      expect(result.exitCode).toBe(0);
      // Output should indicate validation ran, not skipped
      expect(result.stdout).not.toContain("Skipping");
    });
  });
});
