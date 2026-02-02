import {
  auditSpecCompliance,
  AuditSpecComplianceParams,
  ComplianceReport,
} from '../scripts/audit-spec-compliance';
import { AnalyzeSpecResult, AcceptanceCriterion } from '../scripts/analyze-spec';

describe('auditSpecCompliance', () => {
  const mockAnalysis: AnalyzeSpecResult = {
    acceptanceCriteria: [
      {
        id: 'AC-001',
        description: 'User can log in',
        section: 'FR-001',
        priority: 'must',
        met: true,
      },
      {
        id: 'AC-002',
        description: 'User can log out',
        section: 'FR-001',
        priority: 'must',
        met: true,
      },
      {
        id: 'AC-003',
        description: 'Session persists after refresh',
        section: 'FR-002',
        priority: 'must',
        met: false,
      },
      {
        id: 'AC-004',
        description: 'Remember me option available',
        section: 'FR-002',
        priority: 'should',
        met: false,
      },
    ],
    e2eTestFeatures: ['AC-001: User can log in'],
    manualTestingChecklist: [
      { id: 'MT-001', description: 'Test login flow' },
    ],
    totalCriteria: 4,
  };

  describe('basic compliance calculation', () => {
    it('should calculate compliance percentage correctly', () => {
      const params: AuditSpecComplianceParams = {
        analysis: mockAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.totalCriteria).toBe(4);
      expect(report.metCriteria).toBe(2);
      expect(report.percentage).toBe(50);
    });

    it('should return 100% when all criteria met', () => {
      const allMetAnalysis: AnalyzeSpecResult = {
        ...mockAnalysis,
        acceptanceCriteria: mockAnalysis.acceptanceCriteria.map((ac) => ({
          ...ac,
          met: true,
        })),
      };

      const params: AuditSpecComplianceParams = {
        analysis: allMetAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.totalCriteria).toBe(4);
      expect(report.metCriteria).toBe(4);
      expect(report.percentage).toBe(100);
    });

    it('should return 0% when no criteria met', () => {
      const noneMetAnalysis: AnalyzeSpecResult = {
        ...mockAnalysis,
        acceptanceCriteria: mockAnalysis.acceptanceCriteria.map((ac) => ({
          ...ac,
          met: false,
        })),
      };

      const params: AuditSpecComplianceParams = {
        analysis: noneMetAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.totalCriteria).toBe(4);
      expect(report.metCriteria).toBe(0);
      expect(report.percentage).toBe(0);
    });
  });

  describe('criteria breakdown', () => {
    it('should include detailed criteria breakdown', () => {
      const params: AuditSpecComplianceParams = {
        analysis: mockAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.criteriaBreakdown).toHaveLength(4);
      expect(report.criteriaBreakdown[0]).toEqual({
        id: 'AC-001',
        description: 'User can log in',
        priority: 'must',
        met: true,
      });
      expect(report.criteriaBreakdown[2]).toEqual({
        id: 'AC-003',
        description: 'Session persists after refresh',
        priority: 'must',
        met: false,
      });
    });

    it('should separate must-have from should-have criteria', () => {
      const params: AuditSpecComplianceParams = {
        analysis: mockAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      const mustHave = report.criteriaBreakdown.filter((c) => c.priority === 'must');
      const shouldHave = report.criteriaBreakdown.filter((c) => c.priority === 'should');

      expect(mustHave).toHaveLength(3);
      expect(shouldHave).toHaveLength(1);
    });
  });

  describe('task correlation', () => {
    it('should include completed task count', () => {
      const params: AuditSpecComplianceParams = {
        analysis: mockAnalysis,
        completedTasks: [
          { id: 'ISS-000001', title: 'Implement login', status: 'closed' },
          { id: 'ISS-000002', title: 'Add session management', status: 'closed' },
        ],
      };

      const report = auditSpecCompliance(params);

      expect(report.completedTasksCount).toBe(2);
    });

    it('should handle empty completed tasks', () => {
      const params: AuditSpecComplianceParams = {
        analysis: mockAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.completedTasksCount).toBe(0);
    });
  });

  describe('recommendations', () => {
    it('should provide recommendations when criteria not met', () => {
      const params: AuditSpecComplianceParams = {
        analysis: mockAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend addressing must-have criteria first', () => {
      const params: AuditSpecComplianceParams = {
        analysis: mockAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.recommendations[0]).toContain('AC-003');
      expect(report.recommendations[0]).toContain('must');
    });

    it('should not provide recommendations when 100% complete', () => {
      const allMetAnalysis: AnalyzeSpecResult = {
        ...mockAnalysis,
        acceptanceCriteria: mockAnalysis.acceptanceCriteria.map((ac) => ({
          ...ac,
          met: true,
        })),
      };

      const params: AuditSpecComplianceParams = {
        analysis: allMetAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.recommendations).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty acceptance criteria', () => {
      const emptyAnalysis: AnalyzeSpecResult = {
        acceptanceCriteria: [],
        e2eTestFeatures: [],
        manualTestingChecklist: [],
        totalCriteria: 0,
      };

      const params: AuditSpecComplianceParams = {
        analysis: emptyAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.totalCriteria).toBe(0);
      expect(report.metCriteria).toBe(0);
      expect(report.percentage).toBe(0);
      expect(report.criteriaBreakdown).toHaveLength(0);
    });

    it('should handle undefined met status as false', () => {
      const undefinedMetAnalysis: AnalyzeSpecResult = {
        ...mockAnalysis,
        acceptanceCriteria: [
          {
            id: 'AC-001',
            description: 'Test criterion',
            section: 'FR-001',
            priority: 'must',
            // met is undefined
          },
        ],
        totalCriteria: 1,
      };

      const params: AuditSpecComplianceParams = {
        analysis: undefinedMetAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.metCriteria).toBe(0);
      expect(report.percentage).toBe(0);
    });
  });

  describe('summary generation', () => {
    it('should generate human-readable summary', () => {
      const params: AuditSpecComplianceParams = {
        analysis: mockAnalysis,
        completedTasks: [
          { id: 'ISS-000001', title: 'Task 1', status: 'closed' },
        ],
      };

      const report = auditSpecCompliance(params);

      expect(report.summary).toContain('50%');
      expect(report.summary).toContain('2/4');
    });

    it('should include completion status in summary', () => {
      const allMetAnalysis: AnalyzeSpecResult = {
        ...mockAnalysis,
        acceptanceCriteria: mockAnalysis.acceptanceCriteria.map((ac) => ({
          ...ac,
          met: true,
        })),
      };

      const params: AuditSpecComplianceParams = {
        analysis: allMetAnalysis,
        completedTasks: [],
      };

      const report = auditSpecCompliance(params);

      expect(report.summary).toContain('100%');
      expect(report.summary).toContain('complete');
    });
  });
});
