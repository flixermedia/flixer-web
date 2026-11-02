/** Converts a rejected promise into an error-first tuple without wrapping successful data. */
export function catchError(promise) {
    return promise
        .then((data) => [undefined, data])
        .catch((error) => [error instanceof Error ? error : new Error(String(error))]);
}
