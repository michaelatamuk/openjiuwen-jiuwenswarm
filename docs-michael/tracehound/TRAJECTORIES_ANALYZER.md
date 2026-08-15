# Trajectories Analyzer — Module Plan

**Author:** Michael
**Status:** Planning
**Target project:** jiuwenclaw
**Source of log data:** thalamus (`online_logs/turns_YYYY-WNN.jsonl`)

---

## 1. Background

The `thalamus` project logs every agent "turn" to weekly-rotated JSONL files stored in a configurable `log_dir` (typically `online_logs/`). Each file is named `turns_YYYY-WNN.jsonl` (one file per ISO week). Each line in a file is a complete JSON record for one agent turn.

This module reads those logs and produces actionable diagnostics: which components waste context budget, which correlate with failure, where quality is trending, and what the agent is bad at.

---

## 2. Log Format Reference

### 2.1 File Layout

```
<log_dir>/
├── turns_2025-W01.jsonl
├── turns_2025-W02.jsonl
└── ...
```

Files are sorted by week. The analyzer loads up to `max_weeks` (default 8) of the most recent files, newest first.

### 2.2 Turn Record Schema

```json
{
  "turn_id": "<uuid>",
  "timestamp": "2025-01-14T14:32:15Z",
  "query_embedding": [0.087, -0.134, 0.223, ...],
  "context_config": {
    "skills": ["bash-scripting", "debugging-tools"],
    "memory_sections": ["project.md::CI-Pipeline", "user.md::PrefersVerbose"],
    "tools": ["bash_exec", "file_reader"]
  },
  "outcome": {
    "explicit_rating": "positive" | "negative" | null,
    "implicit_signals": {
      "follow_up_correction": false,
      "task_completed": true,
      "conversation_length": 2
    },
    "component_usage": {
      "skills_used": ["bash-scripting"],
      "tools_called": ["bash_exec"]
    },
    "llm_judge_score": 0.78 | null
  },
  "exploration": {
    "explored": true,
    "exploration_rate": 0.1,
    "explored_additions": {
      "skills": ["optional-skill-x"],
      "memory": [],
      "tools": ["optional-tool-y"]
    }
  }
}
```

### 2.3 Outcome Quality Formula

Used by `thalamus/shared/outcome_scorer.py`:

```
Priority 1: explicit_rating → "positive" = 1.0, "negative" = 0.0
Priority 2: llm_judge_score → use directly
Priority 3 (implicit signals fallback):
  score = 0.5
        + 0.2  if task_completed
        - 0.3  if follow_up_correction
        + max(0, 0.1 - 0.02 × conversation_length)
  clamped to [0.0, 1.0]
```

---

## 3. Module Goals

The Trajectories Analyzer answers these questions from the logs:

1. **What is the overall agent quality trend?** — Is quality going up or down week over week?
2. **Which components are underperforming?** — Skills/tools/memory sections that consistently appear in low-quality turns.
3. **Which components are wasting context budget?** — Included in context but never actually used.
4. **What is causing follow-up corrections?** — Which component combinations correlate with the user having to correct the agent?
5. **Are long conversations a signal of failure?** — Distribution of conversation lengths by outcome.
6. **Where does explicit rating disagree with implicit signals?** — Turns where `llm_judge_score` / implicit quality diverges from `explicit_rating`.
7. **Is exploration adding value?** — Quality of explored turns vs. non-explored turns.
8. **Are there data gaps?** — Weeks with very few turns (agent was idle or logs were lost).

---

## 4. Module Structure

```
jiuwenclaw/
└── jiuwenclaw/
    └── trajectories_analyzer/
        ├── __init__.py
        ├── loader.py            # Load + parse JSONL turn records
        ├── scorer.py            # Replicate outcome_quality computation
        ├── analyzers/
        │   ├── __init__.py
        │   ├── quality_trends.py        # Week-over-week quality chart
        │   ├── component_performance.py # Per-component quality breakdown
        │   ├── budget_waste.py          # Unused component detection
        │   ├── correction_patterns.py   # Follow-up correction correlates
        │   ├── exploration_analysis.py  # Explored vs. normal turn quality
        │   └── data_health.py           # Turn count, missing weeks, gaps
        ├── report.py            # Assemble all analyzer outputs into a report
        └── cli.py               # CLI entry point: `jiuwenclaw analyze-trajectories`
```

---

## 5. Component Design

### 5.1 `loader.py` — TrajectoriesLoader

**Responsibility:** Read JSONL files from disk, parse records, expose as a list of typed dicts.

**Key interface:**

