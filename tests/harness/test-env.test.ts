import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIXTURES, withTestEnv } from "./test-env";

const TIMEOUT_LONG = 30_000;

describe("withTestEnv()", () => {
  it(
    "creates temp directory with clean project fixture",
    async () => {
      let capturedPath = "";

      await withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
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
    TIMEOUT_LONG,
  );

  it(
    "creates temp directory with type errors fixture",
    async () => {
      await withTestEnv({ fixture: FIXTURES.WITH_TYPE_ERRORS }, async ({ path }) => {
        expect(existsSync(path)).toBe(true);
        expect(path).toContain("with-type-errors");
      });
    },
    TIMEOUT_LONG,
  );

  it(
    "creates temp directory with lint errors fixture",
    async () => {
      await withTestEnv({ fixture: FIXTURES.WITH_LINT_ERRORS }, async ({ path }) => {
        expect(existsSync(path)).toBe(true);
        expect(path).toContain("with-lint-errors");
      });
    },
    TIMEOUT_LONG,
  );

  it(
    "creates temp directory with circular deps fixture",
    async () => {
      await withTestEnv({ fixture: FIXTURES.WITH_CIRCULAR_DEPS }, async ({ path }) => {
        expect(existsSync(path)).toBe(true);
        expect(path).toContain("with-circular-deps");
      });
    },
    TIMEOUT_LONG,
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
        withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
          capturedPath = path;
          // Verify directory exists during callback
          expect(existsSync(path)).toBe(true);
          throw new Error("Test callback intentionally failed");
        }),
      ).rejects.toThrow("Test callback intentionally failed");

      // Verify cleanup still happened despite error
      expect(existsSync(capturedPath)).toBe(false);
    },
    TIMEOUT_LONG,
  );

  it(
    "propagates error when fixture directory doesn't exist",
    async () => {
      await expect(
        withTestEnv(
          { fixture: "nonexistent-fixture" as typeof FIXTURES.CLEAN_PROJECT },
          async () => {},
        ),
      ).rejects.toThrow(/ENOENT|no such file or directory/i);
    },
    TIMEOUT_LONG,
  );

  it(
    "copies all fixture files to temp directory",
    async () => {
      await withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
        const { join } = await import("node:path");
        // Verify key files were copied
        expect(existsSync(join(path, "package.json"))).toBe(true);
        expect(existsSync(join(path, "tsconfig.json"))).toBe(true);
        expect(existsSync(join(path, "eslint.config.ts"))).toBe(true);
        expect(existsSync(join(path, "src"))).toBe(true);
        expect(existsSync(join(path, "src/clean.ts"))).toBe(true);
      });
    },
    TIMEOUT_LONG,
  );
});
