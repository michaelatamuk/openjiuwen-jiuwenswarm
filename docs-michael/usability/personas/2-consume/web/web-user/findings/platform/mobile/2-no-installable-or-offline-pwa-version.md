---

# No installable or offline (PWA) version

*Concern: Mobile & Cross-Device*

---

## The problem today

The Web UI is a standard SPA — no manifest, no service worker, no offline or install-to-homescreen support.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants the app on their homescreen"]):::plain
    MID(["it can't be installed or used offline"]):::plain
    START --> MID
    MID -->|"reason: no PWA manifest/service worker"| OUT(["The user must keep the tab"]):::fail
    OUT --> DONE(["no offline or install support"]):::fail
```

---

## The proposed fix

A PWA manifest to install to the homescreen, a service worker for offline reads and queued sends, and push for task completion.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["A user wants the app on their homescreen"]):::plain
    MID(["they can install it and read offline"]):::plain
    START --> MID
    MID -->|"reason: a PWA + service worker exist"| OUT(["The app is on their homescreen"]):::fix
    OUT --> DONE(["works offline and can push"]):::ok
```
