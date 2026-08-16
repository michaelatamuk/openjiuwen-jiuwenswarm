# OpenJiuwen Channels

OpenJiuwen Channels is the product suite that puts JiuwenSwarm where its users work. Where Cortex is a collection of algorithms, systems, and tools that make the agent itself faster, cheaper, smarter, and more robust, Channels is a collection of thin clients and integrations that meet the user on the surface they already inhabit — the developer's editor, the data scientist's notebook, the researcher's browser, and the developer's own application. There is no single channel: each one fits a different working context, and each can be used on its own.

JiuwenSwarm already ships with two built-in surfaces that cover its core user base: the **GUI** (the web UI accessible at `localhost:5173` after launch) and the **TUI** (`jiuwenswarm-tui`, a full-featured terminal interface for power users). These two are integral parts of JiuwenSwarm itself — not separate development efforts. The messaging platforms (Feishu, DingTalk, WeCom, WeChat, Xiaoyi, Telegram, Discord, Slack, WhatsApp) are also already integral to JiuwenSwarm.

OpenJiuwen Channels adds new surfaces on top of that foundation, organized around two user families.

Every channel in this suite is a client over the same server runtime (`openjiuwen.core` + `openjiuwen.harness`) and speaks the same WebSocket envelope protocol. The heavy work — reasoning, memory, retrieval, and tool execution — always stays on the server; a channel only adds the input and output surfaces that fit a particular working context. Because sessions are server-side objects, work started in one channel (say, the browser extension) can be continued in another (say, the IDE plugin or VibeStudio) without duplication.

---

## Two User Families

The channel landscape splits naturally along a single axis: technical vs. non-technical users. Both families share the same JiuwenSwarm runtime, the same session model, and the same agent capabilities. What differs is the surface through which those capabilities are accessed.

### Technical family — users who work in code, terminals, and editors

| Channel | Status                  | What it is |
|---|-------------------------|---|
| **TUI** | Built-in to JiuwenSwarm | Full-featured terminal interface; slash commands, swarmflow monitoring, mode switching |
| **SDK** | New                     | Python + TypeScript libraries and REST gateway for embedding JiuwenSwarm in other products |
| **IDE** | New                     | VS Code and JetBrains plugin; agent inside the editor with code diff, rewind, and swarm panel |
| **JupyterLab** | New                      | Notebook extension; agent sees live variables and DataFrame contents without copy-paste |

### Non-technical family — users who work in browsers, apps, and everyday tools

| Channel | Status                  | What it is |
|---|-------------------------|---|
| **GUI** | Built-in to JiuwenSwarm | Web UI at `localhost:5173`; Work and Code workspaces; Agent and Cluster modes; desktop installers for Windows, macOS, and HarmonyOS |
| **Browser** | New                     | Chromium extension; ambient research assistant over web content with cross-tab sessions |
| **Mobile** | New                 | iOS and Android app; camera capture, voice input, share-sheet handoff, push notifications |
| **VibeStudio** | New                 | Browser-based vibe coding environment; describe an app in plain language, get a working deployable project |

---

## Technical Family

### Built-in: TUI — Terminal Interface *(built-in to JiuwenSwarm)*

`jiuwenswarm-tui` is a full-featured terminal interface that ships as a first-class part of JiuwenSwarm. Install it with `pip install jiuwenswarm-tui` and start it with `jiuwenswarm-tui` after the server is running. It offers the same agent capabilities as the web UI — all modes, all memory, multi-agent cluster — plus terminal-native features: a rich set of slash commands (`/mode`, `/swarmflows`, `/keybindings`, `/simplify`, `/review`, `/security-review`, `/btw`), SwarmFlow run-tree monitoring with `/swarmflows`, and keyboard-driven navigation. Targets developers and power users who live in the terminal and prefer not to switch to a browser.

---

### New: jiuwenswarm-sdk — Programmatic Agent Access

JiuwenSwarm SDK exposes the agent runtime as a library — in Python, in TypeScript, or over plain HTTP — so developers can build JiuwenSwarm agents directly into their own products, CI pipelines, and internal tools instead of driving a chat UI. All three surfaces share the same server backend (`openjiuwen.core` + `openjiuwen.harness`); a REST + WebSocket gateway serves the same API to any language that can make an HTTP call.

