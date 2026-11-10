import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { BarCropConfirmation, croppedAspectRatio, detectBlackBars, type BarCrop } from './blackBars'

/** Samples playback sparingly and crops only after several matching frames. */
export function useBlackBarCrop(video: Ref<HTMLVideoElement | undefined>, root: Ref<HTMLElement | undefined>, enabled: Ref<boolean>, allowed: Ref<boolean>, source: () => string) {
  const crop = ref<BarCrop>({ top: 0, bottom: 0 })
  const size = ref({ width: 0, height: 0 })
  const unavailable = ref(false)
  const confirmation = new BarCropConfirmation()
  let timer: ReturnType<typeof setInterval> | undefined
  let observer: ResizeObserver | undefined
  let canvas: HTMLCanvasElement | undefined

  function reset() {
    crop.value = { top: 0, bottom: 0 }
    confirmation.reset()
    unavailable.value = false
    canvas = undefined
  }

  function sample() {
    const el = video.value
    if (!allowed.value || unavailable.value || !el || el.paused || el.seeking || el.readyState < 2 || !el.videoWidth || !el.videoHeight) return
    try {
      canvas ??= document.createElement('canvas')
      canvas.width = 160
      canvas.height = 90
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Canvas 2D context is unavailable')
      context.drawImage(el, 0, 0, canvas.width, canvas.height)
      const next = confirmation.observe(detectBlackBars(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height))
      if (next) crop.value = next
    } catch (error) {
      console.warn('[player] black bar detection unavailable', error)
      unavailable.value = true
      crop.value = { top: 0, bottom: 0 }
    }
  }

  const contentAspect = computed(() => {
    const el = video.value
    return enabled.value && el ? croppedAspectRatio(el.videoWidth, el.videoHeight, crop.value) : null
  })
  const frameStyle = computed(() => {
    const ratio = contentAspect.value
    if (!ratio || !size.value.width || !size.value.height) return {}
    const width = Math.min(size.value.width, size.value.height * ratio)
    return { width: `${width}px`, height: `${width / ratio}px` }
  })
  const videoStyle = computed(() => {
    const { top, bottom } = crop.value
    if (!enabled.value || (!top && !bottom) || !Object.keys(frameStyle.value).length) return {}
    const visible = 1 - top - bottom
    return { position: 'absolute' as const, top: `${-top / visible * 100}%`, height: `${100 / visible}%`, objectFit: 'fill' as const }
  })

  watch([allowed, source], reset)
  onMounted(() => {
    if (root.value && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(([entry]) => {
        if (entry) size.value = { width: entry.contentRect.width, height: entry.contentRect.height }
      })
      observer.observe(root.value)
    }
    timer = setInterval(sample, 2000)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    observer?.disconnect()
  })

  return { frameStyle, videoStyle, contentAspect, unavailable, reset }
}
