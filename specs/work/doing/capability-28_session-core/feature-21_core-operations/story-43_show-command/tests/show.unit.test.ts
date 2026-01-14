/**
 * Unit tests for session show utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for path resolution and formatting
 * - No file system operations
 *
 * @see ADR-21 (Session Directory Structure) for context
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_SESSION_CONFIG, formatShowOutput, resolveSessionPaths, SEARCH_ORDER } from "@/session/show";

describe("resolveSessionPaths", () => {
  it("GIVEN session ID WHEN resolved THEN returns paths in all directories", () => {
    // Given: Session ID and directory config
    const config = {
      todoDir: ".spx/sessions/todo",
      doingDir: ".spx/sessions/doing",
      archiveDir: ".spx/sessions/archive",
    };

    // When: Resolve paths
    const result = resolveSessionPaths("2026-01-13_08-01-05", config);

    // Then: Returns paths in all directories
    expect(result).toEqual([
      ".spx/sessions/todo/2026-01-13_08-01-05.md",
      ".spx/sessions/doing/2026-01-13_08-01-05.md",
      ".spx/sessions/archive/2026-01-13_08-01-05.md",
    ]);
  });

  it("GIVEN custom config WHEN resolved THEN uses custom paths", () => {
    // Given: Custom directory config
    const config = {
      todoDir: "/custom/todo",
      doingDir: "/custom/doing",
      archiveDir: "/custom/archive",
    };

    // When: Resolve paths
    const result = resolveSessionPaths("test-id", config);

    // Then: Uses custom directories
    expect(result).toEqual([
      "/custom/todo/test-id.md",
      "/custom/doing/test-id.md",
      "/custom/archive/test-id.md",
    ]);
  });

  it("GIVEN no config WHEN resolved THEN uses default config", () => {
    // When: Resolve paths without config
    const result = resolveSessionPaths("2026-01-13_08-01-05");

    // Then: Uses default directories
    expect(result).toEqual([
      `${DEFAULT_SESSION_CONFIG.todoDir}/2026-01-13_08-01-05.md`,
      `${DEFAULT_SESSION_CONFIG.doingDir}/2026-01-13_08-01-05.md`,
      `${DEFAULT_SESSION_CONFIG.archiveDir}/2026-01-13_08-01-05.md`,
    ]);
  });

  it("GIVEN result WHEN checked THEN order matches SEARCH_ORDER", () => {
    // When: Resolve paths
    const result = resolveSessionPaths("test", DEFAULT_SESSION_CONFIG);

    // Then: Order matches search order (todo, doing, archive)
    expect(result[0]).toContain(SEARCH_ORDER[0]); // todo
    expect(result[1]).toContain(SEARCH_ORDER[1]); // doing
    expect(result[2]).toContain(SEARCH_ORDER[2]); // archive
  });
});

describe("formatShowOutput", () => {
  it("GIVEN session content WHEN formatted THEN includes status", () => {
    // Given: Session content
    const content = `---
priority: high
---
# Session Content`;

    // When: Format with status
    const result = formatShowOutput(content, { status: "todo" });

    // Then: Status is included
    expect(result).toContain("Status: todo");
  });

  it("GIVEN session with priority WHEN formatted THEN includes priority", () => {
    // Given: Session with priority
    const content = `---
priority: high
---
# Content`;

    // When: Format
    const result = formatShowOutput(content, { status: "todo" });

    // Then: Priority is included
    expect(result).toContain("Priority: high");
  });

  it("GIVEN session with metadata WHEN formatted THEN includes all metadata", () => {
    // Given: Session with full metadata
    const content = `---
id: test-session
priority: high
branch: feature/test
tags: [bug, urgent]
created_at: 2026-01-13T10:00:00Z
---
# Session Content`;

    // When: Format
    const result = formatShowOutput(content, { status: "doing" });

    // Then: All metadata included
    expect(result).toContain("ID: test-session");
    expect(result).toContain("Status: doing");
    expect(result).toContain("Priority: high");
    expect(result).toContain("Branch: feature/test");
    expect(result).toContain("Tags: bug, urgent");
    expect(result).toContain("Created: 2026-01-13T10:00:00Z");
  });

  it("GIVEN session content WHEN formatted THEN preserves original content", () => {
    // Given: Session content
    const content = `---
priority: medium
---
# Original Content
This should be preserved.`;

    // When: Format
    const result = formatShowOutput(content, { status: "archive" });

    // Then: Original content preserved
    expect(result).toContain("# Original Content");
    expect(result).toContain("This should be preserved.");
  });

  it("GIVEN session without front matter WHEN formatted THEN uses defaults", () => {
    // Given: Content without YAML front matter
    const content = "# Just Content\nNo metadata here.";

    // When: Format
    const result = formatShowOutput(content, { status: "todo" });

    // Then: Uses default priority
    expect(result).toContain("Priority: medium");
    expect(result).toContain("Status: todo");
    expect(result).toContain("# Just Content");
  });

  it("GIVEN output WHEN inspected THEN has separator between metadata and content", () => {
    // Given: Any session content
    const content = `---
priority: low
---
# Content`;

    // When: Format
    const result = formatShowOutput(content, { status: "todo" });

    // Then: Has visual separator
    expect(result).toContain("─"); // Unicode box drawing character
  });
});

describe("SEARCH_ORDER", () => {
  it("GIVEN search order WHEN checked THEN todo is first", () => {
    // Then: todo is highest priority for search
    expect(SEARCH_ORDER[0]).toBe("todo");
  });

  it("GIVEN search order WHEN checked THEN has three directories", () => {
    // Then: All three status directories
    expect(SEARCH_ORDER).toHaveLength(3);
    expect(SEARCH_ORDER).toContain("todo");
    expect(SEARCH_ORDER).toContain("doing");
    expect(SEARCH_ORDER).toContain("archive");
  });
});

describe("DEFAULT_SESSION_CONFIG", () => {
  it("GIVEN default config WHEN checked THEN uses .spx/sessions path", () => {
    // Then: Uses standard .spx/sessions base path
    expect(DEFAULT_SESSION_CONFIG.todoDir).toContain(".spx/sessions");
    expect(DEFAULT_SESSION_CONFIG.doingDir).toContain(".spx/sessions");
    expect(DEFAULT_SESSION_CONFIG.archiveDir).toContain(".spx/sessions");
  });
});
