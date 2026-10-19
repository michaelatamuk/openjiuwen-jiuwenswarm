# Agentic App Building Blocks

**Status:** draft v0.1  
**Audience:** platform team, app teams, design partners  
**Purpose:** define the reusable primitives that let startups and one-person companies build multimodal agentic apps much faster, on openJiuwen or an equivalent runtime.

---

## 0. Thesis

Do not build a supermarket of agent components. Build a **production line for multimodal work**.

The 50 app ideas are not 50 requirements. They collapse into a small number of repeated workloads:

1. document or form in, structured artifact out
2. recorded video in, annotated feedback out
3. recorded audio/video in, notes or audio out
4. photo in, judgment or action out
5. screen in, action out
6. creative assets in, finished media out
7. live audio/video in, live assistance out
8. physical environment in, safe action out (ATARI)

The platform wins if a one-person company can go from idea to a paid, trustworthy product in days. That requires four things more than it requires generic agent sophistication:

- getting messy multimodal input in
- running long, resumable jobs
- producing a verifiable artifact
- delivering it through the channel the customer already uses

Every app can be agentic under the hood. Deterministic steps become tools inside the agent graph. The platform should support that, but it should not force autonomy where a fixed step is cheaper and safer.

---

## 1. Selection Rules

A building block is worth building only if it passes all four tests:

| Test | Question | Failure mode |
|---|---|---|
| Workload coverage | Does it unblock at least 6 of the 50 ideas, or 2 committed design partners? | A component built for one demo |
| Non-triviality | Would a competent builder need more than 3 days to assemble it from commodity APIs? | A thin wrapper around OCR or TTS |
| Reuse or differentiation | Does it reuse a Jiuwen asset or create a defensible advantage? | Rebuilding RAG, connectors, guardrails or sandboxing |
| Economic or trust impact | Does it reduce cost, time to production, or risk of a bad outcome? | Sophistication with no buyer-visible value |

Two hard gates:

- **Named first consumer.** No platform block without an app team or design partner committed to using it.
- **Named evaluation.** If it cannot be measured on a golden workload, it is not a platform primitive yet.

---

## 2. First 18 Blocks

These are the spine. Build these before the long tail.

| # | ID | Block | Why first | Phase |
|---|---|---|---|---|
| 1 | A1 | Multimodal intake | Every app needs image, audio, video, PDF or screen input normalized once. | 30 days |
| 2 | A2 | Durable job runner | Video, audio and multi-step work exceed chat-turn timeouts. | 30 days |
| 3 | A3 | Artifact and evidence store | The output is the product: reports, clips, PDFs, annotations, audio. | 30 days |
| 4 | A4 | Structured result contract | Typed output with evidence, confidence and validation turns a demo into a product. | 30 days |
| 5 | B7 | Multimodal model gateway | One interface for LLM, VLM, ASR, TTS, image and video providers. | 30 days |
| 6 | K2 | Golden-path starter | One command from zero to a deployed multimodal app. | 30 days |
| 7 | L5 | Metering, quotas and spend caps | A one-person company must not lose money on one viral run. | 30 days |
| 8 | K9 | Builder console | Builders cannot adopt what they cannot debug: runs, traces, cost, artifacts, replay. | 30 days |
| 9 | F5 | Human approval gate | Grading, claims, inspections and publishing need approve/edit/reject. | 90 days |
| 10 | J2 | Multimodal eval harness | A recipe is not a platform asset until it has a golden set and a regression gate. | 90 days |
| 11 | I1 | Consent receipt service | Camera, voice, classroom and meeting apps need defensible consent. | 90 days |
| 12 | I2 | PII/PHI redaction | Logs, prompts, exports and trainer data must be safe by default. | 90 days |
| 13 | G4 | Context compiler | Keeps agents coherent and affordable as multimodal context grows. | 90 days |
| 14 | C1 | Camera capture SDK | Camera companion, inspection, coaching and acceptance all depend on it. | 90 days |
| 15 | C2 | Audio capture SDK | Voice agents, meeting capture, coaching and translation depend on it. | 90 days |
| 16 | L7 | Web embed widget | Fastest distribution surface for a one-person company. | 90 days |
| 17 | L2 | Workspace tenancy and RBAC | Any B2B or agency use needs data boundaries and roles. | 90 days |
| 18 | H1 | Connector SDK and registry | Files, mail, calendar, chat and docs are the first integrations builders need. | 90 days |

