# Above the agentic platform — a working map

The agentic platform (agents, tools, memory, multi-agent) is a black box. Everything built on top of it sits in one of **five planes**: four describe what you **operate**, and one — **Extend** — is what you **build**. This is a map for gathering information, not a decision.

## Map of this document

- [The five planes at a glance](#the-five-planes-at-a-glance)
- [Where the value is](#where-the-value-is)
- [Business lens](#business-lens)
- [Plane 1 · Control](#plane-1--control)
- [Plane 2 · Trust](#plane-2--trust)
- [Plane 3 · Data](#plane-3--data)
- [Plane 4 · Product](#plane-4--product)
- [Plane 5 · Extend](#plane-5--extend)

## The five planes at a glance

| Plane | What it is | Who plays / buys | Defensibility |
|---|---|---|---|
| **1 · Control** | runs agents reliably, cheaply, and at scale | platform / IT teams | Low — commoditizes fast |
| **2 · Trust** | makes agents observable, safe, auditable, compliant | enterprises, risk & compliance, regulators | High — hard to fake |
| **3 · Data** | makes agents know your business | the business itself | Sticky — compounds with use |
| **4 · Product** | turns agents into products, services, and revenue | end customers and businesses | Where the money is |
| **5 · Extend** | builds the parts that plug into the platform | developers and research teams | Your own work — what we build |

## Where the value is

```mermaid
quadrantChart
  title The five planes — where the value is
  x-axis "Commodity — anyone can" --> "Defensible — hard to copy"
  y-axis "Enabler — indirect value" --> "Business outcome — direct value"
  quadrant-1 "Defensible + outcome = the moat"
  quadrant-2 "Useful, but easy to copy"
  quadrant-3 "Commodity floor — buy, don't build"
  quadrant-4 "Differentiated enabler"
  "1 Control": [0.30, 0.40]
  "5 Extend": [0.55, 0.38]
  "3 Data": [0.58, 0.55]
  "2 Trust": [0.62, 0.72]
  "4 Product": [0.82, 0.88]
```

Control is the floor. Data compounds. Trust is what enterprises demand. Product is where revenue lives. Extend is where the building happens.

## Business lens

The planes describe what exists and what we'd build. These four questions apply to every plane.

- **Who** — who builds it, who runs it, who must adopt it (people, roles, org, change).
- **Who else** — who is already here: incumbents, startups, open source; where the whitespace is.
- **How much** — unit economics, cost to enter, ROI and payback.
- **How fast** — time-to-value, and dependency / lock-in risk.

## Plane 1 · Control

- **What it is:** runs agents reliably, cheaply, and at scale.
- **Who plays / buys:** platform and IT teams.
- **Why it matters:** table stakes — nothing runs without it, but it commoditizes fast.

```mermaid
block-beta
  columns 3
  C1["deployment & rollout"]:3
  c1["release & roll back"] c2["versioning"] c3["canary / gradual"]
  C2["orchestration"]:3
  c4["multi-agent coordination"] c5["long-running work"] c6["scheduling"]
  C3["integration"]:3
  c7["email / CRM / ERP"] c8["internal tools"] c9["data sources"]
  C4["cost & capacity"]:3
  c10["spend control"] c11["speed & latency"] c12["scaling"]
  style C1 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style C2 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style C3 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style C4 fill:#e3f2fd,stroke:#0d47a1,color:#000000
```

**Open questions**
- Which parts can we buy, and which must we build?
- What are the real cost and latency drivers at scale?
- Who owns this today, inside and outside the org?

## Plane 2 · Trust

- **What it is:** makes agents observable, safe, auditable, compliant.
- **Who plays / buys:** enterprises, risk & compliance, regulators.
- **Why it matters:** the defensible layer; required to sell into enterprises.

```mermaid
block-beta
  columns 3
  C1["monitoring & evaluation"]:3
  c1["what agents do"] c2["whether it works"] c3["quality checks"]
  C2["policy & safety"]:3
  c4["rules & guardrails"] c5["approvals"] c6["limits"]
  C3["audit & provenance"]:3
  c7["who / what / when"] c8["data lineage"] c9["on whose behalf"]
  C4["compliance & regulation"]:3
  c10["legal requirements"] c11["industry rules"] c12["reporting"]
  style C1 fill:#ffebee,stroke:#b71c1c,color:#000000
  style C2 fill:#ffebee,stroke:#b71c1c,color:#000000
  style C3 fill:#ffebee,stroke:#b71c1c,color:#000000
  style C4 fill:#ffebee,stroke:#b71c1c,color:#000000
```

**Open questions**
- Which compliance regimes actually apply to us?
- What can we prove today, and what can't we yet?
- Who holds the budget here — risk, compliance, or security?

## Plane 3 · Data

- **What it is:** makes agents know your business.
- **Who plays / buys:** the business itself; data and product owners.
- **Why it matters:** sticky — it compounds with use and is costly to switch away from.

```mermaid
block-beta
  columns 3
  C1["memory"]:3
  c1["short-term"] c2["long-term"] c3["preferences"]
  C2["business knowledge"]:3
  c4["documents"] c5["facts"] c6["domain know-how"]
  C3["context & personalization"]:3
  c7["user / account"] c8["situation"] c9["history"]
  style C1 fill:#ede7f6,stroke:#4a148c,color:#000000
  style C2 fill:#ede7f6,stroke:#4a148c,color:#000000
  style C3 fill:#ede7f6,stroke:#4a148c,color:#000000
```

**Open questions**
- Who owns the data, and under what privacy and permission constraints?
- What knowledge is hardest for competitors to replicate?
- What switching cost could we create?

## Plane 4 · Product

- **What it is:** turns agents into products, services, and revenue.
- **Who plays / buys:** end customers and businesses.
- **Why it matters:** where the money is — and where competition is fiercest.

```mermaid
block-beta
  columns 5
  C1["human interfaces"]:5
  c1["chat"] c2["voice"] c3["desktop"] c4["mobile"] c5["physical / robotic"]
  C2["vertical products"]:5
  c6["industry apps"] c7["job-to-be-done"] c8["agent teams"] space space
  C3["agent-to-agent workflows"]:5
  c9["build agents"] c10["run agents"] c11["improve agents"] space space
  C4["marketplace & monetization"]:5
  c12["distribution"] c13["pricing"] c14["revenue"] c15["reputation"] space
  style C1 fill:#fff3e0,stroke:#e65100,color:#000000
  style C2 fill:#fff3e0,stroke:#e65100,color:#000000
  style C3 fill:#fff3e0,stroke:#e65100,color:#000000
  style C4 fill:#fff3e0,stroke:#e65100,color:#000000
```

**Open questions**
- Which vertical has the clearest, funded buyer?
- What interface do those users actually need?
- Where does defensibility come from — data, distribution, or workflow?

## Plane 5 · Extend

- **What it is:** the parts you build and plug into the black box.
- **Who plays / buys:** developers and research teams — this is our own work.
- **Why it matters:** the platform is a black box, so everything you add to it lives here.

```mermaid
block-beta
  columns 5
  C1["tools"]:5
  c1["MCP servers"] c2["hosted tools"] c3["browser / computer-use"] space space
  C2["skills"]:5
  c4["authorship"] c5["packaging"] c6["testing"] space space
  C3["providers"]:5
  c7["memory"] c8["models"] c9["retrieval"] c10["sandbox"] c11["channels"]
  C4["agents"]:5
  c12["profiles & personas"] c13["templates"] c14["sub-agents"] c15["workflows"] space
  C5["environments"]:5
  c16["simulators"] c17["task suites"] c18["synthetic data"] space space
  style C1 fill:#c8e6c9,stroke:#2e7d32,color:#000000
  style C2 fill:#c8e6c9,stroke:#2e7d32,color:#000000
  style C3 fill:#c8e6c9,stroke:#2e7d32,color:#000000
  style C4 fill:#c8e6c9,stroke:#2e7d32,color:#000000
  style C5 fill:#c8e6c9,stroke:#2e7d32,color:#000000
```

**Open questions**
- Which providers and tools do we build first?
- Which environments and benchmarks do we need to evaluate them?
- What can we build that stays valuable if the platform is swapped?
