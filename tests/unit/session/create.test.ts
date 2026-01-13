/**
 * Unit tests for session creation utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for path construction and validation
 * - No file system operations
 *
 * @see ADR-32 (Timestamp Format) for ID format
 * @see ADR-21 (Session Directory Structure) for path format
 */

import { describe, expect, it } from "vitest";

import { buildSessionPath, MIN_CONTENT_LENGTH, validateSessionContent } from "@/session/create";

describe("buildSessionPath", () => {
  it("GIVEN config and ID WHEN built THEN returns correct path", () => {
    // Given: Config and session ID
    const config = { todoDir: ".spx/sessions/todo" };
    const sessionId = "2026-01-13_08-01-05";

    // When: Build path
    const result = buildSessionPath(sessionId, config);

    // Then: Returns correct path
    expect(result).toBe(".spx/sessions/todo/2026-01-13_08-01-05.md");
  });

  it("GIVEN custom directory WHEN built THEN uses custom path", () => {
    // Given: Custom todo directory
    const config = { todoDir: "/custom/sessions/todo" };
    const sessionId = "test-id";

    // When: Build path
    const result = buildSessionPath(sessionId, config);

    // Then: Uses custom directory
    expect(result).toBe("/custom/sessions/todo/test-id.md");
  });

  it("GIVEN path WHEN inspected THEN ends with .md extension", () => {
    // Given: Any config and ID
    const config = { todoDir: ".spx/sessions/todo" };

    // When: Build path
    const result = buildSessionPath("any-id", config);

    // Then: Ends with .md
    expect(result).toMatch(/\.md$/);
  });
});

describe("validateSessionContent", () => {
  it("GIVEN valid markdown WHEN validated THEN returns valid", () => {
    // Given: Valid session content
    const content = `---
id: test
---
# Content`;

    // When: Validate
    const result = validateSessionContent(content);

    // Then: Returns valid
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("GIVEN empty content WHEN validated THEN returns invalid with error", () => {
    // Given: Empty string
    const content = "";

    // When: Validate
    const result = validateSessionContent(content);

    // Then: Returns invalid with error
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("GIVEN only whitespace WHEN validated THEN returns invalid", () => {
    // Given: Only spaces and newlines
    const content = "   \n\n   \t  ";

    // When: Validate
    const result = validateSessionContent(content);

    // Then: Returns invalid
    expect(result.valid).toBe(false);
  });

  it("GIVEN simple text WHEN validated THEN returns valid", () => {
    // Given: Simple text content
    const content = "Hello, world!";

    // When: Validate
    const result = validateSessionContent(content);

    // Then: Returns valid
    expect(result.valid).toBe(true);
  });

  it("GIVEN content with only newlines WHEN validated THEN returns invalid", () => {
    // Given: Only newlines
    const content = "\n\n\n";

    // When: Validate
    const result = validateSessionContent(content);

    // Then: Returns invalid
    expect(result.valid).toBe(false);
  });
});

describe("MIN_CONTENT_LENGTH", () => {
  it("GIVEN constant WHEN checked THEN is at least 1", () => {
    // Then: Minimum is reasonable
    expect(MIN_CONTENT_LENGTH).toBeGreaterThanOrEqual(1);
  });
});
