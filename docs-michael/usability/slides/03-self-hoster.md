# Slide 3 — Self-hoster

> Self-contained spec for building this slide. You should not need any other file to produce it.

## The one line (put this big on the slide)

**Self-hoster** — The person who installs, runs, and keeps one jiuwenswarm instance — usually their own, so they are also a user of it.

## Who this person is

The person who installs, runs, and keeps one jiuwenswarm instance — usually their own, so they are also a user of it.

## What concerns them (the slide body)

This persona's own concerns — show them as a set of cards/tiles, one per group:

**Data Retention** (1):

- [Data is kept indefinitely with no expiry controls

**Cost & Token Economics** (3):

- [No hints about what is consuming the context
- [No visibility into token usage or session cost
- [Trivial prompts still build the full context

**Running & Managing the Instance** (5):

- [Documentation is scattered with no guide for common tasks
- [Logs and config mix languages unpredictably
- [No visibility into which ports and URLs are in use
- [Permission rules can only be edited in raw YAML
- [Upgrading can silently break an existing config

**Startup & Configuration** (4):

- [Missing optional extras fail when used, not at startup
- [Setup ends before credentials are tested
- [The config file has no validation or check tool
- [Wrong credentials surface only on the first chat, never at startup

**First Run** (2):

- [Running the CLI without config gives no next step
- [Setup wizard ends before the model is confirmed working

**Health & Degradation** (1):

- [You aren't told when a subsystem fails

## Speaker notes (short)

"Self-hoster: The person who installs, runs, and keeps one jiuwenswarm instance — usually their own, so they are also a user of it. These are the 16 concerns specific to them; anything shared comes from the base persona above them."
