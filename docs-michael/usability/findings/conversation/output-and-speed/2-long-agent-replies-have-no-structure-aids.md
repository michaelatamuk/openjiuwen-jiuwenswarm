[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Long agent replies have no structure aids

*Concern: Output & Perceived Speed*

---

## The problem today

`StreamingContent.tsx` renders text with a simple whitespace-preserving display. Long multi-section agent responses have no table of contents, no jump-to-section, and no folding.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent returns a long reply"]):::plain
    MID(["the text has no TOC or section navigation"]):::plain
    START --> MID
    MID -->|"reason: long output is rendered as one flat wall"| OUT(["User scrolls a long reply to find a section"]):::fail
    OUT --> DONE(["loses their place in the answer"]):::fail
```

---

## The proposed fix

Auto-detect headers in agent output (`## Section`) and render a sticky mini-TOC at the top of the message panel for long responses, with collapsible sections for code blocks and long reasoning.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent returns a long reply"]):::plain
    MID(["a sticky mini-TOC lists the sections"]):::plain
    START --> MID
    MID -->|"reason: headers are auto-detected into a TOC"| OUT(["User jumps straight to the section they need"]):::fix
    OUT --> DONE(["reads the reply without losing the thread"]):::ok
```

Concern: [Output & Perceived Speed](README.md).
