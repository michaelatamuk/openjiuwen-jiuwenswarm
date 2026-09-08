---

# The UI can't be driven fully by keyboard

*Concern: Accessibility & Keyboard*

---

## The problem today

Tab focus, arrow-key list navigation, and keyboard activation aren't verified. `shadcn/ui` + `lucide-react` support a11y, but it needs discipline in consuming components.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user relies on the keyboard"]):::plain
    MID(["some elements can't be reached or activated"]):::plain
    START --> MID
    MID -->|"reason: no verified keyboard support exists"| OUT(["Keyboard-only users get stuck"]):::fail
    OUT --> DONE(["interactive elements are out of reach"]):::fail
```

---

## The proposed fix

Every interactive element — session items, skill cards, toggles, tool-call buttons — reachable and operable by keyboard, with visible focus and arrow-key navigation in `ConversationSidebar`.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user relies on the keyboard"]):::plain
    MID(["every element is reachable and operable"]):::plain
    START --> MID
    MID -->|"reason: keyboard support is verified"| OUT(["Keyboard-only users can do everything"]):::fix
    OUT --> DONE(["the whole UI is reachable"]):::ok
```
