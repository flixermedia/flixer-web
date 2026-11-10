import { dominantColor } from './themeCss'

const SAMPLE_SIZE = 40

/** The characteristic colour of an artwork blob, or null when it cannot be read or has no usable colour. */
export async function accentFromBlob(blob: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob, { resizeWidth: SAMPLE_SIZE, resizeHeight: SAMPLE_SIZE, resizeQuality: 'low' })
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    return dominantColor(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data)
  } catch {
    return null
  }
}