**Do not start with:** marketplace, generic memory, every connector, real-time AV, no-code builder, multi-agent default, on-device runtime.

---

## 3. Catalog

**Effort:** S = 1-2 engineer-weeks, M = 3-6, L = 7-12, XL = 12+ or multi-team.  
**Priority:** P0 = unblocks most apps, P1 = needed by 5+ apps, P2 = later or differentiating.

### A. Intake, jobs and artifacts

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| A1 | Multimodal intake | One API for image, audio, video, PDF and screen capture; produces normalized frames, transcripts, pages and references. | API + SDK | M/P0 | Gap; builds above agent-core. |
| A2 | Durable job runner | Long-running jobs with progress, cancellation, retries, idempotency, partial results and webhooks. | API + SDK | L/P0 | Partial reuse from workflows; product-grade API is a gap. |
| A3 | Artifact and evidence store | Immutable inputs, intermediates and outputs with lineage, signed URLs, TTL and export. | Hosted service | L/P0 | Gap; object storage alone is not enough. |
| A4 | Structured result contract | Typed JSON with confidence, bounding boxes, timestamps, page references, validation and repair. | Schema + SDK | M/P0 | Gap; biggest reliability difference between demo and product. |
| A5 | Media normalize and transcode | Probe, transcode, thumbnail, waveform, chunk and malware-scan arbitrary media. | Service + API | M/P0 | Gap; downstream models need one shape. |
| A6 | Time-aligned media index | Query keyframes, segments, transcripts, annotations and clips by time, entity and session. | Service + index | L/P1 | Gap; enables evidence and replay. |
| A7 | Webhook and callback gateway | Signed inbound/outbound webhooks with retries, replay protection and SSRF allowlist. | Service + SDK | M/P0 | Gap; common integration plumbing. |
| A8 | Fixture recorder and replay | Record real camera, audio, screen and tool traces; replay deterministically in tests; redact PII. | CLI + SDK | M/P1 | Gap; essential for multimodal CI. |

### B. Runtime and orchestration

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| B1 | Session runtime | Durable, resumable session state with fork, rewind, TTL and versioning. | API + SDK | M/P0 | Reuse agent-core concepts; product API is a gap. |
| B2 | Unified event protocol | One schema and transport for tokens, audio, video, tools and UI actions with ordering and backpressure. | Protocol + SDK | M/P0 | Gap; prevents per-app glue. |
| B3 | Sandboxed tool executor | Per-call isolation with filesystem, network, time, memory and artifact capture. | Hosted service | L/P0 | Reuse JiuwenBox; product-grade policy is a gap. |
| B4 | Durable workflow and scheduler | Steps, timers, human waits, compensation, recurring runs and run history. | API + SDK | L/P0 | Partial reuse; scheduling product is a gap. |
| B5 | Agent host and autoscaler | Warm pools, tenant quotas, rolling versions and GPU-aware scheduling. | Hosted service + CLI | L/P1 | Gap for multi-tenant SaaS. |
| B6 | Realtime duplex transport | WebRTC/WebSocket media with barge-in, jitter buffering and mobile background handling. | SDK + service | L/P1 | Partner or build after recorded workloads. |
| B7 | Multimodal model gateway | One normalized API for LLM, VLM, ASR, TTS, image and video with fallback, budgets and routing. | API + SDK | M/P0 | Reuse optmod/PerfRouter for text; extend to other modalities. |
| B8 | Prompt and model registry | Versioned prompts, model pins, configs, eval links and one-click rollback. | Service + CLI | M/P0 | Gap; required for reproducibility. |

