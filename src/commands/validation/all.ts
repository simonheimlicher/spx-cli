/**
 * Run all validations command.
 *
 * Executes all validation steps in sequence:
 * 1. Circular dependencies (fastest)
 * 2. Knip (optional)
 * 3. ESLint
 * 4. TypeScript (slowest)
 */
import { circularCommand } from "./circular";
import { knipCommand } from "./knip";
import { lintCommand } from "./lint";
import type { AllCommandOptions, ValidationCommandResult } from "./types";
import { typescriptCommand } from "./typescript";

/**
 * Run all validation steps.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function allCommand(options: AllCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, scope, files, fix, quiet, json } = options;
  const outputs: string[] = [];
  let hasFailure = false;

  // 1. Circular dependencies
  const circularResult = await circularCommand({ cwd, quiet, json });
  if (circularResult.output) outputs.push(circularResult.output);
  if (circularResult.exitCode !== 0) hasFailure = true;

  // 2. Knip (optional - skip on failure, it's informational)
  const knipResult = await knipCommand({ cwd, quiet, json });
  if (knipResult.output) outputs.push(knipResult.output);
  // Don't fail on knip - it's optional

  // 3. ESLint
  const lintResult = await lintCommand({ cwd, scope, files, fix, quiet, json });
  if (lintResult.output) outputs.push(lintResult.output);
  if (lintResult.exitCode !== 0) hasFailure = true;

  // 4. TypeScript
  const tsResult = await typescriptCommand({ cwd, scope, files, quiet, json });
  if (tsResult.output) outputs.push(tsResult.output);
  if (tsResult.exitCode !== 0) hasFailure = true;

  return {
    exitCode: hasFailure ? 1 : 0,
    output: outputs.join("\n\n"),
  };
}