**What developers can do:**
- Run agents in-process in Python (`Agent.create`) or connect to a remote server over WebSocket (`Agent.connect`)
- Stream tokens, register `@tool` functions, attach lifecycle hooks, and checkpoint/restore sessions
- Compose DAG workflows, spawn multi-agent teams, and expose them as MCP servers
- Add memory, knowledge bases, and agentic retrieval; evaluate and trace with `Evaluator` and OpenTelemetry
- Use the same capabilities from TypeScript/JavaScript or via the gateway's REST API with curl

Targets software engineers who want to embed JiuwenSwarm agents in their own applications.

---

### New: jiuwenswarm-ide — IDE Plugin

JiuwenSwarm IDE puts the agent directly inside the developer's editor — available as both a VS Code extension and a JetBrains plugin. The agent is aware of what the developer is currently looking at: open files, recent errors, git state, and project-level rules. This awareness is automatic — the developer does not need to paste context into a chat window.

**What developers can do:**
- Chat with the agent without leaving the editor
- Review proposed code changes as a diff before accepting or rejecting them
- Rewind to an earlier point in a session if a direction turns out to be wrong
- Navigate directly from an agent response to the relevant file or symbol in the editor
- Let the agent run terminal commands as part of a task
- Monitor a live multi-agent team through a visual panel that shows which agents are active and what they are working on

Targets software engineers and engineering teams who spend most of their working time in an IDE.

---

### New: jiuwenswarm-jupyterlab — JupyterLab Extension

jiuwenswarm-jupyterlab puts JiuwenSwarm inside Jupyter notebooks, where data scientists and ML researchers actually work. The agent has direct access to the live notebook environment — it can see the current state of variables, datasets, and cell outputs without the user copying anything. It works in JupyterLab, classic Notebook, VS Code Notebooks, Colab, and Kaggle.

**What data scientists can do:**
- Ask the agent a question or give it a task from inside a notebook cell, without switching windows
- Get agent responses and generated code written directly into the notebook
- Have the agent reason over live data — it sees actual variable values and DataFrame contents, not just code
- Use the sidebar chat panel for a longer back-and-forth conversation while keeping the notebook in view
- Track multi-agent work on a visual swarm map panel

Targets data scientists and ML researchers who work in notebooks rather than IDEs.

---

## Non-Technical Family

### Built-in: GUI — Web UI *(built-in to JiuwenSwarm)*

The web UI is the default visual surface of JiuwenSwarm, available at `http://localhost:5173` after any installation method (desktop installer, `pip install`, or from source). It requires no additional setup and is the first thing a new user sees. The workbench offers two spaces switched from the top-left selector — **Work**, for general tasks and collaboration, and **Code**, for project-directory work with code diff display — and two execution modes: **Agent** (single agent, task planning, dynamic adjustment) and **Cluster** (multi-agent, Leader orchestrating specialised teammates). Desktop installers are available for Windows 10/11, macOS (Intel and Apple Silicon), and HarmonyOS PC; Linux users reach the same UI after a pip or source install. Configuration (model provider, API keys, tool permissions) is managed from the web UI's settings panel or directly in `~/.jiuwenswarm/config/config.yaml`.

---

### New: jiuwenswarm-browser — Chromium Extension

jiuwenswarm-browser puts JiuwenSwarm into the browser as an ambient research assistant. Where the IDE plugin understands code and the JupyterLab extension understands data, the browser extension understands web content — articles, papers, filings, threads, transcripts. Works on Chrome and on Chromium-based browsers without the Side Panel API (major Chinese browsers included), where the panel opens as a popup window automatically.

**What researchers and analysts can do:**
- Pin pages from multiple tabs into a named session; the agent treats all of them as one unified context
- Ask cross-source questions against 9 specialized content types (arXiv, GitHub, SEC EDGAR, PubMed, Wikipedia, YouTube, Twitter/X, Hacker News, generic articles)
- Let the agent act on pages — highlight cited passages, scroll to sections, fill forms, take screenshots, open follow-up URLs
- Manage sessions with templates, export to JSON or Markdown, import, and open directly in the web app
- Save highlights and session notes persistently; notes are injected as context with every message

