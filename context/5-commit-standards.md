# Commit and Deployment Standards

## Deployment Gate Requirements

**Every commit must pass ALL of these criteria before merging:**

### Automated Checks (All Must Pass)

- [ ] **`npm test`** shows **0** failed tests
- [ ] **`npm run typecheck`** shows **0** type errors
- [ ] **`npm run lint`** shows **0** errors (warnings acceptable)
- [ ] **`npm run build`** succeeds (build smoke test)

### Manual Verification Requirements

- [ ] **Story Value Delivered**: Story delivers the promised technical value
- [ ] **No Breaking Changes**: Existing functionality works as before
- [ ] **Documentation Updated**: If new capabilities introduced, documentation reflects changes

---

## Pre-Commit Verification Protocol

**Before creating ANY commit, follow this exact sequence:**

### Step 1: Selective Staging (NEVER use `git add .`)

```bash
# ❌ NEVER do this - stages everything including incomplete work
git add .

# ✅ ALWAYS do this - stage only files related to your specific change
git add src/scanner/patterns.ts test/unit/scanner/patterns.test.ts
```

**Staging Rules:**

- [ ] **One Story Per Commit**: Only stage files related to the single story being fixed
- [ ] **Review Untracked Files**: Run `git status` and consciously decide about each `??` file
- [ ] **Exclude Experimental Work**: Never stage files from other stories unless explicitly related

### Step 2: Pre-Commit Diff Review

```bash
# Review exactly what will be committed
git diff --cached

# Verify file list matches your intent
git diff --cached --name-only
```

**Review Checklist:**

- [ ] **File Count Reasonable**: Does the number of files match the scope of your fix?
- [ ] **No Surprise Files**: Are there files you didn't intend to modify?
- [ ] **No Unrelated Changes**: Are all changes related to the single issue being fixed?
- [ ] **No Debug Code**: No console.log statements, temporary comments, or experimental code?

### Step 3: Atomic Commit Verification

- [ ] **Single Purpose**: Does this commit do exactly one thing?
- [ ] **Story Boundary**: Are all changes related to the same story/issue?
- [ ] **Independent**: Could this commit be reverted without breaking other features?
- [ ] **Complete**: Does this commit include everything needed for the fix to work?

### Red Flags - DO NOT COMMIT IF:

- More than 10 files changed for a simple bug fix
- Files from multiple story directories included
- New files (`??`) that weren't explicitly intended
- Changes in unrelated modules or domains

---

## Conventional Commits Standard

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Commit Types

| Type         | Purpose                                        | SemVer Impact | Examples                                              |
| ------------ | ---------------------------------------------- | ------------- | ----------------------------------------------------- |
| **feat**     | New capability                                 | MINOR         | `feat: add work item scanner with pattern matching`   |
| **fix**      | Bug fix                                        | PATCH         | `fix: handle missing tests directory gracefully`      |
| **docs**     | Documentation changes                          | PATCH         | `docs: update CLI usage examples`                     |
| **style**    | Code formatting (no logic change)              | PATCH         | `style: apply prettier formatting`                    |
| **refactor** | Code restructure, architecture improvements    | PATCH         | `refactor: extract status logic into separate module` |
| **perf**     | Performance improvements                       | PATCH         | `perf: optimize directory scanning with caching`      |
| **test**     | Add or modify tests                            | PATCH         | `test: add integration tests for scanner`             |
| **ci**       | CI/CD pipeline changes                         | PATCH         | `ci: add GitHub Actions workflow`                     |
| **build**    | Build system or dependencies                   | PATCH         | `build: add zod dependency for config validation`     |
| **ctx**      | Context, workflow, AI/human collaboration      | PATCH         | `ctx: add BSP numbering guidance to structure doc`    |

## Type Selection Guidelines

### Use `ctx:` for

- Context documentation (`context/*.md` changes)
- Work item structure and templates
- Workflow and process documentation
- ADR, TRD, capability/feature/story templates

### Use `feat:` for

- New CLI commands or options
- Scanner implementations (pattern matching, directory walking)
- Status determination features
- Reporter implementations (text, json, markdown, table)

### Use `fix:` for

- CLI argument handling issues
- Scanner pattern matching errors
- Status determination issues
- Report generation failures

### Use `refactor:` for

- Extracting modules from existing code
- Improving code organization
- Technical debt reduction

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**CRITICAL:** DO NOT INCLUDE ANY ATTRIBUTION!

## Breaking Changes

Any type can include:

- '!' suffix: `feat!: change CLI syntax to positional arguments`
- 'BREAKING CHANGE:' footer for major version bump

## Scope Usage Guidelines

### Common Scopes

| Scope      | Purpose                                    |
| ---------- | ------------------------------------------ |
| `cli`      | CLI argument parsing, commands             |
| `scanner`  | Directory walking, work item discovery     |
| `status`   | Status determination, state machine        |
| `reporter` | Output formatting (text, json, md, table)  |
| `mcp`      | MCP server adapter                         |
| `context`  | Context documentation (`context/*.md`)     |
| `spec`     | Specifications (`specs/` work items, ADRs) |

## Example Commits

### Good Examples

```bash
# Feature with clear value
feat(scanner): add work item pattern matching with BSP numbering support

# Bug fix with context
fix(status): handle missing tests directory gracefully

Return OPEN status when tests directory doesn't exist instead of
throwing an error, allowing scanning to continue.

# Refactor with justification
refactor: extract pattern matching logic into src/scanner/patterns.ts

Prepares codebase for unit testing by isolating regex matching
logic into pure, injectable functions.

# Context/workflow update
ctx: add BSP numbering examples to structure documentation

# Test infrastructure
test(scanner): add unit tests for work item name parsing
```

### Poor Examples

```bash
# ❌ Too vague
fix: bug fixes

# ❌ Multiple unrelated changes
feat: add scanner and fix status determination and update docs

# ❌ Contains attribution
feat: add MCP server support (implemented by John)

# ❌ Not atomic
refactor: various improvements
```

## Commit Message Best Practices

1. **Subject Line** (50 characters or less)
   - Use imperative mood: "add feature" not "added feature"
   - Don't end with period
   - Be specific and descriptive

2. **Body** (optional, wrap at 72 characters)
   - Explain WHAT and WHY, not HOW
   - Reference relevant issues or requirements
   - Include context for reviewers

3. **Footer** (optional)
   - Reference work items: `Refs: capability-32/feature-32/story-32`
   - Breaking changes: `BREAKING CHANGE: description`

## Pre-Deployment Checklist

Before merging to main:

- [ ] All automated checks pass
- [ ] Manual verification complete
- [ ] Test cases cover new functionality
- [ ] Error scenarios tested
- [ ] Commit message follows standards
