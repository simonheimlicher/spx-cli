/**
 * CLI entry point for spx
 */
import { Command } from "commander";
import type { OutputFormat } from "./commands/spec/status.js";
import { claudeDomain } from "./domains/claude/index.js";
import { sessionDomain } from "./domains/session/index.js";
import { specDomain } from "./domains/spec/index.js";

const program = new Command();

program
  .name("spx")
  .description("Fast, deterministic CLI tool for spec workflow management")
  .version("0.2.0"); // Bump version for domain-scoped architecture

// Register domains
claudeDomain.register(program);
sessionDomain.register(program);
specDomain.register(program);

// Backward compatibility: Root command aliases (deprecated)
program
  .command("status")
  .description("(deprecated) Use 'spx spec status' instead")
  .option("--json", "Output as JSON")
  .option("--format <format>", "Output format (text|json|markdown|table)")
  .action(async (options: { json?: boolean; format?: string }) => {
    // Show deprecation warning to stderr
    console.warn("⚠️  Deprecated: Use 'spx spec status' instead");
    console.warn("   This alias will be removed in v2.0.0\n");

    // Delegate to spec domain status command
    try {
      let format: OutputFormat = "text";
      if (options.json) {
        format = "json";
      } else if (options.format) {
        const validFormats = ["text", "json", "markdown", "table"];
        if (validFormats.includes(options.format)) {
          format = options.format as OutputFormat;
        } else {
          console.error(
            `Error: Invalid format "${options.format}". Must be one of: ${validFormats.join(", ")}`,
          );
          process.exit(1);
        }
      }

      const { statusCommand } = await import("./commands/spec/status.js");
      const output = await statusCommand({ cwd: process.cwd(), format });
      console.log(output);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program
  .command("next")
  .description("(deprecated) Use 'spx spec next' instead")
  .action(async () => {
    // Show deprecation warning to stderr
    console.warn("⚠️  Deprecated: Use 'spx spec next' instead");
    console.warn("   This alias will be removed in v2.0.0\n");

    // Delegate to spec domain next command
    try {
      const { nextCommand } = await import("./commands/spec/next.js");
      const output = await nextCommand({ cwd: process.cwd() });
      console.log(output);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program.parse();