### C. Capture and media

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| C1 | Camera capture SDK | Mobile/web frame capture with orientation, timestamps, burst/stream modes and privacy shutter. | SDK | M/P0 | Gap; device parity is the risk. |
| C2 | Audio capture SDK | Mic capture with AEC, VAD, resampling and duplex-safe frames. | SDK | M/P0 | Gap; echo and latency are the risk. |
| C3 | Screen and app capture | Screen, window or tab capture plus cursor and system audio with consent hooks. | SDK | M/P1 | OS restrictions and DRM are the risk. |
| C4 | Stream normalizer | Canonical sampling, A/V sync, clock alignment and frame dedupe. | Service + SDK | M/P1 | Gap; prevents each model solving sync differently. |
| C5 | Realtime transcription | Streaming ASR with partials, word timestamps, language ID and diarization hooks. | API | M/P0 | Gap; voice apps depend on it. |
| C6 | Device emulator and fixture server | Fake camera, mic, screen and robot feeds for local development and CI. | CLI + template | S/P1 | Gap; makes development reproducible. |

### D. Perception and understanding

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| D1 | Vision understanding | Captioning, objects, scenes, OCR, activity and spatial relations from image or burst. | API | M/P0 | Gap; base for camera and inspection. |
| D2 | Video event indexer | Temporal segmentation, action/event labels, clip search and highlight extraction. | Hosted service | L/P1 | Gap; costly but unlocks sport and media. |
| D3 | Document layout and tables | Reading order, forms, tables, handwriting and figures converted to structure. | API | L/P0 | Gap; required for claims and forms. |
| D4 | Structured field extraction | Schema-bound extraction with per-field confidence, citations and abstention. | API + SDK | M/P0 | Gap; turns documents into records. |
| D5 | Pose and gesture | Skeleton, joint angles, repetition phases and form-deviation scores. | SDK + API | L/P1 | Reuse pose work; product API is a gap. |
| D6 | Defect and condition inspector | Pass/fail, damage regions, severity and baseline comparison. | Hosted service | L/P1 | Gap; liability and calibration are the risks. |
| D7 | Multimodal fusion | Aligns vision, audio, text and telemetry into one timestamped scene with provenance. | SDK | M/P1 | Gap; avoids per-app glue. |

### E. Generation and synthesis

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| E1 | Streaming TTS | Low-latency multilingual speech with style tags and word timings. | API | M/P0 | Gap; voice, podcast and accessibility. |
| E2 | Consent-gated voice cloning | Enrolled voice profiles with consent receipts, watermarking and revocation. | Hosted service | L/P1 | Gap; abuse risk requires policy. |
| E3 | Speech-to-speech translator | Duplex translation preserving timing, tone and consented identity. | Hosted service | XL/P1 | Gap; latency and low-resource languages. |
| E4 | Image generation and edit | Inpainting, outpainting, restyling and product-safe editing with provenance. | API | M/P1 | Gap; copyright and consistency. |
| E5 | Video assembly | Timeline composition, captions, b-roll, transitions, loudness and render farm. | SDK + CLI | L/P1 | Gap; shareable output is the product. |
| E6 | Document, deck and chart generator | Branded PDF/PPTX/DOCX and charts with citations, alt text and templates. | SDK | M/P1 | Gap; business deliverables need polish. |

### F. Agent patterns

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| F1 | Tool-use loop | Hardened plan, call, observe and repair loop with schema validation, retries and budgets. | SDK + template | S/P0 | Reuse agent loop; package it. |
| F2 | Planner and executor | Task decomposition into subtask contracts with acceptance checks and replanning. | Skill pack | M/P0 | Gap; prevents brittle prompts. |
| F3 | Supervisor and multi-agent | Roles, handoffs, shared blackboard and budgeted debate. | Template | L/P1 | Reuse Agent Teams; do not make default. |
| F4 | Critic and reflexion | Rubric-driven self-review with bounded revision and evidence checks. | Skill pack | S/P1 | Gap; judge bias is the risk. |
| F5 | HITL approval gate | Pause, resume, approve, edit, reject, escalate and audit. | SDK + service | M/P0 | Reuse primitives; product UX is a gap. |
| F6 | Realtime voice loop | Turn detection, barge-in, mid-utterance tools and conversational repair. | SDK | L/P0 | Gap; echo and interruption are hard. |
| F7 | Grounded RAG agent | Retrieve, cite, answer, abstain and freshness-check with source inspection. | Template | M/P0 | Reuse retrieval; package evidence semantics. |
| F8 | Scenario replay harness | Replay recorded multimodal sessions for regression and debugging. | CLI + SDK | L/P1 | Gap; privacy and nondeterministic tools. |

