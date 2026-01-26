# DONE

Story completed: 2026-01-25

## Tests

Integration tests graduated to: `tests/integration/session/advanced-cli.integration.test.ts`

## Completion Criteria Verification

- [x] All Level 2 integration tests pass (11 tests)
- [x] `spx session prune` works with default keep=5
- [x] `spx session prune --keep N` keeps N sessions
- [x] `spx session prune --dry-run` shows without deleting
- [x] `spx session archive <id>` moves to archive
- [x] Help text shows all options
- [x] Error messages are actionable
- [x] Exit codes are correct (0 for success, non-zero for errors)

## Files Created/Modified

- `src/commands/session/prune.ts` - Prune command handler
- `src/commands/session/archive.ts` - Archive command handler
- `src/domains/session/index.ts` - Command registration
- `tests/integration/session/advanced-cli.integration.test.ts` - Integration tests
