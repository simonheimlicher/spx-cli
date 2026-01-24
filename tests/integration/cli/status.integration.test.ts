/**
 * Level 2: Integration tests for CLI status command
 * Stories: story-21_status-command, story-43_format-options
 */
import { execa } from "execa";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, "../../../bin/spx.js");

describe("spx spec status command", () => {
  /**
   * Level 2: Integration tests with real CLI and Commander.js
   */

  it("GIVEN fixture repo WHEN running status THEN outputs tree", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When
    const { stdout, exitCode } = await execa("node", [CLI_PATH, "spec", "status"], {
      cwd,
    });

    // Then
    expect(exitCode).toBe(0);
    expect(stdout).toContain("capability-");
    expect(stdout).toContain("feature-");
    expect(stdout).toContain("story-");
  });

  it("GIVEN empty repo WHEN running status THEN shows no work items", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/empty");

    // When
    const { stdout, exitCode } = await execa("node", [CLI_PATH, "spec", "status"], {
      cwd,
    });

    // Then
    expect(exitCode).toBe(0);
    expect(stdout).toContain("No work items found");
  });

  it("GIVEN non-existent specs directory WHEN running status THEN shows error", async () => {
    // Given: Directory with no specs/doing folder
    const cwd = path.join(__dirname, "../../fixtures");

    // When
    const result = await execa("node", [CLI_PATH, "spec", "status"], {
      cwd,
      reject: false,
    });

    // Then
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error:");
  });
});

describe("spx spec status --json", () => {
  /**
   * Level 2: Integration tests for --json flag
   * Stories: story-43_format-options, story-31_cli-integration
   */

  it("GIVEN --json flag WHEN running status THEN outputs valid JSON", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When
    const { stdout, exitCode } = await execa(
      "node",
      [CLI_PATH, "spec", "status", "--json"],
      { cwd },
    );

    // Then
    expect(exitCode).toBe(0);
    expect(() => JSON.parse(stdout)).not.toThrow();
    const parsed = JSON.parse(stdout);
    expect(parsed.capabilities).toBeDefined();
  });

  it("GIVEN --json flag WHEN running status THEN includes config values", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When
    const { stdout, exitCode } = await execa(
      "node",
      [CLI_PATH, "spec", "status", "--json"],
      { cwd },
    );

    // Then
    expect(exitCode).toBe(0);
    const parsed = JSON.parse(stdout);

    // Verify config is included in output (Story 31)
    expect(parsed.config).toBeDefined();
    expect(parsed.config.specs.root).toBe("specs");
    expect(parsed.config.specs.work.dir).toBe("work");
    expect(parsed.config.specs.work.statusDirs.doing).toBe("doing");
    expect(parsed.config.sessions.dir).toBe(".spx/sessions");
  });
});

describe("spx spec status --format", () => {
  /**
   * Level 2: Integration tests for --format option
   * Story: story-43_format-options
   */

  it("GIVEN --format json WHEN running status THEN outputs JSON", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When
    const { stdout, exitCode } = await execa(
      "node",
      [CLI_PATH, "spec", "status", "--format", "json"],
      { cwd },
    );

    // Then
    expect(exitCode).toBe(0);
    expect(() => JSON.parse(stdout)).not.toThrow();
  });

  it("GIVEN --format markdown WHEN running status THEN outputs markdown", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When
    const { stdout, exitCode } = await execa(
      "node",
      [CLI_PATH, "spec", "status", "--format", "markdown"],
      { cwd },
    );

    // Then
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/^#/m); // Markdown headers start with #
  });

  it("GIVEN --format table WHEN running status THEN outputs table", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When
    const { stdout, exitCode } = await execa(
      "node",
      [CLI_PATH, "spec", "status", "--format", "table"],
      { cwd },
    );

    // Then
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/\|.*\|/); // Table rows contain |
  });

  it("GIVEN --format text WHEN running status THEN outputs text tree", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When
    const { stdout, exitCode } = await execa(
      "node",
      [CLI_PATH, "spec", "status", "--format", "text"],
      { cwd },
    );

    // Then
    expect(exitCode).toBe(0);
    expect(stdout).toContain("capability-");
    expect(stdout).toContain("feature-");
  });

  it("GIVEN invalid format WHEN running status THEN shows error", async () => {
    // Given
    const cwd = path.join(__dirname, "../../fixtures/repos/simple");

    // When
    const result = await execa(
      "node",
      [CLI_PATH, "spec", "status", "--format", "invalid"],
      { cwd, reject: false },
    );

    // Then
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid format \"invalid\"");
  });
});
