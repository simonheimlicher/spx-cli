/**
 * Next command implementation
 *
 * Finds the next work item to work on based on BSP order:
 * - BSP order is absolute - lower number must complete first
 * - Status (IN_PROGRESS vs OPEN) is irrelevant to priority
 * - Returns first non-DONE item in BSP order
 */
import { DEFAULT_CONFIG } from "../../config/defaults.js";
import { Scanner } from "../../scanner/scanner.js";
import { buildTree } from "../../tree/build.js";
import type { TreeNode, WorkItemTree } from "../../tree/types.js";

/**
 * Options for next command
 */
export interface NextOptions {
  /** Working directory (defaults to current directory) */
  cwd?: string;
}

/**
 * Find the next work item to work on
 *
 * Priority order:
 * - BSP order is absolute - lower number must complete first
 * - Status (IN_PROGRESS vs OPEN) is irrelevant to priority
 * - Returns first non-DONE story in BSP order
 *
 * Only considers story-level work items (leaf nodes).
 *
 * @param tree - Work item tree
 * @returns Next story to work on, or null if all done
 *
 * @example
 * ```typescript
 * const tree = buildTreeWithMixedStatus();
 * const next = findNextWorkItem(tree);
 * // => { kind: "story", number: 21, slug: "lowest-bsp-story", status: "OPEN", ... }
 * ```
 */
export function findNextWorkItem(tree: WorkItemTree): TreeNode | null {
  // Collect all stories (leaf nodes) from the tree
  const stories: TreeNode[] = [];
  collectStories(tree.nodes, stories);

  if (stories.length === 0) {
    return null;
  }

  // Filter to non-DONE stories, sorted by BSP number
  // BSP order is absolute - lower number must complete first, regardless of status
  const pending = stories
    .filter((story) => story.status !== "DONE")
    .sort((a, b) => a.number - b.number);

  // Return first non-DONE item (lowest BSP wins regardless of status)
  return pending[0] ?? null;
}

/**
 * Recursively collect all story nodes from tree
 *
 * @param nodes - Tree nodes to traverse
 * @param stories - Accumulator for story nodes
 */
function collectStories(nodes: TreeNode[], stories: TreeNode[]): void {
  for (const node of nodes) {
    if (node.kind === "story") {
      stories.push(node);
    } else {
      // Recursively collect from children
      collectStories(node.children, stories);
    }
  }
}

/**
 * Format work item name for display
 *
 * @param node - Tree node to format
 * @returns Formatted name (e.g., "story-32_next-command")
 */
function formatWorkItemName(node: TreeNode): string {
  // Display number (capability needs +1, others as-is)
  const displayNum = node.kind === "capability" ? node.number + 1 : node.number;
  return `${node.kind}-${displayNum}_${node.slug}`;
}

/**
 * Execute next command
 *
 * Finds and displays the next work item to work on.
 * Shows full path information for context.
 *
 * @param options - Command options
 * @returns Formatted output
 * @throws Error if specs directory doesn't exist or is inaccessible
 *
 * @example
 * ```typescript
 * const output = await nextCommand({ cwd: "/path/to/project" });
 * console.log(output);
 * ```
 */
export async function nextCommand(options: NextOptions = {}): Promise<string> {
  const cwd = options.cwd || process.cwd();

  // Step 1-3: Use Scanner with config-driven paths
  const scanner = new Scanner(cwd, DEFAULT_CONFIG);
  const workItems = await scanner.scan();

  // Handle empty project
  if (workItems.length === 0) {
    return `No work items found in ${DEFAULT_CONFIG.specs.root}/${DEFAULT_CONFIG.specs.work.dir}/${DEFAULT_CONFIG.specs.work.statusDirs.doing}`;
  }

  // Step 4: Build hierarchical tree with status
  const tree = await buildTree(workItems);

  // Step 5: Find next work item
  const next = findNextWorkItem(tree);

  if (!next) {
    return "All work items are complete! 🎉";
  }

  // Step 6: Find parent feature and capability for context
  const parents = findParents(tree.nodes, next);

  // Step 7: Format output with context
  const lines: string[] = [];
  lines.push("Next work item:");
  lines.push("");

  if (parents.capability && parents.feature) {
    lines.push(
      `  ${formatWorkItemName(parents.capability)} > ${formatWorkItemName(parents.feature)} > ${
        formatWorkItemName(next)
      }`,
    );
  } else {
    lines.push(`  ${formatWorkItemName(next)}`);
  }

  lines.push("");
  lines.push(`  Status: ${next.status}`);
  lines.push(`  Path: ${next.path}`);

  return lines.join("\n");
}

/**
 * Find parent capability and feature for a story
 *
 * @param nodes - Tree nodes to search
 * @param target - Story node to find parents for
 * @returns Parent capability and feature, or empty object if not found
 */
function findParents(
  nodes: TreeNode[],
  target: TreeNode,
): { capability?: TreeNode; feature?: TreeNode } {
  for (const capability of nodes) {
    for (const feature of capability.children) {
      for (const story of feature.children) {
        if (story.path === target.path) {
          return { capability, feature };
        }
      }
    }
  }
  return {};
}
