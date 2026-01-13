# Story-21: Parse Capability Names - DONE

## Completion Summary

**Date**: 2026-01-04
**Status**: ✅ APPROVED

## Implementation

### Files Created

1. `src/types.ts` - Core type definitions (WorkItem, WorkItemKind)
2. `src/scanner/patterns.ts` - Pattern matching implementation with parseWorkItemName()

### Tests

- **Location**: Graduated to `test/unit/scanner/patterns.test.ts`
- **Level**: Level 1 (Unit tests)
- **Coverage**: 5 test cases covering:
  - Valid capability name parsing
  - Multi-word slug preservation
  - Uppercase letter rejection
  - Invalid BSP number rejection
  - Non-matching pattern rejection

## Quality Metrics

- ✅ All tests passing (5/5)
- ✅ TypeScript compilation successful
- ✅ No mocking used (pure functions)
- ✅ BDD structure (GIVEN/WHEN/THEN)
- ✅ 100% type coverage

## Notes

- BSP numbers are stored 0-indexed internally (directory number - 1)
- Pattern validates BSP numbers in range 10-99
- Slug validation enforces lowercase kebab-case only
