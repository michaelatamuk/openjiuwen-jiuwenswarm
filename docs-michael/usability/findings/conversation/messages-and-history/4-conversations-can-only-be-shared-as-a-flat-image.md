[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Conversations can only be shared as a flat image

*Concern: Messages, History & Notifications*

---

## The problem today

`shareImageExport.tsx` converts the chat to a PNG image — the only sharing mechanism. There is no way to share a conversation as a link, Markdown, or JSON that someone could import.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User wants to share a conversation"]):::plain
    MID(["the only option is a PNG screenshot"]):::plain
    START --> MID
    MID -->|"reason: there is no link / Markdown / JSON export"| OUT(["The recipient gets a flat image they can't reuse"]):::fail
    OUT --> DONE(["cannot import or continue the conversation"]):::fail
```

---

## The proposed fix

- **Export as Markdown** (turns formatted as `**User:** / **Agent:**`).
- **Export as JSON** (full structured conversation for importing elsewhere).
- **Share link** (if the instance has a public URL).

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User wants to share a conversation"]):::plain
    MID(["they can export Markdown, JSON, or a share link"]):::plain
    START --> MID
    MID -->|"reason: structured exports and links exist"| OUT(["The recipient gets a reusable conversation"]):::fix
    OUT --> DONE(["can read it or import it and continue"]):::ok
```

Concern: [Messages, History & Notifications](README.md).
