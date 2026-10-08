# Build: TakeTwo — turn a shaky screen recording into a reproduced bug, a fix, and proof

**The idea.** A user records 20 seconds of a date picker closing by itself and writes "it's broken."
TakeTwo watches the recording, works out the steps they took and what went wrong, reproduces the bug
in a real browser, proposes a fix, and records the same scenario after the fix. A maintainer sees an
issue with reproduction steps, an open PR, and a before/after video — and approves the merge.

**The novelty.** The entry point is a **video from a non-technical user**, and the proof is a
**video**. Coding agents are a crowded field; almost none start from a screen recording.

**The 60-second demo.** Drop in `datepicker-bug.mov` + the repo → the agent lists the inferred steps →
replays them in a headless browser and the console shows the crash → it opens a PR with a one-line fix
and a regression test → it plays the **side-by-side before/after clip** → you click Approve.

---

## 1. Problem

- Users report bugs as a **shaky screen recording** and the words *"it's broken."* No steps, no stack
  trace, no environment.
- Maintainers spend **more time reproducing than fixing** — the real work is guessing intent and
  reconstructing a state they never saw.
- Non-technical reporters (founders, support, designers) can't produce a minimal repro, so triage is a
  bottleneck for every small team without QA.

**Cost today:** every bad report is a round-trip of questions, an unreproduced issue, and maintainer
minutes that scale with volume. **Win:** turn the report itself into a working reproduction.

## 2. Product

A bot installed on a repository. It:

1. **Watches** the recording (or screenshots) and infers the steps taken and the failure.
2. **Reproduces** the bug in a real browser by replaying those steps.
3. **Localizes** the cause and **proposes a fix**.
4. **Records the same scenario after the fix** as proof.
5. Opens an **issue with reproduction steps** and a **PR** — a human maintainer approves the merge.

- **In:** a screen recording or screenshots, and the repo.
- **Out:** an issue with reproduction steps, a PR, and a before/after video.

**Example.** A user uploads 20 seconds of a date picker closing by itself. The agent reproduces it,
opens a PR, and attaches the fixed recording.

## 3. Market & why now

| Signal | Value |
|---|---|
| Market | AI code assistants **$8.1B (2025) → $127B (2032)**, **48% CAGR** (MarketsandMarkets) |
| AI relevance | **Very high** — needs video understanding, browser use, and code writing together |
| Entry point | Video from non-technical users (untapped; competitors start from logged-in devs) |
| Proof | The deliverable is a video, not a diff nobody wants to read |
| Distribution | Open source, shipped as a GitHub bot, run first on the openJiuwen repo — every fix is a public demo |

## 4. Users & jobs-to-be-done

| Persona | Job | Pain today |
|---|---|---|
| Open-source maintainer | Triage incoming bug reports | Can't reproduce; asks for steps |
| Support / QA-less team | Turn a customer clip into an internal ticket | Manual screen-share archaeology |
| Product / design | Report a UI bug they saw | No way to express it in code terms |
| Solo founder | Route a user complaint into a fix | No QA, no time |

## 5. Competition & novelty

| Product | What it does | Gap TakeTwo fills |
|---|---|---|
| **Sherlock** (research demo) | Bug → PR, research-grade | Not productized; no video entry, no proof video |
| **Builder.io** (Fusion / Visual Copilot) | Design/visual → code | Starts from designers, not user bug clips |
| **Jam** | Bug report with recording + console + network | Captures evidence, **doesn't reproduce or fix** |
| **Metabase Repro-Bot** | Narrow, single-app reproduction | Not general, not video-native |
| **Generic coding agents** | Fix from a text issue | Need a repro already written by a human |

**Our wedge:** video in, video out, open source, GitHub-native, human-approved.

---

## 6. Scope

### 6a. Two-day slice (see §13) — the stageable demo

| Keep real | Fake / simplify |
|---|---|
| Video → inferred steps (frames, OCR, cursor tracking) | Arbitrary repos — one **known sample web app** |
| Playwright replay in a real browser | Auth / multi-page flows — a single public route |
| Console/error capture and localization | Full localization — one seeded bug |
| Patch + PR on a sandbox repo | Merge — always human-approved |
| Before/after recording and stitch | Production hardening, scale, billing |

Rule: **every step is deterministic and local**, so the demo never fails on stage.

### 6b. Product scope (post-demo)

Real repos · SPA/React/Vue · authenticated flows · multi-bug clips · GitHub App install · issue
threading · regression-test generation · self-hosted runner · audit log.

---

## 7. System architecture

