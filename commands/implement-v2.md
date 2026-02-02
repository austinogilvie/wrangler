# /wrangler:implement-v2

## Description

Implements specifications using GitHub-centric workflow with mandatory verification gates.

## Usage

```
/wrangler:implement-v2 <spec-id>
```

**Example:**
```
/wrangler:implement-v2 SPEC-000042
```

## What It Does

Invokes the `implement-spec-v2` skill to implement a specification using a five-phase workflow:

1. **ANALYZE:** Extract acceptance criteria from spec
2. **PLAN:** Create GitHub PR with planning description
3. **EXECUTE:** Implement features with TDD
4. **VERIFY:** Verify 100% compliance (MANDATORY)
5. **PUBLISH:** Mark PR ready for review

The GitHub PR serves as the primary audit trail, with the PR description updated through each phase.

## Prerequisites

- Specification file exists in `.wrangler/specifications/`
- `gh` CLI installed and authenticated
- Git working directory clean
- Node.js and npm installed

## Quality Gates

- VERIFY phase is mandatory (cannot be skipped)
- 100% spec compliance required before PUBLISH
- All tests must pass (unit + E2E if required)
- Manual testing checklist must be complete

## Related Skills

- `implement-spec-v2` - Main orchestrator skill (this command invokes it)
- `tdd-development` - Test-driven development workflow
- `code-review` - Code review process
- `writing-specs` - Creating specifications

## See Also

- [implement-spec-v2 Skill Documentation](../skills/implement-spec-v2/SKILL.md)
- [SPEC-000042: Specification](../.wrangler/specifications/SPEC-000042.md)
