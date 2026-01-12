# Instructions: Revise Requirements Skills to Remove Implementation Timing Language

## Context

During PRD cleanup in the spx-cli project (2026-01-12), we discovered and applied a critical principle:

**"Scoping is NEVER PART OF REQUIREMENTS"**

This principle emerged from fixing Platform PRD and Config Domain PRD documents that contained "Delivery Strategy" sections with MVP/Phase 1/2/3 language. These sections violated the core principle that requirements describe WHAT should exist (the ideal solution), not WHEN it gets implemented.

## Rationale for Changes

### The Problem

Requirements documents (PRDs/TRDs/ADRs) were mixing:

- **Requirements scope** (what THIS requirement addresses) ✅
- **Implementation timing** (when features get built) ❌

This creates confusion between:

- "Out of scope for THIS requirement" (correct boundary definition)
- "Deferred to Phase 2" or "Not in MVP" (implementation scheduling)

### The Principle

**Requirements (PRDs/TRDs/ADRs):**

- ✅ Describe WHAT should exist (ideal solution, timeless)
- ✅ Define THEIR OWN scope boundaries ("User-level config is out of scope for this PRD")
- ❌ Do NOT define WHEN they get implemented ("MVP", "Phase 2", "Defer to future")
- ❌ Do NOT scope their children ("Feature X not in MVP")

**Work Items (capability.md, feature.md, story.md):**

- Units of implementation with BSP ordering
- Can reference dependencies and sequencing
- Different rules than requirements documents

### Correct vs Incorrect Phrasing

✅ **Correct (Scope Boundaries):**

- "Out of scope: X is a separate capability"
- "Out of scope: This PRD addresses product-level configuration only"
- "Future domain: Documentation generation and publishing"

❌ **Incorrect (Implementation Timing):**

- "Defer to Phase 2: X is future work"
- "Not in MVP: X comes later"
- "Phase 1 includes Y, Phase 2 includes Z"
- "Option A for MVP" (in recommendations)

### Additional Guidelines

- Requirements = starting point conversation
- Short and to the point
- NO scope restrictions by default (only if explicitly needed)
- Requirements are valid "for the foreseeable future"
- Parent work items do NOT scope when children get implemented

## Changes Required

### Skill 1: `writing-prd/SKILL.md`

**Location:** `~/.claude/plugins/cache/spx-claude/specs/0.3.5/skills/writing-prd/SKILL.md`

**Change Required:** Add principle to `<essential_principles>` section

**Insertion point:** After line 31 (end of `<essential_principles>` section)

**Content to add:**

```xml
**Requirements define WHAT, not WHEN:**

- Requirements describe the ideal solution (timeless vision)
- Define scope boundaries ("Out of scope: X is separate")
- NEVER include implementation timing ("MVP", "Phase 2", "Defer to")
- Avoid: "Not in MVP", "Phase X", "Defer until", "Later"
- Correct: "Out of scope for this PRD", "Future capability", "Separate requirement"
```

### Skill 2: `writing-prd/workflows/define-product-scope.md`

**Location:** `~/.claude/plugins/cache/spx-claude/specs/0.3.5/skills/writing-prd/workflows/define-product-scope.md`

**Change 1:** Fix examples in `<define_excluded>` section (lines 32-36)

**Current (INCORRECT):**

```markdown
| Excluded Capability              | Rationale                                                  |
| -------------------------------- | ---------------------------------------------------------- |
| [e.g., Multi-user collaboration] | Defer until single-user validates value; different product |
| [e.g., Cloud sync]               | Local-first reduces complexity; defer until v2             |
```

**Replace with (CORRECT):**

```markdown
| Excluded Capability              | Rationale                                                     |
| -------------------------------- | ------------------------------------------------------------- |
| [e.g., Multi-user collaboration] | Out of scope: Different product concern, separate requirement |
| [e.g., Cloud sync]               | Out of scope: This PRD addresses local-first workflows only   |
```

**Change 2:** Add anti-pattern warning

**Insertion point:** After line 38 (after "If no exclusions: write 'None identified'")

**Content to add:**

```xml
<anti_patterns>❌ **AVOID implementation timing language:**

- "Defer to Phase 2"
- "Not in MVP"
- "Later" or "Future version"
- "v2" or "v3"

✅ **USE scope boundary language:**

- "Out of scope: This PRD addresses [specific boundary]"
- "Separate capability: [explain what makes it distinct]"
- "Different product concern: [explain separation]"

**Rationale:** Requirements describe WHAT should exist, not WHEN it gets built.</anti_patterns>
```

### Skill 3: `writing-trd/SKILL.md`

**Location:** `~/.claude/plugins/cache/spx-claude/specs/0.3.5/skills/writing-trd/SKILL.md`

**Change Required:** Add principle to `<essential_principles>` section

**Insertion point:** After line 30 (end of `<essential_principles>` section)

**Content to add:**

```xml
**Requirements define WHAT, not WHEN:**

- Requirements describe the ideal solution (timeless vision)
- Define scope boundaries ("Out of scope: X is separate")
- NEVER include implementation timing ("MVP", "Phase 2", "Defer to")
- Avoid: "Not in MVP", "Phase X", "Defer until", "Later"
- Correct: "Out of scope for this TRD", "Future capability", "Separate requirement"
```

## Verification

After making changes, verify:

1. ✅ Grep for `(MVP|Phase [0-9]|Defer to|defer until|v2|v3)` in both skill files
2. ✅ No implementation timing language in examples
3. ✅ All "excluded" examples use "Out of scope:" framing
4. ✅ Principle documented in `<essential_principles>` for both skills
5. ✅ Anti-pattern warning added to scope definition workflow

## Related Documents

**PRDs fixed in spx-cli (2026-01-12):**

- `specs/work/spx-platform.prd.md` - Removed Delivery Strategy section, all MVP/Phase references
- `specs/work/doing/capability-42_core-config/spx-config.prd.md` - Removed Delivery Strategy section, all MVP/Phase references

**Key Changes Made:**

- Removed entire "Delivery Strategy" sections (redundant with scope/dependencies)
- Changed "Option A for MVP" → "Option A (recommended)"
- Changed "What's Included (Platform MVP)" → "What's Included"
- Changed "sufficient for MVP" → "sufficient"
- Changed "Config scope (MVP)" → "Config scope"
- Removed "Delivery Strategy" from Required Sections table

## Summary for Agent

You need to update two skill files in the spx-claude specs repository:

1. **writing-prd/SKILL.md** - Add principle to essential_principles
2. **writing-prd/workflows/define-product-scope.md** - Fix examples + add anti-pattern warning
3. **writing-trd/SKILL.md** - Add principle to essential_principles

The core change: Replace "Defer until..." / "MVP" / "Phase X" language with "Out of scope: [boundary definition]" language.

Requirements define WHAT (timeless ideal), not WHEN (implementation scheduling).
