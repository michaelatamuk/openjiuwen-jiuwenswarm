[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Logs and config mix languages unpredictably

*Concern: Running & Managing the Instance*

---

## The problem today

Error messages, log strings, and config comments mix Chinese and English unpredictably, so an operator reading logs can't predict the language.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator reads the logs"]):::plain
    MID(["lines mix Chinese and English"]):::plain
    START --> MID
    MID -->|"reason: no consistent language for logs"| OUT(["The operator can't reliably parse them"]):::fail
    OUT --> DONE(["log language surprises them"]):::fail
```

---

## The proposed fix

All operator-facing logs (WARNING+), CLI output, and errors are English unconditionally; user-facing chat respects `preferred_response_language`; config comments are provided as `config.zh.yaml` / `config.en.yaml` templates.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator reads the logs"]):::plain
    MID(["operator logs are always English"]):::plain
    START --> MID
    MID -->|"reason: a language rule is enforced"| OUT(["The operator can parse logs reliably"]):::fix
    OUT --> DONE(["chat still honours the user's language"]):::ok
```

Concern: [Running & Managing the Instance](README.md).
