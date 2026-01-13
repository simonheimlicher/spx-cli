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

describe("buildTree - Status Rollup", () => {
  describe("GIVEN all children DONE", () => {
    it("WHEN rolling up status THEN parent is DONE", async () => {
      // Given - status map: all features are DONE
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "OPEN", // Will be overridden by rollup
        "/specs/capability-21_test/feature-32_feat1": "DONE",
        "/specs/capability-21_test/feature-43_feat2": "DONE",
      };

      const testDeps: TreeBuildDeps = {
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

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then - parent should be DONE (all children DONE)
      expect(tree.nodes[0].status).toBe("DONE");
    });
  });

  describe("GIVEN any child IN_PROGRESS", () => {
    it("WHEN rolling up status THEN parent is IN_PROGRESS", async () => {
      // Given - one feature is IN_PROGRESS
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "OPEN",
        "/specs/capability-21_test/feature-32_feat1": "DONE",
        "/specs/capability-21_test/feature-43_feat2": "IN_PROGRESS",
      };

      const testDeps: TreeBuildDeps = {
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

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then - parent should be IN_PROGRESS (any child IN_PROGRESS)
      expect(tree.nodes[0].status).toBe("IN_PROGRESS");
    });
  });

  describe("GIVEN mixed DONE and OPEN", () => {
    it("WHEN rolling up status THEN parent is IN_PROGRESS", async () => {
      // Given - mix of DONE and OPEN
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "OPEN",
        "/specs/capability-21_test/feature-32_feat1": "DONE",
        "/specs/capability-21_test/feature-43_feat2": "OPEN",
      };

      const testDeps: TreeBuildDeps = {
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

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then - parent should be IN_PROGRESS (mixed statuses)
      expect(tree.nodes[0].status).toBe("IN_PROGRESS");
    });
  });

  describe("GIVEN all children OPEN", () => {
    it("WHEN rolling up status THEN parent is OPEN", async () => {
      // Given - all features are OPEN
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "IN_PROGRESS", // Will be overridden by rollup
        "/specs/capability-21_test/feature-32_feat1": "OPEN",
        "/specs/capability-21_test/feature-43_feat2": "OPEN",
      };

      const testDeps: TreeBuildDeps = {
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

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then - parent should be OPEN (all children OPEN)
      expect(tree.nodes[0].status).toBe("OPEN");
    });
  });

  describe("GIVEN nested rollup (feature from stories)", () => {
    it("WHEN rolling up status THEN feature aggregates from stories", async () => {
      // Given - stories have mixed status
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": "OPEN",
        "/specs/capability-21_test/feature-32_feat": "OPEN",
        "/specs/capability-21_test/feature-32_feat/story-21_story1": "DONE",
        "/specs/capability-21_test/feature-32_feat/story-32_story2": "OPEN",
      };

      const testDeps: TreeBuildDeps = {
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
          "feat",
          "/specs/capability-21_test/feature-32_feat"
        ),
        createWorkItemWithPath(
          "story",
          21,
          "story1",
          "/specs/capability-21_test/feature-32_feat/story-21_story1"
        ),
        createWorkItemWithPath(
          "story",
          32,
          "story2",
          "/specs/capability-21_test/feature-32_feat/story-32_story2"
        ),
      ];

      // When
      const tree = await buildTree(workItems, testDeps);

      // Then - feature should be IN_PROGRESS (stories mixed DONE/OPEN)
      expect(tree.nodes[0].children[0].status).toBe("IN_PROGRESS");
      // And capability should also be IN_PROGRESS (feature IN_PROGRESS)
      expect(tree.nodes[0].status).toBe("IN_PROGRESS");
    });
  });
});
