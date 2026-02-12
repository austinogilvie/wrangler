/**
 * Zod schemas for the implementation phase output.
 * The implementer agent produces this after implementing a single task.
 */

import { z } from 'zod';

export const FileChangeSchema = z.object({
  path: z.string().min(1),
  action: z.enum(['created', 'modified', 'deleted']),
  linesAdded: z.number().int().min(0),
  linesRemoved: z.number().int().min(0),
});

export type FileChange = z.infer<typeof FileChangeSchema>;

export const TestResultsSchema = z.object({
  total: z.number().int().min(0),
  passed: z.number().int().min(0),
  failed: z.number().int().min(0),
  exitCode: z.number().int(),
});

export type TestResults = z.infer<typeof TestResultsSchema>;

export const TddFunctionCertSchema = z.object({
  name: z.string().min(1),
  testFile: z.string().min(1),
  watchedFail: z.boolean(),
  watchedPass: z.boolean(),
});

export const TddCertificationSchema = z.object({
  functions: z.array(TddFunctionCertSchema),
});

export type TddCertification = z.infer<typeof TddCertificationSchema>;

export const ImplementResultSchema = z.object({
  filesChanged: z.array(FileChangeSchema),
  testResults: TestResultsSchema,
  tddCertification: TddCertificationSchema,
  commits: z.array(z.string()),
});

export type ImplementResult = z.infer<typeof ImplementResultSchema>;
