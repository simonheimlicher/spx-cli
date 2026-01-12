# Story 32: JSON Formatter - DONE

## Implementation Summary

Implemented JSON formatter that produces structured output with:

- Summary statistics (counts capabilities + features only, NOT stories)
- 2-space indentation
- Full tree data with nested structure
- Display number conversion (capability: internal+1, others: as-is)

## Files Created/Modified

- `src/reporter/json.ts` - JSON formatter implementation
- `tests/unit/reporter/json.test.ts` - Unit tests (7 tests, all passing)

## Tests

All 7 unit tests pass:

- Produces valid JSON
- Includes summary with done/inProgress/open counts
- Counts capabilities and features only (stories excluded)
- Includes all work item data (kind, number, slug, status)
- Display numbers correct for all levels
- Uses 2-space indentation

## Verification

```bash
npx vitest run tests/unit/reporter/json.test.ts
```

Result: ✓ 7/7 tests passing
