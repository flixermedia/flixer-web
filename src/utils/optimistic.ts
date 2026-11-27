const revisions = new Map<string, number>()
const operations = new Map<string, Promise<unknown>>()

export interface OptimisticOptions<Snapshot, Result = void> {
  /** Optional concurrency key. Rapid mutations sharing a key are serialized and only the latest revision can roll back. */
  key?: string
  /** Applies the optimistic UI update synchronously and returns a snapshot for rollback. */
  apply: () => Snapshot
  /** Performs the remote mutation. */
  commit: () => Promise<Result>
  /** Restores the UI state using the snapshot when commit throws. */
  rollback: (snapshot: Snapshot) => void
  /** Optional error handler (e.g. toast notification) invoked if commit throws. */
  onError?: (error: unknown) => void
}

/**
 * Executes an optimistic UI mutation with automatic rollback on failure and
 * per-key revision/queue protection against out-of-order concurrent updates.
 */
export async function runOptimistic<Snapshot, Result = void>(
  options: OptimisticOptions<Snapshot, Result>,
): Promise<{ ok: true; result: Result } | { ok: false; error: unknown }> {
  const { key, apply, commit, rollback, onError } = options
  const revision = key ? (revisions.get(key) ?? 0) + 1 : 0
  if (key) {
    revisions.set(key, revision)
  }

  const snapshot = apply()

  const execute = async (): Promise<{ ok: true; result: Result } | { ok: false; error: unknown }> => {
    try {
      const result = await commit()
      return { ok: true, result }
    } catch (error: unknown) {
      if (!key || revisions.get(key) === revision) {
        rollback(snapshot)
      }
      onError?.(error)
      return { ok: false, error }
    }
  }

  if (!key) {
    return execute()
  }

  const previous = operations.get(key) ?? Promise.resolve()
  const queued = previous.catch(() => undefined).then(execute)
  operations.set(key, queued)
  try {
    return await queued
  } finally {
    if (operations.get(key) === queued) {
      operations.delete(key)
    }
  }
}
