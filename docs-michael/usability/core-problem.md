[← Index](README.md) · jiuwenswarm Usability Review

---

# The Core Problem and the Highest-Leverage Fixes

jiuwenswarm is engineered from the inside out. Each feature was built correctly
within its own scope, but usability was not designed as a cross-cutting concern.
The result: a system that works well for users who already understand it and is
hostile to users who do not.

**The five changes that would move the score the most:**

1. **Startup health check with a printed report.** Validate model credentials,
   channel credentials, and optional dependencies before serving the first request.
   Print a green/yellow/red summary. Eliminates the most common onboarding failure.

2. **Setup wizard that does not exit until a message succeeds.** Extend
   `ModelSetupGuide.tsx` to include inline credential testing and a "send first
   message" step. Turns a 40% first-run failure rate into near zero.

3. **Actionable error messages with a machine-readable code.** Every error surfaced
   to the user must include: what happened, why, and what to do. Add `ERR_*` codes
   for searchability. Dramatically reduces support requests.

4. **Stop button with defined semantics and a completion card.** Users need to trust
   that they can interrupt the agent safely. The trajectory system already has the
   data needed to produce "here is what completed and what did not."

5. **Health indicator in the Web UI sidebar.** A green/yellow/red dot that reflects
   memory, channels, and OTel status. Two hours of implementation that eliminates
   an entire class of silent failures where users operate with broken subsystems.

These five changes require no architectural redesign. They are surface-level
improvements on top of what already exists, and they address the root cause of the
low usability score: the system does not tell users what is happening.
