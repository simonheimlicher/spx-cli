/**
 * Level 2: Integration Tests for validateCircularDependencies()
 * Story: story-43_validation-test-suite
 *
 * Tests validateCircularDependencies() with real madge on fixture projects.
 * Per ADR-001: Level 2 runs real madge against fixture files.
 */

import { describe, expect, it } from "vitest";

import { getTypeScriptScope, validateCircularDependencies, VALIDATION_SCOPES } from "@/validation";
import { FIXTURES, HARNESS_TIMEOUT, withValidationEnv } from "@test/harness/with-validation-env";

describe("validateCircularDependencies() integration", () => {
  describe("GIVEN fixture with circular dependencies", () => {
    it("WHEN validating THEN detects circular imports", async () => {
      await withValidationEnv({ fixture: FIXTURES.WITH_CIRCULAR_DEPS }, async ({ path }) => {
        // Change to fixture directory for madge analysis
        const originalCwd = process.cwd();
        process.chdir(path);

        try {
          const scopeConfig = getTypeScriptScope(VALIDATION_SCOPES.FULL);

          // CALL THE ACTUAL FUNCTION
          const result = await validateCircularDependencies(VALIDATION_SCOPES.FULL, scopeConfig);

          // VERIFY BEHAVIOR
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          // Error should mention circular dependencies
          expect(result.error).toMatch(/circular/i);

          // Should report the circular dependencies found
          expect(result.circularDependencies).toBeDefined();
          expect(result.circularDependencies).not.toHaveLength(0);
        } finally {
          process.chdir(originalCwd);
        }
      });
    }, HARNESS_TIMEOUT); // Longer timeout for real madge execution
  });

  describe("GIVEN clean project", () => {
    it("WHEN validating THEN passes with no circular dependencies", async () => {
      await withValidationEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
        const originalCwd = process.cwd();
        process.chdir(path);

        try {
          const scopeConfig = getTypeScriptScope(VALIDATION_SCOPES.FULL);

          const result = await validateCircularDependencies(VALIDATION_SCOPES.FULL, scopeConfig);

          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        } finally {
          process.chdir(originalCwd);
        }
      });
    }, HARNESS_TIMEOUT);
  });
});
