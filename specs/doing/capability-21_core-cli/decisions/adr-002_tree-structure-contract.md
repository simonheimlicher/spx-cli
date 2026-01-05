# ADR 002: Tree Structure Contract

## Context and Problem Statement

### Problem

```
Feature 54 (Tree Building) and Feature 65 (Output Formatting) need a shared data structure contract.
Feature 54 builds hierarchical trees from flat WorkItem arrays.
Feature 65 formats these trees for display (text, JSON, markdown, table).
Without a contract, these features cannot be developed independently.
```

### Context

- **Business Context**: spx needs to display work item trees in multiple output formats
- **Technical Context**: Feature 54 and Feature 65 are being developed by different people
- **Constraints**: Contract must support BSP-sorted children, status on all nodes, and 3-level hierarchy

## Decision Drivers

- [x] **Independent Development**: Features 54 and 65 must progress in parallel
- [x] **Simplicity**: Contract should be minimal - no over-engineering
- [x] **BSP Ordering**: Children must be sorted by BSP number (stories are ORDERED)
- [x] **Type Safety**: Full TypeScript typing required

## Decision Outcome

**Chosen Approach**: Unified TreeNode type with generic children array

### Tree Node Interface

```typescript
// src/tree/types.ts
export interface TreeNode {
  kind: WorkItemKind;       // "capability" | "feature" | "story"
  number: number;           // Internal BSP number
  slug: string;
  path: string;
  status: WorkItemStatus;   // "OPEN" | "IN_PROGRESS" | "DONE"
  children: TreeNode[];     // BSP-sorted by Feature 54
}

export interface WorkItemTree {
  nodes: TreeNode[];        // Root capabilities
}
```

### Why Unified TreeNode

Alternative considered: Separate types (CapabilityNode, FeatureNode, StoryNode)

**Rejected because:**
- All work items are structurally identical
- Separate types create unnecessary complexity
- Recursive operations are cleaner with a single type

**Unified approach benefits:**
- Simple: One interface for all node types
- Flexible: Formatters use same recursion pattern for all levels
- Type-safe: Discriminated by `kind` field

### Number Convention

- **Internal numbers**: Tree stores internal BSP numbers
  - Capabilities: 0-indexed (directory `21` → internal `20`)
  - Features/Stories: as-is (directory `21` → internal `21`)
- **Display numbers**: Formatters convert internal → display
  - Capabilities: `internal + 1`
  - Features/Stories: `internal` (no conversion)

### BSP Sorting Responsibility

**Feature 54** ensures children are sorted by BSP number:
```typescript
children.sort((a, b) => a.number - b.number)
```

**Feature 65** assumes children are pre-sorted and renders in order.

### Rationale

```
The unified TreeNode design creates a clean contract:
1. Feature 54 produces TreeNode trees with BSP-sorted children
2. Feature 65 consumes TreeNode trees and formats them
3. Both features share src/tree/types.ts as the contract
4. No coupling beyond the interface
```

**Expected Benefits:**
- Independent development of Features 54 and 65
- Simple testing: Feature 65 can use synthetic trees
- Type-safe traversal with discriminated unions

**Accepted Trade-offs:**
- Formatters must check `kind` field to determine node type
- Single interface means no compile-time guarantee that stories have no children

## Implementation Plan

### Immediate Actions

- [x] Define `src/tree/types.ts` with TreeNode and WorkItemTree interfaces
- [x] Feature 65 creates synthetic tree builders for testing
- [ ] Feature 54 implements tree building with BSP sorting
- [ ] Integration tests verify contract compliance

### Success Metrics

- **Feature 65**: Can format synthetic trees without Feature 54 code
- **Feature 54**: Can build trees that Feature 65 formatters consume
- **Integration**: All formatters work with Feature 54's trees
- **Timeline**: Validate when both features complete

## Consequences

### Positive Consequences

- Clean separation: Features 54 and 65 can develop in parallel
- Simple contract: Just two interfaces, easy to understand
- Test-friendly: Feature 65 can test with synthetic trees

### Negative Consequences

- No compile-time enforcement of tree structure (e.g., story nodes can theoretically have children)
- Formatters must use runtime checks on `kind` field

### Mitigation

- Feature 54's tree builder ensures correct structure
- TypeScript's discriminated unions provide type narrowing
- Integration tests verify structural correctness

## Testing Strategy

> Per typescript-testing skill: MAXIMUM CONFIDENCE. MINIMUM DEPENDENCIES. NO MOCKING.

### Level Assignment

| Component                  | Level           | Justification                                    |
| -------------------------- | --------------- | ------------------------------------------------ |
| TreeNode/WorkItemTree types | 0 (No tests)   | TypeScript interfaces, verified at compile time  |
| Synthetic tree builders     | 1 (Unit)       | Pure functions creating test data                |
| Text formatter             | 1 (Unit)       | Pure string rendering                            |
| JSON formatter             | 1 (Unit)       | Pure data serialization                          |
| Markdown formatter         | 1 (Unit)       | Pure string rendering                            |
| Table formatter            | 1 (Unit)       | Pure string rendering                            |
| Contract integration       | 2 (Integration) | Needs real trees from Feature 54                 |

### Escalation Rationale

- **Level 1 → 2**: Unit tests prove formatters work with synthetic trees, but Level 2 verifies compatibility with Feature 54's real tree builder
  - What Level 2 adds: Confidence that Feature 54's tree structure matches contract expectations
  - Why necessary: Type system doesn't guarantee BSP sorting or status rollup correctness

### Testing Principles

- **NO MOCKING**: Synthetic tree builders use real TreeNode structures, not mocks
- **Behavior only**: Formatters tested by output verification, not implementation details
- **Minimum level**: Each formatter stays at Level 1 (pure functions, no external dependencies)
- **DI pattern**: Tree builders accept no external dependencies (pure data construction)

### Implementation Constraints

**Feature 65 (Output Formatting)** must:
1. Create synthetic tree builders in `tests/helpers/tree-builder.ts` (Level 1)
2. Test all formatters with synthetic trees (Level 1)
3. Write Level 1 tests in `specs/.../story-NN/tests/` (progress tests)
4. Graduate tests to `tests/unit/reporter/` when story completes

**Feature 54 (Tree Building)** must:
1. Ensure BSP-sorted children (contract requirement)
2. Provide integration test fixtures for Feature 65
3. Verify contract compatibility in Level 2 tests

**Integration** (when both features complete):
1. Level 2 tests verify Feature 54's trees work with Feature 65's formatters
2. Tests in `tests/integration/reporter/format.integration.test.ts`

### Compliance and Validation

**Architecture Principles:**
- [x] **Consistency**: Unified type follows project's preference for simple over complex
- [x] **Simplicity**: Minimal contract - two interfaces only
- [x] **Type Safety**: Full TypeScript typing with discriminated unions

**Contract Validation:**

Feature 65 creates these test helpers (Level 1):

```typescript
// tests/helpers/tree-builder.ts
export function buildSimpleTree(): WorkItemTree;
export function buildTreeWithFeatures(): WorkItemTree;
export function buildTreeWithStories(): WorkItemTree;
export function buildTreeWithMixedStatus(): WorkItemTree;
```

These prove the contract is sufficient for all formatting needs.

## Links and References

**Related Work Items:**

- Feature 54: Tree Building (implements producer side)
- Feature 65: Output Formatting (implements consumer side)

**Contract Definition:**

- `src/tree/types.ts` - Canonical interface definition
