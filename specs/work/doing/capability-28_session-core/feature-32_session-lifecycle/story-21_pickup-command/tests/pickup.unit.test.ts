/**
 * Unit tests for session pickup utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for path construction and error classification
 * - No external dependencies
 *
 * @see pickup-command.story.md for requirements
 */

import { describe, expect, it } from "vitest";

import { SessionNotAvailableError } from "@/session/errors";
import { buildClaimPaths, classifyClaimError } from "@/session/pickup";

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
