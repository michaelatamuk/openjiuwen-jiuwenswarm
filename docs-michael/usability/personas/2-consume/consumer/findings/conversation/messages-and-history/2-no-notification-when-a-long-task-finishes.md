---

# No notification when a long task finishes

*Concern: Messages, History & Notifications*

---

## The problem today

For tasks that take minutes, the user must keep the Web UI open and watch. There is no desktop notification, sound, badge, or message-to-self when the task completes — only in-app toasts.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User starts a long task"]):::plain
    MID(["they must keep the tab open and watch"]):::plain
    START --> MID
    MID -->|"reason: no notification fires on completion"| OUT(["User leaves and misses the result"]):::fail
    OUT --> DONE(["returns to find it done hours ago, unaware"]):::fail
```

---

## The proposed fix

- **Browser notification:** on task complete, fire a Web Notifications API notification: "Invoice parsing complete — 3 files processed."
- **Sound:** an optional, user-configurable completion sound.
- **Tab badge:** set the page title to show unread results: "(✓) jiuwenswarm".
- **Channel self-message:** option to send the result summary to the user's own Feishu/Telegram account.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["User starts a long task"]):::plain
    MID(["the tab/browser/channel notifies on completion"]):::plain
    START --> MID
    MID -->|"reason: a notification is sent when the task finishes"| OUT(["User is told the moment it's done"]):::fix
    OUT --> DONE(["can act on the result without watching"]):::ok
```
