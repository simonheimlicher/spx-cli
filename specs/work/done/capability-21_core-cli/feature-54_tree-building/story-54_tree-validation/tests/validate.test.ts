/**
 * Level 1: Unit tests for tree validation
 * Story: story-54_tree-validation
 */
import type { WorkItemTree } from "@/tree/types";
import { TreeValidationError, validateTree } from "@/tree/validate";
import { buildSimpleTree, buildTreeWithFeatures, buildTreeWithStories, createNode } from "@test/helpers/tree-builder";
import { describe, expect, it } from "vitest";

describe("validateTree", () => {
  /**
   * Level 1: Pure structure validation
   */

  it("GIVEN valid simple tree WHEN validating THEN does not throw", () => {
    // Given
    const tree = buildSimpleTree();

    // When/Then
    expect(() => validateTree(tree)).not.toThrow();
  });

  it("GIVEN valid tree with features WHEN validating THEN does not throw", () => {
    // Given
    const tree = buildTreeWithFeatures();

    // When/Then
    expect(() => validateTree(tree)).not.toThrow();
  });

  it("GIVEN valid tree with stories WHEN validating THEN does not throw", () => {
    // Given
    const tree = buildTreeWithStories();

    // When/Then
    expect(() => validateTree(tree)).not.toThrow();
  });
});

describe("validateTree - Duplicate BSP numbers", () => {
  it("GIVEN duplicate BSP numbers at capability level WHEN validating THEN throws error", () => {
    // Given: Two capabilities with same number
    const cap1 = createNode("capability", 20, "test1", "DONE");
    const cap2 = createNode("capability", 20, "test2", "DONE");
    const tree: WorkItemTree = { nodes: [cap1, cap2] };

    // When/Then
    expect(() => validateTree(tree)).toThrow(TreeValidationError);
    expect(() => validateTree(tree)).toThrow(/duplicate/i);
  });

  it("GIVEN duplicate BSP numbers at feature level WHEN validating THEN throws error", () => {
    // Given: Two features with same number under one capability
    const feat1 = createNode("feature", 21, "test1", "DONE");
    const feat2 = createNode("feature", 21, "test2", "DONE");
    const cap = createNode("capability", 20, "test", "DONE", [feat1, feat2]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When/Then
    expect(() => validateTree(tree)).toThrow(TreeValidationError);
    expect(() => validateTree(tree)).toThrow(/duplicate/i);
  });

  it("GIVEN duplicate BSP numbers at story level WHEN validating THEN throws error", () => {
    // Given: Two stories with same number under one feature
    const story1 = createNode("story", 21, "test1", "DONE");
    const story2 = createNode("story", 21, "test2", "DONE");
    const feat = createNode("feature", 21, "test", "DONE", [story1, story2]);
    const cap = createNode("capability", 20, "test", "DONE", [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When/Then
    expect(() => validateTree(tree)).toThrow(TreeValidationError);
    expect(() => validateTree(tree)).toThrow(/duplicate/i);
  });
});

describe("validateTree - Hierarchy constraints", () => {
  it("GIVEN story not under feature WHEN validating THEN throws error", () => {
    // Given: Story directly under capability
    const story = createNode("story", 21, "orphan", "DONE");
    const cap = createNode("capability", 20, "test", "DONE", [story]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When/Then
    expect(() => validateTree(tree)).toThrow(TreeValidationError);
    expect(() => validateTree(tree)).toThrow(/hierarchy/i);
  });

  it("GIVEN story with children WHEN validating THEN throws error", () => {
    // Given: Story with children (stories should be leaf nodes)
    const childStory = createNode("story", 32, "child", "DONE");
    const parentStory = createNode("story", 21, "parent", "DONE", [
      childStory,
    ]);
    const feat = createNode("feature", 21, "test", "DONE", [parentStory]);
    const cap = createNode("capability", 20, "test", "DONE", [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When/Then
    expect(() => validateTree(tree)).toThrow(TreeValidationError);
    expect(() => validateTree(tree)).toThrow(/hierarchy/i);
    expect(() => validateTree(tree)).toThrow(/leaf/i);
  });

  it("GIVEN feature not under capability WHEN validating THEN throws error", () => {
    // Given: Feature at root level
    const feat = createNode("feature", 21, "orphan", "DONE");
    const tree: WorkItemTree = { nodes: [feat] };

    // When/Then
    expect(() => validateTree(tree)).toThrow(TreeValidationError);
    expect(() => validateTree(tree)).toThrow(/hierarchy/i);
  });

  it("GIVEN capability under another capability WHEN validating THEN throws error", () => {
    // Given: Capability nested under another capability
    const nestedCap = createNode("capability", 21, "nested", "DONE");
    const cap = createNode("capability", 20, "test", "DONE", [nestedCap]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When/Then
    expect(() => validateTree(tree)).toThrow(TreeValidationError);
    expect(() => validateTree(tree)).toThrow(/hierarchy/i);
  });
});

describe("validateTree - Cycle detection", () => {
  it("GIVEN tree with cycle WHEN validating THEN throws error", () => {
    // Given: Create a cycle by manually creating a child with same path as ancestor
    const story = createNode("story", 21, "test", "DONE");
    const feat = createNode("feature", 21, "test", "DONE", [story]);
    const cap = createNode("capability", 20, "test", "DONE", [feat]);

    // Manually create a cycle: make story's path match capability's path
    // This simulates a cycle where a descendant has the same path as an ancestor
    story.path = cap.path;

    const tree: WorkItemTree = { nodes: [cap] };

    // When/Then
    expect(() => validateTree(tree)).toThrow(TreeValidationError);
    expect(() => validateTree(tree)).toThrow(/cycle/i);
  });
});