### G. Memory and context

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| G1 | Conversation memory | Turns, summaries, pins, TTL and per-user namespaces with retrieval helpers. | API | M/P0 | Gap; product semantics. |
| G2 | Episodic memory | Time, place and entity-indexed events with "what happened when" recall. | Hosted service | L/P1 | Reuse memtier; multimodal and tenancy are gaps. |
| G3 | Hybrid retrieval | Namespaced embeddings, metadata filters, rerank and ACL-aware search. | SDK + service | M/P0 | Reuse existing retrieval; do not rebuild. |
| G4 | Context compiler | Token-budgeted packing, dedupe, salience ranking and modality-aware trimming. | SDK | M/P0 | Reuse Thalamus concepts; product API is a gap. |
| G5 | Retention and forget | TTL, redaction, verifiable deletion and consent-linked legal holds. | Service + API | M/P0 | Gap; compliance depends on it. |
| G6 | Entity and preference graph | People, places, objects and preferences with provenance and consent links. | Hosted service | L/P1 | Gap; entity resolution is hard. |

### H. Tools and connectors

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| H1 | Connector SDK and registry | Manifests, auth flows, schemas, scopes, versioning and health checks. | SDK + registry | M/P0 | Gap; prevents auth sprawl. |
| H2 | Calendar, email and drive | Least-privilege access to Google and Microsoft calendar, mail and files. | Connector pack | M/P0 | Gap; first integrations builders need. |
| H3 | Meeting connector | Join Zoom/Meet/Teams, announce consent, transcribe, diarize and leave cleanly. | Connector pack | XL/P1 | Gap; platform ToS is the risk. |
| H4 | Messaging connectors | Slack, Teams, WhatsApp, Telegram and Discord with threads, media and identity mapping. | Connector pack | L/P1 | Reuse channels; embeddable product surface is a gap. |
| H5 | Browser automation | Headless browser with DOM and vision actions, domain policy and session recording. | Service + SDK | L/P1 | Reuse browser work; product policy is a gap. |
| H6 | Code and repo tool | Clone, patch, run tests, diff and draft PRs inside a sandbox. | Service | L/P1 | Reuse sandbox; packaging is a gap. |
| H7 | Data connectors | S3/GCS, Postgres, Snowflake and vector DBs with row-level ACL pushdown. | Connector pack | L/P1 | Gap; enterprise data grounding. |
| H8 | Web search and fetch | Grounded search plus page parsing with robots, paywall and policy filters. | API | M/P0 | Gap; current facts need citations. |

### I. Trust, consent and safety

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| I1 | Consent receipt service | Capture, version and prove consent for camera, voice, location and data use. | API + service | M/P0 | Gap; multimodal legal basis. |
| I2 | PII/PHI redaction | Streaming and batch detection across text, audio and image with actions. | SDK | M/P0 | Reuse memory guard; image/audio coverage is a gap. |
| I3 | Content moderation | Policy classifiers for text, image and audio with thresholds and appeals. | API | M/P0 | Gap; user-generated and synthetic media. |
| I4 | Prompt injection and tool guard | Screen inputs, retrieved content and tool calls against injection and exfiltration. | SDK + service | L/P0 | Gap; new attack surface. |
| I5 | AuthZ and tenant isolation | Scopes, per-tool permissions, tenant boundaries and delegated user auth. | SDK + service | L/P0 | Reuse tenant concepts; product API is a gap. |
| I6 | Audit and evidence log | Immutable, queryable records of actions, consent, model decisions and approvals. | Hosted service | M/P0 | Gap; compliance and incident response. |
| I7 | Synthetic media disclosure | Visible labels, invisible watermarks and C2PA-compatible manifests. | SDK | M/P1 | Gap; voice and image generation. |

