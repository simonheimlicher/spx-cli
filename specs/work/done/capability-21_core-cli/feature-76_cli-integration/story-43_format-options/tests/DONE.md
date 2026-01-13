# Completion Evidence: Format Options

## Review Summary

**Verdict**: APPROVED
**Date**: 2026-01-05
**Reviewer**: typescript-coder (self-review)

## Verification Results

| Tool   | Status | Details                |
| ------ | ------ | ---------------------- |
| tsc    | PASS   | 0 errors               |
| eslint | PASS   | 0 violations (src/)    |
| vitest | PASS   | 272/272 tests (+6 new) |
| CLI    | PASS   | Manual verification OK |

## Implementation Summary

### Files Modified

1. **src/commands/status.ts** - Added format option support
   - Added `OutputFormat` type: "text" | "json" | "markdown" | "table"
   - Added `format` option to `StatusOptions` interface
   - Imported all formatters (formatJSON, formatMarkdown, formatTable)
   - Implemented format switching with switch statement

2. **src/cli.ts** - Wired format options to CLI
   - Added `--format <format>` option to status command
   - Implemented format validation
   - Made `--json` flag override `--format` option
   - Added error handling for invalid formats

3. **tests/integration/cli/status.integration.test.ts** - Added Level 2 tests
   - 6 new integration tests for format options
   - Tests --json flag
   - Tests --format with all valid formats (text, json, markdown, table)
   - Tests invalid format error handling

## Quality Metrics

- ✅ All 272 test cases pass (including 6 new integration tests)
- ✅ BDD structure (GIVEN/WHEN/THEN) in integration tests
- ✅ Level 2 tests (requires real CLI and Commander.js)
- ✅ TypeScript strict mode compliance
- ✅ Proper format validation with helpful error messages
- ✅ Manual CLI verification successful for all formats

## Verification Command

```bash
# Run all tests
npx vitest run

# Run integration tests only
npx vitest run tests/integration/cli/status.integration.test.ts

# Build CLI
npm run build

# Manual tests
node bin/spx.js status --json
node bin/spx.js status --format markdown
node bin/spx.js status --format table
node bin/spx.js status --format text

# Type checking
npx tsc --noEmit

# Linting
npx eslint src/
```

## CLI Output Examples

### JSON Format

```bash
$ node bin/spx.js status --json
{
  "summary": {
    "done": 5,
    "inProgress": 2,
    "open": 1
  },
  "capabilities": [...]
}
```

### Markdown Format

```bash
$ node bin/spx.js status --format markdown
# capability-21_core-cli

Status: IN_PROGRESS

## feature-21_pattern-matching

Status: DONE
...
```

### Table Format

```bash
$ node bin/spx.js status --format table
| Kind       | Number | Slug                    | Status      |
|------------|--------|-------------------------|-------------|
| capability | 21     | core-cli                | IN_PROGRESS |
| feature    | 21     | pattern-matching        | DONE        |
...
```

### Text Format (default)

```bash
$ node bin/spx.js status
capability-21_core-cli [IN_PROGRESS]
  feature-21_pattern-matching [DONE]
    story-21_parse-capability-names [DONE]
...
```

## Implementation Notes

### Format Option Design

The implementation supports two ways to specify format:

1. **--json flag**: Legacy shorthand for JSON format
2. **--format <format>**: Explicit format selection

Priority: `--json` flag overrides `--format` option for backwards compatibility.

### Format Validation

Invalid formats are caught at CLI level with helpful error:

```
Error: Invalid format "invalid". Must be one of: text, json, markdown, table
```

### Format Switching

The `statusCommand()` function uses a switch statement to select the appropriate formatter:

- `formatText()` - Default, tree view with indentation
- `formatJSON()` - Structured data with summary
- `formatMarkdown()` - Headers and sections
- `formatTable()` - Tabular layout with columns

All formatters consume the same `WorkItemTree` structure, ensuring consistency across formats.

## Story Status

story-43_format-options is now COMPLETE.

The format options successfully:

- ✅ Support --json flag (FR1)
- ✅ Support --format option for all formats (FR2)
- ✅ Validate format input
- ✅ Handle --json flag override
- ✅ Provide consistent output across all formats
