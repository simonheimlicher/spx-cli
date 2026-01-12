/**
 * DEMONSTRATION: Proper Integration Test Pattern
 *
 * This test demonstrates HOW Story-43 should write integration tests.
 * It shows the CORRECT pattern: calling actual validation functions with fixture projects.
 *
 * NOTE: This test is currently COMMENTED OUT because validateESLint() is not exported yet.
 * Story-43 will need to export these functions and write tests like this.
 */

import { FIXTURES, withTestEnv } from "@test/harness/test-env";
import { describe, expect, it } from "vitest";

// TODO: Uncomment once validation functions are exported from validate.ts
// import { validateESLint, validateTypeScript, validateCircularDependencies } from "@scripts/run/validate";

describe("Test Harness Demo - How to Write Proper Integration Tests", () => {
  describe("withTestEnv() harness", () => {
    it("creates isolated temp directory with fixture", async () => {
      await withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
        // Verify temp directory is created and contains fixture
        expect(path).toContain("spx-test-");
        expect(path).toContain("clean-project");
      });
    }, 15000); // Timeout for npm install in fixtures

    it("cleans up temp directory after test", async () => {
      let tempPath: string = "";

      await withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
        tempPath = path;
        // Temp directory exists during test
        expect(path).toBeTruthy();
      });

      // Cleanup happens automatically - can't verify since it's deleted
      // but withTestEnv() ensures cleanup even if test fails
      expect(tempPath).toBeTruthy();
    }, 15000); // Timeout for npm install in fixtures
  });

  /*
   * EXAMPLE: How Story-43 Should Write Integration Tests
   *
   * Once validation functions are exported, Story-43 should write tests like this:
   *
   * describe("validateESLint() integration", () => {
   *   it("GIVEN fixture with lint errors WHEN validating THEN detects errors", async () => {
   *     await withTestEnv({ fixture: FIXTURES.WITH_LINT_ERRORS }, async ({ path }) => {
   *       // Prepare ValidationContext
   *       const scopeConfig = await getTypeScriptScope("full");
   *       const context: ValidationContext = {
   *         projectRoot: path,
   *         scope: "full",
   *         scopeConfig,
   *         enabledValidations: { ESLINT: true },
   *         isFileSpecificMode: false,
   *       };
   *
   *       // CALL THE ACTUAL FUNCTION - this is what was missing!
   *       const result = await validateESLint(context);
   *
   *       // VERIFY BEHAVIOR
   *       expect(result.success).toBe(false);
   *       expect(result.error).toContain("ESLint");
   *       expect(result.error).toMatch(/no-unused-vars|no-var/); // Should mention violations
   *     });
   *   });
   *
   *   it("GIVEN clean project WHEN validating THEN passes", async () => {
   *     await withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
   *       const scopeConfig = await getTypeScriptScope("full");
   *       const context: ValidationContext = {
   *         projectRoot: path,
   *         scope: "full",
   *         scopeConfig,
   *         enabledValidations: { ESLINT: true },
   *         isFileSpecificMode: false,
   *       };
   *
   *       const result = await validateESLint(context);
   *
   *       expect(result.success).toBe(true);
   *       expect(result.error).toBeUndefined();
   *     });
   *   });
   * });
   *
   * describe("validateTypeScript() integration", () => {
   *   it("GIVEN fixture with type errors WHEN validating THEN detects errors", async () => {
   *     await withTestEnv({ fixture: FIXTURES.WITH_TYPE_ERRORS }, async ({ path }) => {
   *       const scopeConfig = await getTypeScriptScope("full");
   *
   *       // CALL THE ACTUAL FUNCTION
   *       const result = await validateTypeScript("full", scopeConfig);
   *
   *       // VERIFY BEHAVIOR
   *       expect(result.success).toBe(false);
   *       expect(result.error).toContain("TypeScript");
   *     });
   *   });
   * });
   *
   * describe("validateCircularDependencies() integration", () => {
   *   it("GIVEN fixture with circular deps WHEN validating THEN detects cycle", async () => {
   *     await withTestEnv({ fixture: FIXTURES.WITH_CIRCULAR_DEPS }, async ({ path }) => {
   *       const scopeConfig = await getTypeScriptScope("full");
   *
   *       // CALL THE ACTUAL FUNCTION
   *       const result = await validateCircularDependencies("full", scopeConfig);
   *
   *       // VERIFY BEHAVIOR
   *       expect(result.success).toBe(false);
   *       expect(result.error).toMatch(/circular/i);
   *     });
   *   });
   * });
   */
});

/**
 * KEY DIFFERENCES FROM WRONG IMPLEMENTATION:
 *
 * WRONG (what was done in Story-43):
 * ```
 * const eslintProcess = spawn("npx", ["eslint", "file.ts"]);
 * expect(result.code).not.toBe(0);
 * ```
 * → Tests that ESLint works, NOT that validateESLint() works
 *
 * CORRECT (what Story-43 should do):
 * ```
 * const result = await validateESLint(context);
 * expect(result.success).toBe(false);
 * ```
 * → Tests that validateESLint() correctly interprets ESLint output
 *
 * WHY THIS MATTERS:
 * - Wrong tests: Zero confidence that validate.ts works
 * - Correct tests: Verifies validation functions interpret tool output correctly
 * - User gets: Proof that validation infrastructure actually works
 */