### J. Evaluation and observability

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| J1 | Golden dataset manager | Versioned, labeled multimodal corpora with splits, provenance and access control. | Service + CLI | M/P0 | Gap; every quality claim needs a baseline. |
| J2 | Offline eval harness | Per-capability metrics, thresholds and CI regression gates. | CLI + SDK | M/P0 | Reuse Evaluation Framework; multimodal is a gap. |
| J3 | Rubric judge | Calibrated LLM judge with confidence and human spot-checks. | Hosted service | M/P1 | Gap; judge bias is the risk. |
| J4 | Modality metrics | WER, mAP, OCR F1, fidelity, A/V sync and latency metrics. | SDK | S/P1 | Gap; comparable numbers across apps. |
| J5 | Human feedback capture | Thumbs, corrections, preference and annotation embedded in apps. | SDK + service | S/P1 | Gap; continuous improvement. |
| J6 | Trace replay evaluator | Convert production traces into replayable eval cases. | CLI | M/P2 | Reuse TraceHound concepts; privacy is the gap. |
| J7 | Unified tracing | OTel spans across model, tool, media, device and human steps. | SDK | M/P0 | Reuse OTel; multimodal spans are a gap. |
| J8 | Cost and usage accounting | Per-tenant tokens, audio-seconds, frames and render minutes with budgets. | Hosted service | M/P0 | Reuse metering; multimodal attribution is a gap. |
| J9 | SLO and incident monitor | p50/p95 latency, queue depth, saturation, drift, outages and alerts. | Dashboard + service | M/P1 | Reuse telemetry; product dashboard is a gap. |

### K. Builder experience

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| K1 | App manifest | One declarative file for agents, tools, channels, scopes, meters, evals and listing. | Schema + validator | M/P0 | Gap; contract for everything else. |
| K2 | Golden-path starter | One command to a deployed app: upload, job, storage, model access, meter and deploy. | CLI + template | M/P0 | Gap; fastest adoption lever. |
| K3 | Template gallery | Six to eight runnable templates: chat, camera, voice, meeting, document and robot sim. | Template pack | M/P0 | Gap; templates must be CI-tested. |
| K4 | Local dev and emulators | Local runtime with fake camera, mic, telephony and chat; hot reload. | CLI | L/P0 | Gap; environment parity is the risk. |
| K5 | Deploy and promotion | Immutable builds, dev/staging/prod, config diff, promotion gates and rollback. | CLI + API | L/P0 | Gap; repeatable releases. |
| K6 | Preview environments | Per-branch URL with seeded data, expiry and shareable demo links. | Service | M/P1 | Gap; cost and data exposure. |
| K7 | Capability registry | Semver, lockfile, provenance and private namespaces for blocks and packs. | Registry | L/P0 | Gap; supply-chain trust. |
| K8 | Typed SDK generator | TypeScript and Python clients, event types and UI schemas from the manifest. | Generator | M/P1 | Gap; keeps clients aligned. |
| K9 | Builder console | Runs, traces, costs, artifacts, failures and replay in one place. | Web app | M/P0 | Reuse OTel/TraceHound; builder UX is a gap. |

