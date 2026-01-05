# ADR 001: CLI Framework Selection

## Context and Problem Statement

### Problem

```
spx requires both simple command execution (spx status --json) and interactive 
tree navigation (spx browse). We need a CLI framework that handles both modes 
elegantly without over-engineering the simple cases.
```

### Context

- **Business Context**: spx replaces an LLM-based spec workflow skill with a deterministic CLI, requiring <100ms response times
- **Technical Context**: TypeScript chosen for MCP SDK alignment; need command parsing + optional TUI capability
- **Constraints**: Must support JSON output for MCP consumption; interactive mode for human navigation

## Decision Drivers

- [x] **Performance**: Commands must complete in <100ms
- [x] **Maintainability**: Simple commands should remain simple to implement
- [x] **Integration**: JSON output for MCP server; interactive mode for humans
- [x] **Extensibility**: Room to grow into full TUI without rewrite

## Considered Options

### Option 1: Commander.js Only

**Description**: Lightweight command parser. Add interactivity later with separate libraries as needed.

### Pros of Option 1

- ✅ Minimal footprint, fast startup
- ✅ Industry standard, familiar to all Node developers
- ✅ Perfect for non-interactive commands

### Cons of Option 1

- ❌ No built-in interactivity; requires additional libraries
- ❌ Fragmented approach if multiple interaction libraries added later

### Option 2: oclif

**Description**: Full CLI framework by Salesforce with plugins, hooks, and structure.

### Pros of Option 2

- ✅ Plugin architecture for extensibility
- ✅ Built-in help generation and command discovery
- ✅ Good for large CLI applications

### Cons of Option 2

- ❌ Heavy for a focused tool like spx
- ❌ No interactivity built-in despite complexity
- ❌ Opinionated structure adds overhead

### Option 3: Commander + Ink

**Description**: Commander for command routing; Ink (React for terminals) for interactive modes.

### Pros of Option 3

- ✅ Simple commands stay simple (Commander)
- ✅ Full TUI capability when needed (Ink)
- ✅ React model enables complex interactive trees
- ✅ Ink ecosystem provides select, spinner, text-input primitives

### Cons of Option 3

- ❌ Two libraries to understand
- ❌ Ink requires React mental model

### Option 4: Clack

**Description**: Beautiful prompt library by the Astro team. Elegant out-of-box aesthetics.

### Pros of Option 4

- ✅ Stunning visual output with minimal code
- ✅ Simple API for guided flows
- ✅ Great for init wizards and confirmations

### Cons of Option 4

- ❌ Prompt-oriented, not app-oriented
- ❌ Limited for persistent TUI (live updating tree)
- ❌ Less flexible for complex navigation

## Decision Outcome

**Chosen Option**: Commander + Ink

### Rationale

```
spx has two distinct interaction modes:

1. Fire-and-forget commands (status, next, done) — Commander handles perfectly
2. Interactive navigation (browse, tree exploration) — Ink provides full TUI

This combination keeps simple things simple while enabling complex interactivity 
without architectural changes. Clack may be added later for specific flows (spx init).
```

**Expected Benefits:**

- Non-interactive commands have minimal overhead
- Interactive mode can render live-updating trees with keyboard navigation
- Architecture supports adding more TUI features without refactoring

**Accepted Trade-offs:**

- Two libraries instead of one; acceptable given clear separation of concerns
- Ink requires React knowledge; acceptable given its power for TUI

## Implementation Plan

### Immediate Actions

- [ ] Initialize project with Commander for command routing
- [ ] Implement `status`, `next`, `done` as pure Commander commands
- [ ] Add Ink for `browse` command with tree navigation

### Success Metrics

- **Non-interactive commands**: <100ms execution time
- **Interactive mode**: Smooth 60fps rendering, keyboard navigation works
- **Timeline**: Validate at v0.1.0

## Consequences

### Positive Consequences

- Clean separation: Commander for CLI, Ink for TUI
- Can ship non-interactive commands first, add browse later
- Ink ecosystem provides battle-tested interactive primitives

### Negative Consequences

- Bundle size larger than Commander-only; mitigated by tree-shaking and lazy loading Ink

## Compliance and Validation

### Architecture Principles

- [x] **Consistency**: Both libraries are mainstream TypeScript-friendly choices
- [x] **Simplicity**: Simple commands use simple code; complexity only where needed
- [x] **Scalability**: Can grow into full TUI without rewrite

### Integration Tests Required

```typescript
describe("CLI Framework Validation", () => {
  it("non-interactive commands complete under 100ms", async () => {
    const start = Date.now();
    await exec("spx status --json");
    expect(Date.now() - start).toBeLessThan(100);
  });

  it("JSON output is valid and parseable", async () => {
    const { stdout } = await exec("spx status --json");
    expect(() => JSON.parse(stdout)).not.toThrow();
  });

  it("interactive mode renders without error", async () => {
    const proc = spawn("spx", ["browse"]);
    await waitForOutput(proc, "capability-");
    proc.stdin.write("q"); // quit
    expect(proc.exitCode).toBe(0);
  });
});
```

## Links and References

**Supporting Documentation:**

- Commander.js: https://github.com/tj/commander.js
- Ink: https://github.com/vadimdemedes/ink
- Clack: https://github.com/bombshell-dev/clack
