# ADR: Session Timestamp Format

## Problem

Session files need unique, sortable identifiers. The current `/pickup` and `/handoff` skills use ISO 8601 Zulu format (`YYYY-MM-DDTHHMMSSZ`) which is technically correct but hard to read and parse visually.

## Context

- **Business**: Users see session IDs in CLI output. Readable timestamps reduce cognitive load.
- **Technical**: Filenames must be filesystem-safe (no colons), sortable alphabetically, and unique per second.

## Decision

**Use `YYYY-MM-DD_HH-mm-ss` format for session timestamps/IDs.**

Examples:

- `2026-01-13_08-01-05.md` (session created at 8:01:05 AM)
- `2026-01-13_14-23-47.md` (session created at 2:23:47 PM)

## Rationale

**Alternatives considered:**

1. **ISO 8601 Zulu format** (`2026-01-13T080105Z`)
   - Rejected: Hard to read, `T` and `Z` add noise, no visual separation

2. **Unix timestamp** (`1736764865.md`)
   - Rejected: Not human-readable at all

3. **UUID v7** (time-ordered UUID)
   - Rejected: Over-engineering, timestamps are sufficient, harder to debug

4. **ISO 8601 with colons** (`2026-01-13T08:01:05`)
   - Rejected: Colons are invalid in Windows filenames

**Why `YYYY-MM-DD_HH-mm-ss`:**

- **Human-readable**: Date and time clearly separated and recognizable
- **Filesystem-safe**: No colons, slashes, or special characters
- **Alphabetically sortable**: Lexicographic order matches chronological order
- **Familiar**: Similar to common log file naming conventions
- **Parseable**: Simple regex `(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})`
- **Unique per second**: Sufficient for single-user session creation

## Trade-offs Accepted

- **No timezone indicator**: Format assumes local time display
  - Mitigation: Store ISO 8601 with timezone in YAML front matter `created_at` field
- **Second granularity only**: Cannot distinguish sessions created in same second
  - Mitigation: Acceptable for manual session creation; add milliseconds if needed later
- **Migration required**: Existing files use different format
  - Mitigation: Migration handled by [Session Directory Structure](adr-21_session-directory-structure.md)

## Testing Strategy

### Level Coverage

| Level    | Question Answered                              | Scope                               |
| -------- | ---------------------------------------------- | ----------------------------------- |
| 1 (Unit) | Can we generate and parse timestamps reliably? | Format generation, parsing, sorting |

### Behaviors Verified

**Level 1 (Unit):**

- `generateSessionId()` produces `YYYY-MM-DD_HH-mm-ss` format
- `parseSessionId(id)` extracts Date object from valid format
- `parseSessionId(id)` returns null/throws for invalid formats
- Alphabetical sort of session IDs matches chronological order
- Session ID from `date +"%Y-%m-%d_%H-%M-%S"` is parseable

## Validation

### How to Recognize Compliance

You're following this decision if:

- Session filenames match pattern `YYYY-MM-DD_HH-mm-ss.md`
- CLI list output shows timestamps in this format
- Session IDs are generated using `date +"%Y-%m-%d_%H-%M-%S"` equivalent

### MUST

- Use underscores to separate date from time (`_`)
- Use hyphens within date and time components (`-`)
- Use 24-hour format for time
- Pad all components with leading zeros (e.g., `08-01-05` not `8-1-5`)

### NEVER

- Use colons in filenames (Windows incompatible)
- Use `T` or `Z` suffixes (ISO 8601 noise)
- Omit leading zeros (breaks sorting)
- Include timezone in filename (store in YAML instead)
