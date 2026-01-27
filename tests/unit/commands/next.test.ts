/**
 * Level 1: Unit tests for next command logic
 * Story: story-32_next-command
 */
import { findNextWorkItem } from "@/commands/spec/next";
import type { WorkItemTree } from "@/tree/types";
import { WORK_ITEM_KINDS, WORK_ITEM_STATUSES } from "@/types";
import { buildTreePath, createNode } from "@test/harness/tree-builder";
import { describe, expect, it } from "vitest";

describe("findNextWorkItem", () => {
  /**
   * Level 1: Pure selection logic tests
   */

  it("GIVEN IN_PROGRESS and OPEN items WHEN finding next THEN returns lowest BSP regardless of status", () => {
    // Given: Tree with IN_PROGRESS story-32 and OPEN story-21
    const inProgressStory = createNode(WORK_ITEM_KINDS[2], 32, "in-progress", WORK_ITEM_STATUSES[1]);
    const openStory = createNode(WORK_ITEM_KINDS[2], 21, "open", WORK_ITEM_STATUSES[0]);
    const feat = createNode(WORK_ITEM_KINDS[1], 21, "test", WORK_ITEM_STATUSES[1], [
      openStory,
      inProgressStory,
    ]);
    const cap = createNode(WORK_ITEM_KINDS[0], 20, "test", WORK_ITEM_STATUSES[1], [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return story-21 (lowest BSP, status irrelevant)
    expect(next).not.toBeNull();
    expect(next?.number).toBe(21);
    expect(next?.slug).toBe("open");
  });

  it("GIVEN multiple IN_PROGRESS items WHEN finding next THEN returns lowest numbered", () => {
    // Given: Tree with IN_PROGRESS story-43 and story-32
    const story32 = createNode(WORK_ITEM_KINDS[2], 32, "second", WORK_ITEM_STATUSES[1]);
    const story43 = createNode(WORK_ITEM_KINDS[2], 43, "third", WORK_ITEM_STATUSES[1]);
    const feat = createNode(WORK_ITEM_KINDS[1], 21, "test", WORK_ITEM_STATUSES[1], [
      story43,
      story32,
    ]);
    const cap = createNode(WORK_ITEM_KINDS[0], 20, "test", WORK_ITEM_STATUSES[1], [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return story-32 (lowest BSP number)
    expect(next).not.toBeNull();
    expect(next?.number).toBe(32);
    expect(next?.slug).toBe("second");
  });

  it("GIVEN only OPEN items WHEN finding next THEN returns OPEN with lowest number", () => {
    // Given: Tree with OPEN story-21 and story-32
    const story21 = createNode(WORK_ITEM_KINDS[2], 21, "first", WORK_ITEM_STATUSES[0]);
    const story32 = createNode(WORK_ITEM_KINDS[2], 32, "second", WORK_ITEM_STATUSES[0]);
    const feat = createNode(WORK_ITEM_KINDS[1], 21, "test", WORK_ITEM_STATUSES[0], [story21, story32]);
    const cap = createNode(WORK_ITEM_KINDS[0], 20, "test", WORK_ITEM_STATUSES[0], [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return story-21 (lowest number)
    expect(next).not.toBeNull();
    expect(next?.status).toBe(WORK_ITEM_STATUSES[0]);
    expect(next?.number).toBe(21);
    expect(next?.slug).toBe("first");
  });

  it("GIVEN all DONE WHEN finding next THEN returns null", () => {
    // Given: Tree with all stories DONE
    const story1 = createNode(WORK_ITEM_KINDS[2], 21, "done1", WORK_ITEM_STATUSES[2]);
    const story2 = createNode(WORK_ITEM_KINDS[2], 32, "done2", WORK_ITEM_STATUSES[2]);
    const feat = createNode(WORK_ITEM_KINDS[1], 21, "test", WORK_ITEM_STATUSES[2], [story1, story2]);
    const cap = createNode(WORK_ITEM_KINDS[0], 20, "test", WORK_ITEM_STATUSES[2], [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return null (all done)
    expect(next).toBeNull();
  });

  it("GIVEN empty tree WHEN finding next THEN returns null", () => {
    // Given: Empty tree
    const tree: WorkItemTree = { nodes: [] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return null
    expect(next).toBeNull();
  });

  it("GIVEN tree with no stories WHEN finding next THEN returns null", () => {
    // Given: Tree with only capability and feature, no stories
    const feat = createNode(WORK_ITEM_KINDS[1], 21, "test", WORK_ITEM_STATUSES[0], []);
    const cap = createNode(WORK_ITEM_KINDS[0], 20, "test", WORK_ITEM_STATUSES[0], [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return null (no stories to work on)
    expect(next).toBeNull();
  });

  it("GIVEN multiple capabilities WHEN finding next THEN returns first in BSP order", () => {
    // Given: Two capabilities - cap1 (BSP 20) has story, cap2 (BSP 21) has story
    // Even though cap2's story has lower number, cap1 comes first in tree order
    const story43Cap1 = createNode(WORK_ITEM_KINDS[2], 43, "cap1-story", WORK_ITEM_STATUSES[0]);
    const feat1 = createNode(WORK_ITEM_KINDS[1], 21, "test1", WORK_ITEM_STATUSES[0], [story43Cap1]);
    const cap1 = createNode(WORK_ITEM_KINDS[0], 20, "test1", WORK_ITEM_STATUSES[0], [feat1]);

    const story21Cap2 = createNode(WORK_ITEM_KINDS[2], 21, "cap2-story", WORK_ITEM_STATUSES[1]);
    const feat2 = createNode(WORK_ITEM_KINDS[1], 21, "test2", WORK_ITEM_STATUSES[1], [
      story21Cap2,
    ]);
    const cap2 = createNode(WORK_ITEM_KINDS[0], 21, "test2", WORK_ITEM_STATUSES[1], [feat2]);

    // Tree is BSP-sorted: cap1 (20) before cap2 (21)
    const tree: WorkItemTree = { nodes: [cap1, cap2] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return story from cap1 (first capability in BSP order)
    expect(next).toBe(story43Cap1);
  });

  /**
   * Type-derived hierarchy tests (per ADR-21)
   *
   * These tests verify that BSP ordering respects hierarchy depth.
   * Test cases are generated from WORK_ITEM_KINDS to adapt to hierarchy changes.
   */
  describe("hierarchy BSP ordering", () => {
    const DEPTH = WORK_ITEM_KINDS.length;

    // Helper to generate BSP numbers for a path
    // At differing level: use specified BSP; before: use 10; after: use afterBsp
    function makeBspPath(differLevel: number, differBsp: number, afterBsp: number): number[] {
      return Array.from({ length: DEPTH }, (_, i) => {
        if (i < differLevel) return 10; // Same before differing level
        if (i === differLevel) return differBsp; // Differ at this level
        return afterBsp; // After differing level
      });
    }

    // Generate test cases for each level where paths can differ
    // At level L: paths match at levels 0..L-1, differ at L, first has lower BSP
    const hierarchyTestCases = Array.from({ length: DEPTH }, (_, level) => ({
      desc: `lower BSP at level ${level} (${WORK_ITEM_KINDS[level]}) wins`,
      // First path: lower BSP (10) at differing level, higher BSP (99) at deeper levels
      first: makeBspPath(level, 10, 99),
      // Second path: higher BSP (20) at differing level, lower BSP (10) at deeper levels (trap!)
      second: makeBspPath(level, 20, 10),
    }));

    it.each(hierarchyTestCases)(
      "GIVEN two paths where $desc WHEN finding next THEN returns first path leaf",
      ({ first, second }) => {
        const path1 = buildTreePath(first);
        const path2 = buildTreePath(second);

        // Tree is BSP-sorted per ADR-002 (path1 has lower BSP at differing level)
        // Depth-first traversal should return path1.leaf regardless of deeper BSP numbers
        const tree: WorkItemTree = { nodes: [path1.root, path2.root] };
        const next = findNextWorkItem(tree);

        // Compare by REFERENCE, not by magic string
        expect(next).toBe(path1.leaf);
      },
    );
  });
});
