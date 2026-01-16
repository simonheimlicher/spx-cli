/**
 * Session handoff CLI command handler.
 *
 * Creates a new session for handoff to another agent context.
 *
 * @module commands/session/handoff
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildSessionPath, validateSessionContent } from "../../session/create.js";
import { SessionInvalidContentError } from "../../session/errors.js";
import { DEFAULT_SESSION_CONFIG, type SessionDirectoryConfig } from "../../session/show.js";
import { generateSessionId } from "../../session/timestamp.js";

/**
 * Options for the handoff command.
 */
export interface HandoffOptions {
  /** Session content (from stdin or argument) */
  content?: string;
  /** Priority level */
  priority?: "high" | "medium" | "low";
  /** Tags for the session */
  tags?: string[];
  /** Custom sessions directory */
  sessionsDir?: string;
}

/**
 * Builds session content with YAML front matter.
 */
function buildSessionContent(options: HandoffOptions): string {
  const content = options.content ?? "# New Session\n\nDescribe your task here.";
  const priority = options.priority ?? "medium";
  const tags = options.tags ?? [];

  // Build YAML front matter
  const frontMatter = [
    "---",
    `priority: ${priority}`,
  ];

  if (tags.length > 0) {
    frontMatter.push(`tags: [${tags.join(", ")}]`);
  }

  frontMatter.push("---");
  frontMatter.push("");

  return frontMatter.join("\n") + content;
}

/**
 * Executes the handoff command.
 *
 * Creates a new session in the todo directory for pickup by another context.
 * Output includes `<HANDOFF_ID>` tag for easy parsing by automation tools.
 *
 * @param options - Command options
 * @returns Formatted output for display with parseable session ID
 * @throws {SessionInvalidContentError} When content validation fails
 */
export async function handoffCommand(options: HandoffOptions): Promise<string> {
  // Build config from options
  const config: SessionDirectoryConfig = options.sessionsDir
    ? {
      todoDir: join(options.sessionsDir, "todo"),
      doingDir: join(options.sessionsDir, "doing"),
      archiveDir: join(options.sessionsDir, "archive"),
    }
    : DEFAULT_SESSION_CONFIG;

  // Generate session ID
  const sessionId = generateSessionId();

  // Build content with front matter
  const fullContent = buildSessionContent(options);

  // Validate content
  const validation = validateSessionContent(fullContent);
  if (!validation.valid) {
    throw new SessionInvalidContentError(validation.error ?? "Unknown validation error");
  }

  // Build path and ensure directory exists
  const sessionPath = buildSessionPath(sessionId, config);
  await mkdir(config.todoDir, { recursive: true });

  // Write file
  await writeFile(sessionPath, fullContent, "utf-8");

  // Output with parseable HANDOFF_ID tag
  return `Created handoff session <HANDOFF_ID>${sessionId}</HANDOFF_ID>\nPath: ${sessionPath}`;
}
