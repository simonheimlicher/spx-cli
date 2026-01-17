/**
 * Unit tests for session pickup utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for path construction, error classification, and session selection
 * - No external dependencies
 *
 * Graduated from:
 * - specs/.../story-21_pickup-command/tests/pickup.unit.test.ts
 * - specs/.../story-43_auto-pickup/tests/auto-pickup.unit.test.ts
 */

import { describe, expect, it } from "vitest";

import { SessionNotAvailableError } from "@/session/errors";
import { buildClaimPaths, classifyClaimError, selectBestSession } from "@/session/pickup";
import type { Session, SessionPriority } from "@/session/types";

/**
 * Factory function to create test sessions.
 */
function createSession(overrides: {
  id?: string;
  priority?: SessionPriority;
}): Session {
  const id = overrides.id ?? "2026-01-13_10-00-00";
  return {
    id,
    status: "todo",
    path: `/test/sessions/todo/${id}.md`,
    metadata: {
      priority: overrides.priority ?? "medium",
      tags: [],
    },
  };
}

describe("buildClaimPaths", () => {
  it("GIVEN session ID and config WHEN built THEN returns source and target", () => {
    // Given
    const config = {
      todoDir: ".spx/sessions/todo",
      doingDir: ".spx/sessions/doing",
    };
    const sessionId = "2026-01-13_08-01-05";

    // When
    const result = buildClaimPaths(sessionId, config);

    // Then
    expect(result).toEqual({
      source: ".spx/sessions/todo/2026-01-13_08-01-05.md",
      target: ".spx/sessions/doing/2026-01-13_08-01-05.md",
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
    const result = buildClaimPaths(sessionId, config);

    // Then
    expect(result).toEqual({
      source: "/custom/todo/my-session.md",
      target: "/custom/doing/my-session.md",
    });
  });
});

describe("classifyClaimError", () => {
  it("GIVEN ENOENT error WHEN classified THEN returns SessionNotAvailable", () => {
    // Given
    const error = Object.assign(new Error("ENOENT"), { code: "ENOENT" });

    // When
    const result = classifyClaimError(error, "test-id");

    // Then
    expect(result).toBeInstanceOf(SessionNotAvailableError);
  });

  it("GIVEN ENOENT error WHEN classified THEN error contains session ID", () => {
    // Given
    const error = Object.assign(new Error("ENOENT"), { code: "ENOENT" });

    // When
    const result = classifyClaimError(error, "specific-session-id");

    // Then
    expect(result.sessionId).toBe("specific-session-id");
    expect(result.message).toContain("specific-session-id");
  });

  it("GIVEN unknown error WHEN classified THEN rethrows", () => {
    // Given
    const error = new Error("Unknown error");

    // When/Then
    expect(() => classifyClaimError(error, "test-id")).toThrow("Unknown error");
  });

  it("GIVEN EACCES error WHEN classified THEN rethrows", () => {
    // Given
    const error = Object.assign(new Error("EACCES"), { code: "EACCES" });

    // When/Then
    expect(() => classifyClaimError(error, "test-id")).toThrow("EACCES");
  });
});

describe("selectBestSession", () => {
  it("GIVEN sessions with different priorities WHEN selected THEN returns highest priority", () => {
    // Given
    const sessions = [
      createSession({ id: "low-1", priority: "low" }),
      createSession({ id: "high-1", priority: "high" }),
      createSession({ id: "medium-1", priority: "medium" }),
    ];

    // When
    const result = selectBestSession(sessions);

    // Then
    expect(result?.id).toBe("high-1");
  });

  it("GIVEN sessions with same priority WHEN selected THEN returns oldest (FIFO)", () => {
    // Given
    const sessions = [
      createSession({ id: "2026-01-13_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-10_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-12_10-00-00", priority: "high" }),
    ];

    // When
    const result = selectBestSession(sessions);

    // Then
    expect(result?.id).toBe("2026-01-10_10-00-00"); // Oldest first (FIFO)
  });

  it("GIVEN empty list WHEN selected THEN returns null", () => {
    // Given
    const sessions: Session[] = [];

    // When
    const result = selectBestSession(sessions);

    // Then
    expect(result).toBeNull();
  });

  it("GIVEN only one session WHEN selected THEN returns that session", () => {
    // Given
    const sessions = [createSession({ id: "only-one", priority: "low" })];

    // When
    const result = selectBestSession(sessions);

    // Then
    expect(result?.id).toBe("only-one");
  });

  it("GIVEN sessions with mixed priorities WHEN selected THEN priority takes precedence over age", () => {
    // Given - older low priority vs newer high priority
    const sessions = [
      createSession({ id: "2026-01-01_10-00-00", priority: "low" }), // Oldest
      createSession({ id: "2026-01-15_10-00-00", priority: "high" }), // Newest
    ];

    // When
    const result = selectBestSession(sessions);

    // Then - high priority wins regardless of age
    expect(result?.id).toBe("2026-01-15_10-00-00");
  });

  it("GIVEN sessions with invalid IDs WHEN selected THEN valid IDs preferred within same priority", () => {
    // Given
    const sessions = [
      createSession({ id: "invalid-id", priority: "high" }),
      createSession({ id: "2026-01-13_10-00-00", priority: "high" }),
    ];

    // When
    const result = selectBestSession(sessions);

    // Then - valid timestamp comes first
    expect(result?.id).toBe("2026-01-13_10-00-00");
  });

  it("GIVEN input array WHEN selected THEN does not mutate original", () => {
    // Given
    const sessions = [
      createSession({ id: "a", priority: "low" }),
      createSession({ id: "b", priority: "high" }),
    ];
    const originalOrder = sessions.map((s) => s.id);

    // When
    selectBestSession(sessions);

    // Then
    expect(sessions.map((s) => s.id)).toEqual(originalOrder);
  });

  it("GIVEN deterministic input WHEN called multiple times THEN returns same result", () => {
    // Given
    const sessions = [
      createSession({ id: "2026-01-13_10-00-00", priority: "high" }),
      createSession({ id: "2026-01-10_10-00-00", priority: "high" }),
    ];

    // When - call multiple times
    const result1 = selectBestSession(sessions);
    const result2 = selectBestSession(sessions);
    const result3 = selectBestSession(sessions);

    // Then - all results are identical (deterministic)
    expect(result1?.id).toBe(result2?.id);
    expect(result2?.id).toBe(result3?.id);
  });
});
