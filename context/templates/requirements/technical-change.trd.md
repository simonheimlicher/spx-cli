# Technical Requirements Document (TRD)

> **Purpose**: This is an unbounded "wishful thinking" catalyst, NOT a work item.
>
> - No size constraints, no state assessment (OPEN/IN PROGRESS/DONE)
> - User evaluates value BEFORE decomposition begins
> - Spawns sized work items (capabilities/features/stories) AFTER value confirmed
> - Can exist at any level: project root, capability/, or feature/

## Status of this Document: DoR Checklist

| DoR checkbox          | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| [ ] **Outcome**       | Technical capability or improvement that this feature will deliver  |
| [ ] **Test Evidence** | Complete E2E test proving capability works                          |
| [ ] **Assumptions**   | Technical feasibility, compatibility, infrastructure requirements   |
| [ ] **Dependencies**  | Existing capabilities, third-party tools, coordination requirements |
| [ ] **Pre-Mortem**    | Integration complexity, performance risks, maintenance overhead     |

## Problem Statement

### Technical Problem

```
When [user] tries to [task], they encounter [limitation]
because [underlying technical cause], which blocks [desired capability].
```

### Current Pain

- **Symptom**: [What users work around]
- **Root Cause**: [Technical reason this pain exists]
- **Impact**: [How this affects workflow]

## Solution Design

### Technical Solution

```
Implement [technical solution] that enables [user] to [new capability]
through [interaction pattern], resulting in [improved workflow].
```

### Technical Architecture

[Include component interactions, data flow, and implementation approach]

## Expected Outcome

### Technical Capability

```
The system will provide [specific technical capability] enabling [user] to [new workflow]
through [technical implementation], resolving [current technical limitation].
```

### Evidence of Success (BDD Tests)

- [ ] `Technical Capability: [New technical function works correctly]`
- [ ] `Integration: [Integrates properly with existing systems]`
- [ ] `User Workflow: [Users can use the capability as intended]`

## End-to-End Tests

Complete technical integration test that provides irrefutable evidence the Technical Outcome is achieved:

```typescript
// E2E test
import { describe, it, expect } from "vitest";
import { execa } from "execa";

describe("Capability: [Name]", () => {
  it("GIVEN [precondition] WHEN [action] THEN [outcome]", async () => {
    // Given
    const projectDir = "tests/fixtures/sample-project";

    // When
    const { exitCode, stdout } = await execa("npx", ["your-cli", "command"], { cwd: projectDir });

    // Then
    expect(exitCode).toBe(0);
    expect(stdout).toContain("expected output");
  });
});
```

## Dependencies

### Work Item Dependencies

- [ ] Requires completion of `specs/doing/{capability-slug}/{feature-slug}`

### Technical Dependencies

- [ ] **Required Tools**: Hugo, Caddy, Node.js
- [ ] **npm Packages**: @lhci/cli, commander, zod

## Pre-Mortem Analysis

### Assumption: [Risk scenario]

- **Likelihood**: Medium
- **Impact**: High
- **Mitigation**: [How to address if it happens]
