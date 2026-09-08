---

# Running the CLI without config gives no next step

*Concern: First Run*

---

## The problem today

Running `jiuwenswarm` from the terminal with no config gives an unclear error, and `--help` doesn't walk through what to do first.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user runs jiuwenswarm with no config"]):::plain
    MID(["an unclear error is shown"]):::plain
    START --> MID
    MID -->|"reason: no guided first-step output exists"| OUT(["The user doesn't know the next step"]):::fail
    OUT --> DONE(["they stall at the terminal"]):::fail
```

---

## The proposed fix

Tell the user plainly: "No config found — run `jiuwenswarm-init`, then `jiuwenswarm-start`", and have `jiuwenswarm-init` prompt for the minimum required config (provider, API key) before exiting.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user runs jiuwenswarm with no config"]):::plain
    MID(["it tells them exactly what to run next"]):::plain
    START --> MID
    MID -->|"reason: a clear next-step message exists"| OUT(["The user knows the path forward"]):::fix
    OUT --> DONE(["they proceed through init"]):::ok
```
