---

# Tool calls show what ran but not why

*Concern: Agent Explanation*

---

## The problem today

`ToolCallDisplay.tsx` shows the tool name, arguments (expandable), success/failure, and a short description when one is set. What it does not show is the *reason* the agent chose this tool. So the user sees `read_file("/data/invoices/inv_001.pdf")` (and its description) but not why the agent read it.

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent calls a tool"]):::plain
    MID(["the UI shows the tool name but not the reason"]):::plain
    START --> MID
    MID -->|"reason: the schema description field is never displayed"| OUT(["User sees what ran but not why"]):::fail
    OUT --> DONE(["can't judge whether the call was sensible"]):::fail
```

---

## The proposed fix

Show a one-sentence rationale before each tool call, from the agent's reasoning or synthesized from the thinking trace:

```
Reading the invoice file to extract the vendor and amount fields.
> read_file("/data/invoices/inv_001.pdf")   ✓  (140ms)
```

For tool errors, show what the agent will try next:

```
> glob("/data/invoices/*.pdf")   ✗  Directory not found
  Agent will check if /data/invoices exists before retrying.
```

```mermaid
flowchart TD
    classDef fail  fill:#FFCDD2,color:#1a1a1a,stroke:#C62828
    classDef ok    fill:#BBDEFB,color:#1a1a1a,stroke:#1565C0
    classDef fix   fill:#C8E6C9,color:#1a1a1a,stroke:#2E7D32
    classDef plain fill:#ECEFF1,color:#1a1a1a,stroke:#607D8B
    START(["The agent calls a tool"]):::plain
    MID(["a one-line reason precedes each tool call"]):::plain
    START --> MID
    MID -->|"reason: the displayed description explains the choice"| OUT(["User sees why the tool was chosen"]):::fix
    OUT --> DONE(["can trust and can catch bad calls"]):::ok
```
