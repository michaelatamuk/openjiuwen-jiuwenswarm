[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No way to rate, retry or correct an agent answer

*Concern: Errors & Feedback*

---

## The problem today

The only feedback mechanism found is on `ProactiveRecommendationCard` (thumbs up/down for skill recommendations, stored in localStorage). There is no feedback on ordinary assistant messages: no thumbs down, no "regenerate", no "that was wrong", no inline correction.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B

    START(["The agent gives an answer"]):::plain
    WRONG(["The answer is wrong or unhelpful"]):::plain

    START --> WRONG
    WRONG -->|"reason: no 👍/👎, no 'regenerate',
    no 'that was wrong', no inline edit"| RETYPE(["The user must
    re-type the whole request"]):::fail
    RETYPE --> DEAD(["Agent gives another answer the user still
    can't correct; it learns nothing"]):::fail
```

---

## The proposed fix

Give every assistant message a lightweight way to react and correct:

- A 👍/👎 and "retry" row that regenerates the last response.
- Thumbs-down optionally opens a micro-form: "Wrong facts" / "Too long" / "Didn't follow my instruction" / "Other" — two taps, no typing.
- A "correct this" mode to edit the agent's answer inline and mark that edit as the session's ground truth.
- Corrections feed back into the session context so the agent adjusts without the user re-explaining.

```mermaid
flowchart TD
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B

    START(["The agent gives an answer"]):::plain
    WRONG(["The answer is wrong or unhelpful"]):::plain

    START --> WRONG
    WRONG -->|"reason: a 👍/👎 + 'retry' + inline-correct
    row on every message"| MARK(["User taps 👎 'Wrong facts',
    retries or corrects inline"]):::fix
    MARK --> DONE(["Agent regenerates an improved answer
    and remembers the correction"]):::ok
```

Concern: [Errors & Feedback](README.md).
