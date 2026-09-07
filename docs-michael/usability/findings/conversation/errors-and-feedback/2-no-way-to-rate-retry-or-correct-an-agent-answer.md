[← Index](../../../README.md) · jiuwenswarm Usability Review

---

# No way to rate, retry or correct an agent answer

*Concern: Errors & Feedback*

---

## The problem today

The only feedback mechanism found is on `ProactiveRecommendationCard` (thumbs up/down for skill recommendations, stored in localStorage). There is no feedback on ordinary assistant messages: no thumbs down, no "regenerate", no "that was wrong", no inline correction.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant A as Agent
    U->>A: ask a question
    A-->>U: gives a wrong or unhelpful answer
    U->>A: re-type the whole ask differently
    A-->>U: gives another answer, still unreviewable
    U->>U: cannot tell the agent it was wrong
```

---

## The proposed fix

Give every assistant message a lightweight way to react and correct:

- A 👍/👎 and "retry" row that regenerates the last response.
- Thumbs-down optionally opens a micro-form: "Wrong facts" / "Too long" / "Didn't follow my instruction" / "Other" — two taps, no typing.
- A "correct this" mode to edit the agent's answer inline and mark that edit as the session's ground truth.
- Corrections feed back into the session context so the agent adjusts without the user re-explaining.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant A as Agent
    U->>A: ask a question
    A-->>U: gives an answer
    U->>U: marks 👎 + "Wrong facts" (two taps)
    U->>A: "retry" / inline correction sent as ground truth
    A-->>U: improved answer, remembers for the session
    U->>U: agent adjusted without re-typing the ask
```

Concern: [Errors & Feedback](README.md).
