/**
 * Spec domain - Manage spec workflow
 *
 * This is a stub implementation. Commands will be added in story-32.
 */
import type { Command } from "commander";
import type { Domain } from "../types.js";

/**
 * Spec domain - Manage spec workflow
 *
 * Commands will be implemented in story-32
 */
export const specDomain: Domain = {
  name: "spec",
  description: "Manage spec workflow",
  register: (_program: Command) => {
    // TODO: Implement in story-32
    // Will add: status, next commands
  },
};
