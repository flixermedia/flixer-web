import { domToJpeg } from 'modern-screenshot'

export interface IssueAttachmentDraft {
  name: string
  dataUrl: string
}

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024

export async function readImageFilesAsAttachments(files: FileList | File[], maxCount = 4): Promise<IssueAttachmentDraft[]> {
  const list = Array.from(files).slice(0, maxCount)
  const results: IssueAttachmentDraft[] = []
  for (const file of list) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error('Only PNG, JPEG, WebP, or GIF images are supported.')
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('Each image must be under 2.5 MB.')
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => reject(new Error('Could not read image file.'))
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      results.push({ name: file.name || 'image.png', dataUrl })
    }
  }
  return results
}

export async function capturePageScreenshotAttachment(): Promise<IssueAttachmentDraft> {
  const bgColor = getComputedStyle(document.body).backgroundColor || '#080811'
  const dataUrl = await domToJpeg(document.documentElement, {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: bgColor === 'rgba(0, 0, 0, 0)' ? '#080811' : bgColor,
    quality: 0.85,
    scale: Math.min(window.devicePixelRatio || 1, 1.5),
    style: {
      marginTop: `-${window.scrollY}px`,
      marginLeft: `-${window.scrollX}px`,
    },
    filter: (node) => !(node instanceof HTMLElement && node.dataset.prioritySupportChat === 'true'),
  })
  return {
    name: `flixer-screenshot-${Date.now()}.jpg`,
    dataUrl,
  }
}