```
screen recording / screenshots ─┐
repo (clone @ HEAD) ────────────┤
                                ▼
                 ┌──────────────────────────────────┐
                 │            TakeTwo agent          │  (openjiuwen DeepAgent + rails)
                 │  observe → reproduce → fix → prove│
                 └───┬───────┬────────┬───────┬──────┘
                     │       │        │       │  calls tools
     ┌───────────────┘       │        │       └────────────────┐
     ▼                       ▼        ▼                        ▼
 video tools            browser tools  repo/code tools     delivery tools
 (frames, OCR,          (Playwright:   (grep, read,        (open_issue,
  cursor, steps)         click, type,   patch, run tests,   open_pr,
                         console, DOM)  git blame)          record + stitch)
     │                       │        │                        │
     └───────────┬───────────┴────────┴───────────┬───────────┘
                 ▼                                 ▼
        repro.json / fix.diff                issue + PR + proof.mp4
                 ▼                                 ▼
            sandboxed runner  ────────▶  maintainer review UI / GitHub check
```

## 8. The pipeline (five stages)

1. **Observe (video understanding).** Extract frames (ffmpeg), detect the cursor and click clusters
   (OpenCV), OCR visible labels (PaddleOCR/Tesseract), optionally transcribe narration
   (faster-whisper). Emit an ordered, timestamped **step list** and the **last good → bad state**
   transition that defines the bug.
2. **TakeTwo (reproduce).** Launch the app in a sandboxed **Playwright** browser, replay each step
   grounded by **visible text / role** (accessibility tree), not raw pixels. Capture console errors,
   network failures, and DOM/visual state at the failure point. Emit `repro.json` (steps + evidence)
   and the **before** recording. If it can't reproduce, it asks one clarifying question with a
   screenshot.
3. **Localize.** Use the captured stack trace/source maps; fall back to searching the repo for the
   visible strings, the failing route, and `git blame`. Emit candidate files/commits.
4. **Fix.** Coding agent proposes a minimal patch and a **regression test derived from the repro**;
   run the existing suite plus the new test in the sandbox. Emit `fix.diff`.
5. **Prove & deliver.** Re-run the same steps on the patched branch, record the **after** clip, stitch
   a labelled side-by-side `proof.mp4`, open the **issue** (steps + evidence) and a **draft PR**
   (diff + test + proof).

## 9. openjiuwen pieces used

| Piece | What it gives us | Where |
|---|---|---|
| `create_deep_agent(...)` | The TakeTwo agent: tools, prompt, rails, task loop | `openjiuwen/harness/factory.py` |
| `@tool` | Each observe/taketwo/localize/fix/deliver action as a callable | `openjiuwen/core/foundation/tool/tool.py` |
| `MemoryRail` | Remembers repo conventions, flaky selectors, prior fixes | `openjiuwen/harness/rails/memory/memory_rail.py` |
| `Runner.run_agent(agent, {...})` | Runs the agent per submission | `openjiuwen/core/runner` |
| **MCP** | Wraps Playwright + OCR as reusable MCP servers | `jiuwenswarm/server/runtime/mcp/registry.py` |
| Streamlit / `jiuwenswarm-web` | Maintainer review surface (steps · diff · video) | `jiuwenswarm/channels/web/app_web.py` |

The vision model reads frames; the text model plans steps, writes the patch, and drafts the issue/PR.

## 10. Tech stack

| Concern | Choice |
|---|---|
| Orchestration | Python 3.11, openjiuwen (`create_deep_agent`, `Runner`) |
| Video | `ffmpeg` / `imageio-ffmpeg` (sample), OpenCV (cursor/motion), PaddleOCR (labels), faster-whisper (narration) |
| Browser | Playwright (Chromium) — click/type/console/DOM/trace; recording via context video |
| Delivery | PyGithub / GitHub App (issues, draft PRs, checks) |
| Sandbox | Docker: no prod data, scoped secrets, egress allow-list, CPU/time caps |
| Serving | FastAPI webhook + queue; runner worker per job |
| Quality | ruff, mypy, pytest; golden runs for the demo |

## 11. Artifacts & data model

```
submission.json   { repo, video, screenshots[], reporter, install_id }
timeline.json     [ { t, frame, label, cursor, click, text } ]
repro.json        { url, steps[], failure{console, network, dom}, before_clip }
fix.diff          unified diff + new test
proof.mp4         before | after, labelled, timestamped
issue.md / pr.md  rendered from the above
```

Everything is written under a per-job workspace and attached to the GitHub issue/PR as artifacts.

## 12. Safety, trust & governance

- **Never auto-merge.** The bot opens a **draft** PR; a human approves. This is the product's core
  promise, not a limitation.
- **Sandbox by default.** Every taketwo/fix runs in a container with no production data, scoped
  tokens, an egress allow-list, and CPU/time caps.
- **Evidence over claims.** Steps cite timestamps; the fix cites the console/stack trace it resolves;
  the proof video is the same scenario, same seed.
