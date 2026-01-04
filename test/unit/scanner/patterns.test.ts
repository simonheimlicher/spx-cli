/**
 * Level 1: Pure function tests for pattern matching
 * Stories: story-21_parse-capability-names, story-32_parse-feature-names, story-43_parse-story-names
 */
import { describe, it, expect } from "vitest";
import { parseWorkItemName } from "@/scanner/patterns";

describe("parseWorkItemName - Capabilities", () => {
  it("GIVEN valid capability name WHEN parsing THEN extracts kind, number, and slug", () => {
    // Given
    const dirName = "capability-21_core-cli";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result).toEqual({
      kind: "capability",
      number: 20,
      slug: "core-cli",
    });
  });

  it("GIVEN capability with multi-word slug WHEN parsing THEN preserves kebab-case", () => {
    // Given
    const dirName = "capability-30_mcp-server-integration";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("mcp-server-integration");
  });

  it("GIVEN capability with uppercase letters WHEN parsing THEN rejects pattern", () => {
    // Given
    const dirName = "capability-21_CoreCLI";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("Invalid work item name");
  });

  it("GIVEN capability with invalid number WHEN parsing THEN rejects pattern", () => {
    // Given
    const dirName = "capability-5_too-low";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("BSP number must be between 10 and 99");
  });

  it("GIVEN non-capability pattern WHEN parsing THEN returns error", () => {
    // Given
    const dirName = "random-directory";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("Invalid work item name");
  });
});

describe("parseWorkItemName - Features", () => {
  it("GIVEN valid feature name WHEN parsing THEN extracts kind, number, and slug", () => {
    // Given
    const dirName = "feature-21_pattern-matching";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result).toEqual({
      kind: "feature",
      number: 21,
      slug: "pattern-matching",
    });
  });

  it("GIVEN feature with multi-word slug WHEN parsing THEN preserves kebab-case", () => {
    // Given
    const dirName = "feature-32_directory-walking-integration";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("directory-walking-integration");
  });

  it("GIVEN capability and feature with same number WHEN parsing THEN distinguishes by kind", () => {
    // Given
    const capabilityName = "capability-21_core-cli";
    const featureName = "feature-20_some-feature";

    // When
    const capResult = parseWorkItemName(capabilityName);
    const featResult = parseWorkItemName(featureName);

    // Then
    expect(capResult.kind).toBe("capability");
    expect(featResult.kind).toBe("feature");
    expect(capResult.number).toBe(featResult.number);
  });

  it("GIVEN feature with invalid BSP number WHEN parsing THEN rejects pattern", () => {
    // Given
    const dirName = "feature-100_too-high";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("BSP number must be between 10 and 99");
  });
});

describe("parseWorkItemName - Kind Detection", () => {
  it("GIVEN mixed work items WHEN parsing THEN correctly identifies each kind", () => {
    // Given
    const testCases = [
      { input: "capability-21_test", expectedKind: "capability" },
      { input: "feature-21_test", expectedKind: "feature" },
    ];

    // When/Then
    testCases.forEach(({ input, expectedKind }) => {
      const result = parseWorkItemName(input);
      expect(result.kind).toBe(expectedKind);
    });
  });
});

describe("parseWorkItemName - Stories", () => {
  it("GIVEN valid story name WHEN parsing THEN extracts kind, number, and slug", () => {
    // Given
    const dirName = "story-21_parse-capability-names";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result).toEqual({
      kind: "story",
      number: 21,
      slug: "parse-capability-names",
    });
  });

  it("GIVEN story with multi-word slug WHEN parsing THEN preserves kebab-case", () => {
    // Given
    const dirName = "story-54_validate-bsp-numbers-range";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("validate-bsp-numbers-range");
  });

  it("GIVEN story with invalid BSP number WHEN parsing THEN rejects pattern", () => {
    // Given
    const dirName = "story-05_too-low";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("BSP number must be between 10 and 99");
  });
});

describe("parseWorkItemName - Complete Pattern Coverage", () => {
  it("GIVEN all three kinds WHEN parsing THEN returns consistent structure", () => {
    // Given
    const testCases = [
      { input: "capability-21_core-cli", expectedKind: "capability" },
      { input: "feature-21_pattern-matching", expectedKind: "feature" },
      { input: "story-32_parse-features", expectedKind: "story" },
    ];

    // When/Then
    testCases.forEach(({ input, expectedKind }) => {
      const result = parseWorkItemName(input);

      // Then: All have same structure
      expect(result).toHaveProperty("kind");
      expect(result).toHaveProperty("number");
      expect(result).toHaveProperty("slug");
      expect(result.kind).toBe(expectedKind);
    });
  });

  it("GIVEN work items with same number but different kinds WHEN parsing THEN distinguishes correctly", () => {
    // Given
    const capability = "capability-51_test";
    const feature = "feature-50_test";
    const story = "story-50_test";

    // When
    const capResult = parseWorkItemName(capability);
    const featResult = parseWorkItemName(feature);
    const storyResult = parseWorkItemName(story);

    // Then
    expect(capResult.kind).toBe("capability");
    expect(featResult.kind).toBe("feature");
    expect(storyResult.kind).toBe("story");
    expect(capResult.number).toBe(50);
    expect(featResult.number).toBe(50);
    expect(storyResult.number).toBe(50);
  });
});

describe("parseWorkItemName - Edge Cases", () => {
  it("GIVEN slug with single character WHEN parsing THEN accepts pattern", () => {
    // Given
    const dirName = "story-20_x";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("x");
  });

  it("GIVEN slug with numbers WHEN parsing THEN accepts pattern", () => {
    // Given
    const dirName = "feature-30_test-123-feature";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.slug).toBe("test-123-feature");
  });

  it("GIVEN pattern with trailing slash WHEN parsing THEN still works", () => {
    // Given
    const dirName = "capability-21_core-cli";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.kind).toBe("capability");
  });
});

describe("parseWorkItemName - BSP Validation Integration", () => {
  it("GIVEN work item with valid BSP number WHEN parsing THEN succeeds", () => {
    // Given
    const dirName = "capability-50_test";

    // When
    const result = parseWorkItemName(dirName);

    // Then
    expect(result.number).toBe(49); // capability-50 → 49 (0-indexed)
  });

  it("GIVEN work item with BSP number too low WHEN parsing THEN throws error", () => {
    // Given
    const dirName = "capability-09_test";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("BSP number must be between 10 and 99");
  });

  it("GIVEN work item with BSP number too high WHEN parsing THEN throws error", () => {
    // Given
    const dirName = "feature-100_test";

    // When/Then
    expect(() => parseWorkItemName(dirName)).toThrow("BSP number must be between 10 and 99");
  });
});
