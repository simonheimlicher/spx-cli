# AI Agent Context Guide: spx

## Quick Start for Agents

**Single Entry Point**: This document provides project overview. Read the context files below as you work on tasks.

### Required Reading (in order)

1. **This file** (`CLAUDE.md`) - Project overview
2. **`context/CLAUDE.md`** - Agent orchestration guide, decision tree, validation workflow

### Read On Demand (trigger-based)

| Document                         | MUST read when...                          |
| -------------------------------- | ------------------------------------------ |
| `context/1-structure.md`         | Creating new capabilities/features/stories |
| `context/2-workflow.md`          | Starting any work item                     |
| `context/3-coding-standards.md`  | Writing or modifying TypeScript code       |
| `context/4-testing-standards.md` | Writing tests, determining test approach   |
| `context/5-commit-standards.md`  | Ready to commit changes                    |

## 🚨 VALIDATION GATE (MANDATORY BEFORE COMMIT)

**NEVER commit without passing validation.** This is non-negotiable.

```bash
# Full validation pipeline (circular deps → ESLint → TypeScript)
npm run validate

# Quick verification before committing
npm run validate && npm test
```

### Pre-Commit Checklist

Before committing ANY changes:

- [ ] **`npm run validate`** passes (all 3 steps: circular deps, ESLint, TypeScript)
- [ ] **`npm test`** shows 0 failed tests
- [ ] **`npm run build`** succeeds

### Available Validation Commands

| Command                       | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `npm run validate`            | Full validation (circular → ESLint → tsc) |
| `npm run validate:production` | Production scope only                     |
| `npm run lint`                | ESLint only                               |
| `npm run lint:fix`            | Auto-fix ESLint issues                    |
| `npm run typecheck`           | TypeScript only                           |
| `npm run circular`            | Check for circular dependencies           |
| `npm run knip`                | Find unused code                          |
| `npm run format`              | Format code with Prettier                 |
| `npm run format:check`        | Check formatting without changing files   |

---

### Foundational Skills

**Testing**: This project follows the `typescript-testing` skill at `~/Code/context/claude/typescript/skills/typescript-testing/`.

| Agent Role    | When to Invoke Skill                                            |
| ------------- | --------------------------------------------------------------- |
| **Architect** | Before writing ADRs—determine testing levels for each component |
| **Coder**     | Before writing tests—get patterns for assigned levels           |
| **Reviewer**  | When reviewing tests—verify levels are appropriate              |

The skill defines the 3-level testing system (Unit → Integration → E2E) and the core principles (DI over mocking, behavior over implementation, escalation justification).

### Then

- Check `specs/doing/` for active work items

### Finding Work Items

**IMPORTANT**: Use the `spx` CLI to check project status instead of manually searching directories.

```bash
# Get current project status (fast, deterministic)
node bin/spx.js status

# This replaces manual directory traversal and is much faster
```

**Why use spx status:**

- ✅ Fast: <100ms vs 1-2 minutes with manual searching
- ✅ Deterministic: Reliable DONE/IN PROGRESS/OPEN classification
- ✅ Complete: Shows full hierarchy with status rollup
- ✅ Accurate: Uses tests/DONE.md for status determination

**When to use manual search:**

- Only when you need to read specific story/feature content
- For examining ADRs or detailed requirements

## Project Overview

**spx** is a fast, deterministic CLI tool and MCP server for spec workflow management. It provides:

- **Instant spec status analysis** - Replace slow LLM-based status checks with <100ms deterministic scans
- **Work item scanning** - Automatically discover and classify capabilities, features, and stories
- **MCP integration** - Expose spec workflow tools to AI agents via Model Context Protocol
- **Zero token cost** - Eliminate expensive LLM calls for deterministic file operations

## Key Features

- **Fast status analysis**: Scan entire spec tree in <100ms vs 1-2 minutes with LLM
- **Deterministic classification**: DONE/IN PROGRESS/OPEN based on `tests/` directory state
- **Multiple output formats**: Text, JSON, Markdown, Table - for humans and agents
- **Context-aware discovery**: Reads `context/1-structure.md` for custom patterns
- **MCP server mode**: Exposes spec workflow as tools for AI agents

## Installation

```bash
# Install from npm (when published)
npm install -g spx

# Or use with npx
npx spx status

# Or add to project
npm install --save-dev spx
```

## Usage

```bash
# Get project status
spx status

# Get status as JSON (for agents/scripts)
spx status --json

# Find next work item
spx next

# Show work item tree
spx tree

# Mark item as done
spx done story-32

# Validate structure
spx validate

# Initialize specs directory
spx init
```

## Development

```bash
cd /Users/shz/Code/spx/root

# Install dependencies
npm ci

# Run tests
npm test

# Build
npm run build

# Run CLI locally
node bin/spx.js --help
```

## Technical Stack

- **Language**: TypeScript
- **Build**: tsup
- **Testing**: Vitest
- **CLI**: Commander.js

## Context System

This project uses a structured context system for AI agent collaboration.

### Documentation Structure

| Location                         | Purpose                                 |
| -------------------------------- | --------------------------------------- |
| `context/CLAUDE.md`              | Agent orchestration guide               |
| `context/1-structure.md`         | Project layout and conventions          |
| `context/2-workflow.md`          | TRD → Capability → Feature → Story flow |
| `context/3-coding-standards.md`  | TypeScript standards                    |
| `context/4-testing-standards.md` | Testing with Vitest                     |
| `context/5-commit-standards.md`  | Commit message format                   |
| `context/templates/`             | Templates for ADRs and work items       |

### Work Tracking

Active work is tracked in `specs/doing/`:

```
specs/doing/
└── capability-NN_{slug}/
    ├── {slug}.capability.md
    ├── decisions/
    └── feature-NN_{slug}/
        ├── {slug}.feature.md
        └── story-NN_{slug}/
            ├── {slug}.story.md
            └── DONE.md (when complete)
```

## Architecture

### Core Components

spx is built around three core components:

```
spx/
├── src/
│   ├── scanner/          # Directory walking, pattern matching
│   ├── status/           # DONE/IN PROGRESS/OPEN state machine
│   ├── reporter/         # Output formatting (text, json, md, table)
│   └── mcp/             # MCP server adapter
```

### Scanner

The scanner walks the `specs/` directory tree and identifies work items by pattern:

- `capability-NN_slug/`
- `feature-NN_slug/`
- `story-NN_slug/`

### Status Determination

Status is computed deterministically from the `tests/` directory state:

- **OPEN**: Missing or empty `tests/` directory
- **IN PROGRESS**: `tests/` has files but no `DONE.md`
- **DONE**: `tests/DONE.md` exists

### Reporter

Multiple output formats for different consumers:

- **Text**: Human-readable tree for terminal display
- **JSON**: Structured data for MCP tools and scripts
- **Markdown**: Documentation-ready format
- **Table**: Compact overview for quick scanning

### MCP Server

Exposes spec workflow operations as MCP tools:

- `status` - Get current project status
- `next` - Find next work item
- `validate` - Validate project structure
- `explain` - Explain work item status
