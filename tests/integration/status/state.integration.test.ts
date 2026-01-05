/**
 * Level 2: Integration tests for filesystem operations
 * Stories: story-32_detect-tests-dir, story-43_parse-done-md, story-54_status-edge-cases
 */
import { describe, it, expect } from "vitest";
import {
  hasTestsDirectory,
  isTestsDirectoryEmpty,
  hasDoneMd,
  getWorkItemStatus,
  StatusDeterminationError,
} from "@/status/state";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("hasTestsDirectory", () => {
  it("GIVEN work item with tests dir WHEN checking THEN returns true", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/with-tests"
    );

    // When
    const result = await hasTestsDirectory(workItemPath);

    // Then
    expect(result).toBe(true);
  });

  it("GIVEN work item without tests dir WHEN checking THEN returns false", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/no-tests"
    );

    // When
    const result = await hasTestsDirectory(workItemPath);

    // Then
    expect(result).toBe(false);
  });

  it("GIVEN nonexistent work item path WHEN checking THEN returns false", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/does-not-exist"
    );

    // When
    const result = await hasTestsDirectory(workItemPath);

    // Then
    expect(result).toBe(false);
  });
});

describe("isTestsDirectoryEmpty", () => {
  it("GIVEN empty tests dir WHEN checking THEN returns true", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/empty-tests/tests"
    );

    // When
    const result = await isTestsDirectoryEmpty(testsPath);

    // Then
    expect(result).toBe(true);
  });

  it("GIVEN tests dir with test files WHEN checking THEN returns false", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/with-tests/tests"
    );

    // When
    const result = await isTestsDirectoryEmpty(testsPath);

    // Then
    expect(result).toBe(false);
  });

  it("GIVEN tests dir with only DONE.md WHEN checking THEN returns true", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/only-done/tests"
    );

    // When
    const result = await isTestsDirectoryEmpty(testsPath);

    // Then
    expect(result).toBe(true); // DONE.md doesn't count as "has tests"
  });

  it("GIVEN tests dir with .gitkeep only WHEN checking THEN returns true", async () => {
    // Given: .gitkeep and other dotfiles shouldn't count as test files
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/empty-tests/tests"
    );

    // When
    const result = await isTestsDirectoryEmpty(testsPath);

    // Then
    expect(result).toBe(true); // .gitkeep doesn't count as "has tests"
  });
});

describe("hasDoneMd", () => {
  it("GIVEN tests dir with DONE.md WHEN checking THEN returns true", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-item/tests"
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(true);
  });

  it("GIVEN tests dir without DONE.md WHEN checking THEN returns false", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/in-progress/tests"
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(false);
  });

  it("GIVEN DONE.md as directory (not file) WHEN checking THEN returns false", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-is-dir/tests"
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(false); // Directory doesn't count
  });

  it("GIVEN DONE.md with different case WHEN checking THEN returns false", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../fixtures/work-items/wrong-case/tests"
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(false); // Case-sensitive
  });
});

describe("getWorkItemStatus", () => {
  /**
   * Level 2: Integration tests for complete status determination
   * Story: story-54_status-edge-cases
   */

  it("GIVEN work item with no tests dir WHEN getting status THEN returns OPEN", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/no-tests"
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then
    expect(status).toBe("OPEN");
  });

  it("GIVEN work item with tests but no DONE.md WHEN getting status THEN returns IN_PROGRESS", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/in-progress"
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then
    expect(status).toBe("IN_PROGRESS");
  });

  it("GIVEN work item with DONE.md WHEN getting status THEN returns DONE", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-item"
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then
    expect(status).toBe("DONE");
  });

  it("GIVEN work item with empty tests dir WHEN getting status THEN returns OPEN", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/empty-tests"
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then
    expect(status).toBe("OPEN");
  });

  it("GIVEN work item with only DONE.md WHEN getting status THEN returns DONE", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/only-done"
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then
    expect(status).toBe("DONE");
  });

  it("GIVEN work item with DONE.md as directory WHEN getting status THEN returns IN_PROGRESS", async () => {
    // Given: DONE.md exists but is a directory (not a file)
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-is-dir"
    );

    // When
    const status = await getWorkItemStatus(workItemPath);

    // Then: Should treat as no DONE.md
    expect(status).toBe("IN_PROGRESS");
  });

  it("GIVEN non-existent work item WHEN getting status THEN throws StatusDeterminationError", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/does-not-exist"
    );

    // When/Then
    await expect(getWorkItemStatus(workItemPath)).rejects.toThrow(
      StatusDeterminationError
    );
    await expect(getWorkItemStatus(workItemPath)).rejects.toThrow(
      /Failed to determine status/
    );
  });
});

describe("Status determination performance", () => {
  it("GIVEN work item WHEN getting status multiple times THEN completes quickly", async () => {
    // Given
    const workItemPath = path.join(
      __dirname,
      "../../fixtures/work-items/done-item"
    );

    // When: Measure multiple calls
    const iterations = 10;
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      await getWorkItemStatus(workItemPath);
    }
    const elapsed = Date.now() - start;
    const avgTime = elapsed / iterations;

    // Then: Average should be well under 5ms per call
    // Note: This is a rough check, not a precise benchmark
    expect(avgTime).toBeLessThan(10); // Generous threshold for CI environments
  });
});
