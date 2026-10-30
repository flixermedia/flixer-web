import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { getItemTheme, listSettings } from '../api'
import { catchError } from '../utils/catchError'

export const THEME_MUTED_KEY = 'flixer.themeMusicMuted'
const TARGET_VOLUME = 0.35
const FADE_MS = 500
const STEP_MS = 25

export function themeFadeVolume(progress: number, target = TARGET_VOLUME): number {
  return Math.max(0, Math.min(1, progress)) * target
}

function readMutedPreference(): boolean {
  try {
    return localStorage.getItem(THEME_MUTED_KEY) === 'true'
  } catch {
    return false
  }
}

export function useThemeMusic(itemId: Ref<string | undefined>, eligible: Ref<boolean>) {
  const muted = ref(readMutedPreference())
  const available = ref(false)
  const loading = ref(false)
  const playing = ref(false)
  let audio: HTMLAudioElement | null = null
  let objectUrl: string | null = null
  let fadeTimer: ReturnType<typeof setInterval> | undefined
  let generation = 0

  const enabled = ref(false)
  const canToggle = computed(() => available.value && enabled.value && eligible.value)

  function clearFade() {
    if (fadeTimer) clearInterval(fadeTimer)
    fadeTimer = undefined
  }

  function releaseAudio(target = audio) {
    if (!target) return
    target.pause()
    target.removeAttribute('src')
    target.load()
    if (target === audio) audio = null
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = null
    playing.value = false
  }

  function fadeTo(target: HTMLAudioElement, volume: number, done?: () => void) {
    clearFade()
    const start = target.volume
    const startedAt = performance.now()
    fadeTimer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / FADE_MS)
      target.volume = start + (volume - start) * progress
      if (progress >= 1) {
        clearFade()
        done?.()
      }
    }, STEP_MS)
  }

  function stop(fade = true) {
    generation++
    loading.value = false
    clearFade()
    const target = audio
    if (!target) return
    if (fade && !target.paused && target.volume > 0) {
      fadeTo(target, 0, () => releaseAudio(target))
    } else {
      releaseAudio(target)
    }
  }

  async function prepare(id = itemId.value) {
    if (!id || !enabled.value || !eligible.value || muted.value) return false
    if (audio && objectUrl) return true
    const [error, blob] = await catchError(Promise.resolve().then(() => getItemTheme(id)))
    if (error || !blob || id !== itemId.value) return false
    try {
      objectUrl = URL.createObjectURL(blob)
      audio = new Audio(objectUrl)
      audio.loop = true
      audio.volume = 0
      audio.addEventListener('play', () => (playing.value = true))
      audio.addEventListener('pause', () => (playing.value = false))
      available.value = true
      return true
    } catch {
      return false
    }
  }

  async function play() {
    if (!canToggle.value || muted.value) return
    if (!(await prepare())) return
    const target = audio
    const current = generation
    if (!target) return
    const [error] = await catchError(Promise.resolve().then(() => target.play()))
    if (error) {
      target.pause()
      target.volume = 0
      playing.value = false
      return
    }
    if (current !== generation || target !== audio || muted.value) {
      target.pause()
      return
    }
    fadeTo(target, TARGET_VOLUME)
  }

  function setMuted(value: boolean) {
    muted.value = value
    try {
      localStorage.setItem(THEME_MUTED_KEY, String(value))
    } catch {
      // The current preference still applies for this session.
    }
    if (value) stop()
    else void play()
  }

  async function toggle() {
    if (!canToggle.value) return
    if (playing.value) setMuted(true)
    else setMuted(false)
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') stop()
  }

  async function initialize(id: string | undefined, isEligible: boolean) {
    stop(false)
    const current = ++generation
    loading.value = false
    available.value = false
    enabled.value = false
    if (!id || !isEligible) return
    loading.value = true
    try {
      const [settingsError, settings] = await catchError(Promise.resolve().then(() => listSettings()))
      if (settingsError) {
        available.value = false
        return
      }
      if (current !== generation) return
      enabled.value = settings.find((entry) => entry.key === 'themes_enabled')?.value === true
      if (!enabled.value) return
      const [themeError, blob] = await catchError(Promise.resolve().then(() => getItemTheme(id)))
      if (themeError) {
        available.value = false
        return
      }
      if (current !== generation || id !== itemId.value || !blob) return
      try {
        objectUrl = URL.createObjectURL(blob)
        audio = new Audio(objectUrl)
        audio.loop = true
        audio.volume = 0
        audio.addEventListener('play', () => (playing.value = true))
        audio.addEventListener('pause', () => (playing.value = false))
        available.value = true
      } catch {
        available.value = false
        return
      }
      if (!muted.value) {
        const target = audio
        const [playError] = await catchError(Promise.resolve().then(() => target.play()))
        if (playError) {
          target.pause()
          target.volume = 0
        } else if (current === generation && target === audio && !muted.value) fadeTo(target, TARGET_VOLUME)
        else {
          target.pause()
        }
      }
    } finally {
      if (current === generation) loading.value = false
    }
  }

  watch([itemId, eligible], ([id, isEligible]) => void initialize(id, isEligible), { immediate: true })
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibilityChange)
  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange)
    clearFade()
    releaseAudio()
    generation++
  })

  return { available: computed(() => canToggle.value), loading, playing, muted, toggle, stop }
}