### L. Commercialization and distribution

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| L1 | Auth service | OIDC, social login, magic links, passkeys and MFA. | Hosted service | M/P0 | Gap; mandatory for SaaS. |
| L2 | Workspace tenancy and RBAC | Organizations, workspaces, roles, invites and scoped access. | API + policy | L/P0 | Reuse tenant concepts; SaaS onboarding is a gap. |
| L3 | End-user identity upgrade | Anonymous session that later binds to an account and merges history. | API | M/P0 | Gap; kiosk to account conversion. |
| L4 | Billing adapter | Plans, checkout, subscriptions, trials, dunning and cancellation. | Service + SDK | L/P0 | Gap; tax and merchant-of-record are hard. |
| L5 | Metering pipeline | Idempotent usage events converted into billable units with audit. | Service | L/P0 | Reuse metering; multimodal units are a gap. |
| L6 | Entitlements and plan flags | Feature access by plan or contract, enforced in runtime and UI. | API + SDK | M/P1 | Gap; packaging and enforcement. |
| L7 | Web embed widget | Drop-in chat, voice and camera widget with theming and domain allowlist. | Web component | M/P0 | Gap; fastest distribution. |
| L8 | Mobile and PWA kit | Camera/mic capture, offline queue, push, deep links and installable PWA. | SDK + template | L/P1 | Gap; field and family use cases. |
| L9 | Voice and telephony | Inbound/outbound calls, streaming ASR/TTS, DTMF and warm handoff. | Connector | XL/P1 | Gap; carrier and latency risk. |
| L10 | Notification service | Email, SMS, push and in-app with templates, preferences and digests. | Service | M/P1 | Gap; retention and alerts. |
| L11 | Share links and public run pages | Expiring, read-only pages for reports and artifacts with redaction. | Service | M/P0 | Gap; outputs need to travel. |
| L12 | Onboarding console | Guided setup, sample data, checklist, resume links and time-to-value telemetry. | Web app | M/P0 | Gap; solo builders need hand-holding. |

### M. Packaging and marketplace

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| M1 | Capability package format | Signed bundle with manifest, schemas, UI, evals, pricing, licence and SBOM. | Spec + registry | L/P0 | Gap; unit of reuse and sale. |
| M2 | Publishing pipeline | Listing, media, demo tenant, review, staged rollout and private listing. | CLI + service | L/P0 | Gap; marketplace needs supply. |
| M3 | Versioning and deprecation | Semver, compatibility ranges, migration notes and sunset windows. | Registry policy | M/P1 | Gap; protects builders. |
| M4 | Licensing and enforcement | Per-seat, per-run and per-tenant licences with offline grace. | SDK + service | L/P0 | Gap; monetization. |
| M5 | Ratings and verified badges | Verified reviews, abuse controls, seller responses and capability badges. | Service | M/P1 | Gap; trust layer. |
| M6 | Payouts and revenue share | Splits, statements, KYC/tax and disputes. | Service | L/P2 | Gap; third-party sellers. |
| M7 | Recipe gallery | Curated end-to-end recipes with verified evals and one-click deploy. | Gallery | M/P0 | Better than a broad marketplace early. |

### N. Vertical recipe packs

Bundles of primitives, schemas, reference flows, evals and sample data. They are not finished apps.

| ID | Pack | What the builder gets | Effort/Pri | Reuse or gap |
|---|---|---|---|---|
| N1 | Camera companion | Live capture, scene memory, grounding, consent UX and latency profiles. | L/P1 | Combine C1, D1, G2, I1. |
| N2 | Visual acceptance | Reference vs actual, defect annotation, evidence capture and report export. | L/P1 | Combine A3, D6, F5. |
| N3 | Meeting copilot | Join, consent, transcribe, diarize, summarize, actions and CRM sync. | XL/P1 | Combine C5, H3, F5. |
| N4 | Sport coach | Pose, rep/phase detection, form scoring, overlay and drill library. | XL/P1 | Combine C1, D5, E5. |
| N5 | Kitchen agent | Recipe retrieval, hands-free voice, timers, inventory and substitutions. | L/P1 | Combine C2, H2, F6. |
| N6 | Classroom assistant | Curriculum retrieval, safeguarding, teacher review and parent reports. | L/P1 | Combine D3, F5, I3. |
| N7 | Document-to-podcast | Parse, script, synthesize, chapters, loudness and RSS. | M/P1 | Combine D3, E1, C5. |
| N8 | Voice translator | Streaming ASR/MT/TTS, glossary, turn-taking and offline fallback. | XL/P1 | Combine C2, E3, F6. |
| N9 | Second-hand inspector | Guided photos, condition grading, defect evidence and listing draft. | L/P1 | Combine C1, D6, E6. |

### O. ATARI and embodied

Only build when there is a committed hardware or robot design partner.