```python
class TrajectoriesLoader:
    def __init__(self, log_dir: str | Path, max_weeks: int = 8):
        ...

    def load(self) -> list[TurnRecord]:
        """Load up to max_weeks of log files, return sorted by timestamp ascending."""
        ...

    def load_raw(self) -> list[dict]:
        """Return raw dicts without validation (faster, for inspection)."""
        ...
```

**TurnRecord dataclass:**

```python
@dataclass
class TurnRecord:
    turn_id: str
    timestamp: datetime
    query_embedding: list[float]
    skills: list[str]
    memory_sections: list[str]
    tools: list[str]
    explicit_rating: str | None          # "positive", "negative", or None
    follow_up_correction: bool
    task_completed: bool
    conversation_length: int
    skills_used: list[str]
    tools_called: list[str]
    llm_judge_score: float | None
    explored: bool
    exploration_additions: dict          # {"skills": [...], "memory": [...], "tools": [...]}
```

**Loading logic:**
- Glob `turns_*.jsonl` in `log_dir`, sort descending, take `max_weeks` files
- Parse each line as JSON, skip blank lines and malformed records (log warning)
- Sort all loaded records by `timestamp` ascending before returning

---

### 5.2 `scorer.py` — OutcomeScorer

**Responsibility:** Compute scalar quality score in [0, 1] for each turn. Mirrors `thalamus/shared/outcome_scorer.py` exactly so results are consistent.

```python
def compute_quality(turn: TurnRecord) -> float:
    if turn.explicit_rating == "positive":
        return 1.0
    if turn.explicit_rating == "negative":
        return 0.0
    if turn.llm_judge_score is not None:
        return float(turn.llm_judge_score)
    # implicit signals fallback
    score = 0.5
    if turn.task_completed:
        score += 0.2
    if turn.follow_up_correction:
        score -= 0.3
    score += max(0.0, 0.1 - 0.02 * turn.conversation_length)
    return max(0.0, min(1.0, score))
```

---

### 5.3 `analyzers/quality_trends.py` — QualityTrendsAnalyzer

**What it produces:**
- Per-week mean quality score
- Per-week count of positive/negative explicit ratings
- Overall trend direction (improving / degrading / flat)
- Worst week and best week

**Output structure:**

```python
@dataclass
class WeeklyQualitySummary:
    week_tag: str          # e.g. "2025-W03"
    n_turns: int
    mean_quality: float
    n_explicit_positive: int
    n_explicit_negative: int
    n_task_completed: int
    n_follow_up_corrections: int

@dataclass
class QualityTrendsResult:
    weeks: list[WeeklyQualitySummary]
    trend_direction: str   # "improving" | "degrading" | "flat" | "insufficient_data"
    best_week: str
    worst_week: str
    overall_mean: float
```

**Trend detection:** Linear regression slope over `mean_quality` per week. Slope > +0.02 → "improving", < -0.02 → "degrading", else "flat". Requires at least 3 weeks of data.

---

### 5.4 `analyzers/component_performance.py` — ComponentPerformanceAnalyzer

**What it produces:**
- For every skill, memory section, and tool: mean quality score on turns where it was included in context
- Flag components whose mean quality is below a threshold (default: global mean − 0.15)
- Flag components with high follow-up correction rate (> 30%)
- Flag components with low task completion rate (< 50%)

**Output structure:**

```python
@dataclass
class ComponentStats:
    name: str
    component_type: str    # "skill" | "memory" | "tool"
    n_turns_included: int
    mean_quality: float
    task_completion_rate: float
    correction_rate: float
    flags: list[str]       # e.g. ["low_quality", "high_correction_rate"]
```

**Bottleneck detection rules:**

| Rule | Flag |
|---|---|
| mean_quality < global_mean − 0.15 | `low_quality` |
| correction_rate > 0.30 | `high_correction_rate` |
| task_completion_rate < 0.50 | `low_task_completion` |
| n_turns_included < 5 | `insufficient_data` |

---

### 5.5 `analyzers/budget_waste.py` — BudgetWasteAnalyzer

**What it produces:**
- Components that are included in `context_config` but appear in 0% of `component_usage` (never used)
- Components with < 20% utilization rate (included but rarely invoked)

**Definition:**
- **Skills utilization:** `len(skills_used) / len(skills)` per turn where skills is non-empty
- **Tools utilization:** `len(tools_called) / len(tools)` per turn where tools is non-empty
- Memory sections have no runtime usage tracking (no `memory_sections_used` field), so memory waste is estimated by correlation: memory sections included in low-quality turns at higher-than-average rate

**Output structure:**

