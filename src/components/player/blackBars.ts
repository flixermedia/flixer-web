export interface BarCrop {
  top: number
  bottom: number
}

/** Aspect ratio of the retained picture, or null when no crop is active. */
export function croppedAspectRatio(width: number, height: number, crop: BarCrop): number | null {
  const visible = 1 - crop.top - crop.bottom
  if ((!crop.top && !crop.bottom) || width <= 0 || height <= 0 || visible <= 0) return null
  return width / (height * visible)
}

export class BarCropConfirmation {
  private candidate: BarCrop | null = null
  private matches = 0

  reset() {
    this.candidate = null
    this.matches = 0
  }

  observe(next: BarCrop | null): BarCrop | null {
    if (!next) {
      this.reset()
      return null
    }
    if (this.candidate && Math.abs(this.candidate.top - next.top) <= 1 / 90 && Math.abs(this.candidate.bottom - next.bottom) <= 1 / 90) this.matches++
    else { this.candidate = next; this.matches = 1 }
    return this.matches >= 3 ? next : null
  }
}

/**
 * Detect symmetrical, nearly black letterbox rows in a small RGBA frame.
 * Returns null for inconclusive frames, including fades and dark scenes.
 */
export function detectBlackBars(data: Uint8ClampedArray, width: number, height: number): BarCrop | null {
  if (width < 16 || height < 16 || data.length !== width * height * 4) return null
  const black: boolean[] = []
  let brightPixels = 0
  for (let y = 0; y < height; y++) {
    let nonBlack = 0
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const max = Math.max(data[i], data[i + 1], data[i + 2])
      if (max > 24) nonBlack++
      if (max > 60) brightPixels++
    }
    black.push(nonBlack <= width * 0.02)
  }
  if (brightPixels < width * height * 0.05) return null
  let top = 0
  let bottom = 0
  while (top < height && black[top]) top++
  while (bottom < height && black[height - 1 - bottom]) bottom++
  if (top === 0 && bottom === 0) return { top: 0, bottom: 0 }
  if (Math.min(top, bottom) < 2 || Math.max(top, bottom) > height * 0.2 || Math.abs(top - bottom) > 2) return null
  // Keep a small margin so compression noise near the picture is not cropped.
  return { top: Math.max(0, top - 1) / height, bottom: Math.max(0, bottom - 1) / height }
}
