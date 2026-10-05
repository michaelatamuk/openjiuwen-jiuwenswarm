# What we build on top of Jiuwen

Jiuwen is the **brain**. On top, we build **three parts**. Simple rule:

> **No body → software. Has a body → hardware.** And **we make the engines, not the cars.**

| Part | Software or hardware? | Who builds it |
|---|---|---|
| **1 · Products** | **software** — a brain in software | product teams, on Jiuwen's surfaces |
| **2 · Bodies** | **hardware** — a brain in a body | hardware / product teams |
| **3 · Enabling stack** | **neither** — it enables both | **us (R&D)** |

## 1 · Software products — a brain in software

**By job:**

```mermaid
block-beta
  columns 4
  j1["support"] j2["sales"] j3["HR"] j4["finance ops"]
  j5["security ops"] j6["IT / helpdesk"] j7["coding"] j8["research"]
  style j1 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style j2 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style j3 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style j4 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style j5 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style j6 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style j7 fill:#e3f2fd,stroke:#0d47a1,color:#000000
  style j8 fill:#e3f2fd,stroke:#0d47a1,color:#000000
```

**By industry:**

```mermaid
block-beta
  columns 5
  i1["health"] i2["legal"] i3["finance"] i4["insurance"] i5["retail"]
  i6["manufacturing"] i7["telecom"] i8["public sector"] i9["education"] i10["logistics"]
  style i1 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i2 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i3 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i4 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i5 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i6 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i7 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i8 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i9 fill:#ede7f6,stroke:#4a148c,color:#000000
  style i10 fill:#ede7f6,stroke:#4a148c,color:#000000
```

| Example product | Job / industry | Runs on (Jiuwen gives) |
|---|---|---|
| support triage agent | job · support | web / chat |
| helpdesk agent | job · IT | IDE / chat |
| claims processing agent | industry · insurance | software |
| contract review agent | industry · legal | software |
| month-end close agent | job · finance ops | software |

## 2 · Hardware bodies — a brain in a body

```mermaid
block-beta
  columns 3
  b1["robots"] b2["vehicles"] b3["smart home"]
  b4["devices & IoT"] b5["wearables"] b6["machines & equipment"]
  style b1 fill:#eeeeee,stroke:#424242,color:#000000
  style b2 fill:#eeeeee,stroke:#424242,color:#000000
  style b3 fill:#eeeeee,stroke:#424242,color:#000000
  style b4 fill:#eeeeee,stroke:#424242,color:#000000
  style b5 fill:#eeeeee,stroke:#424242,color:#000000
  style b6 fill:#eeeeee,stroke:#424242,color:#000000
```

Jiuwen = the brain; the body team builds the senses, the acting, and the real-time loop.

## 3 · The enabling stack — ours (R&D)

We build **frameworks and infrastructure** here — **not products, not content**.

```mermaid
block-beta
  columns 1
  G8["Rehearse"]:1
  L8["8 · Simulation — rehearse in a fake world before the real one"]:1
  G7["Trust"]:1
  L7["7 · Proves and controls — measure it, bound it, record it"]:1
  G6["Know & do"]:1
  L6["6 · Runs on its own — plan, recover, escalate"]:1
  L5["5 · Knows the business — bring in and keep the domain's knowledge"]:1
  G5["Reach"]:1
  L4["4 · Connect — reach the customer's systems"]:1
  L3["3 · Sees and acts — senses and actions for hardware"]:1
  L2["2 · Runs on the device — real time, always-on"]:1
  G4["Who it is"]:1
  L1["1 · Identity & access — the agent acts as itself, with the right permissions"]:1
  style G4 fill:#37474f,color:#ffffff,stroke:#263238
  style G5 fill:#37474f,color:#ffffff,stroke:#263238
  style G6 fill:#37474f,color:#ffffff,stroke:#263238
  style G7 fill:#37474f,color:#ffffff,stroke:#263238
  style G8 fill:#37474f,color:#ffffff,stroke:#263238
  style L1 fill:#c8e6c9,stroke:#2e7d32,color:#000000
  style L2 fill:#bbdefb,stroke:#0d47a1,color:#000000
  style L3 fill:#bbdefb,stroke:#0d47a1,color:#000000
  style L4 fill:#bbdefb,stroke:#0d47a1,color:#000000
  style L5 fill:#d1c4e9,stroke:#4a148c,color:#000000
  style L6 fill:#d1c4e9,stroke:#4a148c,color:#000000
  style L7 fill:#ffcdd2,stroke:#b71c1c,color:#000000
  style L8 fill:#ffe0b2,stroke:#e65100,color:#000000
```

