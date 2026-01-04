/**
 * Directory walking and filesystem traversal
 */
import fs from "fs/promises";
import path from "path";
import type { DirectoryEntry } from "../types.js";

/**
 * Recursively walk a directory tree and return all subdirectories
 *
 * @param root - Root directory path to start walking from
 * @param visited - Set of visited paths to avoid symlink loops (internal use)
 * @returns Promise resolving to array of directory entries
 * @throws Error if root directory doesn't exist or permission denied
 *
 * @example
 * ```typescript
 * const entries = await walkDirectory("/path/to/specs");
 * // Returns: [{ name: "capability-21_test", path: "/path/to/specs/capability-21_test", isDirectory: true }, ...]
 * ```
 */
export async function walkDirectory(
  root: string,
  visited: Set<string> = new Set()
): Promise<DirectoryEntry[]> {
  // Normalize and resolve path to handle symlinks
  const normalizedRoot = path.resolve(root);

  // Check for symlink loops
  if (visited.has(normalizedRoot)) {
    return []; // Skip already visited directories
  }
  visited.add(normalizedRoot);

  try {
    // Read directory contents
    const entries = await fs.readdir(normalizedRoot, { withFileTypes: true });
    const results: DirectoryEntry[] = [];

    for (const entry of entries) {
      const fullPath = path.join(normalizedRoot, entry.name);

      // Only process directories
      if (entry.isDirectory()) {
        // Add current directory
        results.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
        });

        // Recursively walk subdirectories
        const subEntries = await walkDirectory(fullPath, visited);
        results.push(...subEntries);
      }
    }

    return results;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(
        `Failed to walk directory "${normalizedRoot}": ${error.message}`
      );
    }
    throw error;
  }
}
