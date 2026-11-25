import { decode, isBlurhashValid } from 'blurhash'

const MAX_DECODED_CACHE = 512
const decodedCache = new Map<string, Uint8ClampedArray>()

export function isValidBlurhash(hash: string | null | undefined): hash is string {
  if (typeof hash !== 'string' || hash.length < 6) return false
  return isBlurhashValid(hash).result
}

export function decodeBlurhashPixels(hash: string, width = 32, height = 32): Uint8ClampedArray | null {
  if (!isValidBlurhash(hash)) return null
  const w = Math.max(1, Math.min(128, Math.round(width)))
  const h = Math.max(1, Math.min(128, Math.round(height)))
  const key = `${hash}:${w}x${h}`
  const cached = decodedCache.get(key)
  if (cached) {
    decodedCache.delete(key)
    decodedCache.set(key, cached)
    return cached
  }
  try {
    const pixels = decode(hash, w, h)
    decodedCache.set(key, pixels)
    while (decodedCache.size > MAX_DECODED_CACHE) {
      const oldest = decodedCache.keys().next().value
      if (oldest === undefined) break
      decodedCache.delete(oldest)
    }
    return pixels
  } catch {
    return null
  }
}

export function renderBlurhashToCanvas(canvas: HTMLCanvasElement, hash: string, width = 32, height = 32): boolean {
  const w = Math.max(1, Math.min(128, Math.round(width)))
  const h = Math.max(1, Math.min(128, Math.round(height)))
  const pixels = decodeBlurhashPixels(hash, w, h)
  if (!pixels) return false
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  const imageData = ctx.createImageData(w, h)
  imageData.data.set(pixels)
  ctx.putImageData(imageData, 0, 0)
  return true
}
