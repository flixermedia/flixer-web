export type CatchErrorResult<T> = [undefined, T] | [Error]

/** Converts a rejected promise into an error-first tuple without wrapping successful data. */
export function catchError<T>(promise: Promise<T>): Promise<CatchErrorResult<T>> {
  return promise
    .then((data): CatchErrorResult<T> => [undefined, data])
    .catch((error: unknown): CatchErrorResult<T> => [error instanceof Error ? error : new Error(String(error))])
}
