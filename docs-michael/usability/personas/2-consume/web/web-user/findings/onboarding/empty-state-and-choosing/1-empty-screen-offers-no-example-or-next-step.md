---

# Empty screen offers no example or next step

*Concern: Empty States & Choosing a Mode*

---

## The problem today

An empty conversation shows a blank input. `WelcomeBubble` exists but its content isn't discoverable without reading code.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user opens an empty screen"]):::plain
    MID(["a blank input gives no direction"]):::plain
    START --> MID
    MID -->|"reason: no example tasks are offered"| OUT(["The user doesn't know what to ask"]):::fail
    OUT --> DONE(["stares at an empty box"]):::fail
```

---

## The proposed fix

Show 3–5 example tasks tailored to the active mode, a prompt chip that fills the input on click, and a "What can I do?" capability overview.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user opens an empty screen"]):::plain
    MID(["example tasks and a capability link guide them"]):::plain
    START --> MID
    MID -->|"reason: tailored suggestions fill the input"| OUT(["The user knows what to try"]):::fix
    OUT --> DONE(["starts their first task"]):::ok
```
