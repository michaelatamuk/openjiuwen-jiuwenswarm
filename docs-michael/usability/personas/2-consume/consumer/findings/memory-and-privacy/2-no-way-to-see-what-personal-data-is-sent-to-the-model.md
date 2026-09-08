---

# No way to see what personal data is sent to the model

*Concern: Memory Visibility*

---

## The problem today

The full prompt sent to the model — memory snapshot, skills, history, system sections — is invisible. The user cannot audit what personal data is sent to an external API.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The user sends a message"]):::plain
    MID(["the assembled prompt goes out unseen"]):::plain
    START --> MID
    MID -->|"reason: the prompt is not inspectable"| OUT(["The user can't audit what data was sent"]):::fail
    OUT --> DONE(["personal data may leave without consent"]):::fail
```

---

## The proposed fix

A "What's in the prompt?" inspector (ⓘ on the model indicator) summarising the current prompt: token count, which sections are included, and whether memory/skills are attached — so the user sees that their `USER.md` is included before consenting to an external model.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The user sends a message"]):::plain
    MID(["a 'What's in the prompt?' inspector shows sections"]):::plain
    START --> MID
    MID -->|"reason: the prompt is inspectable before sending"| OUT(["The user sees what data would go out"]):::fix
    OUT --> DONE(["can consent (or withhold) knowingly"]):::ok
```