| ID | Block | What the builder gets | Form | Effort/Pri | Reuse or gap |
|---|---|---|---|---|---|
| O1 | Robot bridge | MQTT/ROS-style discovery, commands, telemetry and offline behavior. | SDK + protocol | XL/P2 | Gap; hardware variance. |
| O2 | World state and scene graph | Live objects, positions, layout and change history as an agent tool. | Service + SDK | XL/P2 | Reuse spatial work; product API is a gap. |
| O3 | Safety gate | Constraint checks, e-stop and human approval before physical action. | Service | XL/P2 | Gap; certification is the barrier. |
| O4 | Replay and audit | Record intent, action, observation and outcome for every physical step. | Service | L/P2 | Reuse tracing concepts; physical audit is a gap. |

---

## 4. What to Reuse from Jiuwen and Cortex

Do not rebuild these as generic platform blocks.

| Asset | Reuse | Gap to close | Decision |
|---|---|---|---|
| agent-core runtime | Sessions, context, tools/MCP, guardrails, workflows | Product async jobs, artifact model, tenant onboarding | Reuse as substrate |
| ATM | Tool repair, memory guard, topology mutation | Review UX; topology mutation is premature | Adopt repair and memory guard |
| Agent-Core OTel | Trace backbone | Multimodal spans, tenant attribution, builder UI | Reuse and extend |
| TraceHound | Post-session diagnostics | Multimodal dimensions, privacy scrubbing | Internal support and eval mining first |
| memtier | Episodic/semantic memory | Tenancy, consent, multimodal memory | Optional backend |
| Thalamus | Context selection | Product API, task profiles | Internal for high-volume recipes |
| SkillTend/SkillForge | Prompt and recipe maintenance | Golden sets, approval, regression control | Internal quality tool |
| optmod/PerfRouter | Text routing and cost | VLM, ASR, TTS, video, streaming | Text brain of the gateway |
| Channels | Web, desktop, IDE, browser, IM | Embeddable widget, mobile capture, white-label | Reuse protocol, build embed layer |
| JiuwenBox | Sandboxing | Media/GPU jobs and long renders | Reuse for code and browser |
| Agent Teams | Multi-step and team apps | Debuggability and cost | Recipe, not default |
| MicroSwarm | Isolation architecture | Not implemented, migration cost | 6-12 month edge bet |
| Evaluation Framework | Suites, judges, gates | Multimodal rubrics and golden media | Reuse runner, add corpus |

**The real gaps are not algorithms:**

1. product-grade media pipeline
2. trustworthy result contract
3. builder-facing operations layer
4. multimodal evaluation corpus
5. SaaS packaging and unit economics
6. real-time media, only when proven

---

## 5. What Not to Build Yet

| Trap | Why it fails | Better move |
|---|---|---|
| Generic marketplace | Chicken-and-egg supply, curation and liability | Curated recipe gallery with verified evals |
| Every connector | Auth churn, rate limits, long-tail maintenance | Connector SDK plus six reference connectors |
| Generic memory | Ambiguous privacy and evaluation; most apps need scoped facts | User profile, project facts and episode log separately |
| Generic RAG/knowledge base | Jiuwen already has retrieval infrastructure | Integrate and add evidence semantics |
| Multi-agent default | Adds cost, latency and debugging burden | Single agent plus durable job by default |
| No-code agent builder | High support, low differentiation | SDK, templates and recipes with escape hatches |
| Real-time AV first | Latency, echo, consent, device variance and cost | Recorded-first; partner for WebRTC |
| Self-improving skills public | Can silently regress production | Use internally with approval and evals |
| Outcome-based billing early | Attribution is contestable | Meter usage first; add verified outcomes later |
| White-label and compliance early | Pulls platform into bespoke deployments | Sell when a customer pays for it |
| Universal chat UI | Builders need embedded capture surfaces | Web/mobile components plus IM/email delivery |
| Model zoo or leaderboard | Benchmarks age quickly | Per-recipe success and cost |

---

## 6. Roadmap

### 30 days: one golden path

**Ship:** A1, A2, A3, A4, B7, K2, L5, K9, plus three recipes: document extraction with review, recorded video feedback, document-to-audio.

**Do not ship:** marketplace, generic memory, real-time AV, no-code builder, every connector.

**Exit criteria:**

