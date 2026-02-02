import * as fs from 'fs-extra';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { AnalyzeSpecResult, AcceptanceCriterion } from './analyze-spec';

/**
 * PR workflow phases
 */
export enum PRPhase {
  PLANNING = 'planning',
  EXECUTION = 'execution',
  VERIFICATION = 'verification',
  COMPLETE = 'complete',
}

/**
 * Task information for execution phase
 */
export interface Task {
  id: string;
  title: string;
  status: string;
}

/**
 * Compliance report for verification phase
 */
export interface ComplianceReport {
  totalCriteria: number;
  metCriteria: number;
  percentage: number;
}

/**
 * Extended spec information for PR generation
 */
export interface SpecInfo {
  specId: string;
  title: string;
  status: string;
  priority: string;
}

/**
 * Parameters for generating PR description
 */
export interface GeneratePRDescriptionParams {
  phase: PRPhase;
  specInfo: SpecInfo;
  analysis: AnalyzeSpecResult;
  templatesDir: string;
  tasks?: Task[];
  complianceReport?: ComplianceReport;
}

/**
 * Generate PR description from template and analysis data
 *
 * @param params - Generation parameters
 * @returns Rendered PR description markdown
 */
export async function generatePRDescription(
  params: GeneratePRDescriptionParams
): Promise<string> {
  const { phase, specInfo, analysis, templatesDir, tasks, complianceReport } = params;

  // Validate phase
  if (!Object.values(PRPhase).includes(phase)) {
    throw new Error(`Invalid phase: ${phase}`);
  }

  // Register Handlebars helpers
  registerHandlebarsHelpers();

  // Load template file
  const templatePath = path.join(templatesDir, `${phase}.hbs`);
  let templateContent: string;
  try {
    templateContent = await fs.readFile(templatePath, 'utf-8');
  } catch (error: any) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  // Compile template
  const template = Handlebars.compile(templateContent);

  // Prepare template data
  const templateData = {
    specId: specInfo.specId,
    specTitle: specInfo.title,
    status: specInfo.status,
    priority: specInfo.priority,
    acceptanceCriteria: analysis.acceptanceCriteria,
    requiresE2ETests: analysis.e2eTestFeatures.length > 0,
    e2eTestReasons: analysis.e2eTestFeatures.join(', '),
    manualTestingChecklist: analysis.manualTestingChecklist,
    taskCount: analysis.totalCriteria,
    tasks: tasks || [],
    compliancePercentage: complianceReport?.percentage || 0,
    complianceMet: complianceReport?.metCriteria || 0,
    complianceTotal: complianceReport?.totalCriteria || analysis.totalCriteria,
  };

  // Render template
  const rendered = template(templateData);

  return rendered;
}

/**
 * Register custom Handlebars helpers
 */
function registerHandlebarsHelpers() {
  // eq helper for equality comparison
  Handlebars.registerHelper('eq', function (a: any, b: any) {
    return a === b;
  });

  // percentage helper
  Handlebars.registerHelper('percentage', function (value: number, total: number) {
    if (total === 0) return '0';
    return Math.round((value / total) * 100).toString();
  });

  // checkbox helper
  Handlebars.registerHelper('checkbox', function (checked: boolean) {
    return checked ? 'x' : ' ';
  });
}

/**
 * CLI entry point for testing
 */
if (require.main === module) {
  const phase = process.argv[2] as PRPhase;
  const templatesDir = process.argv[3];
  const analysisPath = process.argv[4];

  if (!phase || !templatesDir || !analysisPath) {
    console.error('Usage: ts-node generate-pr-description.ts <phase> <templatesDir> <analysisPath>');
    process.exit(1);
  }

  fs.readFile(analysisPath, 'utf-8')
    .then((content) => {
      const data = JSON.parse(content);
      return generatePRDescription({
        phase,
        specInfo: {
          specId: data.specId,
          title: data.title,
          status: data.status,
          priority: data.priority,
        },
        analysis: data.analysis,
        templatesDir,
      });
    })
    .then((description) => {
      console.log(description);
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
