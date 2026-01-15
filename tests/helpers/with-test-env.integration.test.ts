/**
 * Integration tests for withTestEnv context manager
 *
 * Level 2: Tests real filesystem operations in os.tmpdir()
 *
 * @see specs/doing/capability-21_core-cli/feature-48_test-harness/story-21_context-manager/
 * @see specs/doing/capability-21_core-cli/feature-48_test-harness/story-32_fixture-integration/
 */
import { existsSync, readdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PRESETS } from "./fixture-generator";
import { withTestEnv } from "./with-test-env";

describe("withTestEnv", () => {
  describe("bare temp directory (default)", () => {
    it("GIVEN no options WHEN called THEN creates temp directory in tmpdir", async () => {
      let capturedPath: string | undefined;

      await withTestEnv(async ({ path }) => {
        capturedPath = path;
        expect(path).toContain(tmpdir());
        expect(path).toContain("spx-test-");
        expect(existsSync(path)).toBe(true);
      });

      // Verify cleanup
      expect(existsSync(capturedPath!)).toBe(false);
    });

    it("GIVEN callback returns value WHEN called THEN returns that value", async () => {
      const result = await withTestEnv(async () => 42);
      expect(result).toBe(42);
    });

    it("GIVEN callback returns object WHEN called THEN returns that object", async () => {
      const result = await withTestEnv(async ({ path }) => ({
        path,
        custom: "value",
      }));
      expect(result.custom).toBe("value");
      expect(result.path).toContain("spx-test-");
    });
  });

  describe("emptySpecs mode", () => {
    it("GIVEN emptySpecs: true WHEN called THEN creates specs/work/doing structure", async () => {
      await withTestEnv({ emptySpecs: true }, async ({ path }) => {
        expect(existsSync(join(path, "specs"))).toBe(true);
        expect(existsSync(join(path, "specs", "work", "doing"))).toBe(true);
      });
    });

    it("GIVEN emptySpecs: true WHEN called THEN specs/work/doing is empty", async () => {
      await withTestEnv({ emptySpecs: true }, async ({ path }) => {
        const contents = readdirSync(join(path, "specs", "work", "doing"));
        expect(contents).toHaveLength(0);
      });
    });

    it("GIVEN emptySpecs: true WHEN completed THEN cleans up", async () => {
      let capturedPath: string | undefined;

      await withTestEnv({ emptySpecs: true }, async ({ path }) => {
        capturedPath = path;
      });

      expect(existsSync(capturedPath!)).toBe(false);
    });
  });

  describe("fixture mode", () => {
    it("GIVEN fixture: PRESETS.MINIMAL WHEN called THEN creates fixture structure", async () => {
      await withTestEnv({ fixture: PRESETS.MINIMAL }, async ({ path }) => {
        const doingPath = join(path, "specs", "work", "doing");
        expect(existsSync(doingPath)).toBe(true);

        const contents = readdirSync(doingPath);
        expect(contents.some((d) => d.startsWith("capability-"))).toBe(true);
      });
    });

    it("GIVEN fixture: PRESETS.MINIMAL WHEN completed THEN cleans up", async () => {
      let capturedPath: string | undefined;

      await withTestEnv({ fixture: PRESETS.MINIMAL }, async ({ path }) => {
        capturedPath = path;
        expect(existsSync(path)).toBe(true);
      });

      expect(existsSync(capturedPath!)).toBe(false);
    });

    it("GIVEN fixture with custom config WHEN called THEN creates matching fixture", async () => {
      const customConfig = {
        capabilities: 2,
        featuresPerCapability: 1,
        storiesPerFeature: 1,
        statusDistribution: { done: 1, inProgress: 0, open: 0 },
      };

      await withTestEnv({ fixture: customConfig }, async ({ path }) => {
        const doingPath = join(path, "specs", "work", "doing");
        const contents = readdirSync(doingPath);
        const caps = contents.filter((d) => d.startsWith("capability-"));
        expect(caps.length).toBe(2);
      });
    });

    it("GIVEN both fixture and emptySpecs WHEN called THEN fixture takes precedence", async () => {
      await withTestEnv(
        { fixture: PRESETS.MINIMAL, emptySpecs: true },
        async ({ path }) => {
          // Should have full fixture structure, not just empty specs
          const doingPath = join(path, "specs", "work", "doing");
          const contents = readdirSync(doingPath);
          expect(contents.some((d) => d.startsWith("capability-"))).toBe(true);
        },
      );
    });
  });

  describe("cleanup behavior", () => {
    it("GIVEN callback throws error WHEN called THEN still cleans up", async () => {
      let capturedPath: string | undefined;

      await expect(
        withTestEnv(async ({ path }) => {
          capturedPath = path;
          throw new Error("test error");
        }),
      ).rejects.toThrow("test error");

      expect(existsSync(capturedPath!)).toBe(false);
    });

    it("GIVEN fixture callback throws WHEN called THEN still cleans up fixture", async () => {
      let capturedPath: string | undefined;

      await expect(
        withTestEnv({ fixture: PRESETS.MINIMAL }, async ({ path }) => {
          capturedPath = path;
          throw new Error("fixture test error");
        }),
      ).rejects.toThrow("fixture test error");

      expect(existsSync(capturedPath!)).toBe(false);
    });

    it("GIVEN directory already deleted by callback WHEN cleanup runs THEN does not throw", async () => {
      // This tests idempotent cleanup
      await withTestEnv(async ({ path }) => {
        // Delete directory inside callback
        await rm(path, { recursive: true });
      });
      // Should not throw
    });

    it("GIVEN emptySpecs directory deleted WHEN cleanup runs THEN does not throw", async () => {
      await withTestEnv({ emptySpecs: true }, async ({ path }) => {
        await rm(path, { recursive: true });
      });
      // Should not throw
    });
  });

  describe("type safety", () => {
    it("GIVEN async function returning void WHEN called THEN returns undefined", async () => {
      const result = await withTestEnv(async () => {
        // void function
      });
      expect(result).toBeUndefined();
    });

    it("GIVEN generic type WHEN called THEN preserves type", async () => {
      interface CustomResult {
        count: number;
        label: string;
      }

      const result = await withTestEnv<CustomResult>(async () => ({
        count: 5,
        label: "test",
      }));

      expect(result.count).toBe(5);
      expect(result.label).toBe("test");
    });
  });
});
