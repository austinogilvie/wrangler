/**
 * Zod schemas for the verification phase output.
 * The verifier agent runs the full test suite and checks requirements.
 */

import { z } from 'zod';

export const RequirementVerificationSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  met: z.boolean(),
  evidence: z.string().min(1),
});

export type RequirementVerification = z.infer<typeof RequirementVerificationSchema>;

export const VerifyResultSchema = z.object({
  testSuite: z.object({
    total: z.number().int().min(0),
    passed: z.number().int().min(0),
    failed: z.number().int().min(0),
    exitCode: z.number().int(),
    coverage: z.number().min(0).max(100).optional(),
  }),
  requirements: z.array(RequirementVerificationSchema),
  gitClean: z.boolean(),
});

export type VerifyResult = z.infer<typeof VerifyResultSchema>;
