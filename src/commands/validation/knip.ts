/**
 * Knip command for detecting unused code.
 *
 * Runs knip to find unused exports, dependencies, and files.
 */
import { discoverTool, formatSkipMessage } from "../../validation/discovery";
import type { KnipCommandOptions, ValidationCommandResult } from "./types";

/**
 * Detect unused code with knip.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function knipCommand(options: KnipCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, quiet } = options;

  // Discover knip
  const result = await discoverTool("knip", { projectRoot: cwd });
  if (!result.found) {
    const skipMessage = formatSkipMessage("unused code detection", result);
    return { exitCode: 0, output: skipMessage };
  }

  // TODO: Implement actual knip validation using src/validation/steps/knip.ts
  // For now, return placeholder
  if (!quiet) {
    return {
      exitCode: 0,
      output:
        `Unused code detection: using ${result.location.path} (${result.location.source})\n(implementation pending story-47)`,
    };
  }

  return { exitCode: 0, output: "" };
}
