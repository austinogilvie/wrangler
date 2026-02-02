---
id: ISS-000059
title: >-
  Memos created in subdirectory .wrangler/memos/ instead of top-level repository
  .wrangler/memos/
type: issue
status: open
priority: high
labels:
  - bug
  - governance
  - mcp
  - subagents
  - path-resolution
createdAt: '2026-01-30T19:22:49.344Z'
updatedAt: '2026-01-30T19:22:49.344Z'
project: Governance Framework
wranglerContext:
  agentId: main-session
  estimatedEffort: 1-2 days
---
## Summary

Memos are sometimes being created in subdirectory `.wrangler/memos/` paths (e.g., `frontend/.wrangler/memos/`) instead of the top-level repository `.wrangler/memos/` directory. This leads to memo fragmentation across the codebase and violates the centralized governance structure.

**Impact**: 
- Memos scattered across multiple locations
- Breaks centralized governance model
- Makes it harder to find and track reference material
- Inconsistent with wrangler's `.wrangler/` centralization principle

**Current Behavior**: 
Subagents (and possibly main agents) sometimes create memos in subdirectory `.wrangler/` paths when working from subdirectories.

**Expected Behavior**: 
All memos should be created in the top-level repository `.wrangler/memos/` directory regardless of current working directory or subagent context.

## Issue Reproduction Steps

1. Spawn a subagent with a task that generates a memo
2. If the subagent's working directory is a subdirectory (e.g., `frontend/`)
3. Observe memo gets created at `frontend/.wrangler/memos/` instead of top-level `.wrangler/memos/`

## Environment

- **Wrangler Version**: 1.2.0
- **MCP Server**: wrangler-mcp
- **Context**: Occurs with subagents working in subdirectories

## Root Cause Analysis

Likely causes:
1. **Path resolution issue**: MCP server or session hooks may be resolving paths relative to current working directory instead of git repository root
2. **Git root detection**: Workspace root detection may fail in nested contexts
3. **Subagent context isolation**: Subagents may not inherit correct workspace root from parent session

## Solutions Attempted

None yet - issue just identified.

## Available Diagnostics

- Example observed: Memos created in `frontend/.wrangler/memos/` 
- Need to audit: Session hook path resolution logic
- Need to audit: MCP server workspace root detection
- Need to audit: Subagent workspace initialization

## References

### Key Files
- `hooks/session-start.sh` - Session initialization and `.wrangler/` creation
- `mcp/server.ts` - MCP server workspace root detection
- `.wrangler/workspace-schema.json` - Schema defining canonical paths
- `skills/using-git-worktrees/SKILL.md` - Worktree context handling

### Related Documentation
- `CLAUDE.md` - File organization guidelines
- `docs/SESSION-HOOKS.md` - Session hooks system documentation

### Potential Fixes
1. **Enforce git root detection**: Always resolve workspace root to git repository root
2. **Add path validation**: Verify memo paths before creation, reject non-top-level paths
3. **Subagent context inheritance**: Ensure subagents receive and respect parent workspace root
4. **Session hook enhancement**: Make session-start.sh more robust in nested contexts
