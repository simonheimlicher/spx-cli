/**
 * Unit tests for handoff command frontmatter handling.
 *
 * Test Level: 1 (Unit)
 * - Pure function testing
 * - No external dependencies
 *
 * Graduated from: specs/.../feature-32_session-lifecycle/tests/handoff-frontmatter.unit.test.ts
 *
 * Note: parseSessionMetadata tests are NOT included here as they are already
 * covered more comprehensively in tests/unit/session/list.test.ts
 */

import { describe, expect, it } from "vitest";

import { buildSessionContent, hasFrontmatter } from "@/commands/session/handoff";
import { parseSessionMetadata } from "@/session/list";

describe("hasFrontmatter", () => {
  it("GIVEN content with frontmatter WHEN hasFrontmatter THEN returns true", () => {
    const content = `---
priority: high
---

# My Session`;

    expect(hasFrontmatter(content)).toBe(true);
  });

  it("GIVEN content without frontmatter WHEN hasFrontmatter THEN returns false", () => {
    const content = `# My Session

Some content here.`;

    expect(hasFrontmatter(content)).toBe(false);
  });

  it("GIVEN content with dashes not at start WHEN hasFrontmatter THEN returns false", () => {
    const content = `# My Session

---
This is a horizontal rule, not frontmatter.`;

    expect(hasFrontmatter(content)).toBe(false);
  });

  it("GIVEN empty content WHEN hasFrontmatter THEN returns false", () => {
    expect(hasFrontmatter("")).toBe(false);
  });
});

describe("buildSessionContent", () => {
  it("GIVEN content with frontmatter WHEN buildSessionContent THEN preserves content as-is", () => {
    const content = `---
priority: high
tags: [feature, api]
---

# Implement Authentication

Add JWT-based auth.`;

    const result = buildSessionContent(content);

    expect(result).toBe(content);
  });

  it("GIVEN content without frontmatter WHEN buildSessionContent THEN adds default frontmatter", () => {
    const content = `# Implement Authentication

Add JWT-based auth.`;

    const result = buildSessionContent(content);

    expect(result).toContain("---");
    expect(result).toContain("priority: medium");
    expect(result).toContain("# Implement Authentication");
  });

  it("GIVEN empty content WHEN buildSessionContent THEN creates default session", () => {
    const result = buildSessionContent("");

    expect(result).toContain("---");
    expect(result).toContain("priority: medium");
    expect(result).toContain("# New Session");
  });

  it("GIVEN undefined content WHEN buildSessionContent THEN creates default session", () => {
    const result = buildSessionContent(undefined);

    expect(result).toContain("---");
    expect(result).toContain("priority: medium");
  });
});

describe("End-to-End: Handoff Content Flow", () => {
  it("GIVEN agent provides content with metadata WHEN handoff THEN metadata extracted correctly", () => {
    // This simulates what an agent would provide via stdin
    const agentContent = `---
priority: high
tags: [refactor, cleanup]
---

# Refactor Authentication Module

## Context
The auth module needs cleanup after the JWT migration.

## Files
- src/auth/login.ts
- src/auth/middleware.ts`;

    // Build session content (should preserve as-is)
    const sessionContent = buildSessionContent(agentContent);

    // Extract metadata (should get high priority and tags)
    const metadata = parseSessionMetadata(sessionContent);

    expect(metadata.priority).toBe("high");
    expect(metadata.tags).toEqual(["refactor", "cleanup"]);
    expect(sessionContent).toBe(agentContent);
  });

  it("GIVEN agent provides content without metadata WHEN handoff THEN defaults added", () => {
    // Agent provides just the content, no frontmatter
    const agentContent = `# Fix Login Bug

The login button doesn't work on mobile.`;

    // Build session content (should add frontmatter)
    const sessionContent = buildSessionContent(agentContent);

    // Extract metadata (should get defaults)
    const metadata = parseSessionMetadata(sessionContent);

    expect(metadata.priority).toBe("medium");
    expect(metadata.tags).toEqual([]);
    expect(sessionContent).toContain("# Fix Login Bug");
  });
});
