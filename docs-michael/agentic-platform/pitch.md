# The Agentic App Platform - Simple Pitch

## In one sentence

We build the reusable parts that let small teams create apps that can **see, hear, read, and act** quickly.

---

## The problem

Every team building an AI app rebuilds the same plumbing:

- upload and process images, audio, video and documents
- run long jobs and show progress
- store inputs, outputs and evidence
- connect models, cameras, microphones and tools
- remember context
- ask a human for approval
- check quality and cost
- handle users, billing and security

This takes months before the team can even test the real idea.

---

## Our idea

**Build the common parts once. Let every app reuse them.**

Think of it as a box of Lego for agentic apps. A building block is one reusable capability.

A builder chooses a recipe for documents, video or audio, connects the blocks, and ships the app.

We are not building 50 apps. We are building the parts that all 50 apps need.

---

## What the builder gets

1. **A fast start** - begin from a working recipe, not an empty folder.
2. **Compatible parts** - blocks fit together.
3. **Local and hosted options** - start free on a laptop; scale later.
4. **Cost visibility** - know the cost before and after each run.
5. **Safety and evidence** - consent, audit, approval and traceability.
6. **Less maintenance** - one team maintains the common parts.

---

## Examples of building blocks

These are the **18 blocks we start with**. Some already exist in the platform as primitives; the table shows what we add.

| Building block | Existing primitive | What we add |
|---|---|---|
| Media intake | Model endpoints and file upload | One intake for image, audio, video, PDF and screen; normalized frames, transcripts and pages |
| Job runner | Agent turns and workflow steps | Durable jobs with progress, retries, cancellation, partial results and webhooks |
| Evidence store | Object storage and run artifacts | Inputs, outputs and proof with lineage, signed URLs, TTL and export |
| Structured result | Free-text model output | Typed results with confidence, timestamps, page references, validation and repair |
| Model gateway | Model clients and text routing | Multimodal gateway with fallback, budgets, modality routing and cost visibility |
| Golden-path starter | SDK and examples | One command from zero to a running, deployed app |
| Metering and caps | Token and usage tracking | Per-run, per-tenant multimodal units, quotas, margins and hard spend caps |
| Builder console | Traces and diagnostics | Runs, failures, cost per outcome, replay, alerts and support view |
| Approval gate | Pause and approve hooks | Review inbox with roles, evidence diff, escalation, audit, mobile approval and SLA |
| Evaluation | Text evaluation and judges | Multimodal golden sets, evidence-aware judges, recipe success rates and regression gates |
| Consent receipt | Consent hooks | Versioned, provable consent for camera, voice, location and data use |
| PII/PHI redaction | Text guardrails | Streaming redaction across text, audio and image |
| Context compiler | Context window management | Token-budgeted, modality-aware packing, dedupe and salience ranking |
| App contract and registry | Manifests and MCP tool registration | One manifest plus a versioned, signed registry of reusable blocks |
| Outcome verifier | Evaluation and judges | Checks the real deliverable in a browser, camera or robot, with per-item evidence |
| Embed widget | Web and messaging channels | Drop-in chat, voice and camera widget with theming and domain allowlist |
| Workspace isolation | Tenant concepts | SaaS workspaces, roles, invites and scoped access |
| Golden workloads | Test data and eval suites | Curated multimodal data, failure taxonomy and cost baselines for each recipe |

## Starter recipes

## Starter recipes

- **Document to structured result** - forms, invoices, claims.
- **Video to feedback** - coaching, inspection, review.
- **Document to audio** - reports, lectures, podcasts.

We do not rebuild the engine. We build the car, the dashboard, the service plan and the road assistance.

---

## What we do not build yet

- a huge marketplace
- every possible connector
- generic memory for everything
- real-time audio and video
- a no-code builder
- multi-agent by default
- a model leaderboard

These are tempting, but they slow down the first useful platform.

---

## Why this works

- **Small teams need speed.** A one-person company cannot spend months on plumbing.
- **The same patterns repeat.** Many app ideas need the same jobs, media handling, evidence, approvals and cost controls.
- **The agent runtime is already here.** openJiuwen provides the agent foundation; we add the production parts.
- **Huawei can win at scale.** The same platform can run on Ascend and serve many apps.
- **The long-term advantage is trust.** Reliable results, known cost, safety and evaluation matter more than a long feature list.

---

## Business model

**Free the building blocks. Charge for running them at scale.**

- **Free / local:** SDK, templates, recipes, bring your own model keys
- **Builder:** hosted development, small usage allowance, traces and spend caps
- **Production:** pay for managed jobs, storage, model access and support
- **Enterprise:** private deployment, compliance, SSO and service guarantees

One-person companies should be able to start free, see their costs, and grow without a surprise bill.

---

## What success looks like

- A new builder gets a working app quickly
- A production app reuses several building blocks
- More apps reach production
- Every recipe has a known cost per successful result
- Builders can export their data and leave - trust is part of the product

---

## Short version

> We help small teams build AI apps that can see, hear, read and act.
> Instead of rebuilding uploads, jobs, storage, models, memory, safety and billing, they use our building blocks.
> They start with a recipe and ship quickly.
> We make money when those apps run at scale.

---

## Simple answers to likely questions

**Is this another app?**  
No. It is the platform under many apps.

**Is it a framework?**  
It is an SDK, a set of services and ready-made recipes.

**Must every app use an agent?**  
The agent runs under the hood, but simple steps can stay deterministic tools.

**Why not just use existing libraries?**  
They give pieces. We give the production path: jobs, evidence, review, cost, safety and deployment.

**What is the long-term advantage?**  
Reliable outcomes, lower cost, better evaluation and trusted data - not a longer feature list.

**Who is the first customer?**  
A small team or one-person company that needs to ship a useful multimodal app quickly.
