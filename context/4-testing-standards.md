# Testing Standards

## Foundational Stance

> **MAXIMUM CONFIDENCE. MINIMUM DEPENDENCIES. NO MOCKING. REALITY IS THE ORACLE.**

- Every dependency you add must **justify itself** with confidence gained
- If you can verify with pure functions, don't require filesystem operations
- If you can verify with temp directories, don't require external tools
- Mocking is a **confession** that your code is poorly designed
- Reality is the only oracle that matters

---

## 🚨 Progress Tests vs Regression Tests

> **CRITICAL INVARIANT: The production test suite (`test/`) MUST ALWAYS PASS.**
>
> This is the deployment gate. A failing test in `test/` means undeployable code.

### The Two Test Locations

| Location           | Name                 | May Fail? | Purpose                                |
| ------------------ | -------------------- | --------- | -------------------------------------- |
| `specs/.../tests/` | **Progress tests**   | YES       | TDD red-green cycle during development |
| `test/`            | **Regression tests** | NO        | Protect working functionality          |

### Why This Matters

**Progress tests** allow TDD:

1. Write failing test in `specs/.../tests/` (RED)
2. Implement code until test passes (GREEN)
3. Graduate test to `test/` when work item complete

**Regression tests** protect the codebase:

- Run in CI on every commit
- Must always pass
- Failure = broken build = blocked deployment

### The Rule

> **⚠️ NEVER write tests directly in `test/`**
>
> Writing a failing test in `test/` breaks CI until implementation is complete.
> Always write progress tests in `specs/.../tests/` first, then graduate them.

### Quick Decision

```
Am I implementing new functionality?
├── YES → Write test in specs/.../tests/ (progress test)
│         Graduate to test/ when DONE
└── NO  → Modify existing test in test/ (regression test)
          Must stay GREEN
```

---

## Testing Framework

