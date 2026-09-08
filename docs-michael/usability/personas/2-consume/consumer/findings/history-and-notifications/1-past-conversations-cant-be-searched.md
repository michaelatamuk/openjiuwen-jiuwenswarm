---

# Past conversations can't be searched

*Concern: Messages, History & Notifications*

---

## The problem today

`ConversationSidebar.tsx` shows sessions grouped by project with rename, delete, and pin — but no search. Finding a specific past conversation means scrolling through every session.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User wants to revisit a past conversation"]):::plain
    MID(["there is no search box"]):::plain
    START --> MID
    MID -->|"reason: the sidebar only offers scrolling"| OUT(["User can't locate an old conversation"]):::fail
    OUT --> DONE(["gives up or scrolls endlessly"]):::fail
```

---

## The proposed fix

A search box at the top of the conversation sidebar that searches across session titles and message content. Results highlight the matching message and jump to it — table-stakes for any chat product.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User wants to revisit a past conversation"]):::plain
    MID(["a search box searches titles and content"]):::plain
    START --> MID
    MID -->|"reason: results highlight and jump to the match"| OUT(["User finds the old conversation quickly"]):::fix
    OUT --> DONE(["gets back to it and moves on"]):::ok
```
