/**
 * Integration Tests for validateESLint()
 *
 * These tests CALL THE ACTUAL FUNCTION validate ESLint() with real ESLint on fixture projects.
 * They verify that validate.ts correctly interprets ESLint output.
 */

import {
  getTypeScriptScope,
  validateESLint,
  VALIDATION_SCOPES,
  type ValidationContext,
} from "@scripts/run/validate";
import { FIXTURES, withTestEnv } from "@test/harness/test-env";
import { describe, expect, it } from "vitest";

describe("validateESLint() integration", () => {
  describe("GIVEN fixture with lint errors", () => {
    it("WHEN validating THEN detects ESLint violations", async () => {
      await withTestEnv({ fixture: FIXTURES.WITH_LINT_ERRORS }, async ({ path }) => {
        // Change to fixture directory
        const originalCwd = process.cwd();
        process.chdir(path);

        try {
          // Prepare ValidationContext
          const scopeConfig = getTypeScriptScope(VALIDATION_SCOPES.FULL);
          const context: ValidationContext = {
            projectRoot: path,
            scope: VALIDATION_SCOPES.FULL,
            scopeConfig,
            enabledValidations: { ESLINT: true },
            isFileSpecificMode: false,
          };

          // CALL THE ACTUAL FUNCTION - this is what was missing!
          const result = await validateESLint(context);

          // VERIFY BEHAVIOR
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          // Error message should mention ESLint
          expect(result.error).toMatch(/eslint/i);
        } finally {
          process.chdir(originalCwd);
        }
      });
    }, 15000); // Longer timeout for real ESLint execution
  });

  describe("GIVEN clean project", () => {
    it("WHEN validating THEN passes", async () => {
      await withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
        const originalCwd = process.cwd();
        process.chdir(path);

        try {
          const scopeConfig = getTypeScriptScope(VALIDATION_SCOPES.FULL);
          const context: ValidationContext = {
            projectRoot: path,
            scope: VALIDATION_SCOPES.FULL,
            scopeConfig,
            enabledValidations: { ESLINT: true },
            isFileSpecificMode: false,
          };

          const result = await validateESLint(context);

          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        } finally {
          process.chdir(originalCwd);
        }
      });
    }, 15000);
  });
});
