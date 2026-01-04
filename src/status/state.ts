/**
 * Status determination state machine for work items
 */
import type { WorkItemStatus } from "../types";
import { access, readdir } from "fs/promises";
import path from "path";

/**
 * Input flags for status determination
 */
export interface StatusFlags {
  /** Whether tests/ directory exists */
  hasTestsDir: boolean;
  /** Whether tests/DONE.md exists */
  hasDoneMd: boolean;
  /** Whether tests/ directory is empty (excluding DONE.md) */
  testsIsEmpty: boolean;
}

/**
 * Determines work item status based on tests/ directory state
 *
 * Truth Table:
 * | hasTestsDir | testsIsEmpty | hasDoneMd | Status      |
 * |-------------|--------------|-----------|-------------|
 * | false       | N/A          | N/A       | OPEN        |
 * | true        | true         | false     | OPEN        |
 * | true        | true         | true      | DONE        |
 * | true        | false        | false     | IN_PROGRESS |
 * | true        | false        | true      | DONE        |
 *
 * @param flags - Status determination flags
 * @returns Work item status as OPEN, IN_PROGRESS, or DONE
 *
 * @example
 * ```typescript
 * // No tests directory
 * determineStatus({ hasTestsDir: false, hasDoneMd: false, testsIsEmpty: true })
 * // => "OPEN"
 *
 * // Tests directory with files, no DONE.md
 * determineStatus({ hasTestsDir: true, hasDoneMd: false, testsIsEmpty: false })
 * // => "IN_PROGRESS"
 *
 * // Tests directory with DONE.md
 * determineStatus({ hasTestsDir: true, hasDoneMd: true, testsIsEmpty: false })
 * // => "DONE"
 * ```
 */
export function determineStatus(flags: StatusFlags): WorkItemStatus {
  // No tests directory → OPEN
  if (!flags.hasTestsDir) {
    return "OPEN";
  }

  // Has DONE.md → DONE (regardless of other files)
  if (flags.hasDoneMd) {
    return "DONE";
  }

  // Has tests directory but empty → OPEN
  if (flags.testsIsEmpty) {
    return "OPEN";
  }

  // Has tests directory with files, no DONE.md → IN_PROGRESS
  return "IN_PROGRESS";
}

/**
 * Checks if a work item has a tests/ directory
 *
 * @param workItemPath - Absolute path to the work item directory
 * @returns Promise resolving to true if tests/ exists, false otherwise
 *
 * @example
 * ```typescript
 * const hasTests = await hasTestsDirectory('/path/to/story-21');
 * // => true if /path/to/story-21/tests exists
 * ```
 */
export async function hasTestsDirectory(
  workItemPath: string
): Promise<boolean> {
  try {
    const testsPath = path.join(workItemPath, "tests");
    await access(testsPath);
    return true;
  } catch (error) {
    // ENOENT means directory doesn't exist → return false
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    // Re-throw permission errors and other failures
    throw error;
  }
}

/**
 * Checks if a tests/ directory is empty (has no test files)
 *
 * A directory is considered empty if it contains no files, or only contains:
 * - DONE.md (completion marker, not a test)
 * - Dotfiles like .gitkeep (version control artifacts, not tests)
 *
 * @param testsPath - Absolute path to the tests/ directory
 * @returns Promise resolving to true if empty, false if has test files
 *
 * @example
 * ```typescript
 * // Directory with only DONE.md
 * await isTestsDirectoryEmpty('/path/to/tests');
 * // => true (DONE.md doesn't count as a test)
 *
 * // Directory with test files
 * await isTestsDirectoryEmpty('/path/to/tests');
 * // => false
 * ```
 */
export async function isTestsDirectoryEmpty(
  testsPath: string
): Promise<boolean> {
  try {
    const entries = await readdir(testsPath);

    // Filter out DONE.md and dotfiles
    const testFiles = entries.filter((entry) => {
      // Exclude DONE.md
      if (entry === "DONE.md") {
        return false;
      }
      // Exclude dotfiles (.gitkeep, .DS_Store, etc.)
      if (entry.startsWith(".")) {
        return false;
      }
      return true;
    });

    // Empty if no test files remain after filtering
    return testFiles.length === 0;
  } catch (error) {
    // ENOENT means directory doesn't exist → treat as empty
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return true;
    }
    // Re-throw permission errors and other failures
    throw error;
  }
}
