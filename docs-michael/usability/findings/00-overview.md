[← Index](../README.md) · jiuwenswarm Usability Review

---

# Findings Overview & Root Cause

How to read this folder: the findings are grouped into **theme folders** under
`findings/`, each folder holding single-source concern files. Every finding lives in
exactly one file, numbered within that file and given a short, self-explanatory title.

This page explains why the findings exist and how the concerns are organised. The full
folder → file index is in [README.md](../README.md#findings--single-source-of-truth-for-each-finding).

---

## The root cause

jiuwenswarm is engineered from the inside out. Each feature was built correctly within
its own scope, but usability was not designed as a cross-cutting concern. The result is
a system that works well for users who already understand it and is hostile to those who
do not.

The pattern that recurs across most findings is the same: **the system does not tell
users what is happening.** The data exists — the trajectory system, the health status,
the task plan, the config validation result — but it is not surfaced. Most of the
concerns below are grouped around that recurring failure.

---

## How the concerns are grouped

Each folder groups concerns by *what the user is trying to do or what breaks*, not by
who the user is:

| Theme folder | The concerns it holds |
|---|---|
| `conversation/` | Reading, shaping and explaining the agent's live output; managing messages, history and notifications about finished work. |
| `control/` | Knowing and constraining what the agent may do — permissions, approval & preview, and stopping, resuming or undoing work. |
| `memory-and-privacy/` | Seeing what is remembered and sent out; how long data is kept. |
| `setup-and-operation/` | Running and administering the instance — startup & config, instance management, health & degradation, diagnostics & help, and cost. |
| `onboarding/` | First run, empty states and choosing a mode, and gradual discovery of features. |
| `platform/` | Accessibility & keyboard and mobile / cross-device use. |
| `skills/` | The skill marketplace, authoring & dependencies, and versioning. |
| `collaboration/` | Multi-user identity & isolation and a shared skill library. |
| `extension-surface/` | Building new behaviour into jiuwenswarm from inside — rails, tools, testing and API stability. |
| `application-api/` | Building a product on top of jiuwenswarm as a backend — transport, connection security, and integration. |

A full listing of every file and the finding IDs it contains is in the
[findings index](../README.md#findings--single-source-of-truth-for-each-finding).

---

## Two kinds of gaps

The findings are not all the same kind of problem, and it is worth separating them:

- **Silent features** — the capability or data exists, but the system does not surface
  it. The fix is usually a display or communication change over infrastructure that
  already exists. This is the majority of `conversation/`, `control/`,
  `memory-and-privacy/`, and `setup-and-operation/`.
- **Missing features** — never built at all: keyboard shortcuts and accessibility, mobile
  layout, conversation search, skill versioning, multi-tenancy, and much of the
  `extension-surface/` and `application-api/` findings. These are usability failures of a
  different kind: the question is not "why doesn't the system communicate this?" but "why
  doesn't this exist?"

---

For help reading the corpus by role rather than by concern, the per-persona files in
[`personas/`](../README.md#personas--start-here-if-you-are-a-specific-role) list the
findings that matter to each kind of user.

---
