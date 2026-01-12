# Story: Validation Test Suite

## Acceptance Criteria

- [ ] Test coverage ≥80% for scripts/run/validate.ts
- [ ] All pure functions have Level 1 unit tests
- [ ] Validation steps have Level 2 integration tests with fixtures
- [ ] No mocking used (dependency injection only)
- [ ] All tests pass in CI

## Implementation Tasks

1. Create test directory structure:
   ```
   specs/.../story-43/tests/
   ├── unit/
   │   ├── build-args.test.ts
   │   ├── parsers.test.ts
   │   └── file-expansion.test.ts
   └── integration/
       ├── eslint-validation.integration.test.ts
       ├── typescript-validation.integration.test.ts
       └── circular-deps-validation.integration.test.ts
   ```

2. Write Level 1 tests (unit/):
   - `buildEslintArgs()`: file-specific mode, full-project mode
   - `buildTypeScriptArgs()`: different scope configs
   - `parseStdinJson()`: valid JSON, invalid JSON, missing fields
   - `validateAndExpandFilePaths()`: directories, files, non-existent paths

3. Create test fixtures:
   ```
   tests/fixtures/validation/
   ├── with-type-errors/
   ├── with-lint-errors/
   └── with-circular-deps/
   ```

4. Write Level 2 tests (integration/):
   - ESLint validation: detects real lint errors in fixture
   - TypeScript validation: detects real type errors in fixture
   - Circular deps: detects real circular imports in fixture

5. Run coverage and iterate until ≥80%:
   ```bash
   npm run test:coverage
   ```

## Testing Strategy

**Level 1 (Unit):**

- Argument builders: 15+ tests covering all code paths
- Parsers: 10+ tests covering valid/invalid inputs
- File expansion: 8+ tests covering different path scenarios

**Level 2 (Integration):**

- ESLint validation: 3+ tests (detects errors, passes clean, file-specific)
- TypeScript validation: 3+ tests (detects errors, passes clean, different configs)
- Circular deps: 2+ tests (detects cycles, passes clean)

## Definition of Done

- `npm run test:coverage` shows ≥80% coverage for scripts/run/validate.ts
- All tests pass with `npm test`
- No mocking used (grep confirms no `vi.mock` or `jest.mock`)
- Tests use dependency injection with controlled implementations
- Fixtures are minimal and focused
