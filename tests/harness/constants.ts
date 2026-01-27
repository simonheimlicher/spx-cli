/**
 * Test constants and default values for test data generation
 */

// Re-export from production code (per ADR-21: single source of truth)
export { LEAF_KIND, WORK_ITEM_KINDS } from "@/types";

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
