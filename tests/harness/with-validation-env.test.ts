import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIXTURES, HARNESS_TIMEOUT, withValidationEnv } from "./with-validation-env";

describe("withValidationEnv()", () => {
  it(
    "creates temp directory with clean project fixture",
    async () => {
      let capturedPath = "";

      await withValidationEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
        capturedPath = path;

        // Verify temp directory exists during test
        expect(existsSync(path)).toBe(true);

        // Verify fixture name in path
        expect(path).toContain("clean-project");

        // Verify temp prefix
        expect(path).toContain("spx-test-");
      });

      // Note: Can't verify cleanup since directory is already deleted
      expect(capturedPath).toBeTruthy();
    },
    HARNESS_TIMEOUT,
  );

  it(
    "creates temp directory with type errors fixture",
    async () => {
      await withValidationEnv({ fixture: FIXTURES.WITH_TYPE_ERRORS }, async ({ path }) => {
        expect(existsSync(path)).toBe(true);
        expect(path).toContain("with-type-errors");
      });
    },
    HARNESS_TIMEOUT,
  );

  it(
    "creates temp directory with lint errors fixture",
    async () => {
      await withValidationEnv({ fixture: FIXTURES.WITH_LINT_ERRORS }, async ({ path }) => {
        expect(existsSync(path)).toBe(true);
        expect(path).toContain("with-lint-errors");
      });
    },
    HARNESS_TIMEOUT,
  );

  it(
    "creates temp directory with circular deps fixture",
    async () => {
      await withValidationEnv({ fixture: FIXTURES.WITH_CIRCULAR_DEPS }, async ({ path }) => {
        expect(existsSync(path)).toBe(true);
        expect(path).toContain("with-circular-deps");
      });
    },
    HARNESS_TIMEOUT,
  );

  it("exports all expected fixture constants", () => {
    expect(FIXTURES.CLEAN_PROJECT).toBe("clean-project");
    expect(FIXTURES.WITH_TYPE_ERRORS).toBe("with-type-errors");
    expect(FIXTURES.WITH_LINT_ERRORS).toBe("with-lint-errors");
    expect(FIXTURES.WITH_CIRCULAR_DEPS).toBe("with-circular-deps");
  });

  it(
    "cleans up temp directory even when callback throws error",
    async () => {
      let capturedPath = "";

      await expect(
        withValidationEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
          capturedPath = path;
          // Verify directory exists during callback
          expect(existsSync(path)).toBe(true);
          throw new Error("Test callback intentionally failed");
        }),
      ).rejects.toThrow("Test callback intentionally failed");

      // Verify cleanup still happened despite error
      expect(existsSync(capturedPath)).toBe(false);
    },
    HARNESS_TIMEOUT,
  );

  it(
    "propagates error when fixture directory doesn't exist",
    async () => {
      await expect(
        withValidationEnv(
          { fixture: "nonexistent-fixture" as typeof FIXTURES.CLEAN_PROJECT },
          async () => {},
        ),
      ).rejects.toThrow(/ENOENT|no such file or directory/i);
    },
    HARNESS_TIMEOUT,
  );

  it(
    "copies all fixture files to temp directory",
    async () => {
      await withValidationEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
        const { join } = await import("node:path");
        // Verify key files were copied
        expect(existsSync(join(path, "package.json"))).toBe(true);
        expect(existsSync(join(path, "tsconfig.json"))).toBe(true);
        expect(existsSync(join(path, "eslint.config.ts"))).toBe(true);
        expect(existsSync(join(path, "src"))).toBe(true);
        expect(existsSync(join(path, "src/clean.ts"))).toBe(true);
      });
    },
    HARNESS_TIMEOUT,
  );
});
