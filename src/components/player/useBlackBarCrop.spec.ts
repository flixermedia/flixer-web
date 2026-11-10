import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref, shallowRef } from 'vue'
import { useBlackBarCrop } from './useBlackBarCrop'

const hooks = vi.hoisted(() => ({ mounted: undefined as (() => void) | undefined, unmounted: undefined as (() => void) | undefined }))
vi.mock('vue', async (importOriginal) => ({
  ...await importOriginal<typeof import('vue')>(),
  onMounted: (callback: () => void) => { hooks.mounted = callback },
  onBeforeUnmount: (callback: () => void) => { hooks.unmounted = callback },
}))

describe('useBlackBarCrop', () => {
  let data: Uint8ClampedArray

  beforeEach(() => {
    vi.useFakeTimers()
    data = new Uint8ClampedArray(160 * 90 * 4)
    for (let y = 10; y < 80; y++) {
      for (let x = 0; x < 160; x++) {
        const index = (y * 160 + x) * 4
        data[index] = data[index + 1] = data[index + 2] = 180
        data[index + 3] = 255
      }
    }
    const context = { drawImage: vi.fn(), getImageData: () => ({ data }) }
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => context }) })
  })

  afterEach(() => {
    hooks.unmounted?.()
    hooks.mounted = hooks.unmounted = undefined
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('restores a confirmed crop immediately after disabling and re-enabling, including while paused', async () => {
    const element = { paused: false, seeking: false, readyState: 4, videoWidth: 1920, videoHeight: 1080 }
    const video = shallowRef<HTMLVideoElement | undefined>(element as HTMLVideoElement)
    const enabled = ref(true)
    const allowed = ref(true)
    const source = ref('first')
    const result = useBlackBarCrop(video, shallowRef<HTMLElement>(), enabled, allowed, () => source.value)
    hooks.mounted?.()

    vi.advanceTimersByTime(6000)
    const aspect = result.contentAspect.value
    expect(aspect).toBeGreaterThan(16 / 9)

    enabled.value = false
    await nextTick()
    expect(result.contentAspect.value).toBeNull()
    element.paused = true
    enabled.value = true
    await nextTick()
    expect(result.contentAspect.value).toBe(aspect)

    enabled.value = false
    await nextTick()
    data.fill(0, 10 * 160 * 4, 15 * 160 * 4)
    data.fill(0, 75 * 160 * 4, 80 * 160 * 4)
    element.paused = false
    vi.advanceTimersByTime(6000)
    element.paused = true
    enabled.value = true
    await nextTick()
    expect(result.contentAspect.value).toBeGreaterThan(aspect!)

    result.reset()
    expect(result.contentAspect.value).toBeNull()
    element.paused = false
    vi.advanceTimersByTime(6000)
    expect(result.contentAspect.value).toBeGreaterThan(aspect!)
    source.value = 'second'
    await nextTick()
    expect(result.contentAspect.value).toBeNull()
    allowed.value = false
    await nextTick()
    vi.advanceTimersByTime(6000)
    expect(result.contentAspect.value).toBeNull()
  })
})
