/**
 * Integration tests for TypeScript checking of scripts/ directory
 *
 * These tests verify that scripts/ is properly included in TypeScript validation
 * and that type errors in scripts are caught.
 */

import { execa } from "execa";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("TypeScript checking for scripts/", () => {
  describe("GIVEN project with scripts included in tsconfig", () => {
    it("WHEN running typecheck THEN scripts/ files are validated", async () => {
      // When: Run typecheck
      const result = await execa("npm", ["run", "typecheck"], {
        cwd: process.cwd(),
        reject: false,
      });

      // Then: Command succeeds (scripts/ type-checks correctly)
      expect(result.exitCode).toBe(0);
    });

    it("WHEN scripts/ has type errors THEN typecheck should catch them", async () => {
      // Given: A temporary script with intentional type errors
      let tempDir: string | null = null;

      try {
        // Create a temporary script file with a type error
        tempDir = await mkdtemp(join(tmpdir(), "test-typecheck-"));
        const testScript = join(process.cwd(), "scripts", "test-type-error.ts");

        // Write a file with type errors
        await writeFile(
          testScript,
          `
// Intentional type error for testing
const foo: number = "not a number";

export {};
`,
          "utf-8",
        );

        // When: Run typecheck
        const result = await execa("npm", ["run", "typecheck"], {
          cwd: process.cwd(),
          reject: false,
        });

        // Then: Typecheck fails due to type error in scripts/
        expect(result.exitCode).toBe(2); // tsc exits with code 2 on errors
        expect(result.stderr || result.stdout).toContain("test-type-error.ts");
        expect(result.stderr || result.stdout).toContain("Type 'string' is not assignable to type 'number'");

        // Cleanup
        await rm(testScript);
      } finally {
        if (tempDir) {
          await rm(tempDir, { recursive: true, force: true });
        }
      }
    });
  });

  describe("GIVEN validate.ts with no any types", () => {
    it("WHEN checking logging functions THEN they use string types", async () => {
      // Given: Read validate.ts
      const { readFile } = await import("fs/promises");
      const validatePath = join(process.cwd(), "scripts", "run", "validate.ts");
      const content = await readFile(validatePath, "utf-8");

      // Then: Log functions use string, not any
      const logSection = content.slice(
        content.indexOf("const log = {"),
        content.indexOf("};", content.indexOf("const log = {")) + 2,
      );

      expect(logSection).toContain("message?: string");
      expect(logSection).toContain("optionalParams: unknown[]");
      expect(logSection).not.toContain("message?: any");
      expect(logSection).not.toContain("optionalParams: any[]");
      expect(logSection).not.toContain("@typescript-eslint/no-explicit-any");
    });
  });
});