- **Least privilege.** GitHub App with the minimum scopes; per-repo opt-in; rate limits; full audit log.
- **Honest failure.** If it can't reproduce, it opens an issue with what it did see and asks **one**
  precise question rather than guessing a fix.

## 13. Two-day slice (hackathon) — day by day

**Day 1 — make it reproduce (8h).**

- **0–1h · Scaffold + the sample app.** A tiny web app with a **seeded date-picker bug**, plus
  `data/datepicker-bug.mov` (shot for the demo). Deterministic content only.
- **1–3h · Video tools.** `app/video.py`: `extract_frames`, `detect_cursor`, `ocr_labels`,
  `infer_steps` → `timeline.json` / ordered step list.
- **3–5h · Browser tools (MCP).** `app/browser.py` wrapping Playwright: `open_app`, `act(step)`,
  `capture_console`, `snapshot`, `record`. TakeTwo the inferred steps; stop at the failure; write
  `repro.json` + the **before** clip.
- **5–7h · Wire the agent.** `create_deep_agent(model, system_prompt, tools=[...], rails=[MemoryRail])`
  with the Observe → TakeTwo → Localize → Fix → Prove prompt; run via `Runner.run_agent`.
- **7–8h · Lock it.** Save a known-good run to `data/golden/` as the stage fallback.

**Day 2 — make it fix and prove (8h).**

- **0–2h · Localize + fix.** Tools: `search_repo`, `read_file`, `apply_patch`, `run_tests`. Seed the
  sample repo so the fix is a real one-liner plus a regression test derived from `repro.json`.
- **2–4h · Proof video.** Re-run the steps on the patched branch, record the **after** clip, stitch
  before|after with ffmpeg, write `proof.mp4`.
- **4–6h · Deliver.** `open_issue` (steps + evidence) and `open_pr` (diff + test + proof) on a sandbox
  repo; render both from `issue.md`/`pr.md`.
- **6–7h · Review UI + fallback.** A two-pane Streamlit view (Steps · Diff · Video) reading the job
  workspace; cache outputs; record a backup run.
- **7–8h · Rehearsal.** The 60-second script below, twice.

## 14. Demo script (60s)

1. "Here's how bugs actually arrive." Drop `datepicker-bug.mov`.
2. Watch it list the **steps it inferred** — pick a date, open the picker, it closes by itself.
3. "It's replaying it right now." The console flashes the error; `repro.json` fills in.
4. It opens the **PR**: a one-line fix + a test. `git blame` points at the culprit commit.
5. It plays **before | after** side by side. "Same steps. Bug gone."
6. "A human approves. That's the whole product."

## 15. Risks & fallbacks

| Risk | Fix |
|---|---|
| Can't reproduce from a shaky clip | Ask **one** clarifying question with a screenshot; open a well-formed issue regardless |
| Vision inference of steps is wrong | Ground steps in the accessibility tree (labels/roles), not pixels; let the agent retry each step |
| Model nondeterminism on stage | temperature ≈ 0, seeded sample app, `golden/` fallback |
| Browser instability | Playwright trace + retries; pin Chromium; record locally, not live |
| Sandbox escape / secrets | container, scoped tokens, egress allow-list, never auto-merge |
| Scope creep to "any repo" | demo is one seeded app; generality is post-demo |

## 16. Open source & go-to-market

- **License:** permissive (Apache-2.0); the vision + browser + patch pipeline is the moat, not the wrapper.
- **Beachhead:** run it on the **openJiuwen repo first** — every accepted fix is a public demo and a
  distribution loop.
- **Distribution:** GitHub App marketplace listing, a `taketwo` CLI, and a "attach a clip" issue form.
- **Metric that sells itself:** time-to-repro before vs after, and % of clips that become merged fixes.

## 17. Success metrics

| Type | Metric | Target (beta) |
|---|---|---|
| North star | % of submitted clips that become a merged fix | > 20% |
| Repro | Successful reproduction rate | > 50% |
| Quality | PR acceptance rate / change-request rate | track |
| Trust | False-positive fixes (breaks tests) | ~0 |
| Value | Maintainer minutes saved per triaged bug | > 20 min |
| Guardrail | Clips that fail safely with a good issue | > 90% |

## 18. Roadmap

- **Week 0 (2 days):** the slice above — one seeded app, one bug, end-to-end.
- **Week 1–2:** generalize input (real repos, SPA, authenticated flows); GitHub App; queue + sandbox.
- **Week 3–6:** regression-test generation, multi-bug clips, flaky-selector memory, self-hosted runner.
- **GA:** marketplace listing, usage telemetry opt-in, audit log, SLAs; first 100 open-source repos.

## 19. Stretch (only if time)

Mobile/browser-extension capture · "explain the bug back to the reporter" reply · auto-bisect to the
offending commit · fix verified against the reporter's exact browser/OS fingerprint.
