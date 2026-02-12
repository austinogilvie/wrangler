/**
 * Handler: create-issues
 * Creates MCP issues from the analysis result.
 * Used in the 'plan' phase after analysis.
 */

import type { WorkflowContext } from '../state.js';
import type { AnalysisResult } from '../schemas/index.js';

/**
 * Create MCP issues from analysis results.
 * Stores task IDs back into the analysis tasks and
 * sets up the context for per-task execution.
 */
export async function createIssuesHandler(ctx: WorkflowContext): Promise<void> {
  const analysis = ctx.get('analysis') as AnalysisResult | undefined;
  if (!analysis) {
    throw new Error('create-issues handler requires "analysis" in context');
  }

  // In a real workflow, this would call the MCP issues_create tool
  // via the session's MCP server. For now, we just prepare the task
  // list in the context so the per-task phase can iterate.

  const tasks = analysis.tasks.map((task, index) => ({
    ...task,
    // Ensure each task has an ID
    id: task.id || `task-${String(index + 1).padStart(3, '0')}`,
  }));

  // Store prepared tasks back
  ctx.set('analysis', { ...analysis, tasks });

  // Track task IDs for checkpointing
  ctx.set('taskIds', tasks.map(t => t.id));
  ctx.set('tasksCompleted', []);
  ctx.set('tasksPending', tasks.map(t => t.id));
}
