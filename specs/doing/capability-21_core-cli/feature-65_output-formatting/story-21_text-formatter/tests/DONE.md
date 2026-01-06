# Story 21: Text Formatter - DONE

## Implementation Summary

Implemented text formatter that renders work item trees with:

- Hierarchical indentation (0/2/4 spaces for capability/feature/story)
- Chalk-colored status indicators (green/yellow/gray)
- Display number conversion (capability: internal+1, others: as-is)

## Files Created/Modified

- `src/reporter/text.ts` - Text formatter implementation
- `tests/unit/reporter/text.test.ts` - Unit tests (6 tests, all passing)

## Tests

All 6 unit tests pass:

- Tree with capability renders with no indentation
- Features render with 2-space indentation
- Stories render with 4-space indentation
- Status indicators included
- Display numbers correct for all levels

## Verification

```bash
npx vitest run tests/unit/reporter/text.test.ts
```

Result: ✓ 6/6 tests passing
