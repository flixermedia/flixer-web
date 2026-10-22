// A page of artwork would otherwise fire dozens of image requests at once and exhaust the server's database pool.
const MAX_PARALLEL = 4
let active = 0
const waiting: Array<() => void> = []

export async function limitedImageLoad<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve))
  active++
  try {
    return await task()
  } finally {
    active--
    waiting.shift()?.()
  }
}
