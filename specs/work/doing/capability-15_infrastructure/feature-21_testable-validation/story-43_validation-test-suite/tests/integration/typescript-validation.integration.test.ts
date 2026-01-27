/**
 * Level 2: Integration Tests for validateTypeScript()
 * Story: story-43_validation-test-suite
 *
 * Tests validateTypeScript() with real tsc on fixture projects.
 * Per ADR-001: Level 2 runs real tsc against fixture files.
 */

import { describe, expect, it } from "vitest";

import { getTypeScriptScope, validateTypeScript, VALIDATION_SCOPES } from "@/validation";
import { FIXTURES, HARNESS_TIMEOUT, withValidationEnv } from "@test/harness/with-validation-env";

describe("validateTypeScript() integration", () => {
  describe("GIVEN fixture with type errors", () => {
    it("WHEN validating THEN detects TypeScript errors", async () => {
      await withValidationEnv({ fixture: FIXTURES.WITH_TYPE_ERRORS }, async ({ path }) => {
        // Change to fixture directory so tsc uses the fixture's tsconfig.json
        const originalCwd = process.cwd();
        process.chdir(path);

        try {
          const scopeConfig = getTypeScriptScope(VALIDATION_SCOPES.FULL);

          // CALL THE ACTUAL FUNCTION
          const result = await validateTypeScript(
            VALIDATION_SCOPES.FULL,
            scopeConfig,
            undefined, // No specific files, full validation
          );

          // VERIFY BEHAVIOR
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          // Error should mention TypeScript or type error
          expect(result.error).toMatch(/typescript|type/i);
        } finally {
          process.chdir(originalCwd);
        }
      });
    }, HARNESS_TIMEOUT); // Longer timeout for real tsc execution
  });

  describe("GIVEN clean project", () => {
    it("WHEN validating THEN passes", async () => {
      await withValidationEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
        const originalCwd = process.cwd();
        process.chdir(path);

        try {
          const scopeConfig = getTypeScriptScope(VALIDATION_SCOPES.FULL);

          const result = await validateTypeScript(VALIDATION_SCOPES.FULL, scopeConfig, undefined);

          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        } finally {
          process.chdir(originalCwd);
        }
      });
    }, HARNESS_TIMEOUT);
  });
});
