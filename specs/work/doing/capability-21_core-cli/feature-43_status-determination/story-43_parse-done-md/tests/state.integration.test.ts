/**
 * Level 2: Integration tests for DONE.md detection
 * Story: story-43_parse-done-md
 */
import { describe, it, expect } from "vitest";
import { hasDoneMd } from "@/status/state";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("hasDoneMd", () => {
  it("GIVEN tests dir with DONE.md WHEN checking THEN returns true", async () => {
    // Given
    const testsPath = path.join(
      __dirname,
      "../../../../../../tests/fixtures/work-items/done-item/tests"
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
      "../../../../../../tests/fixtures/work-items/in-progress/tests"
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
      "../../../../../../tests/fixtures/work-items/done-is-dir/tests"
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
      "../../../../../../tests/fixtures/work-items/wrong-case/tests"
    );

    // When
    const result = await hasDoneMd(testsPath);

    // Then
    expect(result).toBe(false); // Case-sensitive
  });
});
