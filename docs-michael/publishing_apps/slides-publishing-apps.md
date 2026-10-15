---
marp: true
paginate: false
theme: default
---

<!-- Speaker notes: exactly two slides.
     Slide 1 = the plugin route. Slide 2 = run it ourselves + monetization.
     Render with Marp (mermaid blocks need the marp mermaid plugin, or paste the diagrams as images). -->

# 1 · Publishing as a plugin

### The suggested route — and where it stops

- The Hub publishes **Skills · Plugins/Connectors · Expert Teams · Templates** — all extend the assistant **inside JiuwenSwarm**.
- None is a complete app. **InkWell / TopSpin** have their own screens + logic, so a plugin can share their *knowledge or tools* — **not the app itself**.
- **What would make it possible** — the **Jiuwen team** would need to add: **(1)** a Hub type for complete applications, **(2)** install support in JiuwenSwarm that sets it up and shows **the app's own interface**.
- **Bottom line:** not available today. When it is, it becomes the natural channel *inside* the ecosystem.

```mermaid
flowchart LR
    Hub["Hub assets"] --> Skills["Skills"]
    Hub --> Plugins["Plugins / Connectors"]
    Hub --> Teams["Expert Teams"]
    Hub --> Templates["Templates"]
    Skills --> JS["JiuwenSwarm on the user's machine"]
    Plugins --> JS
    Teams --> JS
    Templates --> JS
    JS --> User["User works inside the assistant"]
    Hub -. "not available today" .-> App["App publishing (own screens + logic)"]
    classDef unavailable fill:#fde8e8,stroke:#dc2626,stroke-dasharray:4 3,color:#b91c1c;
    class App unavailable;
```

---

# 2 · Running it ourselves — and how we earn

**Deployment — an always-on agent** *(like Muse / Dots / Grok)*

- Host JiuwenSwarm in the cloud; our apps are the **front end**, JiuwenSwarm is the **agentic backend**.
- One backend, many apps. **Web = open a link · Mobile = install from a store** — otherwise identical.

```mermaid
flowchart LR
    subgraph AppsCloud["Cloud — App hosting"]
        W1["Web App 1 — /apps/topspin"]
        W2["Web App 2 — /apps/inkwell"]
    end
    subgraph Devices["Users' devices"]
        M3["Mobile App 3"]
        M4["Mobile App 4"]
    end
    subgraph JwCloud["Cloud — JiuwenSwarm"]
        Backend["JiuwenSwarm (agentic backend)"]
    end
    subgraph ModelCloud["Cloud — Model provider"]
        Model["Model"]
    end
    W1 --> Backend
    W2 --> Backend
    M3 --> Backend
    M4 --> Backend
    Backend --> Model
```

**Monetization**

- **Free tier · Monthly paid tiers · Per usage · One-time license · Business / white-label**
- Model cost — one choice up front: **we include it**, or **users bring their own key**.
