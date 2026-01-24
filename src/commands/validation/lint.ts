/**
 * ESLint validation command.
 *
 * Runs ESLint for code quality checks.
 */
import { discoverTool, formatSkipMessage } from "../../validation/discovery";
import type { LintCommandOptions, ValidationCommandResult } from "./types";

/**
 * Run ESLint validation.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function lintCommand(options: LintCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, quiet, fix } = options;

  // Discover eslint
  const result = await discoverTool("eslint", { projectRoot: cwd });
  if (!result.found) {
    const skipMessage = formatSkipMessage("ESLint", result);
    return { exitCode: 0, output: skipMessage };
  }

  // TODO: Implement actual ESLint validation using src/validation/steps/eslint.ts
  // For now, return placeholder
  if (!quiet) {
    const mode = fix ? " (with --fix)" : "";
    return {
      exitCode: 0,
      output:
        `ESLint validation${mode}: using ${result.location.path} (${result.location.source})\n(implementation pending story-47)`,
    };
  }

  return { exitCode: 0, output: "" };
}
