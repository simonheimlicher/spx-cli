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

      const tree = await buildTree(workItems, testDeps);

      expect(tree.nodes).toHaveLength(1);
      expect(tree.nodes[0].kind).toBe("capability");
      expect(tree.nodes[0].children).toHaveLength(1);
      expect(tree.nodes[0].children[0].slug).toBe("feat");
    });
  });

  describe("GIVEN feature with story", () => {
    it("WHEN building tree THEN story is child of feature", async () => {
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

      const tree = await buildTree(workItems, testDeps);

      const feature = tree.nodes[0].children[0];
      expect(feature.children).toHaveLength(1);
      expect(feature.children[0].slug).toBe("story");
    });
  });

  describe("GIVEN capability with multiple features", () => {
    it("WHEN building tree THEN all features linked", async () => {
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

      const tree = await buildTree(workItems, testDeps);

      expect(tree.nodes[0].children).toHaveLength(2);
    });
  });

  describe("GIVEN orphan work items", () => {
    it("WHEN building tree THEN throws error", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath("story", 21, "orphan", "/specs/story-21_orphan"),
      ];

      await expect(buildTree(workItems, testDeps)).rejects.toThrow(
        /orphan|parent/i
      );
    });
  });

  describe("GIVEN multiple capabilities", () => {
    it("WHEN building tree THEN returns all at root level", async () => {
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

      const tree = await buildTree(workItems, testDeps);

      expect(tree.nodes).toHaveLength(2);
    });
  });
});

describe("buildTree - BSP Sorting", () => {
  describe("GIVEN features with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
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

      const tree = await buildTree(workItems, testDeps);

      const features = tree.nodes[0].children;
      expect(features.map((f) => f.number)).toEqual([32, 43, 65]);
      expect(features.map((f) => f.slug)).toEqual(["feat1", "feat2", "feat3"]);
    });
  });

  describe("GIVEN stories with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
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

      const tree = await buildTree(workItems, testDeps);

      const stories = tree.nodes[0].children[0].children;
      expect(stories.map((s) => s.number)).toEqual([21, 43, 54]);
    });
  });

  describe("GIVEN multiple capabilities with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
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

      const tree = await buildTree(workItems, testDeps);

      expect(tree.nodes.map((c) => c.number)).toEqual([20, 31, 42]);
    });
  });
});

describe("buildTree - Status Rollup", () => {
  describe("GIVEN all children DONE", () => {
    it("WHEN rolling up status THEN parent is DONE", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "OPEN",
        "/specs/capability-21_test/feature-32_feat1": "DONE",
        "/specs/capability-21_test/feature-43_feat2": "DONE",
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || "OPEN",
      };

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

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe("DONE");
    });
  });

  describe("GIVEN any child IN_PROGRESS", () => {
    it("WHEN rolling up status THEN parent is IN_PROGRESS", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "OPEN",
        "/specs/capability-21_test/feature-32_feat1": "DONE",
        "/specs/capability-21_test/feature-43_feat2": "IN_PROGRESS",
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || "OPEN",
      };

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

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe("IN_PROGRESS");
    });
  });

  describe("GIVEN mixed DONE and OPEN", () => {
    it("WHEN rolling up status THEN parent is IN_PROGRESS", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "OPEN",
        "/specs/capability-21_test/feature-32_feat1": "DONE",
        "/specs/capability-21_test/feature-43_feat2": "OPEN",
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || "OPEN",
      };

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

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe("IN_PROGRESS");
    });
  });

  describe("GIVEN all children OPEN", () => {
    it("WHEN rolling up status THEN parent is OPEN", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "IN_PROGRESS",
        "/specs/capability-21_test/feature-32_feat1": "OPEN",
        "/specs/capability-21_test/feature-43_feat2": "OPEN",
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || "OPEN",
      };

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

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe("OPEN");
    });
  });
});
