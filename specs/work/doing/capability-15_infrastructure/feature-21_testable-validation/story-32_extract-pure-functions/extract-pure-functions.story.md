# Story: Extract Pure Functions with Dependency Injection

## Acceptance Criteria

- [ ] `ProcessRunner` interface defined for subprocess injection
- [ ] `buildEslintArgs()` extracted as pure, exported function
- [ ] `buildTypeScriptArgs()` extracted as pure, exported function
- [ ] `parseStdinJson()` extracted as pure, exported function
- [ ] `validateAndExpandFilePaths()` extracted as pure, exported function
- [ ] Global mutable state eliminated (replaced with context objects)
- [ ] All validation steps accept injectable dependencies

## Implementation Tasks

1. Define interfaces at top of file:
   ```typescript
   interface ProcessRunner {
     spawn(cmd: string, args: string[], opts: SpawnOptions): ChildProcess;
   }

   interface ValidationContext {
     projectRoot: string;
     scope: "full" | "production" | "file-specific";
     scopeConfig: TypeScriptScope;
     enabledValidations: Record<string, boolean>;
     isFileSpecificMode: boolean;
     validatedFiles?: string[];
   }
   ```

2. Extract pure argument builders:
   - `buildEslintArgs(context: ValidationContext): string[]`
   - `buildTypeScriptArgs(context: ValidationContext): string[]`
   - `buildCircularDepsArgs(context: ValidationContext): string[]`

3. Extract parsers:
   - `parseStdinJson(input: string): { filePath: string | null }`
   - `validateAndExpandFilePaths(paths: string[]): string[]`

4. Refactor validation steps to accept dependencies:
   - `validateESLint(context: ValidationContext, runner: ProcessRunner = { spawn })`
   - `validateTypeScript(context: ValidationContext, runner: ProcessRunner = { spawn })`
   - `validateCircularDeps(context: ValidationContext, runner: ProcessRunner = { spawn })`

5. Replace global state:
   - Remove module-level mutable variables
   - Pass state via context objects
   - Use function parameters instead of closure capture

## Testing Strategy

**Level 1 (Unit):**

- Test argument builders return correct arrays for different contexts
- Test parsers handle valid/invalid input correctly
- Test file expansion logic with various inputs

**Level 2 (Integration):**

- Deferred to story-43 (test suite story)

## Definition of Done

- All functions exported and marked `@internal` in JSDoc
- No module-level mutable state remains
- All validation steps use dependency injection
- Code compiles with `npm run typecheck`
- Structure supports testing (but tests written in story-43)
