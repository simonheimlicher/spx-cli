/**
 * Session create CLI command handler.
 *
 * @module commands/session/create
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildSessionPath, validateSessionContent } from "../../session/create.js";
import { SessionInvalidContentError } from "../../session/errors.js";
import { DEFAULT_SESSION_CONFIG, type SessionDirectoryConfig } from "../../session/show.js";
import { generateSessionId } from "../../session/timestamp.js";

/**
 * Options for the create command.
 */
export interface CreateOptions {
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
function buildSessionContent(options: CreateOptions): string {
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
 * Executes the create command.
 *
 * @param options - Command options
 * @returns Formatted output for display
 * @throws {SessionInvalidContentError} When content validation fails
 */
export async function createCommand(options: CreateOptions): Promise<string> {
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

  return `Created session: ${sessionId}\nPath: ${sessionPath}`;
}
