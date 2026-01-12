# Story: Configure TypeScript Checking for Scripts

## Acceptance Criteria

- [ ] `scripts/**/*` added to `tsconfig.json` include array
- [ ] `npm run typecheck` passes with zero errors in validate.ts
- [ ] All `any` types removed from logging functions (replaced with `string`)
- [ ] Validation script properly type-checked in CI

## Implementation Tasks

1. Edit `tsconfig.json` to include `"scripts/**/*"` in the include array
2. Run `npm run typecheck` to identify type errors
3. Fix type errors in validate.ts:
   - Change `any` to `string` in logging function parameters (lines 107-111)
   - Address any other type issues revealed by enabling checking
4. Verify `npm run typecheck` exits with code 0

## Testing Strategy

**Level 1 (Unit):**

- N/A - Configuration change verified by TypeScript compiler itself

**Level 2 (Integration):**

- Verify `npm run typecheck` includes scripts/ in output
- Verify type errors in scripts/ are caught
- Verify validation script type-checks without errors

## Definition of Done

- `npm run typecheck` passes with 0 errors
- validate.ts has no `any` types without justification
- Changes committed with passing CI
