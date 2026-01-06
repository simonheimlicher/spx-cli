# Completion Evidence: Next Command

## Review Summary

**Verdict**: APPROVED
**Date**: 2026-01-04
**Reviewer**: typescript-coder (self-review)

## Verification Results

| Tool   | Status | Details                 |
| ------ | ------ | ----------------------- |
| tsc    | PASS   | 0 errors                |
| eslint | PASS   | 0 violations (src/)     |
| vitest | PASS   | 266/266 tests (+12 new) |
| CLI    | PASS   | Manual verification OK  |

## Implementation Summary

### Files Created

1. **src/commands/next.ts** - Next command implementation
   - `findNextWorkItem(tree): TreeNode | null` - Pure selection logic
   - `nextCommand(options): Promise<string>` - Main orchestration function
   - Selection priority: IN_PROGRESS > OPEN, lowest BSP number first
   - Formats output with full context (capability > feature > story)

2. **tests/unit/commands/next.test.ts** - Level 1 unit tests
   - 7 test cases covering selection logic
   - Tests IN_PROGRESS priority over OPEN
   - Tests lowest BSP number selection
   - Tests edge cases (all DONE, empty tree, no stories)

3. **tests/integration/cli/next.integration.test.ts** - Level 2 integration tests
   - 5 test cases with real CLI execution
   - Tests with mixed status, all done, empty repos
   - Tests error handling for non-existent directories

4. **tests/fixtures/repos/** - Test fixture repositories
   - `mixed/` - Has IN_PROGRESS story-21 and OPEN story-32
   - `all-done/` - All stories have DONE.md

### Files Modified

1. **src/cli.ts** - Wired next command to CLI
   - Imported `nextCommand` function
   - Added `next` command with error handling
   - Proper exit codes and error messages

## Quality Metrics

- ✅ All 266 test cases pass (including 7 unit + 5 integration tests)
- ✅ BDD structure (GIVEN/WHEN/THEN) in all tests
- ✅ Level 1 tests for pure logic, Level 2 for CLI integration
- ✅ TypeScript strict mode compliance
- ✅ Clean error handling with helpful messages
- ✅ Manual CLI verification successful

## Verification Command

```bash
# Run all tests
npx vitest run

# Run unit tests only
npx vitest run tests/unit/commands/next.test.ts

# Run integration tests only
npx vitest run tests/integration/cli/next.integration.test.ts

# Build CLI
npm run build

# Manual test
node bin/spx.js next

# Type checking
npx tsc --noEmit

# Linting
npx eslint src/
```

## CLI Output Example

```bash
$ node bin/spx.js next
Next work item:

  capability-21_core-cli > feature-87_e2e-workflow > story-21_test-fixtures

  Status: OPEN
  Path: /Users/shz/Code/spx/root/specs/doing/capability-21_core-cli/feature-87_e2e-workflow/story-21_test-fixtures
```

## Implementation Notes

### Selection Algorithm

The `findNextWorkItem()` function implements the priority-based selection:

1. **Collect all stories**: Recursively traverse tree to find all leaf nodes (stories)
2. **Filter by status**: Separate into IN_PROGRESS and OPEN lists
3. **Priority 1**: If IN_PROGRESS stories exist, return lowest numbered
4. **Priority 2**: If only OPEN stories exist, return lowest numbered
5. **All done**: Return null if no IN_PROGRESS or OPEN items

This ensures work-in-progress is completed before starting new work, and within each category, stories are worked on in BSP order.

### Output Format

The next command provides full context to help the user locate the work item:

- **Hierarchy**: Shows capability > feature > story path
- **Status**: Displays current status (OPEN or IN_PROGRESS)
- **Path**: Full filesystem path for immediate navigation

### Edge Cases Handled

- **Empty project**: "No work items found in specs/doing"
- **All complete**: "All work items are complete! 🎉"
- **No stories**: Returns null (only capabilities/features)
- **Multiple capabilities**: Searches entire tree for next item

## Story Status

story-32_next-command is now COMPLETE.

The next command successfully:

- ✅ Finds next work item with correct priority (FR1)
- ✅ Implements selection logic (IN_PROGRESS > OPEN, lowest BSP) (FR1)
- ✅ Shows helpful message when no items found (FR1)
- ✅ Provides full context in output
- ✅ Handles all edge cases gracefully
