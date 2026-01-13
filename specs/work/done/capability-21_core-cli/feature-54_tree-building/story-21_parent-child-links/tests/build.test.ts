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
 * Test dependency: simple status resolver that returns OPEN for all items
 * (For Level 1 testing - pure functions without filesystem access)
 */
const testDeps: TreeBuildDeps = {
  getStatus: async () => "OPEN",
};

describe("buildTree - Parent-Child Links", () => {
  describe("GIVEN capability with feature", () => {
    it("WHEN building tree THEN feature is child of capability", async () => {
      // Given
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
      ];

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then
      expect(tree.nodes).toHaveLength(1);
      expect(tree.nodes[0].kind).toBe("capability");
      expect(tree.nodes[0].children).toHaveLength(1);
      expect(tree.nodes[0].children[0].slug).toBe("feat");
    });
  });

  describe("GIVEN feature with story", () => {
    it("WHEN building tree THEN story is child of feature", async () => {
      // Given
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
          21,
          "story",
          "/specs/capability-21_test/feature-32_feat/story-21_story"
        ),
      ];

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then
      const feature = tree.nodes[0].children[0];
      expect(feature.children).toHaveLength(1);
      expect(feature.children[0].slug).toBe("story");
    });
  });

  describe("GIVEN capability with multiple features", () => {
    it("WHEN building tree THEN all features linked", async () => {
      // Given
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

      // Then
      expect(tree.nodes[0].children).toHaveLength(2);
    });
  });

  describe("GIVEN orphan work items", () => {
    it("WHEN building tree THEN throws error", async () => {
      // Given: Story without parent feature
      const workItems: WorkItem[] = [
        createWorkItemWithPath("story", 21, "orphan", "/specs/story-21_orphan"),
      ];

      // When/Then
      await expect(buildTree(workItems, testDeps)).rejects.toThrow(
        /orphan|parent/i
      );
    });
  });

  describe("GIVEN multiple capabilities", () => {
    it("WHEN building tree THEN returns all at root level", async () => {
      // Given
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          "capability",
          20,
          "cap1",
          "/specs/capability-21_cap1"
        ),
        createWorkItemWithPath(
          "capability",
          31,
          "cap2",
          "/specs/capability-32_cap2"
        ),
      ];

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then
      expect(tree.nodes).toHaveLength(2);
    });
  });
});
