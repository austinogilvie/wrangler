/**
 * Zod schemas for the analysis phase output.
 * The analyzer agent reads a spec and produces a structured task list.
 */

import { z } from 'zod';

export const TaskDefinitionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(z.string()),
  dependencies: z.array(z.string()).default([]),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
  filePaths: z.array(z.string()).default([]),
});

export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;

export const RequirementSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  source: z.string().min(1),
  testable: z.boolean(),
});

export type Requirement = z.infer<typeof RequirementSchema>;

export const TechStackSchema = z.object({
  language: z.string().min(1),
  testFramework: z.string().min(1),
  buildTool: z.string().optional(),
});

export type TechStack = z.infer<typeof TechStackSchema>;

export const AnalysisResultSchema = z.object({
  tasks: z.array(TaskDefinitionSchema).min(1),
  requirements: z.array(RequirementSchema),
  constraints: z.array(z.string()),
  techStack: TechStackSchema,
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
