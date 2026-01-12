# Story 43: Build Work Item List - DONE

**Completion Date:** 2026-01-04

## Files Created/Modified

### Source Files

1. `src/scanner/walk.ts` - Added `buildWorkItemList()` function
2. `src/types.ts` - Made `WorkItem.path` required (removed optional `?`)

### Test Files

1. `specs/doing/capability-21_core-cli/feature-32_directory-walking/story-43_build-work-item-list/tests/walk.test.ts` - Level 1 unit tests

## Test Results

**Test Location:** `specs/doing/.../story-43_build-work-item-list/tests/walk.test.ts`
**Test Level:** Level 1 (Unit Tests)
**Test Count:** 4 tests
**Status:** ✅ All passing

### Test Coverage

- ✅ Directory entries → WorkItem objects with correct structure
- ✅ All three kinds (capability, feature, story) parsed correctly
- ✅ Invalid entries throw errors
- ✅ Empty array input → empty array output

## Implementation Summary

Implemented `buildWorkItemList()` as a pure function that:

- Converts `DirectoryEntry[]` to `WorkItem[]`
- Uses `parseWorkItemName()` to extract kind, number, and slug
- Preserves full filesystem path for each work item
- Throws errors for invalid patterns (propagates from parseWorkItemName)

Updated `WorkItem` type:

- Changed `path?: string` to `path: string` (required field)
- Ensures all work items include full filesystem path

## Quality Metrics

- **BDD Structure:** ✅ All tests use GIVEN/WHEN/THEN
- **No Mocking:** ✅ Uses real functions, no mocks
- **Type Safety:** ✅ Full TypeScript coverage
- **Error Handling:** ✅ Proper error propagation

## Graduation Notes

Tests will be graduated to `tests/unit/scanner/walk.test.ts` when feature is complete.
