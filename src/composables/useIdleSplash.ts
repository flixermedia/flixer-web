import { onBeforeUnmount, onMounted, ref } from 'vue'

export const IDLE_MS = 5 * 60_000
const MOVE_THRESHOLD_PX = 8
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

/** DOM-free countdown: calls `onChange(true)` once idle and `onChange(false)` on the next activity. */
export function createIdleTimer(options: { timeoutMs: number; suppressed: () => boolean; hidden: () => boolean; onChange: (idle: boolean) => void }) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let idle = false

  function arm() {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (options.suppressed() || options.hidden()) {
        arm()
        return
      }
      idle = true
      options.onChange(true)
    }, options.timeoutMs)
  }

  return {
    arm,
    get idle() {
      return idle
    },
    activity() {
      if (idle) {
        idle = false
        options.onChange(false)
      }
      arm()
    },
    stop() {
      clearTimeout(timer)
    },
  }
}

/**
 * Shows a splash after the user has been inactive for a while. Any input dismisses it.
 * `suppressed` pauses the countdown, for example while a video is playing.
 */
export function useIdleSplash(suppressed: () => boolean, timeoutMs = IDLE_MS) {
  const active = ref(false)
  let anchor: { x: number; y: number } | null = null
  const timer = createIdleTimer({
    timeoutMs,
    suppressed,
    hidden: () => document.hidden,
    onChange: (idle) => {
      active.value = idle
      anchor = null
    },
  })
  const activity = () => timer.activity()

  function onMove(event: PointerEvent) {
    if (!timer.idle) {
      timer.arm()
      return
    }
    // Ignore tiny movements so a nudged desk doesn't wake the splash.
    anchor ??= { x: event.clientX, y: event.clientY }
    if (Math.hypot(event.clientX - anchor.x, event.clientY - anchor.y) > MOVE_THRESHOLD_PX) timer.activity()
  }

  function onVisible() {
    if (!document.hidden) timer.activity()
  }

  onMounted(() => {
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, activity, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisible)
    timer.arm()
  })

  onBeforeUnmount(() => {
    timer.stop()
    for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, activity)
    window.removeEventListener('pointermove', onMove)
    document.removeEventListener('visibilitychange', onVisible)
  })

  return { active }
}
