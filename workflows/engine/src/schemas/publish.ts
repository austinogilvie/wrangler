/**
 * Zod schemas for the publish phase output.
 * The publisher agent creates a PR and returns its details.
 */

import { z } from 'zod';

export const PublishResultSchema = z.object({
  prUrl: z.string().url(),
  prNumber: z.number().int().positive(),
  branchName: z.string().min(1),
  commitCount: z.number().int().min(0),
  summary: z.string().min(1),
});

export type PublishResult = z.infer<typeof PublishResultSchema>;