- 5 external builders attempt the path.
- Median time to first successful run < 1 day; p90 < 3 days.
- 2 paid pilots or 3 committed production dates.
- Cost per successful run known for each recipe.
- 60%+ reuse the starter without forking.

### 90 days: from demo to paid product

**Ship:** F5, J2, I1, I2, G4, C1, C2, L7, L2, H1, J7, J8, L4, L5, L11, K1, K7.

**Exit criteria:**

- 20 active builders; 8 apps in production.
- 50%+ of production apps use four or more blocks.
- Median time to first paid customer < 30 days.
- Support < 0.5 tickets per app per week.
- Platform overhead < 300 ms p95 for non-real-time work.
- Two blocks killed or folded.

### 6-12 months: moat

Pick two or three, not all:

- multimodal reliability flywheel: golden media, corrections, failure taxonomy
- cost/latency routing across vision, audio and video
- verified-outcome infrastructure for selected workflows
- real-time media, only with three paying apps
- edge/on-device runtime, only if ATARI is strategic
- deep vertical packs in two verticals with design partners

---

## 7. Metrics

**North star:** verified successful outcomes per active builder per week, paired with cost per verified outcome.

| Layer | Metric | Target |
|---|---|---|
| Activation | Time to first successful end-to-end run | p50 < 1 day; p90 < 3 days |
| Activation | Complete a recipe within 24 hours | > 50% |
| Activation | Deploy a real app within 7 days | > 30% |
| Leverage | Blocks reused per app | >= 4 |
| Leverage | Apps per supported block | >= 5 |
| Reliability | Recipe success rate | > 85% for promoted recipes |
| Reliability | Regression after model/prompt change | < 5% |
| Economics | Cost per successful outcome | Known for top 10 workloads |
| Economics | Gross margin on managed usage | > 40-50% |
| Support | Tickets per 100 apps per week | < 0.5 |
| Ecosystem | Second-app rate | > 25% |
| Counter | Zombie blocks with fewer than 3 consumers after 90 days | Zero |

Kill criteria:

- block with < 3 consumers after 90 days is folded or removed
- recipe below 60% on its golden set is not promoted
- a block that adds > 10% cost or latency without measured quality gain is reverted
- an app needing more than two bespoke platform APIs triggers design review

---

## 8. Packaging for One-Person Companies

**Principle:** free the primitives, price the operations and guarantees.

| Tier | Includes | Price |
|---|---|---|
| Free/local | SDK, local runtime, starter, 3 recipes, BYO model keys, local console | $0 |
| Builder | Hosted dev, 3 apps, limited job-hours and storage, gateway, traces, spend caps | Low monthly + usage |
| Production | Managed jobs, storage/egress, channels, review inbox, evals, tenants, dashboards | Usage-based + model pass-through + storage |
| Enterprise | Dedicated tenant/region, SSO, audit, compliance, white-label, SLA | Annual contract |

Free: SDK, templates, recipes, connector SDK, reference connectors, local console, evaluation format, BYO model/cloud.
Charged: managed execution, media storage/egress, hosted gateway, managed eval runs, review/audit, isolation, compliance, support.

OPC protections:

- hard spend caps and per-run budgets
- transparent cost per task
- BYO model and BYO cloud
- export artifacts, traces, recipes and data
- no per-seat tax for a one-person company
- no mandatory marketplace or revenue share
- clear deprecation policy

---

## 9. Immediate Decisions

1. Pick three reference workloads, not fifty apps.
2. Recruit three design partners who will build in public.
3. Build the spine only: intake, jobs, artifacts, result contract, gateway, starter, metering, console.
4. Ship three recipes with golden sets and published cost/success numbers.
5. Adopt the kill list: no marketplace, no generic memory, no every-connector effort, no real-time AV, no no-code builder, no multi-agent default.
6. Instrument from day one: time to first run, block reuse, cost per outcome, review rate, retention.
7. Review at 90 days: any block with fewer than three consumers is removed.

The platform succeeds when a one-person company can go from an idea to a paid, trustworthy multimodal product in days, and the platform team can say for every block which apps use it, what it saves, and what it costs to keep.
