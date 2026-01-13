import { describe, it, expect } from "vitest";
import { buildTree, type TreeBuildDeps } from "@/tree/build";
import type { WorkItem } from "@/types";

/**
 * Helper to create WorkItem with path
 */
function createWorkItemWithPath(
  kind: "capability" | "feature" | "story",
  number: number,
  slug: string,
  path: string
): WorkItem {
  return {
    kind,
    number,
    slug,
    path,
  };
}

/**
 * Test dependency: simple status resolver
 */
const testDeps: TreeBuildDeps = {
  getStatus: async () => "OPEN",
};

describe("buildTree - BSP Sorting", () => {
  describe("GIVEN features with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
      // Given - features out of order: 65, 32, 43
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          "capability",
          20,
          "test",
          "/specs/capability-21_test"
        ),
        createWorkItemWithPath(
          "feature",
          65,
          "feat3",
          "/specs/capability-21_test/feature-65_feat3"
        ),
        createWorkItemWithPath(
          "feature",
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1"
        ),
        createWorkItemWithPath(
          "feature",
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2"
        ),
      ];

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then - should be sorted: 32, 43, 65
      const features = tree.nodes[0].children;
      expect(features.map((f) => f.number)).toEqual([32, 43, 65]);
      expect(features.map((f) => f.slug)).toEqual(["feat1", "feat2", "feat3"]);
    });
  });

  describe("GIVEN stories with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
      // Given - stories out of order: 54, 21, 43
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          "capability",
          20,
          "test",
          "/specs/capability-21_test"
        ),
        createWorkItemWithPath(
          "feature",
          32,
          "feat",
          "/specs/capability-21_test/feature-32_feat"
        ),
        createWorkItemWithPath(
          "story",
          54,
          "story3",
          "/specs/capability-21_test/feature-32_feat/story-54_story3"
        ),
        createWorkItemWithPath(
          "story",
          21,
          "story1",
          "/specs/capability-21_test/feature-32_feat/story-21_story1"
        ),
        createWorkItemWithPath(
          "story",
          43,
          "story2",
          "/specs/capability-21_test/feature-32_feat/story-43_story2"
        ),
      ];

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then - should be sorted: 21, 43, 54
      const stories = tree.nodes[0].children[0].children;
      expect(stories.map((s) => s.number)).toEqual([21, 43, 54]);
    });
  });

  describe("GIVEN multiple capabilities with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
      // Given - capabilities out of order: 31, 20, 42
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          "capability",
          31,
          "cap2",
          "/specs/capability-32_cap2"
        ),
        createWorkItemWithPath(
          "capability",
          20,
          "cap1",
          "/specs/capability-21_cap1"
        ),
        createWorkItemWithPath(
          "capability",
          42,
          "cap3",
          "/specs/capability-43_cap3"
        ),
      ];

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then - should be sorted: 20, 31, 42
      expect(tree.nodes.map((c) => c.number)).toEqual([20, 31, 42]);
    });
  });
});
