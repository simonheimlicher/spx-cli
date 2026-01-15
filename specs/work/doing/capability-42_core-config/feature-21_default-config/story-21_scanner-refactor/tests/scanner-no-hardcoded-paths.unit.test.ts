/**
 * Meta-Test: Verify No Hardcoded Paths in Scanner and Commands
 *
 * This test ensures that the scanner refactoring is complete and no
 * hardcoded path strings remain in the scanner source code or commands
 * that use it.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Recursively find all .ts files in a directory
 */
async function findTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findTsFiles(fullPath)));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("Story 21: Scanner Has No Hardcoded Paths", () => {
  it("GIVEN scanner source files WHEN searching for hardcoded paths THEN none are found", async () => {
    // Find all scanner source files (including the Scanner class)
    const scannerFiles = await findTsFiles("src/scanner");

    // Patterns that indicate hardcoded paths in path construction
    // Note: These patterns look for string literals used in path.join or similar
    const hardcodedPatterns = [
      /path\.join\([^)]*["']specs["']/, // path.join(..., "specs", ...)
      /path\.join\([^)]*["']work["']/, // path.join(..., "work", ...)
      /path\.join\([^)]*["']doing["']/, // path.join(..., "doing", ...)
      /path\.join\([^)]*["']backlog["']/, // path.join(..., "backlog", ...)
      /path\.join\([^)]*["']archive["']/, // path.join(..., "archive", ...)
      /path\.join\([^)]*["']done["']/, // path.join(..., "done", ...)
    ];

    const violations: Array<{ file: string; line: number; content: string }> = [];

    // Check each file for hardcoded patterns
    for (const file of scannerFiles) {
      const content = await fs.readFile(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // Skip comments and imports
        if (
          line.trim().startsWith("//")
          || line.trim().startsWith("*")
          || line.trim().startsWith("import")
        ) {
          return;
        }

        for (const pattern of hardcodedPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      });
    }

    // Assert no violations found
    if (violations.length > 0) {
      const violationDetails = violations
        .map((v) => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join("\n\n");

      throw new Error(
        `Found ${violations.length} hardcoded path(s) in scanner files:\n\n${violationDetails}\n\nAll paths must come from config parameter.`,
      );
    }

    expect(violations.length).toBe(0);
  });

  it("GIVEN command files using scanner WHEN searching for hardcoded paths THEN none are found", async () => {
    // Check command files that use the scanner
    const commandFiles = [
      "src/commands/spec/status.ts",
      "src/commands/spec/next.ts",
    ];

    // Patterns that indicate hardcoded paths
    const hardcodedPatterns = [
      /path\.join\([^)]*["']specs["']/, // path.join(..., "specs", ...)
      /path\.join\([^)]*["']work["']/, // path.join(..., "work", ...)
      /path\.join\([^)]*["']doing["']/, // path.join(..., "doing", ...)
    ];

    const violations: Array<{ file: string; line: number; content: string }> = [];

    // Check each file for hardcoded patterns
    for (const file of commandFiles) {
      try {
        const content = await fs.readFile(file, "utf-8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          // Skip comments
          if (
            line.trim().startsWith("//")
            || line.trim().startsWith("*")
            || line.trim().startsWith("import")
          ) {
            return;
          }

          for (const pattern of hardcodedPatterns) {
            if (pattern.test(line)) {
              violations.push({
                file,
                line: index + 1,
                content: line.trim(),
              });
            }
          }
        });
      } catch {
        // File doesn't exist - skip
      }
    }

    // Assert no violations found
    if (violations.length > 0) {
      const violationDetails = violations
        .map((v) => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join("\n\n");

      throw new Error(
        `Found ${violations.length} hardcoded path(s) in command files:\n\n${violationDetails}\n\nCommands must use Scanner with config injection.`,
      );
    }

    expect(violations.length).toBe(0);
  });

  it("GIVEN Scanner class WHEN checking imports THEN uses config types", async () => {
    const scannerContent = await fs.readFile("src/scanner/scanner.ts", "utf-8");

    // Verify Scanner imports SpxConfig
    expect(scannerContent).toContain("SpxConfig");

    // Verify Scanner constructor uses config
    expect(scannerContent).toMatch(/constructor\s*\([^)]*config:\s*SpxConfig/);
  });

  it("GIVEN command files WHEN checking imports THEN use Scanner and DEFAULT_CONFIG", async () => {
    const statusContent = await fs.readFile(
      "src/commands/spec/status.ts",
      "utf-8",
    );
    const nextContent = await fs.readFile(
      "src/commands/spec/next.ts",
      "utf-8",
    );

    // Verify both commands import Scanner
    expect(statusContent).toContain("from \"../../scanner/scanner.js\"");
    expect(nextContent).toContain("from \"../../scanner/scanner.js\"");

    // Verify both commands import DEFAULT_CONFIG
    expect(statusContent).toContain("from \"../../config/defaults.js\"");
    expect(nextContent).toContain("from \"../../config/defaults.js\"");

    // Verify both commands use Scanner with DEFAULT_CONFIG
    expect(statusContent).toContain("new Scanner(");
    expect(statusContent).toContain("DEFAULT_CONFIG");
    expect(nextContent).toContain("new Scanner(");
    expect(nextContent).toContain("DEFAULT_CONFIG");
  });
});
