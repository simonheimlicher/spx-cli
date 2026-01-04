# TypeScript Coding Standards

## Overview

spx is a CLI tool written in TypeScript. These standards ensure maintainable, type-safe code.

## Core Principles

### 1. Strict TypeScript

All code must pass `tsc --strict`. Never use `any` without explicit justification.

```typescript
// ✅ CORRECT: Explicit types
interface ScannerOptions {
  root: string;
  patterns?: string[];
  includeArchived?: boolean;
}

export async function scanWorkItems(options: ScannerOptions): Promise<WorkItemTree> {
  // ...
}

// ❌ WRONG: Implicit any
export async function scanWorkItems(options) {
  // ...
}
```

### 2. Dependency Injection Over Mocking

Design functions to accept dependencies as parameters. This makes testing straightforward without mocking frameworks.

```typescript
// ✅ CORRECT: Dependency injection
export interface FileSystemDependencies {
  readdir: typeof import("fs/promises").readdir;
  stat: typeof import("fs/promises").stat;
  existsSync: typeof import("fs").existsSync;
}

export async function scanSpecsDirectory(root: string, deps: FileSystemDependencies): Promise<WorkItem[]> {
  const entries = await deps.readdir(root, { withFileTypes: true });
  // ...
}

// In tests: Pass controlled dependencies
const mockDeps: FileSystemDependencies = {
  readdir: async () => [
    /* controlled result */
  ],
  stat: async () => ({
    /* controlled stats */
  }),
  existsSync: () => true,
};

// ❌ WRONG: Hard-coded imports that require mocking
import { readdir, stat } from "fs/promises";
import { existsSync } from "fs";

export async function scanSpecsDirectory(root: string) {
  const entries = await readdir(root);
  // Now you need vi.mock() to test this
}
```

### 3. Use Zod for Runtime Validation

All external input (config files, CLI args, file paths) must be validated with Zod.

```typescript
import { z } from "zod";

// Define schema
export const WorkItemSchema = z.object({
  kind: z.enum(["capability", "feature", "story"]),
  number: z.number().int().min(10).max(99),
  slug: z.string().regex(/^[a-z0-9-_]+$/),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE"]),
  children: z.array(z.lazy(() => WorkItemSchema)).default([]),
});

export type WorkItem = z.infer<typeof WorkItemSchema>;

// Use schema for validation
export function validateWorkItem(raw: unknown): WorkItem {
  return WorkItemSchema.parse(raw);
}
```

### 4. Explicit Error Handling

Only catch errors you explicitly expect. Never swallow unexpected errors.

```typescript
// ✅ CORRECT: Specific error handling
try {
  await fs.readFile(path.join(itemPath, "tests", "DONE.md"));
  return "DONE";
} catch (error) {
  if (error instanceof Error && error.message.includes("ENOENT")) {
    // File doesn't exist - check for other test files
    return await checkForTestFiles(itemPath);
  }
  throw error; // Re-throw unexpected errors
}

// ❌ WRONG: Swallowing all errors
try {
  await fs.readFile(path.join(itemPath, "tests", "DONE.md"));
  return "DONE";
} catch {
  return "OPEN"; // Hides real problems
}
```

### 5. Use Constants, Not Magic Strings

Define constants for repeated values.

```typescript
// ✅ CORRECT: Constants
export const DEFAULT_SPECS_ROOT = "specs";
export const DEFAULT_DOING_PATH = "doing";

export const WORK_ITEM_PATTERNS = {
  CAPABILITY: /^capability-(\d{2})_(.+)$/,
  FEATURE: /^feature-(\d{2})_(.+)$/,
  STORY: /^story-(\d{2})_(.+)$/,
} as const;

export const COMMANDS = {
  STATUS: "status",
  NEXT: "next",
  TREE: "tree",
  DONE: "done",
} as const;

export type Command = (typeof COMMANDS)[keyof typeof COMMANDS];

// ❌ WRONG: Magic strings
if (command === "status") {
  // ...
}
```

### 6. Prefer Functions Over Classes

Use functions with explicit dependencies. Only use classes for custom Errors.

```typescript
// ✅ CORRECT: Functions with dependency injection
export async function determineStatus(itemPath: string, deps: FileSystemDependencies): Promise<WorkItemStatus> {
  // ...
}

// ✅ CORRECT: Custom error class
export class WorkItemNotFoundError extends Error {
  constructor(
    message: string,
    public readonly itemPath: string
  ) {
    super(message);
    this.name = "WorkItemNotFoundError";
  }
}

// ❌ WRONG: Service class with internal state
export class ScannerService {
  private config: ScannerConfig;

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  async scan() {
    // ...
  }
}
```

## File Organization

### Naming Conventions

| Type             | Convention       | Example              |
| ---------------- | ---------------- | -------------------- |
| Files            | kebab-case       | `work-item.ts`       |
| Types/Interfaces | PascalCase       | `WorkItemTree`       |
| Functions        | camelCase        | `scanWorkItems`      |
| Constants        | UPPER_SNAKE_CASE | `DEFAULT_SPECS_ROOT` |

### Export Pattern

Each module should have an `index.ts` that exports its public API:

```typescript
// src/scanner/index.ts
export { scanWorkItems, type ScannerOptions, type WorkItemTree } from "./scan.js";
export { parseWorkItemName, type ParsedName } from "./patterns.js";
export { walkDirectory, type WalkOptions } from "./walk.js";
```

## Type Definitions

### Result Types

All major functions return structured result types:

```typescript
export interface WorkItemTree {
  root: string;
  summary: {
    done: number;
    inProgress: number;
    open: number;
  };
  capabilities: WorkItem[];
}

export interface WorkItem {
  kind: "capability" | "feature" | "story";
  number: number;
  slug: string;
  path: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  children: WorkItem[];
}
```

### Options Types

All option types should have sensible defaults via Zod:

```typescript
export const ScannerOptionsSchema = z.object({
  root: z.string().default(process.cwd()),
  specsRoot: z.string().default("specs"),
  includeArchived: z.boolean().default(false),
  patterns: z.array(z.string()).optional(),
});

export type ScannerOptions = z.infer<typeof ScannerOptionsSchema>;
```

## Async Patterns

### Use async/await

Always prefer async/await over raw Promises:

```typescript
// ✅ CORRECT
export async function scanAllWorkItems(root: string): Promise<WorkItem[]> {
  const capabilities: WorkItem[] = [];

  for (const capDir of await readdir(root)) {
    const item = await scanWorkItem(path.join(root, capDir));
    capabilities.push(item);
  }

  return capabilities;
}

// ❌ WRONG: Callback style
export function scanAllWorkItems(root: string, callback: (items: WorkItem[]) => void) {
  // ...
}
```

### Sequential vs Parallel

Run file operations sequentially for predictable order, parallel only when truly independent:

```typescript
// Sequential (preferred for maintaining order)
for (const item of items) {
  results.push(await processItem(item));
}

// Parallel (only when operations are truly independent and order doesn't matter)
const results = await Promise.all(items.map((item) => fetchMetadata(item)));
```

## Logging

Use `consola` for consistent CLI output:

```typescript
import { consola } from "consola";

// Info messages
consola.info("Scanning specs directory...");

// Success messages
consola.success("Found 42 work items");

// Warnings
consola.warn("No context/1-structure.md found, using defaults");

// Errors
consola.error("Failed to read specs directory");

// Debug (only shown with --verbose)
consola.debug("Scanned work item:", { slug, status });
```
