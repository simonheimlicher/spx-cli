# Story-46: Validation Domain Registration - DONE

## Summary

Implemented the validation CLI domain (`spx validation`) with placeholder command handlers that integrate with the existing tool discovery infrastructure.

## Acceptance Criteria Met

- [x] `src/domains/validation/index.ts` implements `Domain` interface
- [x] Domain registered in `src/cli.ts`
- [x] `spx validation --help` shows subcommands
- [x] Subcommands registered: `typescript`, `lint`, `circular`, `knip`, `all`
- [x] Each subcommand has appropriate options

## Files Created

### Domain

- `src/domains/validation/index.ts` - Validation domain with command registration

### Command Handlers

- `src/commands/validation/index.ts` - Module exports
- `src/commands/validation/types.ts` - Shared types
- `src/commands/validation/typescript.ts` - TypeScript validation command
- `src/commands/validation/lint.ts` - ESLint validation command
- `src/commands/validation/circular.ts` - Circular dependency check command
- `src/commands/validation/knip.ts` - Unused code detection command
- `src/commands/validation/all.ts` - Run all validations command

### Tests

- `tests/validation-domain.test.ts` - Level 1 unit tests (4 tests)
- `tests/validation-cli.integration.test.ts` - Level 2 integration tests (13 tests)

## Files Modified

- `src/cli.ts` - Added validation domain registration

## Test Results

- 17 tests passing (4 unit + 13 integration)
- All validation passes (`npm run validate`)
- No regressions introduced

## CLI Commands Available

```
spx validation --help
spx validation typescript [--scope <scope>] [--files <paths...>] [--quiet] [--json]
spx validation lint [--fix] [--scope <scope>] [--files <paths...>] [--quiet] [--json]
spx validation circular [--quiet] [--json]
spx validation knip [--quiet] [--json]
spx validation all [--fix] [--scope <scope>] [--files <paths...>] [--quiet] [--json]
```

Aliases: `spx v`, `spx validation ts`

## Next Steps

Story-47 will implement the actual validation logic by wiring the commands to `src/validation/steps/`.
