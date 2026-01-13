/**
 * Session creation utilities.
 *
 * @module session/create
 */

import type { SessionDirectoryConfig } from "./show";

/**
 * Minimum content length for a valid session.
 */
export const MIN_CONTENT_LENGTH = 1;

/**
 * Configuration subset needed for session creation.
 */
export type CreateSessionConfig = Pick<SessionDirectoryConfig, "todoDir">;

/**
 * Result of session content validation.
 */
export interface ValidationResult {
  /** Whether the content is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Builds the full file path for a new session in the todo directory.
 *
 * @param sessionId - Session ID (timestamp format)
 * @param config - Directory configuration with todoDir
 * @returns Full path to session file
 *
 * @example
 * ```typescript
 * const path = buildSessionPath('2026-01-13_08-01-05', { todoDir: '.spx/sessions/todo' });
 * // => '.spx/sessions/todo/2026-01-13_08-01-05.md'
 * ```
 */
export function buildSessionPath(
  sessionId: string,
  config: CreateSessionConfig,
): string {
  return `${config.todoDir}/${sessionId}.md`;
}

/**
 * Validates session content before creation.
 *
 * @param content - Raw session content
 * @returns Validation result with valid flag and optional error
 *
 * @example
 * ```typescript
 * const result = validateSessionContent('# My Session');
 * // => { valid: true }
 *
 * const result = validateSessionContent('');
 * // => { valid: false, error: 'Session content cannot be empty' }
 * ```
 */
export function validateSessionContent(content: string): ValidationResult {
  // Check for empty content
  if (!content || content.trim().length < MIN_CONTENT_LENGTH) {
    return {
      valid: false,
      error: "Session content cannot be empty",
    };
  }

  // Check for only whitespace
  if (content.trim().length === 0) {
    return {
      valid: false,
      error: "Session content cannot be only whitespace",
    };
  }

  return { valid: true };
}
