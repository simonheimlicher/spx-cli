/**
 * Tree building functions for converting flat work item lists to hierarchical trees
 *
 * Part of Feature 54 (Tree Building)
 */
import type { WorkItem } from "../types.js";
import type { TreeNode, WorkItemTree } from "./types.js";
import { getWorkItemStatus } from "../status/state.js";

/**
 * Dependencies for tree building (for testing)
 */
export interface TreeBuildDeps {
  getStatus?: (path: string) => Promise<string>;
}

/**
 * Build hierarchical tree from flat list of work items
 *
 * Creates parent-child relationships based on directory paths.
 * Per ADR-002, children are BSP-sorted and status is rolled up from children.
 *
 * @param workItems - Flat list of work items from scanner
 * @param deps - Optional dependencies (for testing)
 * @returns Hierarchical tree structure
 * @throws Error if orphan work items detected (items without valid parents)
 *
 * @example
 * ```typescript
 * const workItems = await walkSpecs("/specs");
 * const tree = await buildTree(workItems);
 * // tree.nodes contains top-level capabilities with nested children
 * ```
 */
export async function buildTree(
  workItems: WorkItem[],
  deps: TreeBuildDeps = {}
): Promise<WorkItemTree> {
  const getStatus = deps.getStatus || getWorkItemStatus;

  // Step 1: Determine status for each work item
  const itemsWithStatus = await Promise.all(
    workItems.map(async (item) => ({
      ...item,
      status: await getStatus(item.path),
    }))
  );

  // Step 2: Separate work items by kind
  const capabilities = itemsWithStatus.filter(
    (item) => item.kind === "capability"
  );
  const features = itemsWithStatus.filter((item) => item.kind === "feature");
  const stories = itemsWithStatus.filter((item) => item.kind === "story");

  // Step 3: Build tree nodes for each level (with BSP sorting)
  const storyNodes = stories.map((item) => createTreeNode(item, []));
  const featureNodes = features.map((item) => {
    const children = storyNodes
      .filter((story) => isChildOf(story.path, item.path))
      .sort((a, b) => a.number - b.number); // Sort by BSP number
    return createTreeNode(item, children);
  });
  const capabilityNodes = capabilities.map((item) => {
    const children = featureNodes
      .filter((feature) => isChildOf(feature.path, item.path))
      .sort((a, b) => a.number - b.number); // Sort by BSP number
    return createTreeNode(item, children);
  });

  // Step 4: Detect orphans
  detectOrphans(stories, featureNodes);
  detectOrphans(features, capabilityNodes);

  // Step 5: Sort top-level capabilities by BSP number
  const sortedCapabilities = capabilityNodes.sort((a, b) => a.number - b.number);

  // Step 6: Roll up status from children to parents
  rollupStatus(sortedCapabilities);

  return {
    nodes: sortedCapabilities,
  };
}

/**
 * Create a TreeNode from a work item with status and children
 */
function createTreeNode(
  item: WorkItem & { status: string },
  children: TreeNode[]
): TreeNode {
  return {
    kind: item.kind,
    number: item.number,
    slug: item.slug,
    path: item.path,
    status: item.status as "OPEN" | "IN_PROGRESS" | "DONE",
    children,
  };
}

/**
 * Check if childPath is a direct child of parentPath
 *
 * A path is a child if it starts with the parent path followed by a separator.
 *
 * @param childPath - Potential child path
 * @param parentPath - Potential parent path
 * @returns true if childPath is a direct child of parentPath
 */
function isChildOf(childPath: string, parentPath: string): boolean {
  // Normalize paths to ensure consistent comparison
  const normalizedChild = childPath.replace(/\/$/, "");
  const normalizedParent = parentPath.replace(/\/$/, "");

  // Check if child starts with parent followed by path separator
  if (!normalizedChild.startsWith(normalizedParent + "/")) {
    return false;
  }

  // Ensure it's a direct child (not a grandchild)
  const relativePath = normalizedChild.slice(normalizedParent.length + 1);
  return !relativePath.includes("/");
}

/**
 * Detect orphan work items (items without valid parents)
 *
 * @param items - Work items to check
 * @param potentialParents - Potential parent nodes
 * @throws Error if orphans detected
 */
function detectOrphans(
  items: (WorkItem & { status: string })[],
  potentialParents: TreeNode[]
): void {
  for (const item of items) {
    const hasParent = potentialParents.some((parent) =>
      isChildOf(item.path, parent.path)
    );

    if (!hasParent) {
      throw new Error(
        `Orphan work item detected: ${item.kind} "${item.slug}" at ${item.path} has no valid parent`
      );
    }
  }
}

/**
 * Roll up status from children to parents
 *
 * Recursively aggregates status from child nodes to parent nodes.
 * Rollup rules:
 * - Any child IN_PROGRESS → parent IN_PROGRESS
 * - All children DONE → parent DONE
 * - All children OPEN → parent OPEN
 * - Mixed DONE/OPEN → parent IN_PROGRESS
 *
 * @param nodes - Tree nodes to process (modified in place)
 */
function rollupStatus(nodes: TreeNode[]): void {
  for (const node of nodes) {
    if (node.children.length > 0) {
      // First, recursively roll up status for children
      rollupStatus(node.children);

      // Then, aggregate status from children
      const childStatuses = node.children.map((child) => child.status);

      // Any child IN_PROGRESS → parent IN_PROGRESS
      if (childStatuses.includes("IN_PROGRESS")) {
        node.status = "IN_PROGRESS";
      }
      // All children DONE → parent DONE
      else if (childStatuses.every((status) => status === "DONE")) {
        node.status = "DONE";
      }
      // All children OPEN → parent OPEN
      else if (childStatuses.every((status) => status === "OPEN")) {
        node.status = "OPEN";
      }
      // Mixed DONE/OPEN → parent IN_PROGRESS
      else {
        node.status = "IN_PROGRESS";
      }
    }
    // Leaf nodes (stories) keep their original status
  }
}
