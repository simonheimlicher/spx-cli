import {
  buildEslintArgs,
  buildTypeScriptArgs,
  EXECUTION_MODES,
  VALIDATION_SCOPES,
} from "@scripts/run/validate";
import { describe, expect, it } from "vitest";

describe("buildEslintArgs()", () => {
  describe("GIVEN full project mode", () => {
    it("WHEN mode is read THEN includes cache args and no --fix", () => {
      const args = buildEslintArgs({
        validatedFiles: undefined,
        mode: EXECUTION_MODES.READ,
        cacheFile: "/tmp/eslint-cache",
      });

      expect(args).toEqual([
        "eslint",
        ".",
        "--config",
        "eslint.config.ts",
        "--cache",
        "--cache-location",
        "/tmp/eslint-cache",
      ]);
    });

    it("WHEN mode is write THEN includes cache args and --fix", () => {
      const args = buildEslintArgs({
        validatedFiles: undefined,
        mode: EXECUTION_MODES.WRITE,
        cacheFile: "/tmp/eslint-cache",
      });

      expect(args).toEqual([
        "eslint",
        ".",
        "--config",
        "eslint.config.ts",
        "--cache",
        "--cache-location",
        "/tmp/eslint-cache",
        "--fix",
      ]);
    });

    it("WHEN mode is undefined THEN no --fix flag", () => {
      const args = buildEslintArgs({
        validatedFiles: undefined,
        mode: undefined,
        cacheFile: "/tmp/eslint-cache",
      });

      expect(args).not.toContain("--fix");
    });
  });

  describe("GIVEN file-specific mode", () => {
    it("WHEN single file THEN includes separator and file path", () => {
      const args = buildEslintArgs({
        validatedFiles: ["src/file.ts"],
        mode: EXECUTION_MODES.READ,
        cacheFile: "/tmp/eslint-cache",
      });

      expect(args).toEqual([
        "eslint",
        "--config",
        "eslint.config.ts",
        "--cache",
        "--cache-location",
        "/tmp/eslint-cache",
        "--",
        "src/file.ts",
      ]);
    });

    it("WHEN multiple files THEN includes all files after separator", () => {
      const args = buildEslintArgs({
        validatedFiles: ["src/a.ts", "src/b.ts", "tests/c.test.ts"],
        mode: EXECUTION_MODES.READ,
        cacheFile: "/tmp/eslint-cache",
      });

      expect(args).toContain("--");
      expect(args).toContain("src/a.ts");
      expect(args).toContain("src/b.ts");
      expect(args).toContain("tests/c.test.ts");
    });

    it("WHEN file-specific with write mode THEN includes --fix", () => {
      const args = buildEslintArgs({
        validatedFiles: ["src/file.ts"],
        mode: EXECUTION_MODES.WRITE,
        cacheFile: "/tmp/eslint-cache",
      });

      expect(args).toContain("--fix");
      expect(args).toContain("src/file.ts");
    });

    it("WHEN empty files array THEN treats as full project mode", () => {
      const args = buildEslintArgs({
        validatedFiles: [],
        mode: EXECUTION_MODES.READ,
        cacheFile: "/tmp/eslint-cache",
      });

      expect(args).toEqual([
        "eslint",
        ".",
        "--config",
        "eslint.config.ts",
        "--cache",
        "--cache-location",
        "/tmp/eslint-cache",
      ]);
    });
  });
});

describe("buildTypeScriptArgs()", () => {
  describe("GIVEN full scope", () => {
    it("WHEN scope is full THEN uses tsc with --noEmit", () => {
      const args = buildTypeScriptArgs({
        scope: VALIDATION_SCOPES.FULL,
        configFile: "tsconfig.json",
      });

      expect(args).toEqual(["tsc", "--noEmit"]);
    });
  });

  describe("GIVEN production scope", () => {
    it("WHEN scope is production THEN uses tsc with --project and configFile", () => {
      const args = buildTypeScriptArgs({
        scope: VALIDATION_SCOPES.PRODUCTION,
        configFile: "tsconfig.production.json",
      });

      expect(args).toEqual(["tsc", "--project", "tsconfig.production.json"]);
    });
  });
});
