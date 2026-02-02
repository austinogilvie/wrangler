---
id: SPEC-000042
title: 'Implement-Spec V2: GitHub-Centric Workflow with Bidirectional Sync'
type: specification
status: open
priority: high
labels:
  - specification
  - design
  - implement-spec
  - github-integration
  - workflow
  - v2
createdAt: '2026-02-02T03:14:11.479Z'
updatedAt: '2026-02-02T03:14:11.479Z'
project: Wrangler Core Workflows
wranglerContext:
  agentId: spec-writer-claude
  parentTaskId: implementation-process-audit
  estimatedEffort: 8-10 weeks (3 phases)
---
# Specification: Implement-Spec V2 Workflow

## Executive Summary

**What:** A redesigned spec-to-PR implementation workflow that uses GitHub Pull Requests as the primary audit trail and source of truth, replacing local plan files with evolving PR descriptions that track planning, execution, and verification progress in real-time.

**Why:** The current implement-spec workflow (v1) suffers from critical gaps identified in the SPEC-000016 implementation audit:
- No verification phase between execution and completion
- Premature "done" claims without evidence (claimed 100%, actually 65%)
- Missing E2E test requirements for user-facing features
- Task-oriented thinking vs. feature-oriented thinking
- Audit trail buried in local files instead of visible in GitHub

**Scope:**
- **Included:** 
  - GitHub PR as primary audit artifact with evolving description
  - Five-phase workflow (analyze, plan, execute, verify, publish)
  - Verification checkboxes in PR description for progress tracking
  - Modular architecture (hooks/, scripts/, templates/, examples/)
  - Bidirectional sync between wrangler issues/specs and GitHub Issues
  - Backwards compatibility with /implement and /implement-spec (v1)
  - Comprehensive E2E test requirements
  - Evidence-based completion gates

- **Excluded:**
  - Automatic PR merging (human approval required)
  - GitHub Actions integration (future phase)
  - Real-time collaborative editing of PR description
  - Migration of existing v1 sessions to v2 format

**Status:** Draft

---

## Goals and Non-Goals

### Goals

1. **Make audit trail visible in GitHub:** All planning, execution, and verification progress should be visible in PR timeline, not buried in local `.wrangler/sessions/` files
2. **Prevent premature completion:** Add mandatory verification phase with evidence requirements before claiming "done"
3. **Enforce E2E testing:** Require end-to-end tests for all user-facing features
4. **Enable GitHub sync:** Bidirectional sync between wrangler artifacts and GitHub Issues for unified workflow
5. **Improve modularity:** Break monolithic markdown skill into executable scripts, hooks, templates, and examples
6. **Maintain backwards compatibility:** Existing /implement and /implement-spec commands continue to work
7. **Support resumability:** Interrupted sessions can resume from last checkpoint using PR as source of truth

### Non-Goals

- Replacing the implement skill entirely (v1 remains for simple cases)
- Building a custom GitHub UI or browser extension
- Real-time collaboration features (multiple agents editing same PR)
- Automated PR approval/merging (human oversight required)
- Migrating historical v1 sessions to v2 format
- Integration with project management tools beyond GitHub (Jira, Linear, etc.)

---

## Background & Context

### Problem Statement

The implementation process audit of SPEC-000016 revealed systemic failures:

**Critical Issues:**
1. **Missing verification phase:** Workflow went directly from execution → completion without manual testing, spec compliance audit, or acceptance criteria verification
2. **Unit tests gave false confidence:** 93 passing unit tests but critical bugs (missing `async` keyword) and incomplete features (per-occurrence backend not implemented)
3. **Premature completion claims:** Claimed "100% complete" and "production-ready" when actually ~65% done
4. **Audit trail fragmentation:** Evidence scattered across local files, git commits, and terminal output—not centralized or easily reviewable
5. **Task-oriented vs. feature-oriented:** Focus on completing tasks rather than delivering working features

**Root Causes:**
- Over-optimization for velocity at expense of quality
- No quality gates that block progression
- Misleading success signals (tests pass ≠ feature works)
- Lack of mandatory verification checklist
- No E2E test requirements

### Current State (V1 Workflow)

**implement-spec skill (v1):**
```
INIT → PLAN → EXECUTE → VERIFY → PUBLISH → REPORT
```

**Problems:**
- VERIFY phase is shallow (only runs unit tests)
- No manual testing checklist
- No spec compliance audit
- No acceptance criteria verification
- Plan files stored locally (.wrangler/plans/), not visible in GitHub
- PR created at end with summary, but no incremental tracking
- Audit trail in `.wrangler/sessions/{id}/audit.jsonl` (not user-friendly)

### Proposed State (V2 Workflow)

**implement-spec-v2:**
```
ANALYZE → PLAN → EXECUTE → VERIFY → PUBLISH
         ↓       ↓         ↓         ↓
         └───────── PR Description Evolution ──────────┘
```

**Improvements:**
- PR created at PLAN phase (not PUBLISH)
- PR description evolves through each phase
- Verification checkboxes in PR description
- Manual testing checklist embedded in PR
- E2E test requirements enforced
- Spec compliance audit before completion
- All audit trail visible in GitHub PR timeline
- Modular architecture (scripts, hooks, templates)

---

## Requirements

### Functional Requirements

#### FR-001: GitHub PR as Primary Artifact
**Priority:** MUST HAVE

The system MUST create a GitHub Pull Request during the PLAN phase (not at the end) and use the PR description as the primary audit trail.

**Acceptance Criteria:**
- PR created after ANALYZE phase completes
- PR description initially seeded with spec content and planned tasks
- Each subsequent phase updates PR description with its outputs
- PR timeline shows all phase transitions via comments
- Verification progress tracked via checkboxes in PR description
- No local plan files created (PR description is the plan)

#### FR-002: Five-Phase Workflow
**Priority:** MUST HAVE

The system MUST execute five distinct phases in order:

