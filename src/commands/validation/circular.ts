/**
 * Circular dependency check command.
 *
 * Runs madge to detect circular dependencies.
 */
import { discoverTool, formatSkipMessage } from "../../validation/discovery";
import type { CircularCommandOptions, ValidationCommandResult } from "./types";

/**
 * Check for circular dependencies.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function circularCommand(options: CircularCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, quiet } = options;

  // Discover madge
  const result = await discoverTool("madge", { projectRoot: cwd });
  if (!result.found) {
    const skipMessage = formatSkipMessage("circular dependency check", result);
    return { exitCode: 0, output: skipMessage };
  }

  // TODO: Implement actual circular dependency check using src/validation/steps/circular.ts
  // For now, return placeholder
  if (!quiet) {
    return {
      exitCode: 0,
      output:
        `Circular dependency check: using ${result.location.path} (${result.location.source})\n(implementation pending story-47)`,
    };
  }

  return { exitCode: 0, output: "" };
}
