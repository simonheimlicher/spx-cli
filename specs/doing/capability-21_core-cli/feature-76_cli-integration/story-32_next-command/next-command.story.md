# Story: Next Command

## Functional Requirements

### FR1: Implement `spx next` command

```gherkin
GIVEN spx CLI
WHEN running `spx next`
THEN output next work item to work on (lowest numbered OPEN or IN_PROGRESS)
```

Selection logic:

1. Prefer IN_PROGRESS over OPEN
2. Within same status, choose lowest BSP number
3. If none found, output message

#### Files created/modified

1. `src/cli.ts` [modify]: Add next command
2. `src/commands/next.ts` [new]: Implement next command logic

## Testing Strategy

### Level Assignment

| Component           | Level | Justification             |
| ------------------- | ----- | ------------------------- |
| Next item selection | 1     | Pure sorting/filtering    |
| Command execution   | 2     | Integration test with CLI |

## Unit Tests (Level 1)

```typescript
// test/unit/commands/next.test.ts
import { findNextWorkItem } from "@/commands/next";
import { describe, expect, it } from "vitest";

describe("findNextWorkItem", () => {
  it("GIVEN IN_PROGRESS and OPEN items WHEN finding next THEN returns IN_PROGRESS with lowest number", () => {
    const tree = buildMixedTree();
    const next = findNextWorkItem(tree);

    expect(next.status).toBe("IN_PROGRESS");
  });

  it("GIVEN only OPEN items WHEN finding next THEN returns OPEN with lowest number", () => {
    const tree = buildOpenOnlyTree();
    const next = findNextWorkItem(tree);

    expect(next.status).toBe("OPEN");
    expect(next.number).toBe(21);
  });

  it("GIVEN all DONE WHEN finding next THEN returns null", () => {
    const tree = buildAllDoneTree();
    const next = findNextWorkItem(tree);

    expect(next).toBeNull();
  });
});
```

## Completion Criteria

- [ ] All tests pass (Level 1 + Level 2)
- [ ] Next command works correctly
- [ ] Selection logic correct
- [ ] 100% type coverage
