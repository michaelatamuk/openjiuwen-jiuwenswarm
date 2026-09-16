---

# Headless installs silently become Chinese installs

*Concern: Startup & Configuration*

---

## The problem today

When stdin is not a TTY, the prompt language defaults to `zh` and only a log line records it. Docker, CI and provisioning therefore silently produce a Chinese UI, with no flag to avoid it.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A headless install runs (no TTY)"]):::plain
    MID(["language silently defaults to zh"]):::plain
    START --> MID
    MID -->|"reason: no --lang flag or locale detection"| OUT(["Docker/CI ship a Chinese UI"]):::fail
    OUT --> DONE(["the operator can't opt out"]):::fail
```

---

## The proposed fix

If stdin is not a TTY, default to English (or to the system locale), and add a `--lang` flag plus a `JIUWEN_LANG` env var. Print the chosen language explicitly so headless logs make it obvious.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A headless install runs (no TTY)"]):::plain
    MID(["language is explicit (flag/env/locale)"]):::plain
    START --> MID
    MID -->|"reason: non-TTY defaults to English"| OUT(["The chosen language is printed"]):::fix
    OUT --> DONE(["the operator controls the UI language"]):::ok
```
