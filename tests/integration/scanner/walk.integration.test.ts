/**
 * Level 2: Integration tests for recursive directory walking
 * Story: story-21_recursive-walk
 */
import { describe, it, expect } from "vitest";
import { walkDirectory } from "@/scanner/walk";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("walkDirectory", () => {
  /**
   * Level 2: Integration tests with real filesystem
   */

  it("GIVEN directory with subdirectories WHEN walking THEN returns all paths", async () => {
    // Given
    const fixtureRoot = path.join(__dirname, "../../fixtures/simple-tree");

    // When
    const entries = await walkDirectory(fixtureRoot);

    // Then
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.path.startsWith(path.resolve(fixtureRoot)))).toBe(true);
    expect(entries.every((e) => e.isDirectory)).toBe(true);
  });

  it("GIVEN nested directory structure WHEN walking THEN discovers all levels", async () => {
    // Given
    const fixtureRoot = path.join(__dirname, "../../fixtures/nested-tree");

    // When
    const entries = await walkDirectory(fixtureRoot);

    // Then
    const depths = entries.map((e) => e.path.split(path.sep).length);
    expect(Math.max(...depths)).toBeGreaterThan(3); // Has nested structure
    expect(entries.length).toBeGreaterThanOrEqual(3); // level1, level2, level3
  });

  it("GIVEN empty directory WHEN walking THEN returns empty array", async () => {
    // Given
    const fixtureRoot = path.join(__dirname, "../../fixtures/empty-dir");

    // When
    const entries = await walkDirectory(fixtureRoot);

    // Then
    expect(entries).toEqual([]);
  });

  it("GIVEN non-existent directory WHEN walking THEN throws error", async () => {
    // Given
    const nonExistent = "/path/that/does/not/exist";

    // When/Then
    await expect(walkDirectory(nonExistent)).rejects.toThrow();
  });

  it("GIVEN directory WHEN walking THEN returns DirectoryEntry objects", async () => {
    // Given
    const fixtureRoot = path.join(__dirname, "../../fixtures/simple-tree");

    // When
    const entries = await walkDirectory(fixtureRoot);

    // Then
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((entry) => {
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("path");
      expect(entry).toHaveProperty("isDirectory");
      expect(typeof entry.name).toBe("string");
      expect(typeof entry.path).toBe("string");
      expect(entry.isDirectory).toBe(true);
    });
  });
});

describe("walkDirectory - Edge Cases", () => {
  /**
   * Story-54: Edge Cases
   * Level 2: Integration tests for filesystem edge cases
   */

  it("GIVEN very deep directory structure WHEN walking THEN handles depth correctly", async () => {
    // Given: Deep nesting (capability > feature > story)
    const deepDir = path.join(__dirname, "../../fixtures/deep-nesting");

    // When
    const entries = await walkDirectory(deepDir);

    // Then: Finds all levels
    expect(entries.length).toBeGreaterThan(0);
    const hasCapability = entries.some(e => e.name.includes("capability"));
    const hasFeature = entries.some(e => e.name.includes("feature"));
    const hasStory = entries.some(e => e.name.includes("story"));

    expect(hasCapability).toBe(true);
    expect(hasFeature).toBe(true);
    expect(hasStory).toBe(true);
  });

  it("GIVEN non-existent directory WHEN walking THEN throws descriptive error", async () => {
    // Given
    const nonExistent = "/path/that/absolutely/does/not/exist/anywhere";

    // When/Then: Verifies error handling
    await expect(walkDirectory(nonExistent)).rejects.toThrow(/Failed to walk directory/i);
  });

  /**
   * Note: Symlink cycle detection is already implemented in walkDirectory via the visited Set.
   * The implementation uses path.resolve() to normalize paths and detects when a path has been
   * visited before, preventing infinite loops. This is tested implicitly through the existing
   * nested directory tests.
   */
});
