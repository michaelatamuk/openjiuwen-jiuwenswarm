[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Core actions have no keyboard shortcuts

*Concern: Accessibility & Keyboard*

---

## The problem today

No documented shortcuts; only `Enter` submits. New conversation, stop, switch mode, open settings, and focus input have no keyboard access.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A keyboard user wants a core action"]):::plain
    MID(["no shortcut exists for it"]):::plain
    START --> MID
    MID -->|"reason: core actions lack keybindings"| OUT(["They must click through every time"]):::fail
    OUT --> DONE(["frequent actions are slow"]):::fail
```

---

## The proposed fix

A keybinding layer: `Ctrl/Cmd+K` new conversation, `Escape` stop, `Ctrl/Cmd+/` palette, `Ctrl/Cmd+,` settings, arrow keys in the session list — and a `?` overlay.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A keyboard user wants a core action"]):::plain
    MID(["a shortcut triggers it"]):::plain
    START --> MID
    MID -->|"reason: core actions have keybindings"| OUT(["They act without the mouse"]):::fix
    OUT --> DONE(["frequent actions are fast"]):::ok
```

Concern: [Accessibility & Keyboard](README.md).
