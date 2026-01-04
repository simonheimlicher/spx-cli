/**
 * Test constants and default values for test data generation
 */
import type { WorkItemKind } from "@/types";

/**
 * All valid work item kinds
 */
export const WORK_ITEM_KINDS: readonly WorkItemKind[] = [
  "capability",
  "feature",
  "story",
] as const;

/**
 * Default BSP number for test data
 */
export const DEFAULT_BSP_NUMBER = 20;

/**
 * Minimum valid BSP number
 */
export const MIN_BSP_NUMBER = 10;

/**
 * Maximum valid BSP number
 */
export const MAX_BSP_NUMBER = 99;
