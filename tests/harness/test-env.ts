import { spawn } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Fixture project constants for validation tests.
 * These fixtures are minimal projects with specific validation failures.
 */
export const FIXTURES = {
  WITH_TYPE_ERRORS: "with-type-errors",
  WITH_LINT_ERRORS: "with-lint-errors",
  WITH_CIRCULAR_DEPS: "with-circular-deps",
  CLEAN_PROJECT: "clean-project",
} as const;

export type FixtureName = (typeof FIXTURES)[keyof typeof FIXTURES];

/**
 * Test environment context provided to test callbacks.
 */
export interface TestEnvContext {
  /** Absolute path to the temporary test directory containing the fixture project */
  path: string;
}

/**
 * Options for creating a test environment.
 */
export interface TestEnvOptions {
  /** Name of the fixture project to copy from tests/fixtures/projects/ */
  fixture: FixtureName;
}

/**
 * Creates an isolated test environment with a fixture project.
 *
 * This harness:
 * 1. Creates a temporary directory
 * 2. Copies the specified fixture project into it
 * 3. Runs the test callback with the temp directory path
 * 4. Cleans up the temp directory after the test (even if test fails)
 *
 * @param opts - Configuration for the test environment
 * @param testFn - Test callback that receives the environment context
 *
 * @example
 * ```typescript
 * await withTestEnv({ fixture: FIXTURES.WITH_TYPE_ERRORS }, async ({ path }) => {
 *   const result = await validateTypeScript(path, ...);
 *   expect(result.success).toBe(false);
 * });
 * ```
 */
/**
 * Helper function to install npm dependencies in a directory.
 */
async function installDependencies(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const npmProcess = spawn("npm", ["install", "--silent"], {
      cwd,
      stdio: "pipe", // Suppress output unless there's an error
    });

    let errorOutput = "";
    npmProcess.stderr?.on("data", (data) => {
      errorOutput += data.toString();
    });

    npmProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}: ${errorOutput}`));
      }
    });

    npmProcess.on("error", (error) => {
      reject(new Error(`Failed to spawn npm install: ${error.message}`));
    });
  });
}

export async function withTestEnv(
  opts: TestEnvOptions,
  testFn: (context: TestEnvContext) => Promise<void>,
): Promise<void> {
  // Create temp directory with unique prefix
  const tempDir = await mkdtemp(join(tmpdir(), "spx-test-"));

  try {
    // Copy fixture project to temp directory
    const fixtureSource = join(process.cwd(), "tests", "fixtures", "projects", opts.fixture);
    const fixtureDest = join(tempDir, opts.fixture);

    await cp(fixtureSource, fixtureDest, { recursive: true });

    // Install dependencies (TypeScript, etc.) in the fixture
    await installDependencies(fixtureDest);

    // Run test callback with context
    await testFn({ path: fixtureDest });
  } finally {
    // Always clean up temp directory, even if test fails
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      // Log cleanup errors but don't fail the test
      // tempDir is system-generated via mkdtemp(), not user input - safe for format strings
      console.warn(`Warning: Failed to clean up temp directory ${tempDir}:`, cleanupError); // nosemgrep
    }
  }
}
