/**
 * Fixture writer for E2E testing
 *
 * Implements ADR-003: E2E Fixture Generation Strategy
 * - materializeFixture(tree) - Write tree to os.tmpdir()
 * - createFixture(config) - Convenience wrapper
 *
 * @see specs/doing/capability-21_core-cli/decisions/adr-003_e2e-fixture-generation.md
 */
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type FixtureConfig, type FixtureNode, type FixtureTree, generateFixtureTree } from "./fixture-generator";

/**
 * Materialized fixture on disk
 */
export interface MaterializedFixture {
  /** Absolute path to fixture root */
  path: string;
  /** Cleanup function to remove all files */
  cleanup: () => Promise<void>;
  /** Original config for reference */
  config: FixtureConfig;
}

/**
 * Materialize a fixture tree to the filesystem
 *
 * Creates the directory structure in os.tmpdir() following
 * specs/templates/structure.yaml conventions.
 *
 * @param tree - Fixture tree from generateFixtureTree()
 * @returns Materialized fixture with path and cleanup function
 */
export async function materializeFixture(tree: FixtureTree): Promise<MaterializedFixture> {
  // Create unique fixture directory in tmpdir
  const fixtureId = randomUUID();
  const fixturePath = join(tmpdir(), `spx-fixture-${fixtureId}`);

  // Create base structure: {tmpdir}/spx-fixture-{uuid}/specs/work/doing/
  const doingPath = join(fixturePath, "specs", "work", "doing");
  await mkdir(doingPath, { recursive: true });

  // Materialize each capability
  for (const cap of tree.nodes) {
    await materializeCapability(doingPath, cap);
  }

  // Create cleanup function
  const cleanup = async (): Promise<void> => {
    try {
      await rm(fixturePath, { recursive: true, force: true });
    } catch {
      // Ignore errors if already deleted
    }
  };

  return {
    path: fixturePath,
    cleanup,
    config: tree.config,
  };
}

/**
 * Materialize a capability node
 */
async function materializeCapability(doingPath: string, cap: FixtureNode): Promise<void> {
  // Create capability directory: capability-{NN}_{slug}/
  const capDirName = `capability-${cap.number}_${cap.slug}`;
  const capPath = join(doingPath, capDirName);
  await mkdir(capPath, { recursive: true });

  // Create capability.md file
  const capMdPath = join(capPath, `${cap.slug}.capability.md`);
  await writeFile(
    capMdPath,
    `# Capability: ${formatSlugAsTitle(cap.slug)}\n\nGenerated fixture for testing.\n`,
  );

  // Create decisions directory and ADRs
  const decisionsPath = join(capPath, "decisions");
  await mkdir(decisionsPath, { recursive: true });

  for (const child of cap.children) {
    if (child.kind === "adr") {
      await materializeAdr(decisionsPath, child);
    } else if (child.kind === "feature") {
      await materializeFeature(capPath, child);
    }
  }
}

/**
 * Materialize an ADR node
 */
async function materializeAdr(decisionsPath: string, adr: FixtureNode): Promise<void> {
  // Format ADR number as 3 digits: 001, 002, etc.
  const adrNum = String(adr.number).padStart(3, "0");
  const adrFileName = `adr-${adrNum}_${adr.slug}.md`;
  const adrPath = join(decisionsPath, adrFileName);

  await writeFile(
    adrPath,
    `# ADR: ${formatSlugAsTitle(adr.slug)}\n\n## Decision\n\nGenerated ADR for testing.\n`,
  );
}

/**
 * Materialize a feature node
 */
async function materializeFeature(capPath: string, feat: FixtureNode): Promise<void> {
  // Create feature directory: feature-{NN}_{slug}/
  const featDirName = `feature-${feat.number}_${feat.slug}`;
  const featPath = join(capPath, featDirName);
  await mkdir(featPath, { recursive: true });

  // Create feature.md file
  const featMdPath = join(featPath, `${feat.slug}.feature.md`);
  await writeFile(
    featMdPath,
    `# Feature: ${formatSlugAsTitle(feat.slug)}\n\nGenerated fixture for testing.\n`,
  );

  // Materialize stories
  for (const story of feat.children.filter((c) => c.kind === "story")) {
    await materializeStory(featPath, story);
  }
}

/**
 * Materialize a story node
 */
async function materializeStory(featPath: string, story: FixtureNode): Promise<void> {
  // Create story directory: story-{NN}_{slug}/
  const storyDirName = `story-${story.number}_${story.slug}`;
  const storyPath = join(featPath, storyDirName);
  await mkdir(storyPath, { recursive: true });

  // Create story.md file
  const storyMdPath = join(storyPath, `${story.slug}.story.md`);
  await writeFile(
    storyMdPath,
    `# Story: ${formatSlugAsTitle(story.slug)}\n\nGenerated fixture for testing.\n`,
  );

  // Create tests directory with status-appropriate contents
  const testsPath = join(storyPath, "tests");
  await mkdir(testsPath, { recursive: true });

  switch (story.status) {
    case "DONE":
      // DONE: tests/DONE.md exists
      await writeFile(join(testsPath, "DONE.md"), `# Done\n\nStory completed.\n`);
      break;

    case "IN_PROGRESS":
      // IN_PROGRESS: tests/*.test.ts exists, no DONE.md
      await writeFile(
        join(testsPath, "test.test.ts"),
        `// Generated test file for ${story.slug}\nimport { describe, it, expect } from "vitest";\n\ndescribe("${story.slug}", () => {\n  it("should pass", () => {\n    expect(true).toBe(true);\n  });\n});\n`,
      );
      break;

    case "OPEN":
      // OPEN: tests/ directory exists but is empty
      // Directory already created above, nothing more needed
      break;
  }
}

/**
 * Format a slug as a title
 *
 * @param slug - URL-safe slug (e.g., "my-feature")
 * @returns Title case string (e.g., "My Feature")
 */
function formatSlugAsTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Convenience wrapper: generate and materialize in one call
 *
 * @param config - Fixture configuration
 * @returns Materialized fixture with path and cleanup function
 */
export async function createFixture(config: FixtureConfig): Promise<MaterializedFixture> {
  const tree = generateFixtureTree(config);
  return materializeFixture(tree);
}