spx uses **Vitest** for testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific level
npm test -- test/unit/           # Level 1 only
npm test -- test/integration/    # Level 2 only
npm test -- test/e2e/            # Level 3 only
```

---

## The 3 Levels

| Level | Type        | Speed | Infrastructure                    | Location            |
| ----- | ----------- | ----- | --------------------------------- | ------------------- |
| **1** | Unit        | <50ms | Node.js only                      | `test/unit/`        |
| **2** | Integration | <1s   | Real filesystem, temp directories | `test/integration/` |
| **3** | E2E         | <30s  | Full CLI + fixture repos          | `test/e2e/`         |

### Level 1: Unit Tests

Verify our code logic is correct using:

- Dependency injection with controlled implementations
- Pure function testing
- Temporary directories (ephemeral, reentrant)

**What's NOT external**: `fs`, `path`, `os`, Node.js built-ins when mocked via DI

**What IS external**: Git (optional for incremental mode)

```typescript
// test/unit/status/state.test.ts
describe("determineStatus", () => {
  it("GIVEN tests/DONE.md exists WHEN determining status THEN returns DONE", () => {
    const mockDeps = {
      existsSync: (path: string) => path.endsWith("DONE.md"),
      readdirSync: () => ["test1.test.ts", "DONE.md"],
    };

    const status = determineStatus("/path/to/item", mockDeps);

    expect(status).toBe("DONE");
  });
});
```

### Level 2: Integration Tests

Verify real filesystem operations with temporary directories:

- Real file creation, directory walking, pattern matching
- Temp directories with fixture spec trees
- No external tools, no Git

```typescript
// test/integration/scanner.integration.test.ts
import { mkdtemp, writeFile, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

describe("Scanner Integration", () => {
  it("GIVEN temp specs tree WHEN scanning THEN identifies work items correctly", async () => {
    // Create temp directory with fixture structure
    const tempRoot = await mkdtemp(join(tmpdir(), "spx-test-"));
    const specsPath = join(tempRoot, "specs", "doing");

    await mkdir(join(specsPath, "capability-21_core-cli", "tests"), { recursive: true });
    await writeFile(join(specsPath, "capability-21_core-cli", "tests", "DONE.md"), "");

    const result = await scanWorkItems({ root: tempRoot });

    expect(result.capabilities).toHaveLength(1);
    expect(result.capabilities[0].status).toBe("DONE");
  });
});
```

### Level 3: E2E Tests

Verify complete workflows:

- Real CLI execution with fixtures
- Full `spx status`, `spx next`, `spx tree` commands
- Performance validation (<100ms target)

```typescript
// test/e2e/cli.e2e.test.ts
describe("CLI E2E", () => {
  it("GIVEN fixture repo WHEN running spx status --json THEN returns valid JSON in <100ms", async () => {
    const startTime = Date.now();
    const { stdout } = await execa("node", ["dist/bin/spx.js", "status", "--json"], {
      cwd: "test/fixtures/sample-repo",
    });
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(100);

    const result = JSON.parse(stdout);
    expect(result).toHaveProperty("summary");
    expect(result.summary).toHaveProperty("done");
  });
});
```

---

## Core Principles

### 1. Behavior Testing Only

Tests verify **WHAT** the system does, not **HOW** it does it.

```typescript
// ❌ BAD: Testing implementation
it("uses readdirSync to scan directory", async () => {
  const readdirSpy = vi.spyOn(deps, "readdirSync");
  await scanWorkItems(root, deps);
  expect(readdirSpy).toHaveBeenCalledWith(root); // Tests HOW, not WHAT
});

// ✅ GOOD: Testing behavior
it("GIVEN specs directory WHEN scanning THEN returns all capabilities", async () => {
  const result = await scanWorkItems(root, deps);
  expect(result.capabilities).toHaveLength(3);
  expect(result.capabilities[0].kind).toBe("capability");
});
```

### 2. Dependency Injection Over Mocking

Design code to accept dependencies as parameters. Tests pass controlled implementations—no mocking framework needed.

```typescript
// ❌ BAD: Mocking external calls
vi.mock("fs/promises");
vi.mock("fs");

it("scans directory", async () => {
  await scanWorkItems(root);
  expect(readdir).toHaveBeenCalled(); // What did we prove? NOTHING.
});

// ✅ GOOD: Dependency injection
interface ScanDependencies {
  readdir: typeof import("fs/promises").readdir;
  stat: typeof import("fs/promises").stat;
}

it("GIVEN specs directory WHEN scanning THEN discovers work items", async () => {
  const deps: ScanDependencies = {
    readdir: vi.fn().mockResolvedValue([{ name: "capability-21_core-cli", isDirectory: () => true }]),
    stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
  };

  const result = await scanWorkItems(root, deps);

  expect(result.capabilities).toHaveLength(1);
});
```

### 3. Escalation Requires Justification

Each level adds dependencies. You must **justify** the confidence gained:

| Escalation | Confidence Gained                                               |
| ---------- | --------------------------------------------------------------- |
| 1 → 2      | "Unit tests pass, but does real filesystem scanning work?"      |
| 2 → 3      | "Integration works, but does the full CLI with all flags work?" |

If you cannot articulate what confidence the next level adds, **don't escalate**.

### 4. No Arbitrary Test Data

All test data must be:

- **Generated**: Use factories, not literals
- **Ephemeral**: Created and destroyed within test scope
- **Randomized**: Expose ordering assumptions

```typescript
// ❌ BAD: Arbitrary strings
it("scans work items", async () => {
  await scanWorkItems("/some/random/path");
});

// ✅ GOOD: Generated data
it("GIVEN fixture tree WHEN scanning THEN classifies status correctly", async () => {
  const fixture = await createFixtureTree({
    capabilities: [
      { number: 20, slug: "core-cli", status: "DONE" },
      { number: 32, slug: "mcp-server", status: "OPEN" },
    ],
  });

  const result = await scanWorkItems(fixture.root, realDeps);

  expect(result.capabilities[0].status).toBe("DONE");
});
```

### 5. BDD Structure Required

All tests must follow Given/When/Then structure:

```typescript
describe("parseWorkItemName", () => {
  it("GIVEN capability directory name WHEN parsing THEN extracts number and slug", () => {
    // Given: A capability directory name
    const dirName = "capability-21_core-cli";

    // When: Parsing the name
    const result = parseWorkItemName(dirName);

    // Then: Number and slug are extracted
    expect(result).toEqual({
      kind: "capability",
      number: 20,
      slug: "core-cli",
    });
  });
});
```

---

## What NOT to Test

**Tests verify OUR code, not third-party tools or trivial infrastructure.**

### Don't Test Third-Party Tools

```typescript
// ❌ BAD - testing that Node.js fs works
it("readdirSync returns directory entries", async () => {
  const entries = readdirSync("/some/path");
  expect(Array.isArray(entries)).toBe(true);
  // This tests Node.js, not our code
});

// ✅ GOOD - testing OUR code that uses fs
it("GIVEN directory with work items WHEN scanning THEN filters by pattern", async () => {
  const mockDeps = {
    readdirSync: () => ["capability-21_foo", "not-a-work-item", "feature-10_bar"],
  };

  const result = await scanWorkItems(root, mockDeps);

  expect(result.capabilities).toHaveLength(1); // Only capability matched pattern
});
```

### Smoke Tests Should Point Fingers

When infrastructure fails, the error message must identify the responsible component:

```typescript
// ✅ GOOD - points to responsible component
it("GIVEN Git installed WHEN checking availability THEN git command works", async () => {
  const result = await execa("git", ["--version"]).catch((e) => e);

  expect(result.exitCode, "Git not installed. Required for incremental mode.").toBe(0);
});
```

---

## Test Organization

```
test/
├── unit/                    # Level 1: Pure functions, DI
│   ├── scanner/
│   │   ├── patterns.test.ts
│   │   ├── walk.test.ts
│   │   └── scan.test.ts
│   ├── status/
│   │   ├── state.test.ts
│   │   └── context.test.ts
│   └── reporter/
│       ├── text.test.ts
│       ├── json.test.ts
│       └── markdown.test.ts
├── integration/             # Level 2: Real filesystem
│   ├── scanner.integration.test.ts
│   ├── status.integration.test.ts
│   └── fixtures/
│       └── sample-specs-tree/
├── e2e/                     # Level 3: Full CLI
│   ├── cli.e2e.test.ts
│   └── performance.e2e.test.ts
└── fixtures/                # Shared test data
    ├── constants.ts         # Shared test constants
    ├── factories.ts         # Test data factories
    └── repos/               # Sample repos for E2E
```

---

## Level Assignment by Component

| Component            | Level | Justification                            |
| -------------------- | ----- | ---------------------------------------- |
| Pattern matching     | 1     | Pure function, regex operations          |
| Status determination | 1     | Pure function with file existence checks |
| Path building        | 1     | Pure function, no I/O                    |
| Directory scanning   | 2     | Needs real filesystem operations         |
| Work item detection  | 2     | Needs real directory structure           |
| Full CLI workflows   | 3     | Needs complete environment + fixtures    |
| Performance targets  | 3     | Needs realistic conditions               |

---

## Skip Markers for CI

If optional dependencies are introduced (like Git):

```typescript
// test/integration/conftest.ts
import { execaSync } from "execa";

export function gitAvailable(): boolean {
  try {
    execaSync("git", ["--version"]);
    return true;
  } catch {
    return false;
  }
}
```

```typescript
// Usage in tests
describe.skipIf(!gitAvailable())("Git Integration", () => {
  // Tests that require Git...
});
```

---

## Fixtures

### Test Constants

```typescript
// test/fixtures/constants.ts
export const TEST_SPECS_ROOT = "specs";
export const TEST_DOING_PATH = "doing";

export const FIXTURE_CAPABILITIES = [
  { number: 20, slug: "core-cli" },
  { number: 32, slug: "mcp-server" },
] as const;

export const WORK_ITEM_PATTERNS = {
  CAPABILITY: /^capability-(\d{2})_(.+)$/,
  FEATURE: /^feature-(\d{2})_(.+)$/,
  STORY: /^story-(\d{2})_(.+)$/,
} as const;
```

### Test Factories

```typescript
// test/fixtures/factories.ts
import { FIXTURE_CAPABILITIES } from "./constants";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

export async function createFixtureTree(options: { root: string; capabilities: Array<{ number: number; slug: string; status: "OPEN" | "IN_PROGRESS" | "DONE" }> }): Promise<{ root: string }> {
  const specsPath = join(options.root, "specs", "doing");
  await mkdir(specsPath, { recursive: true });

  for (const cap of options.capabilities) {
    const capPath = join(specsPath, `capability-${cap.number}_${cap.slug}`);
    const testsPath = join(capPath, "tests");
    await mkdir(testsPath, { recursive: true });

    if (cap.status === "DONE") {
      await writeFile(join(testsPath, "DONE.md"), "# DONE\n\nCompleted.");
    } else if (cap.status === "IN_PROGRESS") {
      await writeFile(join(testsPath, "test.test.ts"), 'describe("test", () => {})');
    }
  }

  return { root: options.root };
}
```

---

## Speed Expectations

| Level       | Target | Max  |
| ----------- | ------ | ---- |
| Unit        | <5ms   | 50ms |
| Integration | <500ms | 1s   |
| E2E         | <5s    | 30s  |

---

## Completion Requirements by Work Item

| Work Item      | Required Levels | Verification                             |
| -------------- | --------------- | ---------------------------------------- |
| **Story**      | Level 1         | Must prove core logic works              |
| **Feature**    | Level 1 + 2     | Must prove feature works with filesystem |
| **Capability** | Level 1 + 2 + 3 | Must prove end-to-end value              |

---

## Completion Checklist

Before declaring tests complete:

- [ ] All behaviors have tests at the minimum necessary level
- [ ] No mocking of external systems (DI instead)
- [ ] Escalation to each level is justified in comments
- [ ] Test data is generated, not hardcoded
- [ ] Fast failure: environment checks run first
- [ ] Each test verifies behavior, not implementation

---

## Anti-Patterns

### Mock Everything

```typescript
// ❌ Mocking destroys confidence
vi.mock("fs/promises");
vi.mock("fs");
vi.mock("path");

it("scans directory", async () => {
  await scanWorkItems(root);
  expect(readdir).toHaveBeenCalled(); // What did we prove? NOTHING.
});
```

### Skip Levels

```typescript
// ❌ Jumping to Level 3 without Level 1/2 coverage
it("runs full spx status", async () => {
  // This test is slow and requires fixtures
  const result = await execa("spx", ["status"]);
  // If this fails, we don't know if it's our code or the environment
});
```

### Test Implementation Details

```typescript
// ❌ Testing HOW, not WHAT
it("uses readdirSync with correct args", async () => {
  const spy = vi.spyOn(deps, "readdirSync");
  await scanWorkItems(root, deps);

  expect(spy).toHaveBeenCalledWith(root, { withFileTypes: true }); // Implementation detail!
});
```

### Hardcoded Test Data

```typescript
// ❌ Magic strings that hide assumptions
it("scans work items", async () => {
  await scanWorkItems("/Users/john/code/project/specs");
});
```

---

_Remember: A test that passes because of mocks is worse than no test at all. It gives false confidence. Reality is the only oracle._
