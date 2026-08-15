# OpenJiuwen Channels

OpenJiuwen Channels is the product suite that puts JiuwenSwarm where its users work. Where Cortex is a collection of algorithms, systems, and tools that make the agent itself faster, cheaper, smarter, and more robust, Channels is a collection of thin clients and integrations that meet the user on the surface they already inhabit — the developer's editor, the data scientist's notebook, the researcher's browser, and the developer's own application. There is no single channel: each one fits a different working context, and each can be used on its own.

These channels join a growing family of ways to communicate with JiuwenSwarm. The web app is already the built-in channel of the platform, and the messaging platforms (Feishu, DingTalk, WeCom, WeChat, Xiaoyi, Telegram, Discord, Slack, WhatsApp) are already integral to JiuwenSwarm. This suite adds the surfaces for developers and specialized workflows on top of that foundation.

Every channel in this suite is a client over the same server runtime (`openjiuwen.core` + `openjiuwen.harness`) and speaks the same WebSocket envelope protocol. The heavy work — reasoning, memory, retrieval, and tool execution — always stays on the server; a channel only adds the input and output surfaces that fit a particular working context. Because sessions are server-side objects, work started in one channel (say, the browser) can be continued in another (say, the phone) without duplication, and the agent's awareness of its environment is automatic — no user has to copy and paste context into a chat window.

The suite currently consists of four shipped surfaces, with a mobile app in development:

- **SDK** — programmatic agent access for developers
- **IDE** — an editor plugin for software engineers
- **JupyterLab** — a notebook extension for data scientists and ML researchers
- **Browser** — an ambient research assistant for researchers and analysts
- **Mobile** (planned) — an iOS and Android app for on-the-go use

---

## jiuwenswarm-sdk — Programmatic Agent Access

JiuwenSwarm SDK exposes the agent runtime as a library — in Python, in TypeScript, or over plain HTTP — so developers can build JiuwenSwarm agents directly into their own products, CI pipelines, and internal tools instead of driving a chat UI. All three surfaces share the same server backend (`openjiuwen.core` + `openjiuwen.harness`); a REST + WebSocket gateway serves the same API to any language that can make an HTTP call.

**What developers can do:**
- Run agents in-process in Python (`Agent.create`) or connect to a remote server over WebSocket (`Agent.connect`)
- Stream tokens, register `@tool` functions, attach lifecycle hooks, and checkpoint/restore sessions
- Compose DAG workflows, spawn multi-agent teams, and expose them as MCP servers
- Add memory, knowledge bases, and agentic retrieval; evaluate and trace with `Evaluator` and OpenTelemetry
- Use the same capabilities from TypeScript/JavaScript or via the gateway's REST API with curl

Targets software engineers who want to embed JiuwenSwarm agents in their own applications.

---

## jiuwenswarm-ide — IDE Plugin

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

## jiuwenswarm-jupyterlab — JupyterLab Extension

jiuwenswarm-jupyterlab puts JiuwenSwarm inside Jupyter notebooks, where data scientists and ML researchers actually work. The agent has direct access to the live notebook environment — it can see the current state of variables, datasets, and cell outputs without the user copying anything. It works in JupyterLab, classic Notebook, VS Code Notebooks, Colab, and Kaggle.

**What data scientists can do:**
- Ask the agent a question or give it a task from inside a notebook cell, without switching windows
- Get agent responses and generated code written directly into the notebook
- Have the agent reason over live data — it sees actual variable values and DataFrame contents, not just code
- Use the sidebar chat panel for a longer back-and-forth conversation while keeping the notebook in view
- Track multi-agent work on a visual swarm map panel

Targets data scientists and ML researchers who work in notebooks rather than IDEs.

---

## jiuwenswarm-browser — Chromium Extension

jiuwenswarm-browser puts JiuwenSwarm into the browser as an ambient research assistant. Where the IDE plugin understands code and the JupyterLab extension understands data, the browser extension understands web content — articles, papers, filings, threads, transcripts. Works on Chrome and on Chromium-based browsers without the Side Panel API (major Chinese browsers included), where the panel opens as a popup window automatically.

**What researchers and analysts can do:**
- Pin pages from multiple tabs into a named session; the agent treats all of them as one unified context
- Ask cross-source questions against 9 specialized content types (arXiv, GitHub, SEC EDGAR, PubMed, Wikipedia, YouTube, Twitter/X, Hacker News, generic articles)
- Let the agent act on pages — highlight cited passages, scroll to sections, fill forms, take screenshots, open follow-up URLs
- Manage sessions with templates, export to JSON or Markdown, import, and open directly in the web app
- Save highlights and session notes persistently; notes are injected as context with every message

Targets researchers, analysts, journalists, and professionals who work primarily in the browser rather than an IDE or notebook.

---

## jiuwenswarm-mobile — Mobile App *(planned — future development)*

jiuwenswarm-mobile is a planned cross-platform iOS and Android app built with Expo (React Native) and TypeScript, currently in development and not yet shipped. Like the other channels it is a thin client — the reasoning engine, memory, retrieval, and tool execution all remain on the server. The app will add the mobile-native input surfaces that no desktop channel provides: camera document capture, on-device voice input, and the iOS/Android share sheet, so a URL or document can be dropped into a research session from any other app without opening a browser first.

**What mobile users will be able to do:**
- Start or continue a research session from a phone or tablet, picking up exactly where a desktop session left off
- Photograph a whiteboard, printed report, business card, or contract and send it into a session for analysis
- Speak a question instead of typing, particularly while commuting or multitasking
- Share any URL from any app directly into a session via the share sheet, without opening a browser first
- Receive a push notification when a long agent task completes or a response is ready

Targets users who primarily work on a phone or tablet, or who need access to JiuwenSwarm away from their workstation.

Development is planned in five phases — protocol client, mobile-native inputs, share sheet, push notifications, and distribution — with the core protocol client (connect, sessions, chat) as the first milestone. Design details and constraints live in `mobile/jiuwenswarm-mobile-SIG.md`; the phased plan lives in `mobile/jiuwenswarm-mobile-PLAN.md`.
