/**
 * Handler: save-checkpoint
 * Saves a workflow checkpoint after a task completes.
 */

import type { WorkflowContext } from '../state.js';

/**
 * Save a checkpoint after a task completes successfully.
 * Updates the tasksCompleted/tasksPending tracking.
 */
export async function saveCheckpointHandler(ctx: WorkflowContext): Promise<void> {
  const currentTaskId = ctx.getCurrentTaskId();
  if (!currentTaskId) {
    // Not in a per-task context, nothing to checkpoint
    return;
  }

  // Move task from pending to completed
  const completed = (ctx.get('tasksCompleted') as string[]) ?? [];
  const pending = (ctx.get('tasksPending') as string[]) ?? [];

  if (!completed.includes(currentTaskId)) {
    completed.push(currentTaskId);
  }

  const updatedPending = pending.filter(id => id !== currentTaskId);

  ctx.set('tasksCompleted', completed);
  ctx.set('tasksPending', updatedPending);
}
