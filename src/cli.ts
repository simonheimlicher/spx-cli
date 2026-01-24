/**
 * CLI entry point for spx
 */
import { Command } from "commander";
import { claudeDomain } from "./domains/claude";
import { sessionDomain } from "./domains/session";
import { specDomain } from "./domains/spec";
import { validationDomain } from "./domains/validation";

const program = new Command();

program
  .name("spx")
  .description("Fast, deterministic CLI tool for spec workflow management")
  .version("0.2.0");

// Register domains
claudeDomain.register(program);
sessionDomain.register(program);
specDomain.register(program);
validationDomain.register(program);

program.parse();
