import { execa } from "execa";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, "../../../../../../bin/spx.js");
const FIXTURES_ROOT = path.join(__dirname, "../../../../../../tests/fixtures/repos");

describe("Backward Compatibility Layer", () => {
  describe("status alias", () => {
    it("GIVEN old status command WHEN running THEN shows deprecation warning", async () => {
      // Given: Fixture repo with work items
      const cwd = path.join(FIXTURES_ROOT, "simple");

      // When: Running old status command
      const { stdout, stderr, exitCode } = await execa("node", [
        CLI_PATH,
        "status",
      ], {
        cwd,
      });

      // Then: Command works
      expect(exitCode).toBe(0);
      expect(stdout).toContain("capability-");

      // Then: Shows deprecation warning
      expect(stderr).toContain("⚠️");
      expect(stderr).toContain("Deprecated");
      expect(stderr).toContain("spx spec status");
      expect(stderr).toContain("v2.0.0");
    });

    it("GIVEN old status --json WHEN running THEN works with warning", async () => {
      // Given: Fixture repo
      const cwd = path.join(FIXTURES_ROOT, "simple");

      // When: Running old status --json
      const { stdout, stderr, exitCode } = await execa("node", [
        CLI_PATH,
        "status",
        "--json",
      ], {
        cwd,
      });

      // Then: Command works
      expect(exitCode).toBe(0);
      expect(stderr).toContain("Deprecated");

      // Then: JSON output still works
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty("capabilities");
    });

    it("GIVEN old status --format markdown WHEN running THEN works with warning", async () => {
      // Given: Fixture repo
      const cwd = path.join(FIXTURES_ROOT, "simple");

      // When: Running old status --format markdown
      const { stdout, stderr, exitCode } = await execa("node", [
        CLI_PATH,
        "status",
        "--format",
        "markdown",
      ], {
        cwd,
      });

      // Then: Command works
      expect(exitCode).toBe(0);
      expect(stderr).toContain("Deprecated");
      expect(stdout).toContain("##"); // Markdown header
    });
  });

  describe("next alias", () => {
    it("GIVEN old next command WHEN running THEN shows deprecation warning", async () => {
      // Given: Fixture repo with incomplete work items
      const cwd = path.join(FIXTURES_ROOT, "mixed");

      // When: Running old next command
      const { stdout, stderr, exitCode } = await execa("node", [
        CLI_PATH,
        "next",
      ], {
        cwd,
      });

      // Then: Command works
      expect(exitCode).toBe(0);
      expect(stdout).toContain("Next work item:");

      // Then: Shows deprecation warning
      expect(stderr).toContain("⚠️");
      expect(stderr).toContain("Deprecated");
      expect(stderr).toContain("spx spec next");
      expect(stderr).toContain("v2.0.0");
    });
  });

  describe("zero breaking changes", () => {
    it("GIVEN old and new commands WHEN comparing output THEN identical except warnings", async () => {
      // Given: Fixture repo
      const cwd = path.join(FIXTURES_ROOT, "simple");

      // When: Running old command
      const oldResult = await execa("node", [
        CLI_PATH,
        "status",
        "--json",
      ], {
        cwd,
      });

      // When: Running new command
      const newResult = await execa("node", [
        CLI_PATH,
        "spec",
        "status",
        "--json",
      ], {
        cwd,
      });

      // Then: Outputs are identical
      expect(oldResult.stdout).toBe(newResult.stdout);
      expect(oldResult.exitCode).toBe(newResult.exitCode);

      // Then: Only old command has warning
      expect(oldResult.stderr).toContain("Deprecated");
      expect(newResult.stderr).toBe("");
    });
  });

  describe("help text", () => {
    it("GIVEN root help WHEN viewing THEN shows both old and new commands", async () => {
      // When: Requesting root help
      const { stdout } = await execa("node", [CLI_PATH, "--help"]);

      // Then: Shows new domain structure
      expect(stdout).toContain("spec");
      expect(stdout).toContain("Manage spec workflow");

      // Then: Shows deprecated aliases with deprecation note
      expect(stdout).toContain("status");
      expect(stdout).toContain("deprecated");
      expect(stdout).toContain("next");
    });
  });

  describe("error handling", () => {
    it("GIVEN invalid format in alias WHEN running THEN shows error", async () => {
      // Given: Fixture repo
      const cwd = path.join(FIXTURES_ROOT, "simple");

      // When: Running with invalid format
      const { stderr, exitCode } = await execa(
        "node",
        [CLI_PATH, "status", "--format", "invalid"],
        {
          cwd,
          reject: false,
        },
      );

      // Then: Shows error
      expect(exitCode).toBe(1);
      expect(stderr).toContain("Invalid format");
    });
  });
});
