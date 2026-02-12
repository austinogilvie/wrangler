/**
 * Zod schemas for review gate output.
 * Each review gate produces a ReviewResult with issues found.
 */

import { z } from 'zod';

export const ReviewIssueSchema = z.object({
  severity: z.enum(['critical', 'important', 'minor']),
  description: z.string().min(1),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  fixInstructions: z.string().min(1),
  foundBy: z.string().optional(),
});

export type ReviewIssue = z.infer<typeof ReviewIssueSchema>;

export const TestCoverageAssessmentSchema = z.object({
  adequate: z.boolean(),
  notes: z.string().optional(),
});

export const ReviewResultSchema = z.object({
  assessment: z.enum(['approved', 'needs_revision']),
  issues: z.array(ReviewIssueSchema),
  strengths: z.array(z.string()),
  hasActionableIssues: z.boolean(),
  testCoverage: TestCoverageAssessmentSchema.optional(),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;

/**
 * Aggregated result from multiple review gates.
 */
export const AggregatedReviewResultSchema = z.object({
  assessment: z.enum(['approved', 'needs_revision']),
  issues: z.array(ReviewIssueSchema),
  strengths: z.array(z.string()),
  hasActionableIssues: z.boolean(),
  gateResults: z.array(z.object({
    gate: z.string(),
    assessment: z.enum(['approved', 'needs_revision']),
    issueCount: z.number().int().min(0),
  })),
});

export type AggregatedReviewResult = z.infer<typeof AggregatedReviewResultSchema>;

/**
 * Aggregate multiple gate results into a unified review result.
 */
export function aggregateGateResults(
  gateResults: Array<{ gate: string } & ReviewResult>
): AggregatedReviewResult {
  const allIssues: ReviewIssue[] = [];
  const allStrengths: string[] = [];

  const gateSummaries = gateResults.map(gr => {
    allIssues.push(...gr.issues);
    allStrengths.push(...gr.strengths);
    return {
      gate: gr.gate,
      assessment: gr.assessment,
      issueCount: gr.issues.length,
    };
  });

  const hasActionableIssues = allIssues.some(
    i => i.severity === 'critical' || i.severity === 'important'
  );

  return {
    assessment: hasActionableIssues ? 'needs_revision' : 'approved',
    issues: allIssues,
    strengths: allStrengths,
    hasActionableIssues,
    gateResults: gateSummaries,
  };
}
