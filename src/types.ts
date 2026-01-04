/**
 * Core type definitions for spx
 */

/**
 * Work item types in the spec hierarchy
 */
export type WorkItemKind = "capability" | "feature" | "story";

/**
 * Parsed work item structure
 */
export interface WorkItem {
  /** The type of work item */
  kind: WorkItemKind;
  /** BSP number (0-indexed for capabilities, as-is for features/stories) */
  number: number;
  /** URL-safe slug identifier */
  slug: string;
  /** Full filesystem path to work item directory */
  path?: string;
}

/**
 * Directory entry from filesystem traversal
 */
export interface DirectoryEntry {
  /** Directory name (basename) */
  name: string;
  /** Full absolute path */
  path: string;
  /** Whether this is a directory */
  isDirectory: boolean;
}

/**
 * Work item status
 */
export type WorkItemStatus = "OPEN" | "IN_PROGRESS" | "DONE";
