# Feature: Auto-Injection

## Observable Outcome

When users run `spx session pickup`, files listed in the session's YAML front matter (`specs:` and `files:` arrays) are automatically read and printed to stdout, eliminating manual file-reading steps.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component                 | Level | Justification                                   |
| ------------------------- | ----- | ----------------------------------------------- |
| YAML front matter parsing | 1     | Pure function: string → object                  |
| Path extraction           | 1     | Pure function: front matter → paths array       |
| Output formatting         | 1     | Pure function: file contents → formatted output |
| File reading              | 2     | Needs real filesystem                           |
| Missing file handling     | 2     | Needs real filesystem errors                    |

### Escalation Rationale

- **1 → 2**: Unit tests verify YAML parsing and formatting; integration tests verify real file reading and graceful handling of missing files

## Feature Integration Tests (Level 2)

These tests verify that **file injection** works correctly.

### FI1: Inject existing files

```typescript
// tests/integration/session/auto-injection.integration.test.ts
describe("Feature: Auto-Injection", () => {
  it("GIVEN session with specs/files WHEN pickup THEN file contents in output", async () => {
    // Given: Session with file references, files exist
    const { sessionsDir, projectDir } = await createTempSessionsDir();
    const specPath = path.join(projectDir, "spec.md");
    const codePath = path.join(projectDir, "code.ts");
    await fs.writeFile(specPath, "# Spec Content");
    await fs.writeFile(codePath, "const x = 1;");

    const sessionContent = `---
id: test
specs:
  - ${specPath}
files:
  - ${codePath}
---
# Session`;
    const sessionId = await createSession(sessionsDir, { content: sessionContent });

    // When: Pickup with injection
    const result = await pickupSession(sessionsDir, sessionId, { inject: true });

    // Then: File contents appear
    expect(result.output).toContain("=== Injected Files ===");
    expect(result.output).toContain("# Spec Content");
    expect(result.output).toContain("const x = 1;");
  });
});
```

### FI2: Warn on missing files

```typescript
describe("Feature: Auto-Injection", () => {
  it("GIVEN session with missing file WHEN pickup THEN warning shown, continues", async () => {
    // Given: Session references nonexistent file
    const { sessionsDir } = await createTempSessionsDir();
    const sessionContent = `---
id: test
files:
  - /nonexistent/file.ts
---
# Session`;
    const sessionId = await createSession(sessionsDir, { content: sessionContent });

    // When: Pickup
    const result = await pickupSession(sessionsDir, sessionId, { inject: true });

    // Then: Warning shown, but operation succeeds
    expect(result.exitCode).toBe(0);
    expect(result.warnings).toContain("/nonexistent/file.ts");
  });
});
```

### FI3: Empty arrays produce no injection section

```typescript
describe("Feature: Auto-Injection", () => {
  it("GIVEN session with empty specs/files WHEN pickup THEN no injection section", async () => {
    // Given: Session with empty arrays
    const { sessionsDir } = await createTempSessionsDir();
    const sessionContent = `---
id: test
specs: []
files: []
---
# Session`;
    const sessionId = await createSession(sessionsDir, { content: sessionContent });

    // When: Pickup
    const result = await pickupSession(sessionsDir, sessionId, { inject: true });

    // Then: No injection section
    expect(result.output).not.toContain("=== Injected Files ===");
  });
});
```

### FI4: Skip injection with --no-inject flag

```typescript
describe("Feature: Auto-Injection", () => {
  it("GIVEN session with files WHEN pickup --no-inject THEN files not read", async () => {
    // Given: Session with file references
    const { sessionsDir, projectDir } = await createTempSessionsDir();
    const filePath = path.join(projectDir, "large-file.ts");
    await fs.writeFile(filePath, "// Large content...");

    const sessionContent = `---
id: test
files:
  - ${filePath}
---
# Session`;
    const sessionId = await createSession(sessionsDir, { content: sessionContent });

    // When: Pickup with --no-inject
    const result = await pickupSession(sessionsDir, sessionId, { inject: false });

    // Then: File content not in output
    expect(result.output).not.toContain("Large content");
    expect(result.output).not.toContain("=== Injected Files ===");
  });
});
```

## Capability Contribution

This feature reduces agent setup time:

- **Auto-injection** eliminates manual file reads after pickup
- **Warn-and-continue** ensures pickup succeeds even with stale references
- **--no-inject** allows skipping when files are large or unnecessary

Depends on: [Session Lifecycle](./../feature-32_session-lifecycle/session-lifecycle.feature.md) for pickup command

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 integration tests pass
- [ ] YAML front matter `specs:` and `files:` arrays parsed correctly
- [ ] Listed files printed to stdout with clear delimiters
- [ ] Missing files produce warnings, don't fail pickup
- [ ] `--no-inject` flag skips file reading

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
