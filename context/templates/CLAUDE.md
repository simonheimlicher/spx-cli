# Templates Directory

Templates for creating requirements, decisions, and work items.

**For concepts and workflow:** See [../1-structure.md](../1-structure.md) and [../2-workflow.md](../2-workflow.md)

---

## Available Templates

```
templates/
├── requirements/
│   └── technical-change.trd.md           # Technical requirements (vision)
├── decisions/
│   └── architectural-decision.adr.md     # Architecture decisions (constraints)
└── work-items/
    ├── capability-name.capability.md     # E2E test scenarios
    ├── feature-name.feature.md           # Integration test scenarios
    ├── story-name.story.md               # Implementation steps
    └── DONE.md                           # Completion evidence
```

---

## Quick Reference

| Need to...                 | Use Template                               |
| -------------------------- | ------------------------------------------ |
| Capture technical vision   | `requirements/technical-change.trd.md`     |
| Make architecture decision | `decisions/architectural-decision.adr.md`  |
| Define E2E capability      | `work-items/capability-name.capability.md` |
| Define feature integration | `work-items/feature-name.feature.md`       |
| Define implementation step | `work-items/story-name.story.md`           |
| Mark work item complete    | `work-items/DONE.md`                       |

---

## Naming Conventions

See [../1-structure.md](../1-structure.md) for directory layout and BSP numbering.

| Type       | Pattern                   | Example                           |
| ---------- | ------------------------- | --------------------------------- |
| Capability | `capability-{NN}_{slug}/` | `capability-32_core-cli/`         |
| Feature    | `feature-{NN}_{slug}/`    | `feature-32_existing-scripts/`    |
| Story      | `story-{NN}_{slug}/`      | `story-32_migrate-lhci-script/`   |
| ADR        | `adr-{NNN}_{slug}.md`     | `adr-001_project-architecture.md` |
