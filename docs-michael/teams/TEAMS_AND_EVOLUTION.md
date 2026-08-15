# JiuwenClaw — Teams & Evolution: Deep Developer Guide

> **Scope:** Everything you need to become an expert on how teams are built, managed, and evolved in JiuwenClaw + the OpenJiuwen core. Covers architecture, data flow, control flow, the evolution pipeline, distributed mode, skill management, and what should come next.
>
> **Accuracy note:** All code blocks and data structures were verified directly against source files. No fields, class names, or method signatures are invented.

---

## Table of Contents

1. [Big Picture Architecture](#1-big-picture-architecture)
2. [Project Layout — What Lives Where](#2-project-layout--what-lives-where)
3. [Core Concepts & Vocabulary](#3-core-concepts--vocabulary)
4. [TeamAgent — The SDK Object](#4-teamagent--the-sdk-object)
5. [TeamManager — The Harness Lifecycle Controller](#5-teammanager--the-harness-lifecycle-controller)
6. [Team Configuration — Full Schema](#6-team-configuration--full-schema)
7. [Member Lifecycle — Spawn to Shutdown](#7-member-lifecycle--spawn-to-shutdown)
8. [Rails — The Middleware Layer](#8-rails--the-middleware-layer)
9. [Evolution System — How Skills Improve](#9-evolution-system--how-skills-improve)
10. [Skill Management — Directory Layout & Flow](#10-skill-management--directory-layout--flow)
11. [Team Monitor & Event Streaming](#11-team-monitor--event-streaming)
12. [Distributed Mode](#12-distributed-mode)
13. [Web Layer & Frontend](#13-web-layer--frontend)
14. [Complete Data Flow Diagrams](#14-complete-data-flow-diagrams)
15. [Complete Control Flow — What Triggers What](#15-complete-control-flow--what-triggers-what)
16. [Key File Index](#16-key-file-index)
17. [Advantages of the Current Design](#17-advantages-of-the-current-design)
18. [Known Challenges & Rough Edges](#18-known-challenges--rough-edges)
19. [What Can & Should Be Done Next](#19-what-can--should-be-done-next)

---

## 1. Big Picture Architecture

```
+---------------------------------------------------------------------+
|                        USER / WEB FRONTEND                          |
|              (SPA via jiuwenclaw-web on port 5173)                  |
+----------------------------+----------------------------------------+
                             | WebSocket + HTTP REST
+----------------------------v----------------------------------------+
|                    JIUWENCLAW SERVER (port 19000)                   |
|   +------------------------------------------------------------+    |
|   |                    TeamManager (harness)                   |    |
|   |   - One singleton per channel                              |    |
|   |   - Owns TeamAgent instances keyed by session_id           |    |
|   |   - Owns skill rails, evolution watchers, stream tasks     |    |
|   +------------------------------+------------------------------+    |
|                                  | creates / controls               |
|   +------------------------------v------------------------------+    |
|   |              TeamAgent (openjiuwen SDK)                    |    |
|   |   - blueprint: TeamAgentBlueprint (frozen, static)         |    |
|   |   - state: TeamAgentState (mutable runtime)                |    |
|   |   - harness: TeamHarness (owns DeepAgent LLM loop)         |    |
|   |   - _coordination: CoordinationKernel (event routing)      |    |
|   +------+------------------------------------------+----------+    |
|          | spawns                                   | monitors      |
|   +------v------------------+         +------------v-----------+    |
|   |  TeamMember(s)          |         |  TeamMonitor           |    |
|   |  - DeepAgent each       |         |  - event stream        |    |
|   |  - agent_customizer     |         |  - state queries       |    |
|   |  - own rails            |         +------------------------+    |
|   +------+------------------+                                       |
|          | intercepts all LLM+tool calls                            |
|   +------v--------------------------------------------------+       |
|   |               Rail Chain (per member/leader)            |       |
|   |  SkillEvolutionRail, TeamSkillRail, TeamSkillCreateRail  |       |
|   +---------------------------------------------------------+       |
+---------------------------------------------------------------------+
```

**Key insight:** JiuwenClaw is the "harness layer" that wraps the OpenJiuwen SDK's `TeamAgent`. The SDK owns the actual multi-agent runtime; the harness adds session management, web connectivity, skill evolution, and distributed mode support.

---

## 2. Project Layout — What Lives Where

```
jiuwenclaw/
+- jiuwenclaw/
   +- agents/
   |  +- harness/
   |     +- team/                          <- PRIMARY FOCUS
   |     |  +- team_manager.py            # Lifecycle controller (~1800 lines)
   |     |  +- config_loader.py           # YAML -> TeamAgentSpec (~307 lines)
   |     |  +- bootstrap.py               # Set agent_teams home dir
   |     |  +- distributed_runtime.py     # PyZMQ + PostgreSQL support (~413 lines)
   |     |  +- team_runtime_inheritance.py# Build member rails (~504 lines)
   |     |  +- event_types.py             # SDK->frontend event mapping (~122 lines)
   |     |  +- monitor_handler.py         # Wrap TeamMonitor for web
   |     |  +- remote_member_bootstrap.py # Distributed bootstrap
   |     |  +- a2x/                       # A2X registry for blank agent reservation
   |     |  +- rails/
   |     |     +- team_member_skill_toolkit_rail.py
   |     |     +- team_workspace_report_path_rail.py
   |     +- common/
   |        +- tools/                     # Toolkits (search, browser, audio...)
   |        +- rails/                     # Common rails (avatar, stream event...)
   +- channels/
   |  +- web/
   |     +- app_web.py                    # SPA server + API proxy (~999 lines)
   +- server/
      +- runtime/
         +- agent_adapter/
            +- team_helpers.py            # Utility helpers for team agents

openjiuwen/ (michael-agent-core)
+- agent_teams/
|  +- agent/
|  |  +- team_agent.py          # TeamAgent class
|  |  +- blueprint.py           # TeamAgentBlueprint (frozen dataclass)
|  |  +- state.py               # TeamAgentState (mutable dataclass)
|  |  +- spawn_manager.py       # Spawn teammates
|  |  +- recovery_manager.py    # Restart failed members
|  |  +- session_manager.py     # Session lifecycle
|  |  +- stream_controller.py   # Output streaming
|  |  +- coordination/          # CoordinationKernel + EventBus
|  +- schema/
|  |  +- blueprint.py           # TeamAgentSpec, LeaderSpec, TransportSpec, StorageSpec
|  |  +- team.py                # TeamSpec, TeamMemberSpec, TeamRole, TeamRuntimeContext
|  |  +- deep_agent_spec.py     # DeepAgentSpec
|  +- tools/
|  |  +- database/              # SQLite/PostgreSQL DAOs (member, task, message, team)
|  |  +- team.py                # TeamBackend
|  +- monitor/
|  |  +- team_monitor.py        # TeamMonitor
|  +- messager/                 # inprocess + pyzmq backends
|
+- agent_evolving/
   +- signal/
   |  +- base.py                # EvolutionSignal, EvolutionCategory, EvolutionTarget
   |  +- from_conv.py           # ConversationSignalDetector
   +- trajectory/
   |  +- types.py               # Trajectory, TrajectoryStep, LLMCallDetail, ToolCallDetail
   |  +- store.py               # TrajectoryStore protocol, FileTrajectoryStore, InMemoryTrajectoryStore
   |  +- aggregator.py          # TeamTrajectory (aggregates member trajectories)
   |  +- builder.py             # Build trajectory from execution
   |  +- extractor.py           # Extract data from trajectory
   +- optimizer/
   |  +- skill_call/
   |     +- experience_optimizer.py
   |     +- skill_rewriter.py
   +- agent_rl/                 # Reinforcement learning pipeline (separate subsystem)
```

---

## 3. Core Concepts & Vocabulary

| Term | Definition |
|------|-----------|
| **TeamAgent** | The SDK object that represents a running multi-agent team. Has a leader + N members. |
| **TeamManager** | JiuwenClaw's harness singleton managing TeamAgent lifecycle across sessions. |
| **Rail** | A middleware decorator that intercepts LLM/tool calls on a `DeepAgent`. |
| **Trajectory** | Full record of one agent conversation: every LLM call + every tool call + timing. Stored in JSONL via `FileTrajectoryStore`. |
| **EvolutionSignal** | Detected pattern from a trajectory/conversation indicating something worth learning. Has `signal_type`, `evolution_type`, `section`, `excerpt`, `tool_name`, `skill_name`, `context`. |
| **ConversationSignalDetector** | Detects signals from `Trajectory` or message list. Finds: `execution_failure`, `user_correction`, `script_artifact`, `collaboration_*`. |
| **SkillEvolutionRail** | Member rail: captures trajectories, auto-saves skill improvements (no approval). |
| **TeamSkillRail** | Leader-only rail: proposes team-wide skill improvements (requires approval). |
| **TeamSkillCreateRail** | Leader-only rail: proposes brand-new skill creation (requires approval). |
| **agent_customizer** | Callable field on `TeamAgentSpec`, invoked on each member's `DeepAgent` after creation. Mounts rails and tools. |
| **Session ID** | Unique ID for one user conversation session. `TeamManager` maps `session_id -> TeamAgent`. |
| **Member Name** | DB identifier for a team member (e.g., `team_leader`, `analyst`). Stable across restarts. |
| **A2X Registry** | Service tracking available "blank" claw instances for distributed teammate assignment. |

---

## 4. TeamAgent — The SDK Object

**Source:** `openjiuwen/agent_teams/agent/team_agent.py`

### Structure

`TeamAgent` extends `BaseAgent` and uses **composition** with specialized manager objects:

```python
class TeamAgent(BaseAgent):
    def __init__(self, card):
        self._configurator = AgentConfigurator(card)
        self._state = TeamAgentState()
        self._spawn_manager    = SpawnManager(...)
        self._recovery_manager = RecoveryManager(...)
        self._session_manager  = SessionManager(...)
        self._stream_controller = StreamController(...)
        self._coordination     = CoordinationKernel(self)

    # Properties delegating to _configurator:
    @property blueprint  -> TeamAgentBlueprint       # frozen static config
    @property state      -> TeamAgentState            # mutable runtime state
    @property infra      -> TeamInfra                 # per-process infrastructure
    @property resources  -> PrivateAgentResources
    @property harness    -> TeamHarness | None        # owns the underlying DeepAgent
```

### TeamAgentBlueprint (frozen, never mutates)

**Source:** `openjiuwen/agent_teams/agent/blueprint.py`

```python
@dataclass(frozen=True, slots=True)
class TeamAgentBlueprint:
    card: AgentCard
    spec: TeamAgentSpec        # Full spec (team_name, lifecycle, agents, transport, storage...)
    ctx: TeamRuntimeContext    # role, member_name, persona, team_spec, messager_config, db_config...
    role_policy: str
    language: str

    # Convenience properties:
    @property role        -> TeamRole           # LEADER | TEAMMATE  (from ctx.role)
    @property member_name -> Optional[str]      # (from ctx.member_name)
    @property lifecycle   -> str                # (from spec.lifecycle)
    @property team_spec   -> Optional[TeamSpec] # (from ctx.team_spec)
```

### TeamAgentState (mutable, minimal)

**Source:** `openjiuwen/agent_teams/agent/state.py`

```python
@dataclass
class TeamAgentState:
    team_session: Optional[AgentTeamSession] = None
    team_member: Optional[TeamMember] = None
    pending_user_query: str = ""
    event_listeners: list = field(default_factory=list)
```

**Important:** `session_id` is intentionally NOT stored here. It lives in a contextvar at `openjiuwen.agent_teams.context.get_session_id`. This avoids "two truths" synchronisation bugs.

### TeamAgentSpec — The Build-time Spec

**Source:** `openjiuwen/agent_teams/schema/blueprint.py`

```python
class TeamAgentSpec(BaseModel):
    agents: dict[str, DeepAgentSpec]   # keys: "leader", "teammate"
    team_name: str = "agent_team"
    lifecycle: str = TeamLifecycle.TEMPORARY
    teammate_mode: str = "build_mode"
    spawn_mode: str = "process"        # "inprocess" | "process"
    leader: LeaderSpec = LeaderSpec()
    predefined_members: list[TeamMemberSpec] = []
    model_pool: list[ModelPoolEntry] = []
    model_router: Optional[ModelRouterConfig] = None
    model_pool_strategy: Literal["round_robin", "by_model_name", "router"] = "round_robin"
    team_mode: Literal["default", "predefined", "hybrid"] | None = None
    transport: Optional[TransportSpec] = None  # auto-filled to inprocess when spawn_mode="inprocess"
    storage: Optional[StorageSpec] = None
    worktree: Optional[WorktreeConfig] = None
    workspace: Optional[TeamWorkspaceConfig] = None
    metadata: dict[str, Any] = {}
    enable_hitt: bool = False          # Human-in-the-Team capability ceiling
    language: Optional[str] = None
    agent_customizer: Optional[Callable[..., None]] = None  # not serialized
    memory: Optional[TeamMemoryConfig] = None
```

`spec.build()` creates and returns a fully configured `TeamAgent`.

---

## 5. TeamManager — The Harness Lifecycle Controller

**Source:** `jiuwenclaw/agents/harness/team/team_manager.py`

### Singleton Pattern

```python
_team_managers: dict[str, TeamManager] = {}

def get_team_manager(channel_id: str | None = None) -> TeamManager:
    # One TeamManager per channel (usually one per process)
```

### Internal State

```python
class TeamManager:
    # Primary maps — keyed by session_id
    _team_agents: dict[str, TeamAgent]
    _team_monitors: dict[str, TeamMonitorHandler]
    _stream_tasks: dict[str, asyncio.Task]

    # Active/pending session tracking
    _active_session_id: str | None
    _active_team_name: str | None
    _pending_session_id: str | None
    _pending_team_name: str | None

    # Evolution rails — keyed by session_id
    _team_skill_rails: dict[str, TeamSkillRail]
    _team_member_skill_evolution_rails: dict[str, list[SkillEvolutionRail]]
    _team_skill_create_rails: dict[str, TeamSkillCreateRail]
    _team_rail_contexts: dict[str, RailBuildContext]   # for hot-reload

    # Evolution watchers and skill sync
    _team_evolution_watchers: dict[str, asyncio.Task]
    _team_skill_sync_targets: dict[str, tuple[Path, Path]]
```

### Session Lifecycle

```
create_team()
    |
    v
[CREATED / STORED]
    |
prepare_runtime_activation()
    |
    v
[PENDING]  <-- prepare_session_switch() stops old session
    |
commit_runtime_ready()
    |
    v
[ACTIVE]  -- interact() / stream() work here
    |         \
terminate()   pause()
    |             |
[TERMINATED]  [PAUSED]
    |
cancel() / delete()
```

### Key Methods

```python
async def create_team(spec, session_id, config) -> TeamAgent:
    # 1. spec.build() -> TeamAgent
    # 2. Copy global skills -> team-workspace/skills/ (once, via .team_skills_copied marker)
    # 3. Build and mount evolution rails
    # 4. Register team monitor
    # 5. Store in _team_agents[session_id]

async def prepare_runtime_activation(session_id) -> None:
    # Stop previously active session; set _pending_session_id

async def commit_runtime_ready(session_id) -> None:
    # Promote pending -> active; start stream task and monitor

async def interact(user_message, session_id) -> None:
    # Route user message to the active TeamAgent's leader

async def update_evolution_config(config) -> None:
    # Hot-reload: mount or unmount SkillEvolutionRail / TeamSkillRail / TeamSkillCreateRail
    # on all active sessions without restart

def sync_team_skills(session_id) -> None:
    # After skill proposal approved: copy team-workspace/skills/ -> global skills/
```

---

## 6. Team Configuration — Full Schema

**Source:** `config_loader.py` reads from the main YAML config under `modes.team`.

```yaml
modes:
  team:
    my_team:
      team_name: my_team
      lifecycle: persistent           # "persistent" keeps DB; "temporary" resets each time
      teammate_mode: build_mode
      spawn_mode: inprocess           # "inprocess" | "process"

      leader:
        member_name: team_leader      # DB primary key -- NEVER change after first run
        display_name: "Team Leader"
        persona: "You are a project manager..."
        model_name: null              # Optional: override pool model selection

      agents:
        leader:
          model:
            model_client_config:
              model_name: gpt-4
              api_key: "${OPENAI_API_KEY}"
            model_config_obj:
              temperature: 0.7
          max_iterations: 200
          completion_timeout: 600.0
        teammate:
          model:
            model_client_config:
              model_name: gpt-4-turbo
          max_iterations: 100

      predefined_members:
        - member_name: analyst
          display_name: "Data Analyst"
          persona: "You are a data analyst..."
          role_type: teammate
          model_name: gpt-4           # Optional pool override

      workspace:
        enabled: true
        root_path: ~                  # Optional path override

      transport:
        type: inprocess               # OR pyzmq for distributed

      storage:
        type: sqlite                  # OR postgresql
        params:
          connection_string: team.db

      runtime:                        # Only for distributed mode
        mode: distributed
        role: leader                  # "leader" | "teammate"

      metadata: {}

react:
  evolution:
    auto_scan: true                   # Master switch for SkillEvolutionRail + TeamSkillRail
    skill_create: true                # Switch for TeamSkillCreateRail

models:
  defaults:
    - is_default: true
      model_client_config:
        model_name: gpt-4
        api_key: "${OPENAI_API_KEY}"
      model_config_obj:
        temperature: 0.95
```

**Environment variable overrides (highest priority):**

```bash
EVOLUTION_AUTO_SCAN=true    # Overrides react.evolution.auto_scan
SKILL_CREATE=true           # Overrides react.evolution.skill_create
```

---

## 7. Member Lifecycle — Spawn to Shutdown

### 7.1 Predefined Members (auto-spawned at team start)

```
spec.build() -> TeamAgent
    |
    +- Build leader DeepAgent; apply agent_customizer
    |
    +- For each member in spec.predefined_members:
        +- Insert/load member record in DB
        +- Build DeepAgent with teammate config
        +- Apply agent_customizer
        +- Member is READY
```

### 7.2 Dynamic Spawn (leader LLM calls spawn_member tool)

```
Leader LLM -> spawn_member(name="researcher", persona="...")
    |
    v
SpawnManager.spawn_member()
    +- Validate name uniqueness
    +- Insert member in DB
    +- Allocate model from pool
    +- Build DeepAgent
    +- Apply agent_customizer (same function)
    +- Member is READY; leader can assign tasks
```

In **distributed mode**, additionally:
1. Insert in shared PostgreSQL
2. Publish bootstrap envelope via PyZMQ pub socket
3. Remote claw receives envelope, builds DeepAgent, applies agent_customizer
4. Sends ACK back to leader

### 7.3 The agent_customizer

**Source:** `team_manager.py -> build_agent_customizer()`

A closure stored on `TeamAgentSpec.agent_customizer`. Called by the SDK on each member's `DeepAgent` after creation.

```python
def build_agent_customizer(session_id, team_ws_skills_dir, config, ...) -> Callable:

    def agent_customizer(deep_agent: DeepAgent) -> None:
        # 1. Copy selected skills to member workspace; write skills_state.json
        # 2. Call build_member_rails() and mount each rail on deep_agent.rail_manager
        # 3. Inherit whitelisted tools via filter_inheritable_ability_cards()
        #    and add each to deep_agent.ability_manager

    return agent_customizer
```

### 7.4 What build_member_rails() Mounts

**Source:** `team_runtime_inheritance.py`

Always mounted (all roles):
- `RuntimePromptRail` — system prompt injection
- `ResponsePromptRail` — response formatting
- `SysOperationRail` — file system ops (logged as "FileSystemRail")
- `JiuClawStreamEventRail` — SSE event streaming
- `TaskPlanningRail` — task decomposition
- `SecurityRail` — content filtering
- `HeartbeatRail` — keep-alive
- `AvatarPromptRail` — persona prompt
- `TeamWorkspaceReportPathRail` — workspace path injection (if `team_ws_root` set)

Leader-only (if `EVOLUTION_AUTO_SCAN=true` AND `team_ws_skills_dir` set):
- `TeamSkillRail(auto_save=False, team_id=..., trajectories_dir=...)`

Leader-only (if `SKILL_CREATE=true` AND `team_ws_skills_dir` set):
- `TeamSkillCreateRail(auto_trigger=True)`

Non-leader (if `team_ws_skills_dir` set):
- `SkillEvolutionRail` (via `build_skill_evolution_rail()`, only mounted if `auto_scan` enabled)

### 7.5 Rail Whitelist (inherited from leader)

```python
RAIL_WHITELIST = frozenset({
    "RuntimePromptRail", "ResponsePromptRail", "JiuClawStreamEventRail",
    "TaskPlanningRail", "SecurityRail", "HeartbeatRail", "AvatarPromptRail",
    "FileSystemRail", "TeamSkillRail", "TeamSkillCreateRail",
    "SkillEvolutionRail", "TeamWorkspaceReportPathRail",
})
```

### 7.6 Tool Whitelist (inherited from leader)

40 tools including: `free_search`, `fetch_webpage`, `paid_search`, `vision`, `audio`, `image_ocr`, `generate_image`, `search_skill`, `install_skill`, `uninstall_skill`, `task_tool`, `send_message`, `create_note`, `create_calendar_event`, `search_contact`, `call_phone`, and more.

---

## 8. Rails — The Middleware Layer

Rails intercept every LLM call and every tool call on a `DeepAgent`.

### 8.1 Evolution Rails Summary

| Rail | Role | auto_save | Approval | What it does |
|------|------|-----------|----------|-------------|
| `SkillEvolutionRail` | Teammate | `True` | No | Captures trajectory; detects signals; saves improved SKILL.md section immediately |
| `TeamSkillRail` | Leader | `False` | Yes | Captures team trajectories; buffers proposals; syncs after approval |
| `TeamSkillCreateRail` | Leader | N/A | Yes | Proposes entirely new skills; `auto_trigger=True` |
| `TeamWorkspaceReportPathRail` | All | N/A | No | Injects team workspace path into agent context |

### 8.2 Hot-Mount / Unmount

`TeamManager.update_evolution_config()` can add or remove evolution rails from live sessions without restarting. It uses `_team_rail_contexts` to know each session's configuration.

---

## 9. Evolution System — How Skills Improve

### 9.1 Verified Data Structures

**Source:** `openjiuwen/agent_evolving/signal/base.py`

```python
class EvolutionCategory(str, Enum):
    SKILL_EXPERIENCE = "skill_experience"   # Improve existing skill
    NEW_SKILL        = "new_skill"          # Create a new skill

class EvolutionTarget(str, Enum):
    # Targets a section of SKILL.md (used by optimizers, NOT a field on EvolutionSignal)
    DESCRIPTION = "description"
    BODY        = "body"
    SCRIPT      = "script"

@dataclass
class EvolutionSignal:
    signal_type:    str                          # e.g. "execution_failure", "user_correction"
    evolution_type: EvolutionCategory            # SKILL_EXPERIENCE or NEW_SKILL
    section:        str                          # Target section in SKILL.md
    excerpt:        str                          # Relevant text from conversation/trace
    tool_name:      Optional[str] = None
    skill_name:     Optional[str] = None
    context:        Optional[Dict[str, Any]] = None

    def to_dict(self) -> dict: ...

def make_signal_fingerprint(signal: EvolutionSignal) -> Tuple[str, str, str, str]:
    # Returns (signal_type, tool_name or "", skill_name or "", excerpt[:200])
    # Used for deduplication
```

**Source:** `openjiuwen/agent_evolving/trajectory/types.py`

```python
@dataclass
class LLMCallDetail:
    model: str
    messages: List[Dict[str, Any]]
    response: Optional[Dict[str, Any]] = None
    tools: Optional[List[Dict[str, Any]]] = None
    usage: Optional[Dict[str, Any]] = None
    meta: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ToolCallDetail:
    tool_name: str
    call_args: Any = None
    call_result: Any = None
    tool_description: Optional[str] = None
    tool_schema: Optional[Dict[str, Any]] = None
    tool_call_id: Optional[str] = None

StepDetail = Union[LLMCallDetail, ToolCallDetail]

@dataclass
class TrajectoryStep:
    kind: Literal["llm", "tool"]
    error: Optional[Dict[str, Any]] = None          # dict, not string
    start_time_ms: Optional[int] = None
    end_time_ms: Optional[int] = None
    detail: Optional[StepDetail] = None
    reward: Optional[float] = None                  # from PRM or SignalDetector
    prompt_token_ids: Optional[List[int]] = None
    completion_token_ids: Optional[List[int]] = None
    logprobs: Optional[Any] = None
    meta: Dict[str, Any] = field(default_factory=dict)   # operator_id, invoke relationships...

@dataclass
class Trajectory:
    execution_id: str                               # unique identifier
    steps: List[TrajectoryStep]
    source: str = "offline"                         # "online" | "offline"
    case_id: Optional[str] = None
    session_id: Optional[str] = None
    cost: Optional[Dict[str, int]] = None           # {"input_tokens": N, "output_tokens": M}
    meta: Dict[str, Any] = field(default_factory=dict)   # member_id, member_count...
```

**Source:** `openjiuwen/agent_evolving/trajectory/store.py`

```python
class TrajectoryStore(Protocol):
    def save(self, trajectory, version=None) -> None: ...
    def load(self, execution_id, version=None) -> Optional[Trajectory]: ...
    def query(self, version=None, **filters) -> List[Trajectory]: ...

class InMemoryTrajectoryStore:
    # Stores in memory: dict[version -> dict[execution_id -> Trajectory]]

class FileTrajectoryStore:
    # JSONL format: one JSON record per line, file per version
    # Files named: trajectories_{version or 'default'}.jsonl
    # save()  -> appends a line
    # load()  -> scans lines for matching execution_id
    # query() -> scans lines and filters by field values
```

**Source:** `openjiuwen/agent_evolving/trajectory/aggregator.py`

```python
@dataclass
class TeamTrajectory:
    team_id: str
    session_id: str
    combined: Trajectory   # all member steps merged, sorted by start_time_ms
```

### 9.2 Signal Types Detected

**Source:** `openjiuwen/agent_evolving/signal/from_conv.py` — `ConversationSignalDetector`

`detect(trajectory_or_messages)` accepts a `Trajectory` or a `List[dict]` and returns `List[EvolutionSignal]` (deduplicated).

| signal_type | Trigger | section in SKILL.md |
|-------------|---------|---------------------|
| `execution_failure` | Tool result contains error/exception/failure/timeout/traceback keywords (regex) | `"Troubleshooting"` |
| `user_correction` | User message matches correction patterns: "not right", "you're wrong", "应该", "不对", etc. | `"Examples"` |
| `script_artifact` | A code-execution tool call (`bash`, `execute_python_code`, etc.) succeeds (no failure) — captures the working script | `"Scripts"` |
| `collaboration_send` | `send_message` tool called to a different member | `"Collaboration"` |
| `collaboration_claim` | `claim_task` tool called | `"Collaboration"` |
| `collaboration_view` | `view_task` tool called | `"Collaboration"` |
| `collaboration_receive` | Step has `parent_invoke_id` in `step.meta` | `"Collaboration"` |
| `collaboration_failure` | Tool result matches collaboration-failure regex | `"Collaboration"` |

Collaboration signals only fire when `trajectory.meta["member_id"]` is set and `trajectory.meta.get("source") != "standalone"`.

Deduplication uses `make_signal_fingerprint(signal)` returning `Tuple[str, str, str, str]` = `(signal_type, tool_name or "", skill_name or "", excerpt[:200])`.

### 9.3 The Complete Evolution Pipeline

```
STEP 1: TRAJECTORY CAPTURE
------------------------------------------------------------
Member DeepAgent executes (LLM calls + tool calls)
    |
    v
SkillEvolutionRail intercepts each call:
  - LLM call  -> TrajectoryStep(kind="llm",  detail=LLMCallDetail(...))
  - Tool call -> TrajectoryStep(kind="tool", detail=ToolCallDetail(...))
    |
    v
Full Trajectory assembled: execution_id, steps[], session_id, meta{member_id}
    |
    v
If FileTrajectoryStore set:
  -> store.save(trajectory)  appended to trajectories_default.jsonl


STEP 2: SIGNAL DETECTION
------------------------------------------------------------
on_trajectory_complete(trajectory) called
    |
    v
ConversationSignalDetector.detect(trajectory)
  - Convert Trajectory.steps -> message list
  - Scan tool results for failure keywords  -> "execution_failure"
  - Scan user messages for correction patterns -> "user_correction"
  - Detect successful code-exec tool calls  -> "script_artifact"
  - Detect collaboration tool calls         -> "collaboration_*"
  - Deduplicate by (signal_type, tool_name, skill_name, excerpt[:200])
    |
    v
Returns List[EvolutionSignal]


STEP 3: PROPOSAL GENERATION (if signals found)
------------------------------------------------------------
For each signal:
  - Read existing skill's SKILL.md for skill_name
  - LLM called with: signal context + excerpt + existing skill content
  - LLM generates improved content for signal.section of SKILL.md


STEP 4a: AUTO-SAVE (SkillEvolutionRail, non-leader, auto_save=True)
------------------------------------------------------------
  -> Write updated section to team-workspace/skills/{skill_name}/SKILL.md


STEP 4b: APPROVAL FLOW (TeamSkillRail, leader, auto_save=False)
------------------------------------------------------------
  -> Buffer proposal in _pending_patch_snapshots[request_id]
     |
     v
  Web layer calls drain_team_skill_events(session_id)
     |
  evolution-status.ts shows proposal in frontend
     |
  User APPROVES
     |
     v
  TeamManager.sync_team_skills(session_id)
    -> copy team-workspace/skills/ -> global skills directory
```

### 9.4 Evolution Configuration

```python
# From team_runtime_inheritance.py:

def get_evolution_auto_scan_enabled(config) -> bool:
    # Check EVOLUTION_AUTO_SCAN env var first, then react.evolution.auto_scan in config

def get_skill_create_enabled(config) -> bool:
    # Check SKILL_CREATE env var first, then react.evolution.skill_create in config
```

Rail construction in `build_member_rails()`:

```python
# Leader: TeamSkillRail (if auto_scan enabled AND team_ws_skills_dir set)
if role == "leader" and team_ws_skills_dir and get_evolution_auto_scan_enabled(config):
    team_skill_rail = TeamSkillRail(
        skills_dir=team_ws_skills_dir,
        llm=llm_model,
        model=actual_model_name,
        language=language,
        team_trajectory_store=shared_team_trajectory_store,
        auto_save=False,
        team_id=team_id,
        trajectories_dir=Path(team_trajectories_dir) if team_trajectories_dir else None,
    )

# Leader: TeamSkillCreateRail (if skill_create enabled AND team_ws_skills_dir set)
if role == "leader" and team_ws_skills_dir and get_skill_create_enabled(config):
    team_skill_create_rail = TeamSkillCreateRail(
        skills_dir=team_ws_skills_dir,
        language=language,
        auto_trigger=True,
    )

# Non-leader: SkillEvolutionRail (via build_skill_evolution_rail helper)
if role != "leader" and team_ws_skills_dir:
    evo_rail = build_skill_evolution_rail(
        skills_dir=team_ws_skills_dir,
        config=config,
        team_trajectory_store=shared_team_trajectory_store,
    )
```

---

## 10. Skill Management — Directory Layout & Flow

### 10.1 Directory Structure

```
~/.jiuwen/user_workspace/
+- agent/
|  +- skills/                         # GLOBAL skills (source of truth)
|     +- web_search/
|     |  +- SKILL.md
|     |  +- implementation.py
|     +- skills_state.json
|
+- agent_teams/
   +- .team/
      +- {team_name}/
         +- team-workspace/
         |  +- skills/               # TEAM SHARED (copied from global once)
         |  |  +- web_search/
         |  |  +- .team_skills_copied     # prevents re-copy on restart
         |  |  +- skills_state.json
         |  +- trajectories/
         |     +- trajectories_default.jsonl  # JSONL: one trajectory per line
         +- members/
         |  +- {member_name}/
         |     +- workspace/
         |        +- skills/         # MEMBER-SPECIFIC
         |           +- web_search/
         |           +- skills_state.json
         +- team.db                  # SQLite: members, tasks, messages
```

### 10.2 Skill Initialization Flow

```
1. Team first creation:
   Global skills/ -> team-workspace/skills/
   (.team_skills_copied marker prevents re-copy on restart)

2. Member spawn (agent_customizer):
   Copy selected skills from team-workspace/skills/ -> member/workspace/skills/
   Write member's skills_state.json

3. Skill evolution (SkillEvolutionRail, auto_save=True):
   Updated SKILL.md section written to team-workspace/skills/{skill_name}/SKILL.md

4. Skill approval (TeamSkillRail, after user approves):
   sync_team_skills() copies team-workspace/skills/ -> global skills/
```

### 10.3 MemberSkillToolkitRail

Each member agent gets skill-management tools:
- `search_skill(query)` — find installed skills
- `install_skill(name)` — add skill
- `uninstall_skill(name)` — remove skill

Tool IDs are suffixed with `_{agent_id}` to prevent collisions.

---

## 11. Team Monitor & Event Streaming

### 11.1 Architecture

```
SDK: TeamMonitor (openjiuwen/agent_teams/monitor/team_monitor.py)
  -> Emits MonitorEvent objects

JiuwenClaw: TeamMonitorHandler (harness/team/monitor_handler.py)
  -> Wraps TeamMonitor
  -> Converts SDK events -> frontend dicts
  -> Buffers in asyncio.Queue
  -> start() launches _collect_events() background task
  -> events() yields dicts to web layer

Web Layer:
  -> Reads from TeamMonitorHandler.events()
  -> Sends as SSE to frontend
```

### 11.2 All Event Types

**Source:** `event_types.py`

```
# Member lifecycle
MEMBER_SPAWNED           -> team.member.spawned
MEMBER_STATUS_CHANGED    -> team.member.status_changed
MEMBER_EXECUTION_CHANGED -> team.member.execution_changed
MEMBER_RESTARTED         -> team.member.restarted
MEMBER_SHUTDOWN          -> team.member.shutdown

# Task lifecycle
TASK_CREATED             -> team.task.created
TASK_CLAIMED             -> team.task.claimed
TASK_COMPLETED           -> team.task.completed
TASK_CANCELLED           -> team.task.cancelled
TASK_UNBLOCKED           -> team.task.unblocked

# Communication
MESSAGE                  -> team.message.p2p
BROADCAST                -> team.message.broadcast
```

---

## 12. Distributed Mode

**Source:** `distributed_runtime.py`

### 12.1 When It Activates

```python
def is_distributed_mode(config_base: dict) -> bool:
    team_cfg = config_base.get("team", {})
    if team_cfg.get("runtime", {}).get("mode") == "distributed":
        return True
    return team_cfg.get("transport", {}).get("type") == "pyzmq"
```

### 12.2 Default Port Topology (PyZMQ)

```
Leader Process                        Teammate Process(es)
--------------                        ------------------
direct_port:  18555   <------------>  direct_port: 18600
pub_port:     18556   -- broadcasts->
sub_port:     18557   <-- subscribes-
```

### 12.3 Missing Dependencies Fallback

If `pyzmq` or `psycopg2` is not installed, `fallback_distributed_to_local()` silently downgrades:
- `transport.type: pyzmq` -> `inprocess`
- `storage.type: postgresql` -> `sqlite`
- `runtime.mode: distributed` -> `local`

### 12.4 PostgreSQL Auto-Start

`ensure_postgresql_for_leader()` (leader only):
1. Try `pg_ctlcluster start`
2. Try `systemctl start postgresql`
3. Poll with exponential backoff (max 30s)
4. Raise if still unreachable

### 12.5 Remote Member Bootstrap

```
Leader calls spawn_member("researcher")
  -> Insert in shared PostgreSQL
  -> Build bootstrap envelope (config, member_name, transport topology)
  -> Publish on PyZMQ pub socket
      |
Remote claw (subscribed) receives envelope
  -> Apply transport hints
  -> Build DeepAgent
  -> Apply agent_customizer
  -> Send ACK via direct socket
      |
Leader receives ACK -> member visible in team state
```

---

## 13. Web Layer & Frontend

**Source:** `channels/web/app_web.py`

### 13.1 Request Routing

```
Port 5173 (jiuwenclaw-web)
+- /api/*        -> HTTP proxy -> port 19000
+- /ws/*         -> WebSocket tunnel -> port 19000
+- /file-api/*   -> Handled locally
+- /*            -> Serve dist/ (SPA fallback to index.html)
```

### 13.2 File API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/file-api/list-markdown` | GET | List .md files |
| `/file-api/list-files` | GET | Full file tree |
| `/file-api/file-content` | GET/POST | Read or write file |
| `/file-api/download` | GET | Download (token validated) |
| `/file-api/rebuild-agent-data` | POST | Rebuild agent-data.json |
| `/file-api/ws-debug-config` | GET/POST | WebSocket debug settings |

File API roots: `workspace_root`, `agent_teams_root`, `logs_root`, `auto_harness_root`.

### 13.3 Frontend Evolution Components

```
frontend/src/
+- components/ChatPanel/evolution-status.ts   # Pending skill proposals; approve/reject UI
+- core/commands/builtins/evolve.ts           # "/evolve" slash command
```

---

## 14. Complete Data Flow Diagrams

### 14.1 User Message -> Team Response

```
User types message
    |
    v
Frontend -> WebSocket -> /ws/ tunnel -> jiuwenclaw server
    |
    v
TeamManager.interact(user_message, session_id)
    |
    v
Leader DeepAgent LLM loop
    |
    +- Rails: before_llm_call() (RuntimePromptRail, AvatarPromptRail inject context)
    +- LLM called; response generated
    +- Rails: after_llm_call() (JiuClawStreamEventRail -> SSE chunk to frontend)
    |
    v (leader delegates to a member)
Member DeepAgent executes task
    |
    +- SkillEvolutionRail records every LLM step:  TrajectoryStep(kind="llm", detail=LLMCallDetail)
    +- SkillEvolutionRail records every tool step: TrajectoryStep(kind="tool", detail=ToolCallDetail)
    |
    v
Member task completes
    |
    +- SkillEvolutionRail.on_trajectory_complete(trajectory)
    |   +- ConversationSignalDetector.detect(trajectory) -> List[EvolutionSignal]
    |   +- If signals: optimizer generates improved SKILL.md section
    |   +- auto_save=True: write to team-workspace/skills/{skill}/SKILL.md
    |
    +- TeamMonitor fires TASK_COMPLETED
        -> TeamMonitorHandler queues event dict
        -> SSE stream -> frontend
```

### 14.2 Skill Evolution -> Approval -> Global Sync

```
[EvolutionSignal detected by TeamSkillRail on leader, auto_save=False]
    |
    v
Proposal buffered in _pending_patch_snapshots[request_id]
    |
    v
Frontend calls drain_team_skill_events(session_id)
    |
    v
evolution-status.ts shows proposal card with content
    |
User clicks APPROVE
    |
    v
TeamManager.sync_team_skills(session_id)
    -> _sync_skills_dir(source=team-workspace/skills/, target=global skills/)
    -> Skill now in global repo; available to new teams
```

---

## 15. Complete Control Flow — What Triggers What

| Trigger | Handler | Side Effects |
|---------|---------|-------------|
| User creates team session | `TeamManager.create_team()` | `spec.build()`, skills copied, `agent_customizer` set, rails mounted, monitor started |
| User activates session | `prepare_runtime_activation()` + `commit_runtime_ready()` | Old session paused, stream task started |
| User sends message | `TeamManager.interact()` | Flows to leader DeepAgent LLM loop |
| Leader LLM calls `spawn_member` | `SpawnManager.spawn_member()` | Member DB record, DeepAgent built, `agent_customizer` applied |
| Member LLM makes call | Rail `before_llm_call` | LLMCallDetail added to trajectory |
| Member tool executes | Rail `after_tool_call` | ToolCallDetail added to trajectory |
| Member conversation completes | `on_trajectory_complete(trajectory)` | `ConversationSignalDetector.detect()`, skill update if signals found |
| Signal detected (member) | `SkillEvolutionRail` | Optimizer called, SKILL.md section auto-saved |
| Signal detected (leader) | `TeamSkillRail` | Proposal buffered for approval |
| User approves skill | `sync_team_skills()` | Skill copied to team-workspace/skills/ and global skills/ |
| Admin updates evolution config | `update_evolution_config()` | Rails mounted/unmounted on all sessions, no restart |
| Member event fires | `TeamMonitor` | `TeamMonitorHandler` queues dict, sent as SSE |
| User stops session | `terminate_session_runtime()` | Stream task cancelled, monitor stopped |
| Distributed spawn needed | `spawn_member` + bootstrap envelope | Remote claw bootstraps teammate via PyZMQ |
| PostgreSQL unavailable | `ensure_postgresql_for_leader()` | Auto-start attempted; error on timeout |

---

## 16. Key File Index

| File | What to read it for |
|------|---------------------|
| `team_manager.py` | Session lifecycle, evolution config hot-update, skill sync |
| `config_loader.py` | YAML config -> `TeamAgentSpec` |
| `team_runtime_inheritance.py` | `build_member_rails()`, rail/tool whitelists, `get_evolution_auto_scan_enabled()`, `build_evolution_llm()` |
| `distributed_runtime.py` | PyZMQ config, PostgreSQL auto-start, fallback logic |
| `event_types.py` | SDK event -> frontend event mapping |
| `monitor_handler.py` | TeamMonitor wrapper, event queue |
| `remote_member_bootstrap.py` | Distributed bootstrap envelope flow |
| `rails/team_member_skill_toolkit_rail.py` | How skill tools are bound to members |
| `agent_evolving/signal/base.py` | `EvolutionSignal`, `EvolutionCategory`, `EvolutionTarget`, `make_signal_fingerprint` |
| `agent_evolving/signal/from_conv.py` | `ConversationSignalDetector` — all detection logic, all signal types |
| `agent_evolving/trajectory/types.py` | `Trajectory`, `TrajectoryStep`, `LLMCallDetail`, `ToolCallDetail` |
| `agent_evolving/trajectory/store.py` | `FileTrajectoryStore` (JSONL), `InMemoryTrajectoryStore`, `TrajectoryStore` protocol |
| `agent_evolving/trajectory/aggregator.py` | `TeamTrajectory` |
| `agent_teams/agent/team_agent.py` | `TeamAgent` class |
| `agent_teams/agent/blueprint.py` | `TeamAgentBlueprint` (frozen dataclass) |
| `agent_teams/agent/state.py` | `TeamAgentState` (mutable dataclass) |
| `agent_teams/schema/blueprint.py` | `TeamAgentSpec`, `LeaderSpec`, `TransportSpec`, `StorageSpec`, `spec.build()` |
| `channels/web/app_web.py` | Web server, file API, WebSocket tunnel |

---

## 17. Advantages of the Current Design

**1. Clean separation:** SDK owns multi-agent runtime; harness owns sessions, web, config. Evolution lives entirely in rails — orthogonal to business logic.

**2. Rail extensibility:** Any behavior can be added as a rail. Whitelist keeps members safe. Hot-mount/unmount without restart.

**3. Persistent state:** SQLite or PostgreSQL. Teams survive restarts. JSONL trajectory store enables post-hoc analysis.

**4. Concrete, readable signal detection:** `ConversationSignalDetector` has explicit regex patterns and known signal types. Easy to extend with new patterns. No black-box scoring.

**5. Distributed mode is optional and graceful:** Auto-downgrades if dependencies missing. No code changes needed.

**6. Good observability:** All events flow through `TeamMonitor`. JSONL trajectories are readable files. Log prefixes make filtering easy.

---

## 18. Known Challenges & Rough Edges

**1. Signal detection is narrow.** Only detects: tool failures, user corrections, successful scripts, and collaboration events. Misses: wrong tool chosen but succeeded, poor quality responses, cross-session regressions.

**2. Skill proposals are LLM-generated with no validation.** `SkillEvolutionRail` auto-saves member proposals immediately. No check that the result is syntactically valid or actually better.

**3. Three-level skill sync is fragile.** Global -> team-workspace -> member. The `.team_skills_copied` marker prevents re-init, but changes to global skills after team creation won't propagate. Member skill proposals go to `team-workspace/skills/` (not the member dir), which is non-obvious.

**4. Distributed mode edge cases.** Network partitions, partial bootstraps, A2X registry unavailability, and reconnection after dropped connections are not clearly handled.

**5. Session state machine is implicit.** `_active_session_id` / `_pending_session_id` flags instead of an explicit `SessionState` enum. Easy to miss illegal transitions.

**6. `team_manager.py` is a God Object.** ~1,800 lines handling session lifecycle, evolution rails, skill sync, distributed bootstrap, and PostgreSQL startup.

**7. No rollback for approved skills.** Once `sync_team_skills()` writes to global skills, revert requires manual file operations.

**8. `agent_customizer` is not serializable.** Excluded from `TeamAgentSpec` serialization. In distributed mode, the remote claw must reconstruct it independently.

---

## 19. What Can & Should Be Done Next

### High Priority

**A. Explicit session state machine** — Replace `_active_session_id`/`_pending_session_id` flags with `SessionState` enum and validated transition method.

**B. Skill validation before save** — Syntax check SKILL.md before auto-save. Similarity check (is it different from existing?). Optional LLM quality score before approval UI.

**C. Skill versioning** — Keep `versions/` subfolder per skill. Enable rollback. Show diff in approval UI.

**D. Evolution metrics** — Log all evolution events (signal/proposal/approval/rejection). Frontend dashboard showing approval rate, most-evolved skills, most-active evolving members.

### Medium Priority

**E. Richer signal detection** — Timeout detection (many iterations where a tool would be faster). Repeated-failure detection across trajectories. User thumbs-down as a signal. Cross-member signals.

**F. Split `team_manager.py`** — Extract `session_manager.py`, `evolution_manager.py`, `stream_manager.py`.

**G. Team templates** — Pre-built YAML configs for common team structures.

### Lower Priority

**H. Evolution replay** — Re-run signal detection on stored JSONL trajectories (for testing `ConversationSignalDetector` changes or regenerating proposals with a better model).

**I. Distributed mode hardening** — Integration tests for PyZMQ bootstrap. Reconnection logic. Clearer error messages for A2X / PostgreSQL failures.

**J. Member pool pre-warming** — Pre-create idle `DeepAgent` instances to reduce cold-start latency on first `spawn_member`.

---

*Sources verified against:*
- `jiuwenclaw/agents/harness/team/` — all files
- `michael-agent-core/openjiuwen/agent_evolving/signal/base.py` — `EvolutionSignal`, `EvolutionCategory`, `EvolutionTarget`
- `michael-agent-core/openjiuwen/agent_evolving/signal/from_conv.py` — `ConversationSignalDetector`
- `michael-agent-core/openjiuwen/agent_evolving/trajectory/types.py` — `Trajectory`, `TrajectoryStep`, `LLMCallDetail`, `ToolCallDetail`
- `michael-agent-core/openjiuwen/agent_evolving/trajectory/store.py` — `FileTrajectoryStore`, `InMemoryTrajectoryStore`
- `michael-agent-core/openjiuwen/agent_evolving/trajectory/aggregator.py` — `TeamTrajectory`
- `michael-agent-core/openjiuwen/agent_teams/agent/team_agent.py` — `TeamAgent`
- `michael-agent-core/openjiuwen/agent_teams/agent/blueprint.py` — `TeamAgentBlueprint`
- `michael-agent-core/openjiuwen/agent_teams/agent/state.py` — `TeamAgentState`
- `michael-agent-core/openjiuwen/agent_teams/schema/blueprint.py` — `TeamAgentSpec`, `LeaderSpec`
- *Date: 2026-05-14*
