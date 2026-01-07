# ADR 001: Validation Script Testability with Single-File Constraint

## Problem

The `scripts/run/validate.ts` validation script (1,594 lines) has critical testability issues: global mutable state, no dependency injection, direct subprocess spawning, and overly permissive `any` types. It's excluded from TypeScript checking and has zero test coverage for infrastructure that validates all project code.

## Context

- **Business**: Validation script is the quality gate for all code changes. Untested validation infrastructure creates blind spots where bugs in the validator itself go undetected, potentially allowing defective code to pass validation.
- **Technical**: Bootstrap constraint requires single-file architecture (must run before any packages installed). TypeScript strict mode project. Current script uses global state (`validationTimings`, `progressSteps`, `logVerbosity`) and direct `spawn()` calls without dependency injection.

## Decision

**Refactor `scripts/run/validate.ts` into testable pure functions with dependency injection while maintaining single-file architecture. Export core functions for testing. Achieve 80%+ test coverage.**

## Rationale

The single-file constraint is non-negotiable (bootstrap scenario), but testability is equally critical. We achieve both by:

1. **Pure functions over classes** - Functions are simpler to test, easier to understand, and better fit the procedural script execution model. Classes would add ceremony without benefit in a single-file context.

2. **Dependency injection via parameters** - Instead of importing `spawn` directly, accept a `ProcessRunner` interface parameter with a default value. This enables Level 1 testing with controlled implementations while keeping the production path simple:

   ```typescript
   interface ProcessRunner {
     spawn(cmd: string, args: string[], opts: SpawnOptions): ChildProcess;
   }

   function validateESLint(
     context: ValidationContext,
     runner: ProcessRunner = { spawn }, // Default = real spawn
   ): Promise<ValidationStepResult>;
   ```

3. **Separate pure logic from side effects** - Extract command-building logic into pure functions testable at Level 1. Keep `spawn()` invocations in minimal wrapper functions testable at Level 2.

4. **Export testable functions** - Mark internal functions as `export` even though they're only used within the file. This makes them importable by tests without changing the public API or split files.

This approach was rejected:

- **Multi-file refactor**: Violates bootstrap constraint (can't have dependencies before installation)
- **Classes with DI**: Adds unnecessary ceremony; functions are sufficient
- **"Keep it untested"**: Unacceptable for validation infrastructure

## Trade-offs Accepted

- **Export internal functions**: Functions like `buildEslintArgs()` are exported for testing but not part of the public API. Mitigation: JSDoc comments mark them as `@internal` to signal they're not for external consumption.
- **Parameter proliferation**: Dependency injection adds parameters to function signatures. Mitigation: Use context objects to group related parameters.
- **Single-file size**: File remains large (1,500+ lines). Mitigation: Use clear section comments and table of contents comment at top of file.

## Testing Strategy

### Level Coverage

| Level           | Question Answered                                                 | Scope                                                                   |
| --------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1 (Unit)        | Are argument builders, parsers, and pure logic functions correct? | `buildEslintArgs()`, `parseStdinJson()`, `validateAndExpandFilePaths()` |
| 2 (Integration) | Do validation steps work with real tsc, ESLint, madge binaries?   | Full validation with real tools on fixture projects                     |

### Escalation Rationale

- **1 → 2**: Level 1 verifies that ESLint arguments are constructed correctly (arrays, flags, file paths), but cannot verify that ESLint actually executes or that arguments are valid. Level 2 runs real ESLint against fixture files to prove the integration works.

### Test Harness

| Level | Harness                 | Location/Dependency                         |
| ----- | ----------------------- | ------------------------------------------- |
| 2     | Fixture project harness | `tests/fixtures/sample-project/` (existing) |

**Harness specification**:

- Minimal TypeScript project with known type errors
- Known ESLint violations
- Known circular dependency for testing detection
- `withTestEnv()` context manager for temp directory isolation

### Behaviors Verified

**Level 1 (Unit):**

- `buildEslintArgs()` constructs correct arguments for file-specific mode
- `buildEslintArgs()` constructs correct arguments for full-project mode
- `buildTypeScriptArgs()` selects correct config based on validation scope
- `parseStdinJson()` extracts file path from hook input JSON
- `parseStdinJson()` returns null for invalid JSON or missing file path
- `validateAndExpandFilePaths()` expands directories to TypeScript files
- `validateAndExpandFilePaths()` rejects non-existent paths
- `getValidationDirectories()` respects tsconfig exclude patterns
- Global state removed: no module-level mutable variables
- `any` types removed from logging functions

**Level 2 (Integration):**

- TypeScript validation detects real type errors in fixture project
- ESLint validation detects real lint errors in fixture project
- Circular dependency detection finds real circular imports
- File-specific validation runs only on specified files
- Postedit hook mode executes fast validation on single file
- Validation fails fast on first error
- Timing cache persists and loads correctly

## Validation

### How to Recognize Compliance

You're following this decision if:

- All validation step functions accept a `ProcessRunner` or similar interface parameter
- Command-building logic is extracted into separate pure functions
- Tests exist in `tests/unit/validation/` covering exported functions
- No module-level mutable global state (except constants)
- `scripts/**/*` is included in `tsconfig.json`
- `npm run typecheck` passes without errors in validate.ts

### MUST

- All `spawn()` calls MUST be wrapped in functions that accept injectable `ProcessRunner` interface
- Command-building functions (args construction) MUST be pure functions separate from execution
- Validation steps MUST accept `ValidationContext` object instead of individual parameters
- All exported functions MUST have TypeScript type annotations (no implicit `any`)
- Logging functions MUST use `string` for messages, not `any`
- Test coverage MUST exceed 80% before graduation

### NEVER

- NEVER use module-level mutable variables (global state)
- NEVER use `any` type without explicit justification comment
- NEVER spawn processes without providing injectable dependency
- NEVER test validation logic using mocks (use DI with controlled implementations)
- NEVER split into multiple files (bootstrap constraint)

## Implementation Checklist

### Phase 1: Configuration (Blocking)

- [ ] Add `"scripts/**/*"` to `tsconfig.json` include array
- [ ] Verify `npm run typecheck` passes with no errors in validate.ts
- [ ] Remove `any` types from logging function signatures

### Phase 2: Architecture (High Priority)

- [ ] Define `ProcessRunner` interface for `spawn()` injection
- [ ] Extract `buildEslintArgs(context): string[]` pure function
- [ ] Extract `buildTypeScriptArgs(context): string[]` pure function
- [ ] Replace global state with explicit context objects passed as parameters
- [ ] Mark internal functions as `export` for test access

### Phase 3: Testing (High Priority)

- [ ] Create `tests/unit/validation/` directory structure
- [ ] Write Level 1 tests for argument builders (80% coverage target)
- [ ] Write Level 1 tests for parsers and utility functions
- [ ] Write Level 2 tests for validation steps with fixture project
- [ ] Verify `npm run test:coverage` shows ≥80% coverage for validate.ts

### Phase 4: Graduation

- [ ] All tests passing
- [ ] Coverage ≥80%
- [ ] Code review approved
- [ ] Graduate tests to `tests/unit/` and `tests/integration/`
- [ ] Create `DONE.md`
