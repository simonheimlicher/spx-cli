/**
 * TypeScript validation command.
 *
 * Runs TypeScript type checking using tsc.
 */
import { discoverTool, formatSkipMessage } from "../../validation/discovery";
import type { TypeScriptCommandOptions, ValidationCommandResult } from "./types";

/**
 * Run TypeScript type checking.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function typescriptCommand(options: TypeScriptCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, quiet } = options;

  // Discover tsc (provided by typescript package)
  const result = await discoverTool("typescript", { projectRoot: cwd });
  if (!result.found) {
    const skipMessage = formatSkipMessage("TypeScript", result);
    return { exitCode: 0, output: skipMessage };
  }

  // TODO: Implement actual TypeScript validation using src/validation/steps/typescript.ts
  // For now, return placeholder
  if (!quiet) {
    return {
      exitCode: 0,
      output:
        `TypeScript validation: using ${result.location.path} (${result.location.source})\n(implementation pending story-47)`,
    };
  }

  return { exitCode: 0, output: "" };
}
