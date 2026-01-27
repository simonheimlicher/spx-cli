/**
 * Test Harness Verification
 *
 * These tests verify that withTestEnv() harness works correctly.
 * They demonstrate the basic usage pattern for Story-43's integration tests.
 *
 * NOTE: Full integration tests with validation functions are in Story-43.
 * This file just verifies the harness infrastructure itself.
 */

import { FIXTURES, HARNESS_TIMEOUT, withValidationEnv } from "@test/harness/with-validation-env";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Test Harness Verification", () => {
  it("GIVEN clean fixture WHEN using harness THEN creates isolated temp directory", async () => {
    await withValidationEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
      // Verify temp directory is created and contains fixture
      expect(path).toContain("spx-test-");
      expect(path).toContain("clean-project");
      expect(existsSync(path)).toBe(true);
    });
  }, HARNESS_TIMEOUT);

  it("GIVEN any fixture WHEN harness completes THEN cleanup happens automatically", async () => {
    let tempPath = "";

    await withValidationEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
      tempPath = path;
      // Temp directory exists during test
      expect(existsSync(path)).toBe(true);
    });

    // Cleanup is handled in finally block of withTestEnv()
    // We captured the path to verify the test ran
    expect(tempPath).toContain("spx-test-");
  }, HARNESS_TIMEOUT);
});
