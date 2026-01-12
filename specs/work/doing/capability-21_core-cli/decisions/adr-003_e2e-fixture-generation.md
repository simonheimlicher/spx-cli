# ADR: E2E Fixture Generation Strategy

## Problem

E2E tests need realistic spec repository fixtures with configurable sizes (10, 50, 100+ items). How should we create and manage these fixtures? Manual fixtures are inflexible and pollute the repository. We need a strategy that provides isolation, realism, and flexibility.

## Options Considered

### Option 1: Static Fixture Directories

Manually create fixture repos in `tests/fixtures/repos/` and commit them to the repository.

### Option 2: Programmatic Generation with Faker.js

Two-function approach: `generateFixtureTree(config)` creates a tree structure with faker.js names, then `materializeFixture(tree)` writes it to `os.tmpdir()` and returns path + cleanup function.

### Option 3: Snapshot-Based Fixtures

Generate fixtures once, serialize to JSON, replay from snapshots for deterministic tests.

## Decision

**We will use Option 2: Programmatic Generation with Faker.js.**

## Rationale

E2E tests must verify behavior across varied, realistic repositories. Static fixtures don't catch edge cases from varied naming and become maintenance burden. Snapshot fixtures still require generation code and lose the benefit of varied naming.

Programmatic generation enables:

- Testing with 10, 50, 100, 500 items without maintaining separate fixtures
- Varied status distributions (all DONE, mixed, all OPEN)
- Realistic names that might expose parsing edge cases (hyphens, underscores, numbers)
- Complete isolation via `os.tmpdir()` - no repo pollution, no test interference
- Automatic cleanup handling

The ~10-20ms generation overhead is negligible compared to the <100ms performance target being tested.

## Trade-offs Accepted

- **Adds faker.js dependency**: Acceptable - dev-only, well-maintained, small footprint
- **Generation overhead**: ~10-20ms per fixture, negligible for E2E tests that already accept <100ms target
- **Non-deterministic names**: Mitigated by optional `seed` parameter for reproducibility when needed

## API Design

### Configuration

```typescript
interface FixtureConfig {
  capabilities: number;
  featuresPerCapability: number;
  storiesPerFeature: number;
  statusDistribution: { done: number; inProgress: number; open: number };
  adrsPerCapability?: number; // Default: 1
  seed?: number; // For reproducibility
}
```

### Presets

```typescript
const PRESETS = {
  // 1 cap, 1 feat, 1 story = 3 items
  MINIMAL: { capabilities: 1, featuresPerCapability: 1, storiesPerFeature: 1, ... },

  // 2 caps × 5 feats × 4 stories = 50 items (shallow, wide)
  SHALLOW_50: { capabilities: 2, featuresPerCapability: 5, storiesPerFeature: 4, ... },

  // 1 cap × 2 feats × 24 stories = 50 items (deep, narrow)
  DEEP_50: { capabilities: 1, featuresPerCapability: 2, storiesPerFeature: 24, ... },

  // 1 cap × 3 feats × 2 stories = 10 items (3-level hierarchy)
  FAN_10_LEVEL_3: { capabilities: 1, featuresPerCapability: 3, storiesPerFeature: 2, ... },
} as const;
```

### Generated File Structure

Only valid files per `specs/templates/structure.yaml` are generated. No noise files.

```
{tmpdir}/spx-fixture-{uuid}/
└── specs/
    └── doing/
        └── capability-21_{faker-slug}/
            ├── {slug}.capability.md
            ├── decisions/
            │   └── adr-001_{faker-slug}.md
            ├── tests/
            │   └── DONE.md                    # If status = DONE
            └── feature-32_{faker-slug}/
                ├── {slug}.feature.md
                ├── tests/
                │   └── test.test.ts           # If status = IN_PROGRESS
                └── story-21_{faker-slug}/
                    ├── {slug}.story.md
                    └── tests/                 # Empty if status = OPEN
```

**Valid files only** - this enables future invalid file detection (e.g., AI-generated session summaries that taint the specs dir).

### Faker.js Usage

All names generated via faker.js:

- Capability slugs: `faker.hacker.noun()` + `faker.hacker.verb()` → `"quantum-parser"`
- Feature slugs: `faker.hacker.adjective()` + `faker.hacker.noun()` → `"neural-protocol"`
- Story slugs: `faker.hacker.verb()` + `faker.hacker.noun()` → `"compile-interface"`
- ADR slugs: `faker.hacker.noun()` + `faker.word.noun()` → `"algorithm-strategy"`

## Testing Strategy

### Level Assignment

| Component         | Level | Justification                              |
| ----------------- | ----- | ------------------------------------------ |
| Tree generator    | 1     | Pure function, no I/O, unit testable       |
| Fixture writer    | 2     | Filesystem I/O, needs real tmpdir          |
| E2E with fixtures | 3     | Full CLI execution against generated repos |

### Escalation Rationale

- **1 → 2**: Fixture writer must verify actual files exist on disk, not just in-memory structures
- **2 → 3**: E2E tests verify the full CLI reads generated fixtures correctly under performance targets

### Key Behaviors to Verify

1. Generated tree has correct item count for given config
2. Status distribution approximately matches config percentages
3. Materialized fixture passes `spx status` without errors
4. Cleanup removes all fixture files and directories
5. Seeded generation produces reproducible results
6. All generated files conform to `specs/templates/structure.yaml`

## Constraints

- Fixtures MUST be created in `os.tmpdir()`, never in the repository
- All E2E tests MUST call `cleanup()` in finally block or afterEach hook
- Generator MUST produce valid BSP numbers (per `specs/templates/structure.yaml`: 21, 32, 43, 54, 65...)
- Generated names MUST pass existing pattern matchers in `src/scanner/`
- Generated files MUST conform to `specs/templates/structure.yaml` - no noise files
