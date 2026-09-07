[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No single command to gather diagnostics for a bug report

*Concern: Diagnostics & Support*

---

## The problem today

When something goes wrong there is no tool to collect diagnostics; the user must know where logs live, which directory, and which log level to set.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Something goes wrong"]):::plain
    MID(["there is no way to gather diagnostics"]):::plain
    START --> MID
    MID -->|"reason: diagnostics require manual log knowledge"| OUT(["The user can't produce a useful report"]):::fail
    OUT --> DONE(["reports vague info to support"]):::fail
```

---

## The proposed fix

A `jiuwenswarm diagnostics` command that collects the last 100 lines of each log, the config (keys redacted), and system info, writes `jiuwenswarm-diagnostics-YYYY-MM-DD.txt`, and says "Share this file when reporting an issue." Runnable remotely (SSH) and includes channel-specific logs.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["Something goes wrong"]):::plain
    MID(["one command gathers a diagnostics file"]):::plain
    START --> MID
    MID -->|"reason: `jiuwenswarm diagnostics` packages everything"| OUT(["The user has a complete report to share"]):::fix
    OUT --> DONE(["support can actually diagnose it"]):::ok
```

Concern: [Diagnostics & Support](README.md).
