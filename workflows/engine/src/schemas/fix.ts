/**
 * Zod schemas for the fix phase output.
 * The fixer agent produces this after addressing review issues.
 */

import { z } from 'zod';

export const FixActionSchema = z.object({
  issueDescription: z.string().min(1),
  severity: z.enum(['critical', 'important', 'minor']),
  action: z.enum(['fixed', 'disputed', 'deferred']),
  explanation: z.string().min(1),
  filesModified: z.array(z.string()),
});

export type FixAction = z.infer<typeof FixActionSchema>;

export const FixResultSchema = z.object({
  fixesApplied: z.array(FixActionSchema),
  testResults: z.object({
    total: z.number().int().min(0),
    passed: z.number().int().min(0),
    failed: z.number().int().min(0),
    exitCode: z.number().int(),
  }),
  commits: z.array(z.string()),
  disputedIssues: z.array(z.object({
    description: z.string(),
    reason: z.string(),
  })),
});

export type FixResult = z.infer<typeof FixResultSchema>;
