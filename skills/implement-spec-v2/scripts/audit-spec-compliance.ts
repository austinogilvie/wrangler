import { AnalyzeSpecResult, AcceptanceCriterion } from './analyze-spec';

/**
 * Task information for correlation
 */
export interface Task {
  id: string;
  title: string;
  status: string;
}

/**
 * Criteria breakdown item
 */
export interface CriteriaBreakdownItem {
  id: string;
  description: string;
  priority: 'must' | 'should' | 'nice';
  met: boolean;
}

/**
 * Compliance audit report
 */
export interface ComplianceReport {
  totalCriteria: number;
  metCriteria: number;
  percentage: number;
  criteriaBreakdown: CriteriaBreakdownItem[];
  completedTasksCount: number;
  recommendations: string[];
  summary: string;
}

/**
 * Parameters for auditing spec compliance
 */
export interface AuditSpecComplianceParams {
  analysis: AnalyzeSpecResult;
  completedTasks: Task[];
}

/**
 * Audit specification compliance
 *
 * Compares acceptance criteria (from spec analysis) against completed tasks
 * to calculate compliance percentage and generate recommendations.
 *
 * @param params - Audit parameters
 * @returns Compliance report
 */
export function auditSpecCompliance(params: AuditSpecComplianceParams): ComplianceReport {
  const { analysis, completedTasks } = params;

  // Calculate metrics
  const totalCriteria = analysis.acceptanceCriteria.length;
  const metCriteria = analysis.acceptanceCriteria.filter((ac) => ac.met === true).length;
  const percentage = totalCriteria === 0 ? 0 : Math.round((metCriteria / totalCriteria) * 100);

  // Build criteria breakdown
  const criteriaBreakdown: CriteriaBreakdownItem[] = analysis.acceptanceCriteria.map((ac) => ({
    id: ac.id,
    description: ac.description,
    priority: ac.priority,
    met: ac.met === true,
  }));

  // Count completed tasks
  const completedTasksCount = completedTasks.length;

  // Generate recommendations
  const recommendations = generateRecommendations(analysis.acceptanceCriteria, percentage);

  // Generate summary
  const summary = generateSummary(metCriteria, totalCriteria, percentage);

  return {
    totalCriteria,
    metCriteria,
    percentage,
    criteriaBreakdown,
    completedTasksCount,
    recommendations,
    summary,
  };
}

/**
 * Generate recommendations based on unmet criteria
 */
function generateRecommendations(
  criteria: AcceptanceCriterion[],
  percentage: number
): string[] {
  const recommendations: string[] = [];

  // If 100% complete, no recommendations
  if (percentage === 100) {
    return recommendations;
  }

  // Find unmet must-have criteria
  const unmetMustHave = criteria.filter((ac) => ac.priority === 'must' && ac.met !== true);

  if (unmetMustHave.length > 0) {
    for (const criterion of unmetMustHave) {
      recommendations.push(
        `Address must-have criterion: ${criterion.id} - ${criterion.description}`
      );
    }
  }

  // Find unmet should-have criteria
  const unmetShouldHave = criteria.filter((ac) => ac.priority === 'should' && ac.met !== true);

  if (unmetShouldHave.length > 0) {
    for (const criterion of unmetShouldHave) {
      recommendations.push(
        `Consider should-have criterion: ${criterion.id} - ${criterion.description}`
      );
    }
  }

  // Find unmet nice-to-have criteria
  const unmetNiceToHave = criteria.filter((ac) => ac.priority === 'nice' && ac.met !== true);

  if (unmetNiceToHave.length > 0) {
    recommendations.push(
      `Optional: ${unmetNiceToHave.length} nice-to-have criteria remaining`
    );
  }

  return recommendations;
}

/**
 * Generate human-readable summary
 */
function generateSummary(metCriteria: number, totalCriteria: number, percentage: number): string {
  if (totalCriteria === 0) {
    return 'No acceptance criteria defined';
  }

  if (percentage === 100) {
    return `Specification complete: ${metCriteria}/${totalCriteria} criteria met (100%)`;
  }

  return `Specification ${percentage}% complete: ${metCriteria}/${totalCriteria} criteria met`;
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const analysisPath = process.argv[2];
  const tasksPath = process.argv[3];

  if (!analysisPath || !tasksPath) {
    console.error('Usage: ts-node audit-spec-compliance.ts <analysisPath> <tasksPath>');
    process.exit(1);
  }

  import('fs/promises')
    .then((fs) => Promise.all([fs.readFile(analysisPath, 'utf-8'), fs.readFile(tasksPath, 'utf-8')]))
    .then(([analysisContent, tasksContent]) => {
      const analysis = JSON.parse(analysisContent) as AnalyzeSpecResult;
      const tasks = JSON.parse(tasksContent) as Task[];

      return auditSpecCompliance({ analysis, completedTasks: tasks });
    })
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
