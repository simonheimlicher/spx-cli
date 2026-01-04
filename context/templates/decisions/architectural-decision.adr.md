# ADR: [Decision Title]

## Problem

[What architectural decision needs to be made? What question are we answering?]

## Options Considered

### Option 1: [Name]

[Brief description of this approach - 1-3 sentences]

### Option 2: [Name]

[Brief description of this approach - 1-3 sentences]

### Option 3: [Name] (if applicable)

[Brief description of this approach - 1-3 sentences]

## Decision

**We will use [chosen option].**

## Rationale

[Why did we choose this option? What factors were decisive? This should be the actual reasoning, not a manufactured list of pros/cons. Reference specific constraints or requirements that made this the right choice.]

## Trade-offs Accepted

- [What downside are we accepting, and why is it acceptable?]
- [What did we give up by not choosing an alternative?]

## Testing Strategy

> **Required**: Every ADR must specify how the decision will be tested.
> See `context/4-testing-standards.md` for level definitions.

### Level Assignment

| Component              | Level | Justification                          |
| ---------------------- | ----- | -------------------------------------- |
| [Affected component 1] | 1     | [Why this level is minimum sufficient] |
| [Affected component 2] | 2     | [Why this level is minimum sufficient] |

### Escalation Rationale

- **1 → 2**: [What confidence does Level 2 add that Level 1 cannot provide?]
- **2 → 3**: [What confidence does Level 3 add that Level 2 cannot provide?]

### Key Behaviors to Verify

1. [Behavior that proves this decision works correctly]
2. [Error handling behavior]
3. [Edge case behavior]

## Constraints

[Any implementation constraints this decision imposes on the codebase]
