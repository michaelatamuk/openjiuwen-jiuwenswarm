[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# Destructive external actions fire without confirmation

*Concern: Approval & Preview*

---

## The problem today

The agent can send messages to Feishu groups, publish to external APIs, and call webhooks — all without a confirmation step. Permissions can block tools entirely, but cannot require per-call confirmation for sensitive actions.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent calls an external service"]):::plain
    MID(["the send fires with no confirmation"]):::plain
    START --> MID
    MID -->|"reason: permissions can't require per-call approval"| OUT(["A group message or webhook goes out unreviewed"]):::fail
    OUT --> DONE(["a mistake is broadcast to many people"]):::fail
```

---

## The proposed fix

A "confirm before send" mode for external-impact tools. Before `send_feishu_message` or any external webhook, show the message content with Confirm / Edit / Cancel — essential for group messages where mistakes are visible to many.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent calls an external service"]):::plain
    MID(["the content is shown with Confirm / Edit / Cancel"]):::plain
    START --> MID
    MID -->|"reason: sensitive actions require per-call approval"| OUT(["The user reviews what will be sent"]):::fix
    OUT --> DONE(["only confirmed actions go out"]):::ok
```

Concern: [Approval & Preview](README.md).
