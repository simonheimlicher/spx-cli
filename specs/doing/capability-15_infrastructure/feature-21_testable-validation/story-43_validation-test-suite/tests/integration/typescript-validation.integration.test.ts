/**
 * Integration Tests for validateTypeScript()
 *
 * These tests CALL THE ACTUAL FUNCTION validateTypeScript() with real tsc on fixture projects.
 * They verify that validate.ts correctly interprets TypeScript compiler output.
 */

import { getTypeScriptScope, validateTypeScript, VALIDATION_SCOPES } from "@scripts/run/validate";
import { FIXTURES, withTestEnv } from "@test/harness/test-env";
import { describe, expect, it } from "vitest";

describe("validateTypeScript() integration", () => {
  describe("GIVEN fixture with type errors", () => {
    it("WHEN validating THEN detects TypeScript errors", async () => {
      await withTestEnv({ fixture: FIXTURES.WITH_TYPE_ERRORS }, async ({ path }) => {
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
    }, 15000); // Longer timeout for real tsc execution
  });

  describe("GIVEN clean project", () => {
    it("WHEN validating THEN passes", async () => {
      await withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
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
    }, 15000);
  });
});
