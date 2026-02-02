import {
  generatePRDescription,
  GeneratePRDescriptionParams,
  PRPhase,
  SpecInfo,
} from '../scripts/generate-pr-description';
import { AnalyzeSpecResult } from '../scripts/analyze-spec';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock fs-extra
jest.mock('fs-extra');

describe('generatePRDescription', () => {
  const testTemplatesDir = '/test/templates';

  const mockSpecInfo: SpecInfo = {
    specId: 'SPEC-000001',
    title: 'Test Specification',
    status: 'open',
    priority: 'high',
  };

  const mockAnalysis: AnalyzeSpecResult = {
    acceptanceCriteria: [
      {
        id: 'AC-001',
        description: 'User can login',
        section: 'FR-001',
        priority: 'must',
      },
      {
        id: 'AC-002',
        description: 'Login redirects to dashboard',
        section: 'FR-001',
        priority: 'must',
      },
    ],
    e2eTestFeatures: ['AC-001: User can login'],
    manualTestingChecklist: [
      { id: 'MT-001', description: 'Start application' },
      { id: 'MT-002', description: 'Open DevTools' },
      { id: 'MT-003', description: 'Test login flow' },
    ],
    totalCriteria: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('planning phase', () => {
    it('should generate PR description for planning phase', async () => {
      const planningTemplate = `# {{specTitle}}

## Spec: {{specId}}

## Planning Phase
- [ ] Spec analyzed
- [ ] {{taskCount}} tasks created
- [ ] E2E test plan created
- [ ] Manual testing checklist generated

## Acceptance Criteria
{{#each acceptanceCriteria}}
- [ ] {{this.id}}: {{this.description}}
{{/each}}`;

      jest.mocked(fs.readFile).mockResolvedValue(planningTemplate as any);

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.PLANNING,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
      };

      const result = await generatePRDescription(params);

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(testTemplatesDir, 'planning.hbs'),
        'utf-8'
      );
      expect(result).toContain('Test Specification');
      expect(result).toContain('SPEC-000001');
      expect(result).toContain('2 tasks created');
      expect(result).toContain('AC-001: User can login');
      expect(result).toContain('AC-002: Login redirects to dashboard');
    });

    it('should include E2E test plan when required', async () => {
      const template = `E2E Tests Required: {{requiresE2ETests}}
{{#if requiresE2ETests}}
Reasons: {{e2eTestReasons}}
{{/if}}`;

      jest.mocked(fs.readFile).mockResolvedValue(template as any);

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.PLANNING,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
      };

      const result = await generatePRDescription(params);

      expect(result).toContain('E2E Tests Required: true');
      expect(result).toContain('AC-001: User can login');
    });

    it('should include manual testing checklist', async () => {
      const template = `## Manual Testing Checklist
{{#each manualTestingChecklist}}
- [ ] {{this.id}}: {{this.description}}
{{/each}}`;

      jest.mocked(fs.readFile).mockResolvedValue(template as any);

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.PLANNING,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
      };

      const result = await generatePRDescription(params);

      expect(result).toContain('MT-001: Start application');
      expect(result).toContain('MT-002: Open DevTools');
      expect(result).toContain('MT-003: Test login flow');
    });
  });

  describe('execution phase', () => {
    it('should generate PR description for execution phase', async () => {
      const executionTemplate = `# {{specTitle}}

## Execution Phase
Task progress tracking...

## Acceptance Criteria
{{#each acceptanceCriteria}}
- [ ] {{this.id}}: {{this.description}}
{{/each}}`;

      jest.mocked(fs.readFile).mockResolvedValue(executionTemplate as any);

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.EXECUTION,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
        tasks: [
          { id: 'ISS-000001', title: 'Implement login UI', status: 'closed' },
          { id: 'ISS-000002', title: 'Add authentication', status: 'in_progress' },
        ],
      };

      const result = await generatePRDescription(params);

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(testTemplatesDir, 'execution.hbs'),
        'utf-8'
      );
      expect(result).toContain('Test Specification');
      expect(result).toContain('Execution Phase');
    });

    it('should include task progress when tasks provided', async () => {
      const template = `## Tasks
{{#each tasks}}
- [{{#if (eq this.status "closed")}}x{{else}} {{/if}}] {{this.id}}: {{this.title}}
{{/each}}`;

      jest.mocked(fs.readFile).mockResolvedValue(template as any);

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.EXECUTION,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
        tasks: [
          { id: 'ISS-000001', title: 'Task 1', status: 'closed' },
          { id: 'ISS-000002', title: 'Task 2', status: 'in_progress' },
        ],
      };

      const result = await generatePRDescription(params);

      expect(result).toContain('ISS-000001: Task 1');
      expect(result).toContain('ISS-000002: Task 2');
    });
  });

  describe('verification phase', () => {
    it('should generate PR description for verification phase', async () => {
      const verificationTemplate = `# {{specTitle}}

## Verification Phase
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Manual testing complete
- [ ] Spec compliance: {{compliancePercentage}}%`;

      jest.mocked(fs.readFile).mockResolvedValue(verificationTemplate as any);

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.VERIFICATION,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
        complianceReport: {
          totalCriteria: 2,
          metCriteria: 1,
          percentage: 50,
        },
      };

      const result = await generatePRDescription(params);

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(testTemplatesDir, 'verification.hbs'),
        'utf-8'
      );
      expect(result).toContain('Verification Phase');
      expect(result).toContain('50%');
    });
  });

  describe('complete phase', () => {
    it('should generate PR description for complete phase', async () => {
      const completeTemplate = `# {{specTitle}}

## Status: Complete

All acceptance criteria met ({{compliancePercentage}}%)`;

      jest.mocked(fs.readFile).mockResolvedValue(completeTemplate as any);

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.COMPLETE,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
        complianceReport: {
          totalCriteria: 2,
          metCriteria: 2,
          percentage: 100,
        },
      };

      const result = await generatePRDescription(params);

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(testTemplatesDir, 'complete.hbs'),
        'utf-8'
      );
      expect(result).toContain('Status: Complete');
      expect(result).toContain('100%');
    });
  });

  describe('error handling', () => {
    it('should throw error if template file not found', async () => {
      jest.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.PLANNING,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
      };

      await expect(generatePRDescription(params)).rejects.toThrow('Template file not found');
    });

    it('should throw error for invalid phase', async () => {
      const params: GeneratePRDescriptionParams = {
        phase: 'invalid' as any,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
      };

      await expect(generatePRDescription(params)).rejects.toThrow('Invalid phase');
    });
  });

  describe('template helpers', () => {
    it('should support eq helper for status comparison', async () => {
      const template = `{{#each tasks}}
{{#if (eq this.status "closed")}}DONE{{else}}TODO{{/if}}
{{/each}}`;

      jest.mocked(fs.readFile).mockResolvedValue(template as any);

      const params: GeneratePRDescriptionParams = {
        phase: PRPhase.EXECUTION,
        specInfo: mockSpecInfo,
        analysis: mockAnalysis,
        templatesDir: testTemplatesDir,
        tasks: [
          { id: 'ISS-000001', title: 'Task 1', status: 'closed' },
          { id: 'ISS-000002', title: 'Task 2', status: 'open' },
        ],
      };

      const result = await generatePRDescription(params);

      expect(result).toContain('DONE');
      expect(result).toContain('TODO');
    });
  });
});