Targets researchers, analysts, journalists, and professionals who work primarily in the browser rather than an IDE or notebook.

---

### New: jiuwenswarm-mobile — Mobile App *(planned — future development)*

jiuwenswarm-mobile is a planned cross-platform iOS and Android app built with Expo (React Native) and TypeScript, currently in development and not yet shipped. Like the other channels it is a thin client — the reasoning engine, memory, retrieval, and tool execution all remain on the server. The app will add the mobile-native input surfaces that no desktop channel provides: camera document capture, on-device voice input, and the iOS/Android share sheet, so a URL or document can be dropped into a research session from any other app without opening a browser first.

**What mobile users will be able to do:**
- Start or continue a research session from a phone or tablet, picking up exactly where a desktop session left off
- Photograph a whiteboard, printed report, business card, or contract and send it into a session for analysis
- Speak a question instead of typing, particularly while commuting or multitasking
- Share any URL from any app directly into a session via the share sheet, without opening a browser first
- Receive a push notification when a long agent task completes or a response is ready

Targets users who primarily work on a phone or tablet, or who need access to JiuwenSwarm away from their workstation.

Development is planned in five phases — protocol client, mobile-native inputs, share sheet, push notifications, and distribution — with the core protocol client (connect, sessions, chat) as the first milestone. Design details and constraints live in `mobile/jiuwenswarm-mobile-SIG.md`; the phased plan lives in `mobile/jiuwenswarm-mobile-PLAN.md`.

---

### New: jiuwenswarm-vibestudio — Vibe Coding and App Generation *(planned — future development)*

VibeStudio is a planned browser-based app-generation environment that lets users build full-stack applications through natural language conversation — no terminal, no configuration, no prior coding knowledge required. It is the OpenJiuwen answer to products like Base44, Bolt.new, and Lovable: a vibe coding surface where describing what you want is enough to get a working, deployable app.

Unlike those products, VibeStudio runs on JiuwenSwarm. It uses the `@jiuwenswarm/sdk` TypeScript package as its sole communication layer, making it simultaneously a product in its own right and a proof-of-concept for what the SDK enables when used inside a real application. Complex apps are built by a coordinated team of specialised JiuwenSwarm agents — Architect, Frontend, Backend, Database, and QA — orchestrated through JiuwenSwarm's team mode. Simple apps are handled by a single agent turn.

**What users will be able to do:**
- Describe any web app in plain language and receive a complete, runnable React or Next.js project within a single conversation turn
- Iterate through conversation — "make the sidebar collapsible", "add a login page", "connect to a Postgres database" — without losing context, because JiuwenSwarm session memory carries the full project history across turns and browser sessions
- See every generated version of the app running live in a sandboxed in-browser preview (Sandpack / StackBlitz WebContainers) immediately after generation, with no local dev environment required
- Watch a real-time swarm panel that shows which agent is active and what it is building, making the multi-agent coordination visible rather than opaque
- Rewind any generation step with one click, rolling the project back to a previous state using the SDK's `client.rewind()` capability
- Deploy the finished app to Vercel or Netlify in one click, or download the project as a standard ZIP for self-hosting or further development in an IDE
- Continue working on a VibeStudio project from a different channel — such as the IDE plugin — because the project is a JiuwenSwarm session and sessions are portable across all channels

Targets non-developers and developers alike who want to prototype or ship a web application rapidly, without configuring a development environment or writing boilerplate.

Development is planned in three phases — core generation loop (React/Vite apps, chat UI, Sandpack preview, project dashboard, ZIP export), full-stack apps (Next.js, Monaco editor, swarm panel, rewind, deployment pipeline), and collaboration (real-time shared editing, VibeStudio server, plugin system). Design details and system architecture live in `vibestudio/vibestudio-SIG.md`; requirements analysis lives in `vibestudio/vibestudio-RAT.md`.
