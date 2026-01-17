/**
 * Unit tests for session release utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for path construction and session finding
 * - No external dependencies
 *
 * Graduated from: specs/.../story-32_release-command/tests/release.unit.test.ts
 */

import { describe, expect, it } from "vitest";

import { buildReleasePaths, findCurrentSession } from "@/session/release";

describe("buildReleasePaths", () => {
  it("GIVEN session ID and config WHEN built THEN returns doing→todo paths", () => {
    // Given
    const config = {
      todoDir: ".spx/sessions/todo",
      doingDir: ".spx/sessions/doing",
    };
    const sessionId = "2026-01-13_08-01-05";

    // When
    const result = buildReleasePaths(sessionId, config);

    // Then
    expect(result).toEqual({
      source: ".spx/sessions/doing/2026-01-13_08-01-05.md",
      target: ".spx/sessions/todo/2026-01-13_08-01-05.md",
    });
  });

  it("GIVEN custom directories WHEN built THEN uses custom paths", () => {
    // Given
    const config = {
      todoDir: "/custom/todo",
      doingDir: "/custom/doing",
    };
    const sessionId = "my-session";

    // When
    const result = buildReleasePaths(sessionId, config);

    // Then
    expect(result).toEqual({
      source: "/custom/doing/my-session.md",
      target: "/custom/todo/my-session.md",
    });
  });
});

describe("findCurrentSession", () => {
  it("GIVEN multiple sessions in doing WHEN found THEN returns most recent", () => {
    // Given
    const doingSessions = [
      { id: "2026-01-10_08-00-00" },
      { id: "2026-01-13_08-00-00" },
      { id: "2026-01-11_08-00-00" },
    ];

    // When
    const result = findCurrentSession(doingSessions);

    // Then
    expect(result?.id).toBe("2026-01-13_08-00-00");
  });

  it("GIVEN empty doing directory WHEN found THEN returns null", () => {
    // Given
    const doingSessions: Array<{ id: string }> = [];

    // When
    const result = findCurrentSession(doingSessions);

    // Then
    expect(result).toBeNull();
  });

  it("GIVEN single session WHEN found THEN returns that session", () => {
    // Given
    const doingSessions = [{ id: "2026-01-13_08-00-00" }];

    // When
    const result = findCurrentSession(doingSessions);

    // Then
    expect(result?.id).toBe("2026-01-13_08-00-00");
  });

  it("GIVEN sessions with invalid IDs WHEN found THEN valid IDs sorted first", () => {
    // Given
    const doingSessions = [
      { id: "invalid" },
      { id: "2026-01-13_08-00-00" },
    ];

    // When
    const result = findCurrentSession(doingSessions);

    // Then
    expect(result?.id).toBe("2026-01-13_08-00-00");
  });

  it("GIVEN input array WHEN found THEN does not mutate original", () => {
    // Given
    const doingSessions = [
      { id: "2026-01-10_08-00-00" },
      { id: "2026-01-13_08-00-00" },
    ];
    const originalOrder = doingSessions.map((s) => s.id);

    // When
    findCurrentSession(doingSessions);

    // Then
    expect(doingSessions.map((s) => s.id)).toEqual(originalOrder);
  });
});