1. **ANALYZE:** Read spec, extract acceptance criteria, identify user-facing features requiring E2E tests
2. **PLAN:** Break spec into tasks, create MCP issues, map to acceptance criteria, seed PR description
3. **EXECUTE:** Implement tasks with TDD, run code reviews, commit work
4. **VERIFY:** Manual testing, E2E tests, spec compliance audit, acceptance criteria verification
5. **PUBLISH:** Push branch, mark session complete, present summary

**Acceptance Criteria:**
- Each phase has clear entry/exit criteria (quality gates)
- Phase cannot proceed if gate criteria not met
- Phase transitions logged to GitHub PR timeline via comments
- Session checkpoint saved after each phase for resumability

#### FR-003: Verification Checkboxes
**Priority:** MUST HAVE

The PR description MUST include verification checkboxes that track progress:

**Acceptance Criteria:**
- Checkboxes auto-generated from spec acceptance criteria
- Checkboxes organized by phase (planning, execution, verification)
- Agent updates checkboxes as work progresses
- GitHub API used to update PR description programmatically
- Unchecked boxes prevent phase progression (quality gates)

**Example PR Description Structure:**
```markdown
## Specification
Implements: `SPEC-000016-cloaking-backend-integration.md`

## Planning Phase
- [x] Spec analyzed
- [x] 9 tasks created (ISS-000191 to ISS-000199)
- [x] E2E test plan created
- [x] Manual testing checklist generated

## Execution Phase
- [x] Task 1: Basic pseudonym generation (commit: abc123)
- [x] Task 2: Strategy defaults (commit: def456)
- [x] Task 3: User editing UI (commit: ghi789)
- [ ] Task 4: Backend per-occurrence support (IN PROGRESS)
- [ ] Task 5: E2E tests
...

## Verification Phase
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Manual testing checklist complete
- [ ] Spec compliance: 0/48 criteria met
- [ ] No browser console errors

## Acceptance Criteria (from spec)
- [ ] AC-001: User can accept entity with click
- [ ] AC-002: Pseudonym generated from strategy
...
```

#### FR-004: E2E Test Requirements
**Priority:** MUST HAVE

The system MUST enforce end-to-end test requirements for all user-facing features.

**Acceptance Criteria:**
- During ANALYZE phase, identify features requiring E2E tests
- Create E2E test plan with specific scenarios
- During EXECUTE phase, verify E2E tests written for each feature
- During VERIFY phase, run E2E tests and verify passing
- E2E test failures block progression to PUBLISH phase

**E2E Test Trigger Patterns:**
- User interaction (clicks, typing, navigation)
- API calls with data persistence
- State management across components
- Page transitions/routing
- UI rendering with dynamic content

#### FR-005: Spec Compliance Audit
**Priority:** MUST HAVE

The system MUST perform a spec compliance audit during VERIFY phase.

**Acceptance Criteria:**
- Extract all acceptance criteria from spec (numbered AC-001, AC-002, etc.)
- Map each criterion to implementation evidence (files, tests, commits)
- Generate compliance report: "X/Y criteria met (Z%)"
- Display compliance in PR description with live updates
- Block PUBLISH phase if compliance < 100%

**Example Compliance Report:**
```
Spec Compliance: 30/48 (62.5%) ❌ NOT READY

Phase 1: Basic Pseudonym Generation - 5/5 ✅
Phase 2: Strategy Defaults - 4/4 ✅
Phase 3: User Editing - 3/8 ❌ (missing backend wiring)
Phase 4: Preview Generation - 9/9 ✅
Phase 5: PDF Export - 3/3 ✅
Phase 6: Error Handling - 6/6 ✅
Phase 7: Backend Per-Occurrence - 0/13 ❌ (not implemented)
```

#### FR-006: Manual Testing Checklist
**Priority:** MUST HAVE

The system MUST generate and enforce completion of a manual testing checklist.

**Acceptance Criteria:**
- Checklist auto-generated during ANALYZE phase from spec
- Embedded in PR description as checkboxes
- Includes happy path, error cases, data persistence, browser console checks
- Agent performs manual testing during VERIFY phase
- Provides evidence (screenshots, console output, network requests)
- Checklist completion required before PUBLISH phase

#### FR-007: Modular Architecture
**Priority:** MUST HAVE

The system MUST use a modular directory structure instead of monolithic markdown skills.

**Acceptance Criteria:**
- `hooks/` - Git hooks (pre-commit, pre-push integration)
- `scripts/` - Executable automation (compliance audits, test runners)
- `templates/` - PR description templates, checklist templates
- `examples/` - Example workflows, sample PR descriptions
- Logic moved from markdown to executable TypeScript/bash scripts
- Skills invoke scripts via Bash tool, not inline logic

**Directory Structure:**
```
skills/implement-spec-v2/
├── SKILL.md                          # High-level orchestration
├── hooks/
│   ├── pre-commit-compliance.sh      # Run compliance checks
│   └── pre-push-verification.sh      # Verify before push
├── scripts/
│   ├── analyze-spec.ts               # Extract acceptance criteria
│   ├── generate-pr-description.ts    # Build PR description
│   ├── audit-spec-compliance.ts      # Check compliance
│   ├── generate-manual-checklist.ts  # Create testing checklist
│   └── update-pr-description.ts      # Update via GitHub API
├── templates/
│   ├── pr-description-initial.md     # Initial PR template
│   ├── pr-description-planning.md    # After PLAN phase
│   ├── pr-description-execution.md   # After EXECUTE phase
│   ├── pr-description-verify.md      # After VERIFY phase
│   └── manual-testing-checklist.md   # Testing template
└── examples/
    ├── example-pr-auth-system.md     # Sample PR for auth
    └── example-pr-cloaking.md        # Sample PR for cloaking
```

#### FR-008: Bidirectional GitHub Sync
**Priority:** SHOULD HAVE (Phase 2)

The system SHOULD support bidirectional synchronization between wrangler artifacts and GitHub Issues.

**Acceptance Criteria:**
- Wrangler issues can be created from GitHub Issues
- Wrangler specs can be created from GitHub Issues (labeled "specification")
- Changes to wrangler issues sync to GitHub Issues
- Changes to GitHub Issues sync to wrangler issues
- Conflict resolution strategy defined (last-write-wins with timestamp)
- Sync triggered on-demand via `/sync-github` command
- Optional: Periodic sync (configurable interval)

