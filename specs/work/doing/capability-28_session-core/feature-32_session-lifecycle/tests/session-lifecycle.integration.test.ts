/**
 * Feature integration tests for session lifecycle.
 *
 * Test Level: 2 (Integration)
 * - Tests atomic claiming with real filesystem
 * - Tests concurrent access behavior
 *
 * @see session-lifecycle.feature.md for requirements
 */

import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SessionNotAvailableError } from "@/session/errors";
import { buildClaimPaths, classifyClaimError, selectBestSession } from "@/session/pickup";
import { buildReleasePaths, findCurrentSession } from "@/session/release";
import type { Session, SessionPriority } from "@/session/types";

/**
 * Test session directory structure.
 */
interface SessionsDir {
  root: string;
  todo: string;
  doing: string;
}

/**
 * Creates a temporary sessions directory structure.
 */
async function createTempSessionsDir(): Promise<SessionsDir> {
  const root = await mkdtemp(join(tmpdir(), "spx-session-test-"));
  const todo = join(root, "todo");
  const doing = join(root, "doing");

  await mkdir(todo, { recursive: true });
  await mkdir(doing, { recursive: true });

  return { root, todo, doing };
}

/**
 * Creates a session file in the todo directory.
 */
async function createSessionFile(
  sessionsDir: SessionsDir,
  sessionId: string,
  content = "# Test Session\n\nTest content",
): Promise<string> {
  const filePath = join(sessionsDir.todo, `${sessionId}.md`);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

/**
 * Checks if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Factory function for creating test sessions.
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

/**
 * Performs a pickup operation using fs.rename (atomic move).
 */
async function pickupSession(
  sessionsDir: SessionsDir,
  sessionId: string,
): Promise<{ id: string; content: string }> {
  const paths = buildClaimPaths(sessionId, {
    todoDir: sessionsDir.todo,
    doingDir: sessionsDir.doing,
  });

  try {
    await rename(paths.source, paths.target);
    const content = await readFile(paths.target, "utf-8");
    return { id: sessionId, content };
  } catch (error) {
    throw classifyClaimError(error, sessionId);
  }
}

/**
 * Performs a release operation using fs.rename.
 */
async function releaseSession(
  sessionsDir: SessionsDir,
  sessionId: string,
): Promise<void> {
  const paths = buildReleasePaths(sessionId, {
    doingDir: sessionsDir.doing,
    todoDir: sessionsDir.todo,
  });

  await rename(paths.source, paths.target);
}

describe("Feature: Session Lifecycle", () => {
  let sessionsDir: SessionsDir;

  beforeEach(async () => {
    sessionsDir = await createTempSessionsDir();
  });

  afterEach(async () => {
    try {
      await rm(sessionsDir.root, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("FI1: Successful pickup moves session", () => {
    it("GIVEN session in todo WHEN pickup THEN session moves to doing", async () => {
      // Given: Session in todo directory
      const sessionId = "2026-01-13_08-00-00";
      const testContent = "# Test Session\n\nTest content";
      await createSessionFile(sessionsDir, sessionId, testContent);

      // When: Pickup session
      const result = await pickupSession(sessionsDir, sessionId);

      // Then: Session in doing, not in todo
      expect(await fileExists(join(sessionsDir.doing, `${sessionId}.md`))).toBe(true);
      expect(await fileExists(join(sessionsDir.todo, `${sessionId}.md`))).toBe(false);
      expect(result.content).toBe(testContent);
    });
  });

  describe("FI2: Concurrent pickup - only one succeeds", () => {
    it("GIVEN one session WHEN two concurrent pickups THEN exactly one succeeds", async () => {
      // Given: One session in todo
      const sessionId = "2026-01-13_08-00-00";
      await createSessionFile(sessionsDir, sessionId);

      // When: Two concurrent pickups
      const results = await Promise.allSettled([
        pickupSession(sessionsDir, sessionId),
        pickupSession(sessionsDir, sessionId),
      ]);

      // Then: Exactly one succeeds
      const successes = results.filter((r) => r.status === "fulfilled");
      const failures = results.filter((r) => r.status === "rejected");
      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);

      // The failure should be SessionNotAvailableError
      const failedResult = failures[0] as PromiseRejectedResult;
      expect(failedResult.reason).toBeInstanceOf(SessionNotAvailableError);
    });

    it("GIVEN session claimed WHEN another pickup attempted THEN fails with SessionNotAvailable", async () => {
      // Given: Session already claimed
      const sessionId = "2026-01-13_08-00-00";
      await createSessionFile(sessionsDir, sessionId);
      await pickupSession(sessionsDir, sessionId);

      // When: Another pickup attempted
      const secondPickup = pickupSession(sessionsDir, sessionId);

      // Then: Fails with SessionNotAvailable
      await expect(secondPickup).rejects.toBeInstanceOf(SessionNotAvailableError);
    });
  });

  describe("FI3: Release moves session back", () => {
    it("GIVEN claimed session WHEN release THEN session returns to todo", async () => {
      // Given: Claimed session in doing
      const sessionId = "2026-01-13_08-00-00";
      await createSessionFile(sessionsDir, sessionId);
      await pickupSession(sessionsDir, sessionId);

      // When: Release session
      await releaseSession(sessionsDir, sessionId);

      // Then: Session back in todo
      expect(await fileExists(join(sessionsDir.todo, `${sessionId}.md`))).toBe(true);
      expect(await fileExists(join(sessionsDir.doing, `${sessionId}.md`))).toBe(false);
    });

    it("GIVEN released session WHEN pickup again THEN succeeds", async () => {
      // Given: Session that was claimed and released
      const sessionId = "2026-01-13_08-00-00";
      await createSessionFile(sessionsDir, sessionId);
      await pickupSession(sessionsDir, sessionId);
      await releaseSession(sessionsDir, sessionId);

      // When: Pickup again
      const result = await pickupSession(sessionsDir, sessionId);

      // Then: Succeeds
      expect(result.id).toBe(sessionId);
      expect(await fileExists(join(sessionsDir.doing, `${sessionId}.md`))).toBe(true);
    });
  });

  describe("FI4: Pickup with --auto selects highest priority", () => {
    it("GIVEN sessions with different priorities WHEN selectBestSession THEN highest priority claimed", async () => {
      // Given: Sessions with different priorities
      const sessions = [
        createSession({ id: "2026-01-10_10-00-00", priority: "low" }),
        createSession({ id: "2026-01-11_10-00-00", priority: "high" }),
        createSession({ id: "2026-01-12_10-00-00", priority: "medium" }),
      ];

      // When: Select best session
      const selected = selectBestSession(sessions);

      // Then: High priority session selected
      expect(selected?.id).toBe("2026-01-11_10-00-00");
      expect(selected?.metadata.priority).toBe("high");
    });

    it("GIVEN sessions with same priority WHEN selectBestSession THEN oldest (FIFO) selected", async () => {
      // Given: Sessions with same priority
      const sessions = [
        createSession({ id: "2026-01-13_10-00-00", priority: "high" }),
        createSession({ id: "2026-01-10_10-00-00", priority: "high" }),
        createSession({ id: "2026-01-12_10-00-00", priority: "high" }),
      ];

      // When: Select best session
      const selected = selectBestSession(sessions);

      // Then: Oldest session selected (FIFO)
      expect(selected?.id).toBe("2026-01-10_10-00-00");
    });

    it("GIVEN no sessions WHEN selectBestSession THEN returns null", () => {
      // Given: Empty session list
      const sessions: Session[] = [];

      // When: Select best session
      const selected = selectBestSession(sessions);

      // Then: Returns null
      expect(selected).toBeNull();
    });
  });

  describe("FI5: Find current session for release", () => {
    it("GIVEN multiple sessions in doing WHEN findCurrentSession THEN returns most recent", () => {
      // Given: Multiple sessions
      const sessions = [
        { id: "2026-01-10_08-00-00" },
        { id: "2026-01-13_08-00-00" },
        { id: "2026-01-11_08-00-00" },
      ];

      // When: Find current session
      const current = findCurrentSession(sessions);

      // Then: Most recent returned
      expect(current?.id).toBe("2026-01-13_08-00-00");
    });

    it("GIVEN empty doing directory WHEN findCurrentSession THEN returns null", () => {
      // Given: No sessions
      const sessions: Array<{ id: string }> = [];

      // When: Find current session
      const current = findCurrentSession(sessions);

      // Then: Returns null
      expect(current).toBeNull();
    });
  });
});
