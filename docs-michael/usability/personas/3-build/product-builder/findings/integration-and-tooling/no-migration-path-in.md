---

# No migration/import path from an existing agent setup

*Concern: Integration & Tooling*

---

## The problem today

jiuwenswarm runs Claude Code and Codex as managed runtimes but never reads their existing files (`CLAUDE.md`, `AGENTS.md`, MCP servers) to help a builder import their setup.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A builder already has a Claude/Codex setup"]):::plain
    MID(["jiuwenswarm runs those runtimes but ignores their files"]):::plain
    START --> MID
    MID -->|"reason: no import path reads existing config"| OUT(["They rebuild everything by hand"]):::fail
    OUT --> DONE(["adoption costs a full re-setup"]):::fail
```

---

## The proposed fix

Add an `import` command that scans for `CLAUDE.md`, `AGENTS.md`, and MCP server definitions, maps them onto jiuwenswarm prompts, memory and MCP config, and produces a reviewed diff before applying.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A builder already has a Claude/Codex setup"]):::plain
    MID(["an import command reads those files and maps them"]):::plain
    START --> MID
    MID -->|"reason: existing config is translated to jiuwenswarm"| OUT(["The builder reviews and applies a diff"]):::fix
    OUT --> DONE(["they start from their working setup"]):::ok
```