**Sync Mapping:**
```
Wrangler Issue         ↔  GitHub Issue
---------------------     -----------------
id: ISS-000042        ↔  number: #42
title                 ↔  title
description           ↔  body
status                ↔  state (open/closed)
labels                ↔  labels
assignee              ↔  assignee
priority              ↔  label: priority-{high|medium|low}
project               ↔  milestone or project
wranglerContext       ↔  body (frontmatter block)
```

#### FR-009: Backwards Compatibility
**Priority:** MUST HAVE

The system MUST maintain backwards compatibility with v1 workflows.

**Acceptance Criteria:**
- `/implement [scope]` continues to use v1 workflow
- `/implement-spec [spec]` continues to use v1 workflow
- `/implement-spec-v2 [spec]` uses new v2 workflow
- New command: `/wrangler:implement-v2` as alias
- v1 and v2 can coexist in same project
- Clear documentation distinguishing v1 vs v2
- No breaking changes to MCP session tools

#### FR-010: Session Resumability
**Priority:** MUST HAVE

The system MUST support resuming interrupted sessions using PR as source of truth.

**Acceptance Criteria:**
- Session state stored in `.wrangler/sessions/{id}/context.json`
- PR URL stored in session context
- On resume, fetch current PR description from GitHub
- Parse PR description to determine current phase and progress
- Resume from last incomplete phase
- Agent can ask: "Resume session {id}?" if interrupted session detected

---

### Non-Functional Requirements

#### NFR-001: Performance
**Priority:** SHOULD HAVE

- PR description updates MUST complete within 2 seconds (p95)
- GitHub API rate limits MUST be respected (5000 req/hour for authenticated)
- Spec compliance audit MUST complete within 10 seconds for specs with <100 criteria
- Session resumption MUST complete within 5 seconds

#### NFR-002: Reliability
**Priority:** MUST HAVE

- GitHub API failures MUST be retried with exponential backoff (3 attempts)
- Network failures MUST not corrupt local session state
- Session interruption MUST preserve all work (checkpoints after each phase)
- PR description updates MUST be atomic (no partial updates)

#### NFR-003: Security
**Priority:** MUST HAVE

- GitHub Personal Access Token (PAT) MUST be stored securely (environment variable)
- PAT MUST have minimal required scopes (repo, issues)
- Sensitive data MUST NOT be included in PR descriptions
- Branch protection rules MUST be respected (no force-push)

#### NFR-004: Usability
**Priority:** SHOULD HAVE

- PR description MUST be readable and well-formatted
- Verification checkboxes MUST be intuitive and clearly labeled
- Phase transitions MUST be visible in PR timeline (comments)
- Error messages MUST be actionable and specific
- Documentation MUST include examples and troubleshooting

#### NFR-005: Maintainability
**Priority:** SHOULD HAVE

- Scripts MUST be testable in isolation (unit tests)
- Templates MUST be parameterized (no hardcoded values)
- Code MUST follow TypeScript best practices
- GitHub API calls MUST be centralized (single client module)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User / Claude Code                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ /wrangler:implement-v2 spec.md
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Implement-Spec-V2 Orchestrator                  │
│              (skills/implement-spec-v2/SKILL.md)             │
└──────────┬───────────────────────────────────────────┬──────┘
           │                                           │
           │ Phase Execution                           │ State Management
           ↓                                           ↓
