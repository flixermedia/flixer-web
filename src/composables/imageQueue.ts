// A page of artwork would otherwise fire dozens of image requests at once and exhaust the server's database pool.
const MAX_PARALLEL = 4
let active = 0
const waiting: Array<() => void> = []
const waitingLow: Array<() => void> = []

export interface ImageLoadOptions {
  /** Background preloads yield to anything the user is actually looking at. */
  low?: boolean
  /** Work cancelled while still queued never starts, so images from a page the user left don't hold up the next one. */
  signal?: AbortSignal
}

function release() {
  active--
  const next = waiting.shift() ?? waitingLow.shift()
  next?.()
}

export async function limitedImageLoad<T>(task: () => Promise<T>, options: ImageLoadOptions = {}): Promise<T> {
  const { low = false, signal } = options
  if (signal?.aborted) throw new DOMException('Image load cancelled', 'AbortError')
  if (active >= MAX_PARALLEL) {
    const queue = low ? waitingLow : waiting
    await new Promise<void>((resolve, reject) => {
      const start = () => {
        signal?.removeEventListener('abort', cancel)
        resolve()
      }
      const cancel = () => {
        const index = queue.indexOf(start)
        if (index >= 0) queue.splice(index, 1)
        reject(new DOMException('Image load cancelled', 'AbortError'))
      }
      queue.push(start)
      signal?.addEventListener('abort', cancel, { once: true })
    })
  }
  active++
  try {
    return await task()
  } finally {
    release()
  }
}
