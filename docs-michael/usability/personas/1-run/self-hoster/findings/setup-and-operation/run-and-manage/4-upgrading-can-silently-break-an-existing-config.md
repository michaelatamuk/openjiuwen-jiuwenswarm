---

# Upgrading can silently break an existing config

*Concern: Running & Managing the Instance*

---

## The problem today

`pip install --upgrade jiuwenswarm` has no config version, no migration, and no breaking-change changelog — an old config may silently break after upgrade.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator upgrades jiuwenswarm"]):::plain
    MID(["an old config may be incompatible"]):::plain
    START --> MID
    MID -->|"reason: no version or migration system exists"| OUT(["Startup breaks after the upgrade"]):::fail
    OUT --> DONE(["the operator can't tell what changed"]):::fail
```

---

## The proposed fix

A `jiuwenswarm_config_version`; on startup, if the config is older, print a migration guide or auto-migrate with a backup; and a changelog section for config-breaking changes.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["An operator upgrades jiuwenswarm"]):::plain
    MID(["an older config is detected and migrated"]):::plain
    START --> MID
    MID -->|"reason: config version + backup exist"| OUT(["The upgrade migrates cleanly"]):::fix
    OUT --> DONE(["the operator sees exactly what changed"]):::ok
```