┌──────────────────────────┐              ┌────────────────────────┐
│   Phase Scripts          │              │   MCP Session Tools    │
│   (scripts/*.ts)         │              │   (session_start, etc) │
│                          │              │                        │
│ - analyze-spec.ts        │              │ - session context      │
│ - generate-pr-desc.ts    │              │ - checkpoints          │
│ - audit-compliance.ts    │              │ - phase tracking       │
│ - update-pr-desc.ts      │              │                        │
└──────────┬───────────────┘              └────────┬───────────────┘
           │                                       │
           │ GitHub API Calls                      │ Local Storage
           ↓                                       ↓
┌──────────────────────────┐              ┌────────────────────────┐
│   GitHub API Client      │              │   .wrangler/sessions/  │
│   (utils/github.ts)      │              │   - context.json       │
│                          │              │   - audit.jsonl        │
│ - Create PR              │              │                        │
│ - Update PR description  │              └────────────────────────┘
│ - Add PR comment         │
│ - Fetch PR status        │
└──────────┬───────────────┘
           │
           │ REST API
           ↓
┌──────────────────────────────────────────────────────────────┐
│                         GitHub                                │
│                                                               │
│  - Pull Request (audit trail)                                │
│  - Issues (optional sync)                                    │
│  - Commits (implementation evidence)                         │
└──────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Component 1: Orchestrator (SKILL.md)

**Responsibility:** High-level workflow coordination across phases

**Interfaces:**
- Input: `/wrangler:implement-v2 [spec-file]` command
- Output: Session summary, PR URL, completion status

**Key Behaviors:**
1. Parse command arguments (spec file path)
2. Initialize session via `session_start` MCP tool
3. Execute phases sequentially: ANALYZE → PLAN → EXECUTE → VERIFY → PUBLISH
4. Invoke phase scripts via Bash tool
5. Update session checkpoints after each phase
6. Handle errors and interruptions
7. Present final summary to user

**Dependencies:**
- Phase scripts (scripts/*.ts)
- MCP session tools
- GitHub API client
- Template files

**Error Handling:**
- Quality gate failures → halt and escalate
- GitHub API failures → retry 3x with backoff
- Session interruption → save checkpoint, allow resume

---

#### Component 2: Analyze Phase Script

**File:** `scripts/analyze-spec.ts`

**Responsibility:** Extract acceptance criteria, identify E2E test needs, generate verification checklist

**Interface:**
```typescript
interface AnalyzeSpecParams {
  specFile: string;
  sessionId: string;
}

interface AnalyzeSpecResult {
  acceptanceCriteria: AcceptanceCriterion[];
  e2eTestFeatures: string[];
  manualTestingChecklist: ChecklistItem[];
  totalCriteria: number;
}

async function analyzeSpec(params: AnalyzeSpecParams): Promise<AnalyzeSpecResult>
```

**Algorithm:**
1. Read spec file content
2. Parse markdown sections
3. Extract acceptance criteria (numbered AC-001, AC-002, etc.)
4. Identify user-facing features (triggers: "user can", "UI displays", "clicking", etc.)
5. Generate E2E test scenarios for identified features
6. Generate manual testing checklist from requirements
7. Return structured result

**Output Example:**
```json
{
  "acceptanceCriteria": [
    { "id": "AC-001", "description": "User can accept entity with click", "section": "Phase 1" },
    { "id": "AC-002", "description": "Pseudonym generated from strategy", "section": "Phase 1" }
  ],
  "e2eTestFeatures": [
    "Entity acceptance flow",
    "Pseudonym display in popover",
    "User editing of pseudonyms"
  ],
  "manualTestingChecklist": [
    { "id": "MT-001", "description": "Click accept button → pseudonym appears" },
    { "id": "MT-002", "description": "Edit pseudonym → value persists" }
  ],
  "totalCriteria": 48
}
```

---

#### Component 3: Generate PR Description Script

**File:** `scripts/generate-pr-description.ts`

**Responsibility:** Build PR description from template and phase outputs

**Interface:**
```typescript
interface GeneratePRDescriptionParams {
  specFile: string;
  sessionId: string;
  phase: 'initial' | 'planning' | 'execution' | 'verification';
  analyzeResult?: AnalyzeSpecResult;
  planResult?: PlanPhaseResult;
  executionResult?: ExecutionPhaseResult;
  verificationResult?: VerificationPhaseResult;
}

interface GeneratePRDescriptionResult {
  content: string;
  metadata: {
    totalCheckboxes: number;
    completedCheckboxes: number;
    currentPhase: string;
  };
}

async function generatePRDescription(params: GeneratePRDescriptionParams): Promise<GeneratePRDescriptionResult>
```

**Algorithm:**
1. Load appropriate template from `templates/`
2. Inject dynamic content based on phase
3. Format acceptance criteria as checkboxes
4. Format task list with commit links
5. Format verification checklist
6. Calculate completion metrics
7. Return formatted markdown

**Templates Used:**
- `pr-description-initial.md` - After ANALYZE (spec summary)
- `pr-description-planning.md` - After PLAN (task breakdown)
- `pr-description-execution.md` - After EXECUTE (commit links)
- `pr-description-verify.md` - After VERIFY (evidence)

---

#### Component 4: Spec Compliance Audit Script

**File:** `scripts/audit-spec-compliance.ts`

**Responsibility:** Verify implementation against acceptance criteria

**Interface:**
```typescript
interface AuditComplianceParams {
  specFile: string;
  sessionId: string;
  acceptanceCriteria: AcceptanceCriterion[];
  worktreePath: string;
}

interface AuditComplianceResult {
  totalCriteria: number;
  metCriteria: number;
  unmετCriteria: string[];
  compliancePercentage: number;
  evidenceMap: Map<string, Evidence>;
}

interface Evidence {
  criterion: string;
  files: string[];
  tests: string[];
  commits: string[];
  verified: boolean;
}

async function auditSpecCompliance(params: AuditComplianceParams): Promise<AuditComplianceResult>
```

**Algorithm:**
1. Load acceptance criteria from analyze phase output
2. For each criterion:
   a. Search codebase for implementation evidence (grep for keywords)
   b. Search test files for verification tests
   c. Search git log for related commits
   d. Determine if criterion is met (heuristic-based)
3. Calculate compliance percentage
4. Generate report with evidence mapping
5. Return structured result

**Verification Heuristics:**
- File mentions criterion keywords → likely implemented
- Test exists with criterion keywords → likely verified
- Commit message references criterion → likely complete
- All three present → criterion MET
- Missing any → criterion UNMET

---

#### Component 5: Update PR Description Script

**File:** `scripts/update-pr-description.ts`

**Responsibility:** Update GitHub PR description via API

**Interface:**
```typescript
interface UpdatePRDescriptionParams {
  prNumber: number;
  newDescription: string;
  sessionId: string;
}

interface UpdatePRDescriptionResult {
  success: boolean;
  prUrl: string;
  updatedAt: string;
}

async function updatePRDescription(params: UpdatePRDescriptionParams): Promise<UpdatePRDescriptionResult>
```

**Algorithm:**
1. Load GitHub PAT from environment variable
2. Initialize GitHub API client (Octokit)
3. Call `PATCH /repos/{owner}/{repo}/pulls/{number}` with new body
4. Handle rate limiting (retry with backoff)
5. Verify update succeeded
6. Return result

**Error Handling:**
- Rate limit exceeded → wait and retry (exponential backoff)
- Authentication failure → return error with setup instructions
- Network failure → retry 3x, then fail

---

#### Component 6: GitHub API Client

**File:** `utils/github.ts`

**Responsibility:** Centralized GitHub API interactions

**Interface:**
```typescript
class GitHubClient {
  constructor(token: string, owner: string, repo: string);
  
  async createPR(params: CreatePRParams): Promise<PR>;
  async updatePR(prNumber: number, params: UpdatePRParams): Promise<PR>;
  async addPRComment(prNumber: number, body: string): Promise<Comment>;
  async getPR(prNumber: number): Promise<PR>;
  async listIssues(params: ListIssuesParams): Promise<Issue[]>;
  async createIssue(params: CreateIssueParams): Promise<Issue>;
  async updateIssue(issueNumber: number, params: UpdateIssueParams): Promise<Issue>;
}
```

**Key Features:**
- Automatic rate limit handling
- Retry logic with exponential backoff
- Request/response logging (debug mode)
- Type-safe interfaces for all API calls

---

#### Component 7: Bidirectional Sync Engine (Phase 2)

**File:** `utils/github-sync.ts`

**Responsibility:** Synchronize wrangler issues with GitHub Issues

**Interface:**
```typescript
interface SyncParams {
  direction: 'push' | 'pull' | 'bidirectional';
  artifactTypes: ('issue' | 'specification')[];
  dryRun?: boolean;
}

interface SyncResult {
  created: number;
  updated: number;
  conflicts: Conflict[];
  errors: SyncError[];
}

async function syncWithGitHub(params: SyncParams): Promise<SyncResult>
```

**Sync Algorithm (Bidirectional):**
1. Fetch all wrangler issues/specs from MCP
2. Fetch all GitHub Issues with label `wrangler:synced`
3. Build mapping: wrangler ID ↔ GitHub issue number
4. Detect changes:
   - New wrangler issues → create GitHub Issues
   - New GitHub Issues → create wrangler issues
   - Modified wrangler issues → update GitHub Issues
   - Modified GitHub Issues → update wrangler issues
5. Conflict resolution:
   - Compare `updatedAt` timestamps
   - Last-write-wins strategy
   - Log conflicts for manual review
6. Execute changes (or preview if dry-run)
7. Return sync result

**Conflict Resolution Strategy:**
- **Last-write-wins:** Most recent `updatedAt` timestamp wins
- **Merge strategy:** If both modified, merge non-conflicting fields
- **Manual review:** Critical conflicts logged for human decision

---

### Data Models

#### Session Context
```typescript
interface SessionContext {
  id: string;
  specFile: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentPhase: 'analyze' | 'plan' | 'execute' | 'verify' | 'publish';
  worktreePath: string;
  branchName: string;
  prNumber?: number;
  prUrl?: string;
  phasesCompleted: string[];
  tasksCompleted: string[];
  tasksPending: string[];
  analyzeResult?: AnalyzeSpecResult;
  planResult?: PlanPhaseResult;
  startedAt: string;
  updatedAt: string;
}
```

#### Acceptance Criterion
```typescript
interface AcceptanceCriterion {
  id: string;              // AC-001, AC-002, etc.
  description: string;      // What must be true
  section: string;          // Which spec section
  priority: 'must' | 'should' | 'nice';
  met: boolean;             // Verification result
  evidence?: Evidence;      // How we verified it
}
```

#### PR Description Metadata
```typescript
interface PRDescriptionMetadata {
  specFile: string;
  sessionId: string;
  phase: string;
  totalTasks: number;
  completedTasks: number;
  totalCriteria: number;
  metCriteria: number;
  compliancePercentage: number;
  lastUpdated: string;
}
```

---

## Implementation Details

### Phase-by-Phase Workflow

#### Phase 1: ANALYZE

**Entry Criteria:**
- Valid spec file path provided
- Spec file exists and is readable
- Session initialized via `session_start`

**Steps:**
1. Invoke `scripts/analyze-spec.ts`
2. Extract acceptance criteria (AC-001, AC-002, etc.)
3. Identify user-facing features requiring E2E tests
4. Generate manual testing checklist
5. Save analyze result to session context
6. Update session phase to 'analyze_complete'

**Exit Criteria:**
- Acceptance criteria extracted (at least 1)
- E2E test plan created
- Manual testing checklist generated
- No parse errors

**Quality Gate:**
- If spec has zero acceptance criteria → ESCALATE to user
- If spec file malformed → ESCALATE with parse error

---

#### Phase 2: PLAN

**Entry Criteria:**
- ANALYZE phase completed
- Acceptance criteria available

**Steps:**
1. Invoke `writing-plans` skill to break spec into tasks
2. Create MCP issues for each task
3. Map tasks to acceptance criteria
4. Invoke `scripts/generate-pr-description.ts` with 'planning' template
5. Create GitHub PR via `utils/github.ts`
6. Update session context with PR number and URL
7. Update session phase to 'plan_complete'

**Exit Criteria:**
- At least 1 task created
- GitHub PR created successfully
- PR description contains task breakdown
- Every acceptance criterion mapped to at least one task

**Quality Gate:**
- If no PR created → halt (GitHub API failure)
- If orphan acceptance criteria (no tasks) → WARN user

**PR Description After PLAN:**
```markdown
## Specification
Implements: `SPEC-000016-cloaking-backend-integration.md`

## Planning Phase ✅
- [x] Spec analyzed
- [x] 9 tasks created
- [x] E2E test plan created
- [x] Manual testing checklist generated

### Task Breakdown
1. **ISS-000191:** Basic pseudonym generation
2. **ISS-000192:** Strategy defaults
3. **ISS-000193:** User editing UI
4. **ISS-000194:** Backend per-occurrence support
5. **ISS-000195:** E2E tests for acceptance flow
...

## Acceptance Criteria (48 total)
- [ ] AC-001: User can accept entity with click
- [ ] AC-002: Pseudonym generated from strategy
...

## E2E Test Plan
1. **Entity Acceptance Flow:** Click accept → pseudonym generated → persists
2. **User Editing Flow:** Click edit → change value → save → value persists
...

## Manual Testing Checklist
- [ ] MT-001: Start frontend and backend
- [ ] MT-002: Open browser DevTools
- [ ] MT-003: Click accept button on entity
- [ ] MT-004: Verify pseudonym appears in popover
...
```

---

#### Phase 3: EXECUTE

**Entry Criteria:**
- PLAN phase completed
- PR exists and is accessible
- Tasks created and ready

**Steps:**
1. Invoke `implement` skill with task list
2. For each task:
   a. Implementation subagent executes with TDD
   b. Code review subagent reviews
   c. Fix subagents handle Critical/Important issues
   d. Update PR description with task completion (checkbox)
   e. Add PR comment: "Completed task {id}: {title}"
3. Save execution result to session context
4. Update session phase to 'execute_complete'

**Exit Criteria:**
- All tasks completed
- All Critical/Important code review issues fixed
- All changes committed to branch
- PR description updated with all task completions

**Quality Gate:**
- If any task blocked after escalation → HALT
- If code review issues cannot be fixed (flummoxed) → ESCALATE

**PR Description During EXECUTE:**
```markdown
## Execution Phase ⏳
- [x] Task 1: Basic pseudonym generation (commit: abc123)
- [x] Task 2: Strategy defaults (commit: def456)
- [x] Task 3: User editing UI (commit: ghi789)
- [ ] Task 4: Backend per-occurrence support (IN PROGRESS)
...

## Recent Activity
- ✅ Completed Task 3: User editing UI (commit: ghi789)
- 🔧 Fixed Critical issue: Missing null check in parseUser()
- ⏳ Started Task 4: Backend per-occurrence support
```

---

#### Phase 4: VERIFY

**Entry Criteria:**
- EXECUTE phase completed
- All tasks marked complete
- All changes committed

**Steps:**
1. Run full test suite (unit + integration + E2E)
   ```bash
   cd {worktree} && npm test
   ```
2. Invoke `scripts/audit-spec-compliance.ts`
   - Check compliance percentage
   - Identify unmet criteria
3. Manual testing (agent performs and documents):
   - Start services (frontend, backend)
   - Execute manual testing checklist
   - Capture screenshots/evidence
   - Document in PR comments
4. Browser console check:
   - Open DevTools
   - Execute test scenarios
   - Verify no errors in console
5. Update PR description with verification results
6. Update session phase to 'verify_complete'

**Exit Criteria:**
- All tests passing (exit code 0)
- Spec compliance >= 100%
- Manual testing checklist complete
- No browser console errors
- Evidence provided for all verification steps

**Quality Gate (CRITICAL):**
- If tests failing → halt, do NOT proceed
- If compliance < 100% → halt, identify gaps, ESCALATE
- If manual testing incomplete → halt, request completion
- If console errors present → halt, fix errors first

**PR Description After VERIFY:**
```markdown
## Verification Phase ✅
- [x] All unit tests passing (147/147)
- [x] All integration tests passing (23/23)
- [x] All E2E tests passing (8/8)
- [x] Manual testing checklist complete
- [x] Spec compliance: 48/48 (100%) ✅
- [x] No browser console errors

## Spec Compliance Report
Phase 1: Basic Pseudonym Generation - 5/5 ✅
Phase 2: Strategy Defaults - 4/4 ✅
Phase 3: User Editing - 8/8 ✅
Phase 4: Preview Generation - 9/9 ✅
Phase 5: PDF Export - 3/3 ✅
Phase 6: Error Handling - 6/6 ✅
Phase 7: Backend Per-Occurrence - 13/13 ✅

## Manual Testing Evidence
**Test: Entity Acceptance Flow**
- Started services: frontend (localhost:3000), backend (localhost:5001)
- Clicked "Accept" on entity "John Doe"
- Pseudonym generated: "Alpha-7"
- Verified in entities.json
- Screenshot: [link]

**Browser Console:**
- No errors
- No warnings
- Network requests: 8 successful, 0 failed
```

---

#### Phase 5: PUBLISH

**Entry Criteria:**
- VERIFY phase completed (all gates passed)
- Branch committed and clean
- PR description up-to-date

**Steps:**
1. Push branch to remote
   ```bash
   git push -u origin {branch}
   ```
2. Add final PR comment summarizing session
3. Invoke `session_complete` MCP tool
4. Present summary to user with PR URL
5. Optionally invoke `finishing-a-development-branch` skill

**Exit Criteria:**
- Branch pushed successfully
- Session marked complete
- User presented with summary and PR URL

**Quality Gate:**
- If push fails (conflicts, auth) → ESCALATE
- If cannot mark complete → WARN but continue

**Final PR Comment:**
```markdown
## Implementation Complete ✅

**Session:** 2026-01-31-1b84d33-a14c
**Duration:** 2 hours 15 minutes
**Tasks Completed:** 9/9
**Spec Compliance:** 48/48 (100%)

### Test Results
- Unit tests: 147/147 passing
- Integration tests: 23/23 passing
- E2E tests: 8/8 passing

### TDD Compliance
- 18 functions implemented
- 18/18 followed RED-GREEN-REFACTOR
- 0 deviations

### Code Reviews
- 9 reviews completed
- 2 Critical fixed, 3 Important fixed, 5 Minor deferred

Ready for review and merge.

---
Generated with Claude Code + Wrangler
```

---

### Command Structure

#### Primary Command
```bash
/wrangler:implement-v2 [spec-file]
```

**Aliases:**
- `/implement-spec-v2 [spec-file]`

**Examples:**
```bash
# Full path
/wrangler:implement-v2 .wrangler/specifications/SPEC-000016-cloaking-backend.md

# Relative path (searches .wrangler/specifications/)
/wrangler:implement-v2 SPEC-000016

# Infer from context (last mentioned spec file)
/wrangler:implement-v2
```

#### Backwards Compatibility Commands (V1)
```bash
/wrangler:implement [scope]        # Uses v1 workflow
/implement-spec [spec-file]        # Uses v1 workflow
```

#### Sync Command (Phase 2)
```bash
/wrangler:sync-github [direction] [types]
```

**Examples:**
```bash
# Push wrangler issues to GitHub
/wrangler:sync-github push issues

# Pull GitHub Issues to wrangler
/wrangler:sync-github pull issues

# Bidirectional sync (issues and specs)
/wrangler:sync-github bidirectional issues,specifications

# Dry-run (preview changes)
/wrangler:sync-github bidirectional issues --dry-run
```

---

## Security Considerations

### GitHub Personal Access Token

**Storage:**
- MUST be stored in environment variable `GITHUB_TOKEN` or `GITHUB_PAT`
- NEVER hardcoded in scripts or configuration files
- NEVER committed to git repository

**Required Scopes:**
- `repo` - Read/write access to code, PRs, issues
- `workflow` (optional) - If GitHub Actions integration added later

**Security Best Practices:**
- Use fine-grained tokens with minimal scopes
- Rotate tokens every 90 days
- Revoke tokens immediately if compromised

### Sensitive Data in PR Descriptions

**Guidelines:**
- NEVER include API keys, passwords, or tokens in PR descriptions
- NEVER include user PII (emails, names) unless anonymized
- Sanitize error messages (remove stack traces with paths)
- Redact sensitive configuration values

**Example Sanitization:**
```markdown
❌ WRONG:
Error: Database connection failed: postgres://user:password@localhost:5432

✅ CORRECT:
Error: Database connection failed: [credentials redacted]
```

### Branch Protection

**Respect Repository Rules:**
- Do NOT force-push to protected branches
- Do NOT bypass required checks
- Do NOT merge PRs programmatically (require human approval)

---

## Error Handling

### Error Categories

#### 1. GitHub API Errors

**Causes:**
- Rate limit exceeded (5000 req/hour)
- Authentication failure (invalid token)
- Network timeout
- Resource not found (PR deleted)

**Handling:**
- **Rate limit:** Wait for reset (check X-RateLimit-Reset header), retry
- **Auth failure:** Clear error message with setup instructions
- **Network timeout:** Retry 3x with exponential backoff (1s, 2s, 4s)
- **Not found:** Check if PR still exists, escalate if deleted

#### 2. Quality Gate Failures

**Causes:**
- Tests failing
- Spec compliance < 100%
- Manual testing incomplete
- Browser console errors

**Handling:**
- **Tests failing:** Display failures, halt workflow, ESCALATE
- **Compliance < 100%:** Show unmet criteria, halt, ESCALATE
- **Manual testing incomplete:** Prompt agent to complete, halt until done
- **Console errors:** Display errors, halt, request fixes

#### 3. Session Interruptions

**Causes:**
- Claude Code crash
- Network disconnection
- User cancellation

**Handling:**
- Save checkpoint before each phase transition
- On restart, detect interrupted session via `session_get()`
- Offer resume: "Resume session {id} from phase {phase}?"
- If user confirms, continue from last checkpoint

---

## Testing Strategy

### Unit Tests

**Test Targets:**
- `scripts/analyze-spec.ts` - Acceptance criteria extraction
- `scripts/generate-pr-description.ts` - Template rendering
- `scripts/audit-spec-compliance.ts` - Compliance calculation
- `utils/github.ts` - API client methods
- `utils/github-sync.ts` - Sync logic

**Coverage Target:** 80%+

**Test Approach:**
- Mock GitHub API responses
- Provide sample spec files as fixtures
- Verify output structure and content
- Test error conditions (malformed specs, API failures)

**Example Test:**
```typescript
describe('analyzeSpec', () => {
  it('should extract numbered acceptance criteria', async () => {
    const result = await analyzeSpec({
      specFile: 'fixtures/sample-spec.md',
      sessionId: 'test-session',
    });
    
    expect(result.acceptanceCriteria).toHaveLength(10);
    expect(result.acceptanceCriteria[0].id).toBe('AC-001');
    expect(result.acceptanceCriteria[0].description).toContain('user can');
  });
});
```

### Integration Tests

**Test Scenarios:**
1. **Full workflow (happy path):** ANALYZE → PLAN → EXECUTE → VERIFY → PUBLISH
2. **Quality gate failure:** Tests fail during VERIFY → halt workflow
3. **Session resume:** Interrupt during EXECUTE → resume successfully
4. **GitHub API failure:** Rate limit hit → retry logic works

**Test Approach:**
- Use test GitHub repository (ephemeral)
- Create real PRs during tests (clean up after)
- Verify PR descriptions match expected templates
- Verify checkboxes updated correctly

### End-to-End Tests

**Test Scenarios:**
1. **Implement small spec:** 3 tasks, no E2E tests, verify PR created
2. **Implement spec with E2E:** 5 tasks, 2 E2E tests, verify all pass
3. **Spec compliance failure:** Incomplete implementation → verify halt
4. **Manual testing evidence:** Verify screenshots/logs in PR comments

**Test Approach:**
- Real spec files (fixtures)
- Real implementation (subagents work)
- Real GitHub PRs (ephemeral repo)
- Verify end state (PR merged, session complete)

---

## Deployment

### Installation

**Prerequisites:**
- Wrangler v1.2.0+ installed
- Node.js v18+ (for TypeScript scripts)
- Git configured
- GitHub Personal Access Token with `repo` scope

**Steps:**
1. Update wrangler to v1.2.0+
   ```bash
   npm install -g wrangler@latest
   ```

2. Set GitHub token
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```

3. Verify installation
   ```bash
   /wrangler:implement-v2 --version
   # Expected: v2.0.0
   ```

### Migration from V1

**Backwards Compatibility:**
- V1 commands continue to work unchanged
- No migration required for existing sessions
- V2 is opt-in via new command

**Migration Path (Optional):**
1. Complete any in-progress v1 sessions
2. Start new specs with v2 workflow
3. Gradually adopt v2 for team

**Breaking Changes:**
- None (v1 and v2 coexist)

---

## Performance Characteristics

### Expected Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| ANALYZE phase | < 5 seconds | For specs with <100 criteria |
| PLAN phase | < 10 seconds | Includes PR creation |
| PR description update | < 2 seconds (p95) | GitHub API call |
| Spec compliance audit | < 10 seconds | For <100 criteria, <1000 files |
| Session resume | < 5 seconds | Load from disk + fetch PR |

### Scalability Considerations

**Large Specs (>100 criteria):**
- ANALYZE phase may take 10-20 seconds
- Compliance audit may take 20-30 seconds
- Consider batching compliance checks

**Large Codebases (>10,000 files):**
- Grep operations may be slow
- Consider using search index (ripgrep)
- Cache analysis results

**GitHub API Rate Limits:**
- 5000 requests/hour for authenticated users
- Average workflow uses ~20 API calls
- Supports ~250 workflows/hour
- Implement caching for repeated queries

---

## Open Questions & Decisions

### Resolved Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Use PR description as source of truth | Centralized audit trail visible in GitHub | Local files (v1 approach) |
| Mandatory VERIFY phase | Prevents premature completion claims | Optional verification (too risky) |
| Modular architecture | Testability, reusability, maintainability | Monolithic markdown skill (v1) |
| Last-write-wins conflict resolution | Simple, predictable, low overhead | Manual review (too slow), 3-way merge (complex) |
| TypeScript for scripts | Type safety, better IDE support, testable | Bash scripts (harder to test) |

### Open Questions

| Question | Status | Resolution Needed By |
|----------|--------|----------------------|
| Should we support GitHub Actions integration? | DEFERRED | Phase 3 |
| Should sync be real-time or on-demand? | DEFERRED | Phase 2 implementation |
| Should we support multiple PR description formats? | OPEN | Before v2.0.0 release |
| Should verification evidence include videos? | OPEN | User feedback post-launch |
| Should we auto-merge PRs that pass all gates? | OPEN | Security review needed |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **GitHub API rate limits exceeded** | Medium | High | Implement caching, retry logic, respect rate limit headers |
| **PR description becomes too large (>65KB limit)** | Low | Medium | Truncate older activity, link to full audit in comments |
| **Network failure during PR update loses progress** | Low | Medium | Atomic updates, save state before API calls, retry logic |
| **User edits PR description manually, breaking automation** | Medium | Low | Parse current state before updating, detect conflicts |
| **Spec compliance audit false positives** | Medium | Medium | Manual override mechanism, improve heuristics with feedback |
| **Session resume fails due to PR deleted** | Low | High | Detect missing PR, offer to create new PR or abort session |
| **Backwards incompatibility breaks existing workflows** | Low | High | Comprehensive testing, maintain v1 alongside v2 |

---

## Success Criteria

### Launch Criteria (Phase 1)

- [ ] All functional requirements implemented (FR-001 to FR-007, FR-009, FR-010)
- [ ] Unit test coverage > 80%
- [ ] Integration tests pass (5 scenarios)
- [ ] E2E tests pass (3 scenarios)
- [ ] Documentation complete (README, examples, troubleshooting)
- [ ] Backwards compatibility verified (v1 commands still work)
- [ ] Manual testing complete (3 sample specs implemented with v2)
- [ ] Code review passed
- [ ] No critical or high-priority bugs

### Success Metrics (Post-Launch)

**Adoption:**
- 50% of new specs use v2 workflow within 30 days
- 80% of specs use v2 workflow within 90 days

**Quality:**
- 95% reduction in premature "done" claims (vs. v1)
- 90% spec compliance at PR creation (vs. 65% in SPEC-000016)
- E2E test coverage on 100% of user-facing features

**Efficiency:**
- Average workflow duration: <3 hours for 10-task spec
- Session resume success rate: >95%
- GitHub API rate limit violations: <1% of workflows

**User Satisfaction:**
- Positive feedback from 80% of users
- <5% revert to v1 workflow after trying v2

---

## Timeline & Milestones

### Phase 1: Core V2 Workflow (4-6 weeks)

**Week 1-2: Foundation**
- [ ] Design modular architecture
- [ ] Implement GitHub API client (utils/github.ts)
- [ ] Create PR description templates
- [ ] Write unit tests for utilities

**Week 3-4: Phase Scripts**
- [ ] Implement analyze-spec.ts
- [ ] Implement generate-pr-description.ts
- [ ] Implement audit-spec-compliance.ts
- [ ] Implement update-pr-description.ts
- [ ] Write unit tests for scripts

**Week 5-6: Orchestration & Testing**
- [ ] Implement SKILL.md orchestrator
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Manual testing with sample specs
- [ ] Documentation

### Phase 2: GitHub Sync (3-4 weeks)

**Week 1-2: Sync Engine**
- [ ] Implement github-sync.ts
- [ ] Bidirectional sync logic
- [ ] Conflict resolution
- [ ] Unit tests

**Week 3-4: Integration & Testing**
- [ ] /wrangler:sync-github command
- [ ] Integration tests
- [ ] Documentation
- [ ] User testing

### Phase 3: Advanced Features (TBD)

**Future Enhancements:**
- GitHub Actions integration (auto-run verification)
- Video evidence for manual testing
- Multi-repo sync
- Custom PR description templates
- Performance optimizations (search indexing)

---

## References

### Related Specifications

- **SPEC-000016:** Cloaking Backend Integration (audit identified gaps)
- **implement-spec (v1):** Current workflow being replaced

### Related Issues

- **ISS-000059:** Memos created in subdirectory .wrangler/memos instead of root memos/
- **Implementation Process Audit:** .wrangler/memos/2026-01-31-implementation-process-audit.md

### External Resources

- **GitHub REST API:** https://docs.github.com/en/rest
- **Octokit (GitHub API client):** https://github.com/octokit/octokit.js
- **MCP Session Tools:** mcp/tools/session/

### Internal Documentation

- **Current Workflows:** docs/workflows.md
- **Verification Requirements:** docs/verification-requirements.md
- **Skill Invocation Patterns:** docs/skill-invocation-patterns.md
- **Git Hooks:** docs/git-hooks.md

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **Acceptance Criterion (AC)** | Specific, testable requirement from spec (e.g., AC-001) |
| **Quality Gate** | Checkpoint that must pass before proceeding to next phase |
| **Spec Compliance** | Percentage of acceptance criteria met (verified) |
| **E2E Test** | End-to-end test covering full user journey |
| **PR Description Evolution** | PR description updated through workflow phases |
| **Session Resumability** | Ability to continue interrupted session from checkpoint |
| **Bidirectional Sync** | Two-way synchronization between wrangler and GitHub |
| **Evidence** | Proof that acceptance criterion met (files, tests, commits) |

### Assumptions

1. **GitHub access:** User has GitHub account with repo access
2. **Git repository:** Project is a git repository
3. **Network connectivity:** Stable internet for GitHub API calls
4. **Node.js available:** v18+ for running TypeScript scripts
5. **MCP tools available:** session_start, session_checkpoint, etc. work
6. **Spec format:** Specs follow wrangler template structure

### Constraints

1. **GitHub API rate limits:** 5000 requests/hour (authenticated)
2. **PR description size limit:** 65,536 characters (GitHub limit)
3. **Worktree limitations:** Some git operations don't work in worktrees
4. **Network dependency:** Requires internet for GitHub operations
5. **Token expiration:** GitHub tokens expire (need rotation)

---

**End of Specification**