```python
@dataclass
class BudgetWasteResult:
    never_used_skills: list[str]          # skills included in context but never in skills_used
    rarely_used_skills: list[ComponentUtilization]
    never_used_tools: list[str]
    rarely_used_tools: list[ComponentUtilization]
    potentially_wasteful_memory: list[str] # memory sections flagged by correlation

@dataclass
class ComponentUtilization:
    name: str
    times_included: int
    times_used: int
    utilization_rate: float    # times_used / times_included
```

---

### 5.6 `analyzers/correction_patterns.py` — CorrectionPatternsAnalyzer

**What it produces:**
- Component combinations that co-occur with follow-up corrections above baseline
- Turns where `follow_up_correction=True` grouped by which components were present
- Co-occurrence matrix: for each pair (component A, component B), how often both appear in corrected turns vs. all turns

**Output structure:**

```python
@dataclass
class CorrectionPattern:
    component: str
    correction_rate: float        # rate when this component is in context
    baseline_correction_rate: float  # global correction rate
    lift: float                   # correction_rate / baseline_correction_rate
    n_corrected_turns: int

@dataclass
class CorrectionPatternsResult:
    baseline_correction_rate: float
    high_lift_components: list[CorrectionPattern]   # lift > 1.5
    total_corrected_turns: int
    total_turns: int
```

---

### 5.7 `analyzers/exploration_analysis.py` — ExplorationAnalyzer

**What it produces:**
- Quality of explored turns vs. non-explored turns
- Which exploration additions led to quality improvement (positive delta)
- Which exploration additions consistently degraded quality (negative delta)
- Exploration rate over time

**Logic:**
- For each explored turn: compute `quality_delta = quality(turn) - global_mean_quality`
- Group deltas by each `explored_additions.skills[i]`, `explored_additions.tools[i]`
- Components with mean positive delta are "promising explorations"
- Components with mean negative delta are "harmful explorations" (should be excluded more aggressively)

**Output structure:**

```python
@dataclass
class ExplorationAnalysisResult:
    n_explored: int
    n_normal: int
    mean_quality_explored: float
    mean_quality_normal: float
    quality_delta: float          # explored - normal; positive = exploration is net beneficial
    promising_additions: list[ExplorationAdditionStats]
    harmful_additions: list[ExplorationAdditionStats]

@dataclass
class ExplorationAdditionStats:
    name: str
    component_type: str
    n_times_explored: int
    mean_quality_delta: float     # vs. global mean
```

---

### 5.8 `analyzers/data_health.py` — DataHealthAnalyzer

**What it produces:**
- Total turns loaded
- Turns per week (detect unusually low counts = possible data gaps)
- Percentage of turns with explicit ratings (coverage of human feedback)
- Percentage of turns with LLM judge scores
- Malformed/skipped records count
- Oldest and newest turn timestamps

**Output structure:**

```python
@dataclass
class DataHealthResult:
    total_turns: int
    turns_per_week: dict[str, int]
    weeks_with_low_data: list[str]   # weeks with < 10 turns
    explicit_rating_coverage: float  # fraction of turns with explicit_rating set
    llm_judge_coverage: float
    skipped_records: int
    date_range: tuple[datetime, datetime]
    log_files_found: list[str]
```

---

### 5.9 `report.py` — TrajectoriesReport

**Responsibility:** Run all analyzers and format results for display or file output.

```python
class TrajectoriesReport:
    def __init__(self, loader: TrajectoriesLoader):
        ...

    def run(self) -> ReportResult:
        """Run all analyzers, return structured results."""
        turns = self._loader.load()
        qualities = [compute_quality(t) for t in turns]
        return ReportResult(
            data_health=DataHealthAnalyzer(turns).analyze(),
            quality_trends=QualityTrendsAnalyzer(turns, qualities).analyze(),
            component_performance=ComponentPerformanceAnalyzer(turns, qualities).analyze(),
            budget_waste=BudgetWasteAnalyzer(turns).analyze(),
            correction_patterns=CorrectionPatternsAnalyzer(turns).analyze(),
            exploration=ExplorationAnalyzer(turns, qualities).analyze(),
        )

    def render_text(self, result: ReportResult) -> str:
        """Return a human-readable text report (for CLI output)."""
        ...

    def render_json(self, result: ReportResult) -> str:
        """Return machine-readable JSON."""
        ...
```

---

### 5.10 `cli.py` — CLI Entry Point

**Command:** `jiuwenclaw analyze-trajectories`

**Arguments:**

| Argument | Default | Description |
|---|---|---|
| `--log-dir` | `./online_logs` | Path to thalamus log directory |
| `--max-weeks` | `8` | Number of recent weeks to analyze |
| `--output` | `stdout` | Output path for JSON report (omit for text) |
| `--format` | `text` | `text` or `json` |
| `--threshold-quality` | `0.15` | Quality deficit threshold for component flags |
| `--threshold-utilization` | `0.20` | Utilization threshold for budget waste flags |

