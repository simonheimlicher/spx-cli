# Story 21: Context Manager - DONE

## Summary

Implemented `withTestEnv()` context manager that handles test environment setup and teardown automatically.

## What Was Built

**File**: `tests/helpers/with-test-env.ts`

### Core Function

```typescript
export async function withTestEnv<T>(
  fn: (ctx: TestEnvContext) => Promise<T>,
): Promise<T>;

export async function withTestEnv<T>(
  options: TestEnvOptions,
  fn: (ctx: TestEnvContext) => Promise<T>,
): Promise<T>;
```

### Modes Implemented

| Mode        | Option             | Behavior                                  |
| ----------- | ------------------ | ----------------------------------------- |
| Bare temp   | (none)             | Creates unique directory in `os.tmpdir()` |
| Empty specs | `emptySpecs: true` | Creates `specs/doing/` structure          |

### Key Behaviors

- **Automatic cleanup**: `finally` block ensures cleanup on success or failure
- **Idempotent cleanup**: No error if directory already deleted
- **Return value preservation**: Callback return value passed through
- **Type-safe overloads**: Compile-time checking of options and callback

## Tests Graduated

Tests are in `tests/helpers/with-test-env.integration.test.ts`:

- Bare temp directory creation and cleanup
- Return value preservation
- Empty specs structure creation
- Cleanup on callback error
- Idempotent cleanup (handles pre-deleted directories)

## Acceptance Criteria Met

- [x] AC1: Bare temp directory created in `os.tmpdir()`
- [x] AC2: Empty specs structure with `emptySpecs: true`
- [x] AC3: Cleanup on success
- [x] AC4: Cleanup on failure (error propagates)
- [x] AC5: Idempotent cleanup
