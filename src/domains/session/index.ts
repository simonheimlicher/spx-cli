/**
 * Session domain - Manage session workflow
 */
import type { Command } from "commander";

import {
  createCommand,
  deleteCommand,
  listCommand,
  pickupCommand,
  releaseCommand,
  showCommand,
} from "../../commands/session/index.js";
import type { Domain } from "../types.js";

/**
 * Reads content from stdin if available (piped input).
 * Returns undefined if stdin is a TTY (interactive terminal).
 */
async function readStdin(): Promise<string | undefined> {
  // Check if stdin is a TTY (interactive) - if so, don't wait for input
  if (process.stdin.isTTY) {
    return undefined;
  }

  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data.trim() || undefined);
    });
    // Handle case where stdin closes without data
    process.stdin.on("error", () => {
      resolve(undefined);
    });
  });
}

/**
 * Handles command errors with consistent formatting.
 */
function handleError(error: unknown): never {
  console.error("Error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

/**
 * Register session domain commands
 *
 * @param sessionCmd - Commander.js session domain command
 */
function registerSessionCommands(sessionCmd: Command): void {
  // list command
  sessionCmd
    .command("list")
    .description("List all sessions")
    .option("--status <status>", "Filter by status (todo|doing|archive)")
    .option("--json", "Output as JSON")
    .option("--sessions-dir <path>", "Custom sessions directory")
    .action(async (options: { status?: string; json?: boolean; sessionsDir?: string }) => {
      try {
        const output = await listCommand({
          status: options.status as "todo" | "doing" | "archive" | undefined,
          format: options.json ? "json" : "text",
          sessionsDir: options.sessionsDir,
        });
        console.log(output);
      } catch (error) {
        handleError(error);
      }
    });

  // show command
  sessionCmd
    .command("show <id>")
    .description("Show session content")
    .option("--sessions-dir <path>", "Custom sessions directory")
    .action(async (id: string, options: { sessionsDir?: string }) => {
      try {
        const output = await showCommand({
          sessionId: id,
          sessionsDir: options.sessionsDir,
        });
        console.log(output);
      } catch (error) {
        handleError(error);
      }
    });

  // pickup command
  sessionCmd
    .command("pickup [id]")
    .description("Claim a session (move from todo to doing)")
    .option("--auto", "Auto-select highest priority session")
    .option("--sessions-dir <path>", "Custom sessions directory")
    .action(async (id: string | undefined, options: { auto?: boolean; sessionsDir?: string }) => {
      try {
        if (!id && !options.auto) {
          console.error("Error: Either session ID or --auto flag is required");
          process.exit(1);
        }
        const output = await pickupCommand({
          sessionId: id,
          auto: options.auto,
          sessionsDir: options.sessionsDir,
        });
        console.log(output);
      } catch (error) {
        handleError(error);
      }
    });

  // release command
  sessionCmd
    .command("release [id]")
    .description("Release a session (move from doing to todo)")
    .option("--sessions-dir <path>", "Custom sessions directory")
    .action(async (id: string | undefined, options: { sessionsDir?: string }) => {
      try {
        const output = await releaseCommand({
          sessionId: id,
          sessionsDir: options.sessionsDir,
        });
        console.log(output);
      } catch (error) {
        handleError(error);
      }
    });

  // create command
  sessionCmd
    .command("create")
    .description("Create a new session (reads content from stdin if piped)")
    .option("--priority <priority>", "Priority level (high|medium|low)", "medium")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--sessions-dir <path>", "Custom sessions directory")
    .action(async (options: { priority?: string; tags?: string; sessionsDir?: string }) => {
      try {
        // Read content from stdin if available
        const content = await readStdin();

        const output = await createCommand({
          content,
          priority: options.priority as "high" | "medium" | "low" | undefined,
          tags: options.tags?.split(",").map((t) => t.trim()),
          sessionsDir: options.sessionsDir,
        });
        console.log(output);
      } catch (error) {
        handleError(error);
      }
    });

  // delete command
  sessionCmd
    .command("delete <id>")
    .description("Delete a session")
    .option("--sessions-dir <path>", "Custom sessions directory")
    .action(async (id: string, options: { sessionsDir?: string }) => {
      try {
        const output = await deleteCommand({
          sessionId: id,
          sessionsDir: options.sessionsDir,
        });
        console.log(output);
      } catch (error) {
        handleError(error);
      }
    });
}

/**
 * Session domain - Manage session workflow
 */
export const sessionDomain: Domain = {
  name: "session",
  description: "Manage session workflow",
  register: (program: Command) => {
    const sessionCmd = program
      .command("session")
      .description("Manage session workflow");

    registerSessionCommands(sessionCmd);
  },
};
