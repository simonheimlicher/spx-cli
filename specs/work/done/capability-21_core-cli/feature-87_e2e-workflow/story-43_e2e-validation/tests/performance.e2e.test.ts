/**
 * E2E Performance tests (Level 3)
 *
 * Tests the core success metric: <100ms for 50 work items.
 *
 * Note: E2E tests include Node.js process startup overhead (~50-150ms),
 * so we use a 300ms threshold for E2E testing. The actual CLI execution
 * time (excluding Node.js startup) is verified to be <100ms in unit tests.
 *
 * @see story-43_e2e-validation.story.md
 */
import { describe, it, expect, afterEach } from "vitest";
import { execa } from "execa";
import { resolve } from "node:path";
import { PRESETS, generateFixtureTree } from "@test/helpers/fixture-generator";
import { materializeFixture } from "@test/helpers/fixture-writer";
import type { MaterializedFixture } from "@test/helpers/fixture-writer";

// Path to CLI binary (relative to project root)
const CLI_PATH = resolve(process.cwd(), "bin/spx.js");

// E2E threshold includes Node.js startup overhead (~50-150ms)
// The capability target of <100ms refers to CLI execution time only
const E2E_PERFORMANCE_THRESHOLD_MS = 300;

describe("E2E: Performance", () => {
  let fixture: MaterializedFixture | null = null;

  afterEach(async () => {
    if (fixture) {
      await fixture.cleanup();
      fixture = null;
    }
  });

  describe("FR1: Performance Benchmarks", () => {
    it("GIVEN SHALLOW_50 fixture WHEN running status --json THEN completes within threshold", async () => {
      const tree = generateFixtureTree(PRESETS.SHALLOW_50);
      fixture = await materializeFixture(tree);

      const startTime = Date.now();
      const { stdout, exitCode } = await execa("node", [CLI_PATH, "status", "--json"], {
        cwd: fixture.path,
      });
      const elapsed = Date.now() - startTime;

      expect(exitCode).toBe(0);
      expect(elapsed).toBeLessThan(E2E_PERFORMANCE_THRESHOLD_MS);

      const result = JSON.parse(stdout);
      // SHALLOW_50: 2 caps + 10 feats = 12 items
      // Summary counts capabilities + features only (NOT stories)
      expect(
        result.summary.done + result.summary.inProgress + result.summary.open
      ).toBe(12);
    });

    it("GIVEN DEEP_50 fixture WHEN running status --json THEN completes within threshold", async () => {
      const tree = generateFixtureTree(PRESETS.DEEP_50);
      fixture = await materializeFixture(tree);

      const startTime = Date.now();
      const { stdout, exitCode } = await execa("node", [CLI_PATH, "status", "--json"], {
        cwd: fixture.path,
      });
      const elapsed = Date.now() - startTime;

      expect(exitCode).toBe(0);
      expect(elapsed).toBeLessThan(E2E_PERFORMANCE_THRESHOLD_MS);

      const result = JSON.parse(stdout);
      // DEEP_50: 1 cap + 2 feats = 3 items
      // Summary counts capabilities + features only (NOT stories)
      expect(
        result.summary.done + result.summary.inProgress + result.summary.open
      ).toBe(3);
    });

    it("GIVEN SHALLOW_50 fixture WHEN running status (text) THEN completes within threshold", async () => {
      const tree = generateFixtureTree(PRESETS.SHALLOW_50);
      fixture = await materializeFixture(tree);

      const startTime = Date.now();
      const { exitCode } = await execa("node", [CLI_PATH, "status"], {
        cwd: fixture.path,
      });
      const elapsed = Date.now() - startTime;

      expect(exitCode).toBe(0);
      expect(elapsed).toBeLessThan(E2E_PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe("Performance Consistency", () => {
    it("GIVEN SHALLOW_50 fixture WHEN running 5 times THEN all runs within threshold", async () => {
      const tree = generateFixtureTree(PRESETS.SHALLOW_50);
      fixture = await materializeFixture(tree);

      const times: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await execa("node", [CLI_PATH, "status", "--json"], {
          cwd: fixture.path,
        });
        times.push(Date.now() - startTime);
      }

      expect(Math.max(...times)).toBeLessThan(E2E_PERFORMANCE_THRESHOLD_MS);
    });

    it("GIVEN fixture WHEN running multiple formats THEN all complete within threshold each", async () => {
      const tree = generateFixtureTree(PRESETS.SHALLOW_50);
      fixture = await materializeFixture(tree);

      const formats = ["json", "text", "markdown", "table"];

      for (const format of formats) {
        const args =
          format === "text"
            ? [CLI_PATH, "status"]
            : [CLI_PATH, "status", "--format", format];

        const startTime = Date.now();
        const { exitCode } = await execa("node", args, {
          cwd: fixture.path,
        });
        const elapsed = Date.now() - startTime;

        expect(exitCode).toBe(0);
        expect(elapsed).toBeLessThan(E2E_PERFORMANCE_THRESHOLD_MS);
      }
    });
  });

  describe("Summary Accuracy", () => {
    it("GIVEN fixture with known status distribution WHEN running status --json THEN summary reflects distribution", async () => {
      const config = {
        ...PRESETS.SHALLOW_50,
        statusDistribution: { done: 1, inProgress: 0, open: 0 },
        seed: 42,
      };
      const tree = generateFixtureTree(config);
      fixture = await materializeFixture(tree);

      const { stdout, exitCode } = await execa("node", [CLI_PATH, "status", "--json"], {
        cwd: fixture.path,
      });

      expect(exitCode).toBe(0);

      const result = JSON.parse(stdout);
      // All stories should be DONE
      expect(result.summary.done).toBeGreaterThan(0);
      // Stories should be open = 0 (parents derive DONE from children)
      expect(result.summary.open).toBe(0);
    });
  });
});
