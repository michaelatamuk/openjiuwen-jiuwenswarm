---

# Marketplace shows no ratings, usage or freshness

*Concern: Skill Marketplace*

---

## The problem today

`MarketplacePage.tsx` cards show logo, name, status, install — no ratings, usage, author reputation, or last-updated date, so users can't judge quality before installing.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user browses the marketplace"]):::plain
    MID(["no quality signals are shown"]):::plain
    START --> MID
    MID -->|"reason: cards lack ratings/usage/freshness"| OUT(["The user can't judge a skill"]):::fail
    OUT --> DONE(["installs blindly or avoids it"]):::fail
```

---

## The proposed fix

On each card: star rating, install count, last-updated date, an author verified badge, a one-paragraph description, and a preview of the SKILL.md.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user browses the marketplace"]):::plain
    MID(["quality signals are shown on each card"]):::plain
    START --> MID
    MID -->|"reason: ratings/usage/freshness are visible"| OUT(["The user can judge a skill"]):::fix
    OUT --> DONE(["installs with confidence"]):::ok
```
