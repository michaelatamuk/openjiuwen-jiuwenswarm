---

# No way to know the agent's state without opening the window

*Concern: History & Notifications*

---

## The problem today

The desktop app has no tray state glyph and no native toast when a background task finishes or fails while the window is closed.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A background task finishes or fails"]):::plain
    MID(["the window is closed"]):::plain
    START --> MID
    MID -->|"reason: no tray glyph or toast exists"| OUT(["The user doesn't find out"]):::fail
    OUT --> DONE(["results and failures go unnoticed"]):::fail
```

---

## The proposed fix

Add a tray state glyph (idle / working / needs-attention) and native OS notifications on task completion or failure, deep-linking into the relevant session when clicked.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A background task finishes or fails"]):::plain
    MID(["the tray glyph changes and a toast fires"]):::plain
    START --> MID
    MID -->|"reason: state and completion events reach the OS"| OUT(["The user is notified with the window closed"]):::fix
    OUT --> DONE(["click-through opens the session"]):::ok
```
