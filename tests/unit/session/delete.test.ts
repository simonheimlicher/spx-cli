/**
 * Unit tests for session deletion utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for path resolution
 * - Error type definitions
 *
 * @see ADR-21 (Session Directory Structure) for context
 */

import { describe, expect, it } from "vitest";

import { resolveDeletePath } from "@/session/delete";
import {
  SessionError,
  SessionInvalidContentError,
  SessionNotAvailableError,
  SessionNotFoundError,
} from "@/session/errors";

describe("resolveDeletePath", () => {
  it("GIVEN session ID and found path WHEN resolved THEN returns path", () => {
    // Given: Session exists in doing directory
    const sessionId = "2026-01-13_08-01-05";
    const existingPaths = [".spx/sessions/doing/2026-01-13_08-01-05.md"];

    // When: Resolve delete path
    const result = resolveDeletePath(sessionId, existingPaths);

    // Then: Returns the matching path
    expect(result).toBe(".spx/sessions/doing/2026-01-13_08-01-05.md");
  });

  it("GIVEN session in todo WHEN resolved THEN returns todo path", () => {
    // Given: Session exists in todo directory
    const sessionId = "test-session";
    const existingPaths = [".spx/sessions/todo/test-session.md"];

    // When: Resolve
    const result = resolveDeletePath(sessionId, existingPaths);

    // Then: Returns todo path
    expect(result).toContain("todo");
  });

  it("GIVEN multiple matching paths WHEN resolved THEN returns first", () => {
    // Given: Session exists in multiple directories (shouldn't happen but handle it)
    const sessionId = "duplicate";
    const existingPaths = [
      ".spx/sessions/todo/duplicate.md",
      ".spx/sessions/doing/duplicate.md",
    ];

    // When: Resolve
    const result = resolveDeletePath(sessionId, existingPaths);

    // Then: Returns first matching path
    expect(result).toBe(".spx/sessions/todo/duplicate.md");
  });

  it("GIVEN session ID not found WHEN resolved THEN throws SessionNotFound", () => {
    // Given: No paths exist
    const sessionId = "nonexistent";
    const existingPaths: string[] = [];

    // When/Then: Throws error
    expect(() => resolveDeletePath(sessionId, existingPaths)).toThrow(
      SessionNotFoundError,
    );
  });

  it("GIVEN wrong session ID WHEN resolved THEN throws SessionNotFound", () => {
    // Given: Paths exist but don't match
    const sessionId = "wrong-id";
    const existingPaths = [".spx/sessions/todo/different-id.md"];

    // When/Then: Throws error
    expect(() => resolveDeletePath(sessionId, existingPaths)).toThrow(
      SessionNotFoundError,
    );
  });
});

describe("SessionNotFoundError", () => {
  it("GIVEN session ID WHEN created THEN has descriptive message", () => {
    // When: Create error
    const error = new SessionNotFoundError("test-id");

    // Then: Message is descriptive
    expect(error.message).toContain("test-id");
    expect(error.message).toContain("not found");
  });

  it("GIVEN error WHEN inspected THEN stores session ID", () => {
    // When: Create error
    const error = new SessionNotFoundError("my-session");

    // Then: Session ID is accessible
    expect(error.sessionId).toBe("my-session");
  });

  it("GIVEN error WHEN checked THEN is instanceof SessionError", () => {
    // When: Create error
    const error = new SessionNotFoundError("test");

    // Then: Is SessionError
    expect(error).toBeInstanceOf(SessionError);
    expect(error).toBeInstanceOf(Error);
  });

  it("GIVEN error WHEN checked THEN has correct name", () => {
    // When: Create error
    const error = new SessionNotFoundError("test");

    // Then: Name is set
    expect(error.name).toBe("SessionNotFoundError");
  });
});

describe("SessionNotAvailableError", () => {
  it("GIVEN session ID WHEN created THEN has descriptive message", () => {
    // When: Create error
    const error = new SessionNotAvailableError("claimed-session");

    // Then: Message mentions not available
    expect(error.message).toContain("claimed-session");
    expect(error.message).toContain("not available");
  });

  it("GIVEN error WHEN inspected THEN stores session ID", () => {
    // When: Create error
    const error = new SessionNotAvailableError("busy-session");

    // Then: Session ID is accessible
    expect(error.sessionId).toBe("busy-session");
  });
});

describe("SessionInvalidContentError", () => {
  it("GIVEN reason WHEN created THEN includes reason in message", () => {
    // When: Create error
    const error = new SessionInvalidContentError("missing required field");

    // Then: Reason is in message
    expect(error.message).toContain("missing required field");
    expect(error.message).toContain("Invalid session content");
  });
});
