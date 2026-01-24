/**
 * Level 2: Integration tests for CLI error handling
 * Story: story-54_error-handling
 */
import { execa } from "execa";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, "../../../bin/spx.js");

describe("CLI Error Handling", () => {
  /**
   * Level 2: Integration tests for error handling
   */

  it("GIVEN invalid command WHEN running THEN shows error and exits with 1", async () => {
    // Given: Invalid command "invalid"

    // When
    const result = await execa("node", [CLI_PATH, "invalid"], {
      reject: false,
    });

    // Then
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/unknown command|error/i);
  });

  it("GIVEN no specs dir WHEN running status THEN shows clear error", async () => {
    // Given: Directory with no specs/work/doing folder
    const cwd = path.join(__dirname, "../../fixtures/repos/no-specs");

    // When
    const result = await execa("node", [CLI_PATH, "spec", "status"], {
      cwd,
      reject: false,
    });

    // Then
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error:");
    expect(result.stderr).toContain("specs/work/doing");
  });

  it("GIVEN no command specified WHEN running THEN shows help", async () => {
    // Given: No command

    // When
    const result = await execa("node", [CLI_PATH], {
      reject: false,
    });

    // Then
    // Commander.js shows help when no command given (in stdout or stderr)
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/Usage:|Commands:/);
  });

  it("GIVEN --help flag WHEN running THEN shows help and exits with 0", async () => {
    // Given: --help flag

    // When
    const result = await execa("node", [CLI_PATH, "--help"], {
      reject: false,
    });

    // Then
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Usage:|Commands:/);
    expect(result.stdout).toContain("spec");
    expect(result.stdout).toContain("session");
  });

  it("GIVEN command with --help WHEN running THEN shows command help", async () => {
    // Given: spec status --help

    // When
    const result = await execa("node", [CLI_PATH, "spec", "status", "--help"], {
      reject: false,
    });

    // Then
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("--json");
    expect(result.stdout).toContain("--format");
  });
});

describe("CLI Error Messages", () => {
  /**
   * Level 2: Integration tests for error message quality
   */

  it("GIVEN error in status command WHEN running THEN error includes 'Error:' prefix", async () => {
    // Given: Non-existent directory
    const cwd = path.join(__dirname, "../../fixtures/repos/no-specs");

    // When: Using scoped command (not deprecated alias)
    const result = await execa("node", [CLI_PATH, "spec", "status"], {
      cwd,
      reject: false,
    });

    // Then
    expect(result.stderr).toMatch(/^Error:/);
  });

  it("GIVEN invalid format option WHEN running status THEN error message is helpful", async () => {
    // Given: Invalid format
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When: Using scoped command (not deprecated alias)
    const result = await execa(
      "node",
      [CLI_PATH, "spec", "status", "--format", "xml"],
      {
        cwd,
        reject: false,
      },
    );

    // Then
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid format \"xml\"");
    expect(result.stderr).toContain("text, json, markdown, table");
  });
});