**Example usage:**

```bash
jiuwenclaw analyze-trajectories --log-dir /path/to/online_logs --max-weeks 4
jiuwenclaw analyze-trajectories --log-dir /path/to/online_logs --format json --output report.json
```

**Output sections (text format):**

```
=== Trajectories Analyzer Report ===
Generated: 2025-01-14T15:00:00Z
Turns analyzed: 1247 (across 8 weeks: 2024-W52 to 2025-W07)

--- Data Health ---
  Explicit rating coverage: 34.2%
  LLM judge coverage: 61.8%
  Weeks with low data: none
  Date range: 2024-12-30 → 2025-02-18

--- Quality Trend: DEGRADING ---
  Overall mean quality: 0.64
  Best week:  2025-W03 (mean=0.71, n=178)
  Worst week: 2025-W07 (mean=0.58, n=201)
  Trend: −0.025 per week (last 8 weeks)

--- Component Bottlenecks (3 flagged) ---
  [low_quality] skill: bash-scripting
      mean quality: 0.48 (global: 0.64), n=94 turns
  [high_correction_rate] memory: project.md::CI-Pipeline
      correction rate: 38% (global: 12%), n=67 turns
  [low_task_completion] tool: python_exec
      task completion: 44% (global: 71%), n=112 turns

--- Budget Waste ---
  Never-used skills (2): optional-skill-x, legacy-formatter
  Rarely-used tools (1): file_diff (utilization: 8%, included 76 times, used 6 times)

--- Correction Patterns (top 3) ---
  skill: debugging-tools   correction lift: 2.3× (correction rate 27% vs baseline 12%)
  memory: user.md::VerboseMode  correction lift: 1.9×
  tool: bash_exec          correction lift: 1.7×

--- Exploration Analysis ---
  Explored turns: 124 (9.9% of total)
  Explored mean quality: 0.61 vs normal: 0.65 (delta: −0.04, exploration net neutral)
  Promising addition: skill: code-review-helper (delta: +0.12, n=18)
  Harmful addition:   skill: legacy-formatter  (delta: −0.18, n=11)
```

---

## 6. Integration Points

### 6.1 pyproject.toml entry point

Add to `jiuwenclaw/pyproject.toml`:

```toml
[project.scripts]
jiuwenclaw = "jiuwenclaw.cli:main"
```

Or if the CLI dispatcher already exists:

```python
# In jiuwenclaw/cli.py (dispatcher)
from jiuwenclaw.trajectories_analyzer.cli import register_command
register_command(subparsers)
```

### 6.2 No thalamus dependency at runtime

The analyzer reads raw JSONL files and reimplements `compute_quality` locally. It does **not** import thalamus. This keeps the modules decoupled.

### 6.3 Optional: periodic scheduled run

If jiuwenclaw has a scheduler, the analyzer can run weekly and write `report.json` to a reports directory. This is optional and not part of the initial implementation.

---

## 7. Implementation Order

| Step | Task | Notes |
|---|---|---|
| 1 | `loader.py` + `scorer.py` | Foundation — all analyzers depend on these |
| 2 | `analyzers/data_health.py` | Simple count stats, good smoke test |
| 3 | `analyzers/quality_trends.py` | Core metric, validates data loading |
| 4 | `analyzers/component_performance.py` | Most valuable for bottleneck detection |
| 5 | `analyzers/budget_waste.py` | Requires `component_usage` fields present |
| 6 | `analyzers/correction_patterns.py` | Requires enough turns for correlation |
| 7 | `analyzers/exploration_analysis.py` | Requires `exploration` field in records |
| 8 | `report.py` + `cli.py` | Wire everything together |
| 9 | Tests | One test per analyzer using synthetic JSONL fixtures |

---

## 8. Test Strategy

- Create `tests/trajectories_analyzer/` directory
- Add `fixtures/sample_turns.jsonl` with synthetic turn records covering all edge cases (missing fields, explicit ratings, explored turns, unused components)
- One test file per analyzer module
- Test data health with: missing weeks, malformed lines, zero turns
- Test quality trends with: <3 weeks (insufficient), improving, degrading, flat
- Test component performance with: flagged components, components with `insufficient_data`
- Test budget waste with: never-used skill, 100% utilized tool, mixed
- End-to-end test: `report.py` runs on fixture data and produces non-empty text output

---

## 9. Out of Scope (first version)

- Embedding-based clustering of turns (requires numpy/sklearn; can be Phase 2)
- Web UI / dashboard (CLI output only for now)
- Real-time streaming of new turns (batch analysis only)
- Pushing results back into thalamus training pipeline
- Diffing two report runs (week-over-week automated alerts)