| Layer | How it connects to Jiuwen | Jiuwen gives | Ours (R&D) | Example |
|---|---|---|---|---|
| **1 · Identity & access** | we **manage** the agent's identity | user auth, "on whose behalf" audit | cross-system agent-identity framework | the agent signs in as "robot-7" with only the permissions it needs |
| **2 · Runs on the device** | we **host** the agent on the device | — | real-time / on-device runtime | voice companion in <300 ms, offline |
| **3 · Sees and acts** | the agent **calls our** device tools | multimodal + browser/GUI | device-I/O framework | robot reads a camera, moves its arm |
| **4 · Connect** | the agent **calls our** connectors | MCP / tools | connector framework | the agent updates the case in the CRM |
| **5 · Knows the business** | the agent **calls our** knowledge | memory, retrieval | retrieval / connector engine | claims agent looks up the policy |
| **6 · Runs on its own** | **we control** the agent | planning, retry, approvals | autonomy & reliability framework | claims ≤ $500 auto; above → a human |
| **7 · Proves and controls** | **we watch** the agent | guardrails, observability | evaluation & assurance toolkit | refunds logged; monthly audit |
| **8 · Simulation** | we **run the agent in a fake world** | — | simulator / test-environment toolkit | rehearse a warehouse robot on a fake floor |

Read the connection column: **host** = we run Jiuwen; **calls our …** = Jiuwen uses our service; **we control / watch** = we use Jiuwen; **fake world** = we run Jiuwen in a simulator; **manage** = we give the agent its identity and access.

**Which parts need which layer:**

| Layer | Jobs & industries (software) | Bodies (hardware) |
|---|---|---|
| **1 · Identity & access** | **yes** | **yes** |
| **2 · Runs on the device** | voice only | **yes** |
| **3 · Sees and acts** | no | **yes** |
| **4 · Connect** | **yes** | **yes** |
| **5 · Knows the business** | **yes** | **yes** |
| **6 · Runs on its own** | **yes** | **yes** |
| **7 · Proves and controls** | **yes** | **yes** |
| **8 · Simulation** | **yes** | **yes** |

Test for ours: **reusable across every domain → ours; one domain only → the domain team's.** The commercial layer (accounts, billing, payments, sales) also exists, but it is a business function, not R&D.

## What NOT to build — Jiuwen already gives it

| Capability | Given by Jiuwen | Examples |
|---|---|---|
| Brain | model + agent loop | single agent · deep agent |
| Teams | multi-agent | leader · members · human |
| Tools | built-in + MCP | filesystem · shell · web · browser · code |
| Memory & retrieval | store + search | long-term · graph · vector · rerank |
| Guardrails & observability | safety + tracing | security rails · tracer |
| Channels | user surfaces | web · desktop · mobile · IDE · chat/IM |
| Workflows | orchestration | graph/Pregel · task loop |

## Where to start

```mermaid
quadrantChart
  title What to work on first
  x-axis "Competitors can close the gap" --> "Competitors cannot close the gap"
  y-axis "Less wise to build" --> "Wise to build"
  quadrant-1 "Wise + hard to close — do it"
  quadrant-2 "Wise, but catchable — move fast"
  quadrant-3 "Low value, easy to copy — buy or skip"
  quadrant-4 "Hard to close, lower value — keep as a moat"
  "Knows the business": [0.32, 0.72]
  "Runs on its own": [0.78, 0.85]
  "Proves and controls": [0.80, 0.70]
  "Identity & access": [0.80, 0.38]
  "Runs on the device": [0.62, 0.42]
  "Sees and acts": [0.58, 0.45]
  "Connect": [0.35, 0.42]
  "Simulation": [0.50, 0.32]
```

| Zone | Layers | Move |
|---|---|---|
| Top-right — earns money + hard to copy | Runs on its own · Proves and controls | **do it now** |
| Top-left — earns money, but rivals can catch up | Knows the business | **build, but expect rivals** |
| Bottom-right — hard to copy, but earns indirectly | Identity & access · Runs on the device · Sees and acts | **keep it — that's our edge** |
| Bottom-left — earns indirectly, easy to copy | Connect | **buy, don't build** |
| Center | Simulation | **build a little** |

## Business lens

| Question | Meaning |
|---|---|
| **Who** | who builds, runs, and adopts it |
| **Who else** | who is already here; where the whitespace is |
| **How much** | unit economics, cost to enter, ROI |
| **How fast** | time-to-value, lock-in risk |
