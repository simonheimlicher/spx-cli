/**
 * CLI integration tests for session commands.
 *
 * Test Level: 2 (Integration)
 * - Tests full CLI command execution through Commander.js
 * - Verifies command routing, option parsing, and output
 *
 * @see cli-integration.story.md for requirements
 */

import { execa } from "execa";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("spx session commands", () => {
  let tempDir: string;
  let sessionsDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spx-session-cli-"));
    sessionsDir = join(tempDir, "sessions");
    await mkdir(join(sessionsDir, "todo"), { recursive: true });
    await mkdir(join(sessionsDir, "doing"), { recursive: true });
    await mkdir(join(sessionsDir, "archive"), { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("spx session --help", () => {
    it("GIVEN help flag WHEN session THEN shows all subcommands", async () => {
      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "--help"],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("pickup");
      expect(stdout).toContain("release");
      expect(stdout).toContain("list");
      expect(stdout).toContain("show");
      expect(stdout).toContain("create");
      expect(stdout).toContain("delete");
    });
  });

  describe("spx session list", () => {
    it("GIVEN empty directories WHEN list THEN shows no sessions", async () => {
      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "list", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("(no sessions)");
    });

    it("GIVEN sessions in todo WHEN list THEN shows sessions", async () => {
      // Create a test session
      await writeFile(
        join(sessionsDir, "todo", "2026-01-13_08-00-00.md"),
        "---\npriority: high\n---\n# Test",
      );

      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "list", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("2026-01-13_08-00-00");
      expect(stdout).toContain("[high]");
    });

    it("GIVEN --json flag WHEN list THEN outputs JSON", async () => {
      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "list", "--json", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty("todo");
      expect(parsed).toHaveProperty("doing");
      expect(parsed).toHaveProperty("archive");
    });
  });

  describe("spx session show", () => {
    it("GIVEN session in todo WHEN show THEN displays content", async () => {
      const sessionId = "2026-01-13_08-00-00";
      await writeFile(
        join(sessionsDir, "todo", `${sessionId}.md`),
        "---\npriority: high\n---\n# Test Session\n\nContent here.",
      );

      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "show", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Status: todo");
      expect(stdout).toContain("Priority: high");
      expect(stdout).toContain("# Test Session");
    });

    it("GIVEN non-existent session WHEN show THEN fails with error", async () => {
      const result = await execa(
        "node",
        ["bin/spx.js", "session", "show", "non-existent", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Session not found");
    });
  });

  describe("spx session pickup", () => {
    it("GIVEN session in todo WHEN pickup THEN moves to doing", async () => {
      const sessionId = "2026-01-13_08-00-00";
      await writeFile(
        join(sessionsDir, "todo", `${sessionId}.md`),
        "---\npriority: medium\n---\n# Test",
      );

      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "pickup", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain(`Claimed session: ${sessionId}`);
      expect(stdout).toContain("Status: doing");
    });

    it("GIVEN sessions in todo WHEN pickup --auto THEN claims highest priority", async () => {
      // Create sessions with different priorities
      await writeFile(
        join(sessionsDir, "todo", "2026-01-13_08-00-00.md"),
        "---\npriority: low\n---\n# Low",
      );
      await writeFile(
        join(sessionsDir, "todo", "2026-01-13_09-00-00.md"),
        "---\npriority: high\n---\n# High",
      );

      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "pickup", "--auto", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Claimed session: 2026-01-13_09-00-00");
    });

    it("GIVEN no sessions WHEN pickup --auto THEN fails with error", async () => {
      const result = await execa(
        "node",
        ["bin/spx.js", "session", "pickup", "--auto", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("No sessions available");
    });
  });

  describe("spx session release", () => {
    it("GIVEN claimed session WHEN release THEN moves to todo", async () => {
      const sessionId = "2026-01-13_08-00-00";
      await writeFile(
        join(sessionsDir, "doing", `${sessionId}.md`),
        "---\npriority: medium\n---\n# Test",
      );

      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "release", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain(`Released session: ${sessionId}`);
      expect(stdout).toContain("returned to todo");
    });

    it("GIVEN no session in doing WHEN release THEN fails with error", async () => {
      const result = await execa(
        "node",
        ["bin/spx.js", "session", "release", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Session not claimed");
    });
  });

  describe("spx session create", () => {
    it("GIVEN no options WHEN create THEN creates session with defaults", async () => {
      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "create", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), input: "" },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Created session:");
      expect(stdout).toContain("Path:");
    });

    it("GIVEN priority and tags WHEN create THEN includes in session", async () => {
      const { stdout, exitCode } = await execa(
        "node",
        [
          "bin/spx.js",
          "session",
          "create",
          "--priority",
          "high",
          "--tags",
          "test,feature",
          "--sessions-dir",
          sessionsDir,
        ],
        { cwd: process.cwd(), input: "" },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Created session:");
    });

    it("GIVEN content piped via stdin WHEN create THEN uses stdin content", async () => {
      const testContent = "# Session from stdin\n\nThis is piped content.";
      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "create", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), input: testContent },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Created session:");

      // Extract session ID and verify content
      const match = stdout.match(/Created session: (\S+)/);
      expect(match).not.toBeNull();
      const sessionId = match![1];

      const showResult = await execa(
        "node",
        ["bin/spx.js", "session", "show", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );
      expect(showResult.stdout).toContain("Session from stdin");
      expect(showResult.stdout).toContain("This is piped content");
    });
  });

  describe("spx session delete", () => {
    it("GIVEN session in todo WHEN delete THEN removes file", async () => {
      const sessionId = "2026-01-13_08-00-00";
      await writeFile(
        join(sessionsDir, "todo", `${sessionId}.md`),
        "# Test",
      );

      const { stdout, exitCode } = await execa(
        "node",
        ["bin/spx.js", "session", "delete", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain(`Deleted session: ${sessionId}`);
    });

    it("GIVEN non-existent session WHEN delete THEN fails with error", async () => {
      const result = await execa(
        "node",
        ["bin/spx.js", "session", "delete", "non-existent", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Session not found");
    });
  });

  describe("End-to-end workflow", () => {
    it(
      "GIVEN session WHEN create -> pickup -> release -> delete THEN completes successfully",
      { timeout: 15000 },
      async () => {
        // Create
        const createResult = await execa(
          "node",
          ["bin/spx.js", "session", "create", "--sessions-dir", sessionsDir],
          { cwd: process.cwd(), input: "" },
        );
        expect(createResult.exitCode).toBe(0);

        // Extract session ID from output
        const match = createResult.stdout.match(/Created session: (\S+)/);
        expect(match).not.toBeNull();
        const sessionId = match![1];

        // Pickup
        const pickupResult = await execa(
          "node",
          ["bin/spx.js", "session", "pickup", sessionId, "--sessions-dir", sessionsDir],
          { cwd: process.cwd() },
        );
        expect(pickupResult.exitCode).toBe(0);

        // Release
        const releaseResult = await execa(
          "node",
          ["bin/spx.js", "session", "release", sessionId, "--sessions-dir", sessionsDir],
          { cwd: process.cwd() },
        );
        expect(releaseResult.exitCode).toBe(0);

        // Delete
        const deleteResult = await execa(
          "node",
          ["bin/spx.js", "session", "delete", sessionId, "--sessions-dir", sessionsDir],
          { cwd: process.cwd() },
        );
        expect(deleteResult.exitCode).toBe(0);
      },
    );
  });
});
