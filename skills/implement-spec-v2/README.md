# Implement-Spec V2

GitHub-centric implementation workflow with evolving PR descriptions and mandatory verification.

## Overview

This skill implements SPEC-000042, providing a redesigned spec-to-PR workflow that addresses the gaps identified in the implementation process audit:

- **GitHub PR as audit trail**: PR description evolves through workflow phases
- **Mandatory verification**: Quality gates prevent premature completion claims
- **E2E test requirements**: Enforced for all user-facing features
- **Spec compliance auditing**: Automated verification against acceptance criteria
- **Modular architecture**: Executable TypeScript scripts instead of inline markdown logic

## Directory Structure

```
skills/implement-spec-v2/
├── SKILL.md                          # Main orchestrator documentation
├── package.json                      # TypeScript dependencies
├── tsconfig.json                     # TypeScript configuration
├── jest.config.js                    # Jest test configuration
├── hooks/                            # Git hooks for compliance
├── scripts/                          # Executable automation scripts
│   ├── utils/                        # Shared utilities
│   │   └── github.ts                 # GitHub API client
│   ├── analyze-spec.ts               # Extract acceptance criteria
│   ├── generate-pr-description.ts    # Build PR descriptions
│   ├── audit-spec-compliance.ts      # Check implementation completeness
│   └── update-pr-description.ts      # Update PR via GitHub API
├── templates/                        # PR description templates
│   ├── pr-description-initial.md     # After ANALYZE phase
│   ├── pr-description-planning.md    # After PLAN phase
│   ├── pr-description-execution.md   # After EXECUTE phase
│   ├── pr-description-verify.md      # After VERIFY phase
│   └── manual-testing-checklist.md   # Testing template
├── examples/                         # Example PR descriptions
└── __tests__/                        # Comprehensive test suite
```

## Workflow Phases

1. **ANALYZE**: Extract acceptance criteria, identify E2E test needs
2. **PLAN**: Break spec into tasks, create PR with initial description
3. **EXECUTE**: Implement with TDD, update PR as tasks complete
4. **VERIFY**: Run tests, audit compliance, perform manual testing
5. **PUBLISH**: Push branch, mark complete, present summary

## Key Features

### GitHub PR as Source of Truth

- PR created during PLAN phase (not at end)
- Description evolves through each phase
- Verification checkboxes track progress
- All audit trail visible in GitHub timeline

### Mandatory Quality Gates

- **After ANALYZE**: Must extract ≥1 acceptance criteria
- **After PLAN**: Must create ≥1 task, every AC mapped
- **After EXECUTE**: All tasks complete, code reviewed
- **After VERIFY**: Tests pass, compliance 100%, manual testing complete
- **Before PUBLISH**: All gates passed

### Spec Compliance Auditing

- Automatic mapping of acceptance criteria to implementation evidence
- Heuristic-based verification (files + tests + commits)
- Compliance report with percentage and gaps
- Blocks progression if <100%

### E2E Test Enforcement

- Identifies user-facing features requiring E2E tests
- Generates E2E test plan during ANALYZE
- Verifies E2E tests written during EXECUTE
- Runs E2E tests during VERIFY

## Getting Started

### Prerequisites

- Node.js v18+
- GitHub Personal Access Token with `repo` scope
- Git repository with remote

### Installation

```bash
cd skills/implement-spec-v2
npm install
npm run build
npm test
```

### Usage

```bash
# From Claude Code
/wrangler:implement-v2 SPEC-000016

# Or explicitly
/wrangler:implement-v2 .wrangler/specifications/SPEC-000016-auth-system.md
```

## Development

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Building

```bash
npm run build               # Compile TypeScript
```

### Adding New Scripts

1. Create script in `scripts/`
2. Write tests FIRST in `__tests__/`
3. Implement with TDD
4. Update SKILL.md to reference script
5. Add to workflow documentation

## Backwards Compatibility

V1 commands continue to work unchanged:

- `/wrangler:implement [scope]` - Uses v1 workflow
- `/implement-spec [spec]` - Uses v1 workflow

V2 is opt-in via new command:

- `/wrangler:implement-v2 [spec]` - Uses v2 workflow

## Documentation

- **SKILL.md**: Full workflow orchestration guide
- **scripts/**: Individual script documentation
- **templates/**: PR description template examples
- **examples/**: Sample PR descriptions

## Testing

- **Unit tests**: All scripts have 80%+ coverage
- **Integration tests**: Full workflow scenarios
- **E2E tests**: Real spec files, real GitHub PRs

## License

MIT

## Version

2.0.0 (implements SPEC-000042 Phase 1)
