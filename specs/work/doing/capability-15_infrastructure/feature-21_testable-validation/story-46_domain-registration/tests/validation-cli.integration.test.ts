/**
 * Integration tests for the validation CLI commands.
 *
 * Level 2 tests verifying the CLI commands are accessible and parse options correctly.
 */
import { execa } from "execa";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Navigate up from tests dir to project root (7 levels)
const CLI_PATH = path.join(__dirname, "../../../../../../../bin/spx.js");

describe("Validation CLI Integration", () => {
  describe("GIVEN spx validation --help", () => {
    it("THEN shows all subcommands", async () => {
      const { stdout, exitCode } = await execa("node", [CLI_PATH, "validation", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("typescript");
      expect(stdout).toContain("lint");
      expect(stdout).toContain("circular");
      expect(stdout).toContain("knip");
      expect(stdout).toContain("all");
    });

    it("THEN shows the alias 'v'", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "--help"]);

      expect(stdout).toContain("validation|v");
    });
  });

  describe("GIVEN spx v (alias)", () => {
    it("THEN works the same as spx validation", async () => {
      const { stdout, exitCode } = await execa("node", [CLI_PATH, "v", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("typescript");
      expect(stdout).toContain("lint");
    });
  });

  describe("GIVEN spx validation typescript", () => {
    it("THEN the command is accessible", async () => {
      const { exitCode } = await execa("node", [CLI_PATH, "validation", "typescript"]);

      // Should succeed (with placeholder output for now)
      expect(exitCode).toBe(0);
    });

    it("THEN shows alias 'ts' in help", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "typescript", "--help"]);

      expect(stdout).toContain("typescript|ts");
    });

    it("THEN accepts common options", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "typescript", "--help"]);

      expect(stdout).toContain("--scope");
      expect(stdout).toContain("--files");
      expect(stdout).toContain("--quiet");
      expect(stdout).toContain("--json");
    });
  });

  describe("GIVEN spx validation lint", () => {
    it("THEN the command is accessible", async () => {
      const { exitCode } = await execa("node", [CLI_PATH, "validation", "lint"]);

      expect(exitCode).toBe(0);
    });

    it("THEN accepts --fix option", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "lint", "--help"]);

      expect(stdout).toContain("--fix");
    });
  });

  describe("GIVEN spx validation circular", () => {
    it("THEN the command is accessible", async () => {
      const { exitCode } = await execa("node", [CLI_PATH, "validation", "circular"]);

      expect(exitCode).toBe(0);
    });
  });

  describe("GIVEN spx validation knip", () => {
    it("THEN the command is accessible", async () => {
      const { exitCode } = await execa("node", [CLI_PATH, "validation", "knip"]);

      expect(exitCode).toBe(0);
    });
  });

  describe("GIVEN spx validation all", () => {
    it("THEN the command is accessible", async () => {
      const { exitCode } = await execa("node", [CLI_PATH, "validation", "all"]);

      expect(exitCode).toBe(0);
    });

    it("THEN is the default command", async () => {
      // Running 'validation' without subcommand should run 'all'
      const { stdout, exitCode } = await execa("node", [CLI_PATH, "validation"]);

      expect(exitCode).toBe(0);
      // Should show output from all validation steps
      expect(stdout).toContain("TypeScript");
      expect(stdout).toContain("ESLint");
    });

    it("THEN accepts --fix option for ESLint", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "all", "--help"]);

      expect(stdout).toContain("--fix");
    });
  });
});
