# Story 43: Markdown Formatter - DONE

## Implementation Summary

Implemented markdown formatter that renders trees with:

- Heading hierarchy (# for capabilities, ## for features, ### for stories)
- Status lines after each heading
- Display number conversion (capability: internal+1, others: as-is)

## Files Created/Modified

- `src/reporter/markdown.ts` - Markdown formatter implementation
- `tests/unit/reporter/markdown.test.ts` - Unit tests (6 tests, all passing)

## Tests

All 6 unit tests pass:

- Uses # for capabilities
- Uses ## for features
- Uses ### for stories
- Includes status lines
- Display numbers correct for all levels

## Verification

```bash
npx vitest run tests/unit/reporter/markdown.test.ts
```

Result: ✓ 6/6 tests passing
