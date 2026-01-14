/**
 * Unit tests for session listing utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for sorting and parsing
 * - No external dependencies
 *
 * @see ADR-21 (Session Directory Structure) for context
 */

import { describe, expect, it } from "vitest";

import { parseSessionMetadata, sortSessions } from "@/session/list";
import { DEFAULT_PRIORITY, type Session, type SessionPriority } from "@/session/types";

/**
 * Factory function to create test sessions.
 */
function createSession(overrides: {
  id?: string;
  priority?: SessionPriority;
  status?: "todo" | "doing" | "archive";
  tags?: string[];
}): Session {
  return {
    id: overrides.id ?? "2026-01-13_10-00-00",
    status: overrides.status ?? "todo",
    path: `/test/sessions/todo/${overrides.id ?? "2026-01-13_10-00-00"}.md`,
    metadata: {
      priority: overrides.priority ?? "medium",
      tags: overrides.tags ?? [],
    },
  };
}

describe("sortSessions", () => {
  it("GIVEN sessions with different priorities WHEN sorted THEN high first", () => {
    // Given: Sessions with different priorities
    const sessions = [
      createSession({ id: "a", priority: "low" }),
      createSession({ id: "b", priority: "high" }),
      createSession({ id: "c", priority: "medium" }),
    ];

    // When: Sort sessions
    const result = sortSessions(sessions);

    // Then: Ordered by priority (high → medium → low)
    expect(result.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("GIVEN sessions with same priority WHEN sorted THEN newest first", () => {
    // Given: Sessions with same priority but different timestamps
    const sessions = [
      createSession({ id: "2026-01-10_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-13_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-11_10-00-00", priority: "high" }),
    ];

    // When: Sort sessions
    const result = sortSessions(sessions);

    // Then: Ordered by timestamp descending (newest first)
    expect(result.map((s) => s.id)).toEqual([
      "2026-01-13_10-00-00",
      "2026-01-11_10-00-00",
      "2026-01-10_10-00-00",
    ]);
  });

  it("GIVEN empty array WHEN sorted THEN returns empty array", () => {
    // When: Sort empty array
    const result = sortSessions([]);

    // Then: Returns empty array
    expect(result).toEqual([]);
  });

  it("GIVEN single session WHEN sorted THEN returns same session", () => {
    // Given: Single session
    const sessions = [createSession({ id: "2026-01-13_10-00-00" })];

    // When: Sort
    const result = sortSessions(sessions);

    // Then: Returns same session
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2026-01-13_10-00-00");
  });

  it("GIVEN sessions with invalid IDs WHEN sorted THEN invalid IDs sort last", () => {
    // Given: Mix of valid and invalid session IDs
    const sessions = [
      createSession({ id: "invalid", priority: "high" }),
      createSession({ id: "2026-01-13_10-00-00", priority: "high" }),
    ];

    // When: Sort
    const result = sortSessions(sessions);

    // Then: Valid ID comes first, invalid ID last
    expect(result.map((s) => s.id)).toEqual(["2026-01-13_10-00-00", "invalid"]);
  });

  it("GIVEN input array WHEN sorted THEN does not mutate original", () => {
    // Given: Sessions array
    const sessions = [
      createSession({ id: "a", priority: "low" }),
      createSession({ id: "b", priority: "high" }),
    ];
    const originalOrder = sessions.map((s) => s.id);

    // When: Sort
    sortSessions(sessions);

    // Then: Original array unchanged
    expect(sessions.map((s) => s.id)).toEqual(originalOrder);
  });
});

describe("parseSessionMetadata", () => {
  it("GIVEN YAML front matter WHEN parsed THEN extracts metadata", () => {
    // Given: Content with YAML front matter
    const content = `---
id: test
priority: high
tags: [bug, urgent]
---
# Content`;

    // When: Parse metadata
    const result = parseSessionMetadata(content);

    // Then: Metadata extracted correctly
    expect(result.id).toBe("test");
    expect(result.priority).toBe("high");
    expect(result.tags).toEqual(["bug", "urgent"]);
  });

  it("GIVEN no front matter WHEN parsed THEN returns defaults", () => {
    // Given: Content without front matter
    const content = "# Just content";

    // When: Parse metadata
    const result = parseSessionMetadata(content);

    // Then: Returns default values
    expect(result.priority).toBe(DEFAULT_PRIORITY);
    expect(result.tags).toEqual([]);
  });

  it("GIVEN empty content WHEN parsed THEN returns defaults", () => {
    // When: Parse empty string
    const result = parseSessionMetadata("");

    // Then: Returns defaults
    expect(result.priority).toBe(DEFAULT_PRIORITY);
    expect(result.tags).toEqual([]);
  });

  it("GIVEN malformed YAML WHEN parsed THEN returns defaults", () => {
    // Given: Malformed YAML
    const content = `---
priority: [invalid: yaml:
---
# Content`;

    // When: Parse
    const result = parseSessionMetadata(content);

    // Then: Returns defaults (graceful degradation)
    expect(result.priority).toBe(DEFAULT_PRIORITY);
    expect(result.tags).toEqual([]);
  });

  it("GIVEN invalid priority value WHEN parsed THEN uses default", () => {
    // Given: Invalid priority value
    const content = `---
priority: critical
---`;

    // When: Parse
    const result = parseSessionMetadata(content);

    // Then: Uses default priority
    expect(result.priority).toBe(DEFAULT_PRIORITY);
  });

  it("GIVEN full metadata WHEN parsed THEN extracts all fields", () => {
    // Given: Complete YAML front matter
    const content = `---
id: 2026-01-13_10-00-00
priority: high
tags: [feature, cli]
branch: feature/session
created_at: 2026-01-13T10:00:00-08:00
working_directory: /path/to/project
specs:
  - path/to/spec.md
files:
  - src/file.ts
---
# Session content`;

    // When: Parse
    const result = parseSessionMetadata(content);

    // Then: All fields extracted
    expect(result.id).toBe("2026-01-13_10-00-00");
    expect(result.priority).toBe("high");
    expect(result.tags).toEqual(["feature", "cli"]);
    expect(result.branch).toBe("feature/session");
    expect(result.createdAt).toBe("2026-01-13T10:00:00-08:00");
    expect(result.workingDirectory).toBe("/path/to/project");
    expect(result.specs).toEqual(["path/to/spec.md"]);
    expect(result.files).toEqual(["src/file.ts"]);
  });

  it("GIVEN front matter with ... delimiter WHEN parsed THEN extracts metadata", () => {
    // Given: YAML with ... end delimiter
    const content = `---
priority: low
...
# Content`;

    // When: Parse
    const result = parseSessionMetadata(content);

    // Then: Parses correctly
    expect(result.priority).toBe("low");
  });

  it("GIVEN tags with non-string values WHEN parsed THEN filters them out", () => {
    // Given: Tags array with mixed types
    const content = `---
tags: [valid, 123, true, null]
---`;

    // When: Parse
    const result = parseSessionMetadata(content);

    // Then: Only string tags kept
    expect(result.tags).toEqual(["valid"]);
  });
});
