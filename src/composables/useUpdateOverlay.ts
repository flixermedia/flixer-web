import { computed, ref } from 'vue'
import type { UpdateRun } from '../api/updates'

export interface UpdateStepView {
  name: string
  message: string
  status: 'running' | 'succeeded' | 'failed'
  startedAt: string
  finishedAt?: string
}

export interface ExtendedUpdateRun extends UpdateRun {
  steps?: UpdateStepView[]
  log?: string[]
}

const overlayOpen = ref(false)
const emulatedRun = ref<ExtendedUpdateRun | null>(null)
const isEmulated = ref(false)
let emulationTimers: ReturnType<typeof setTimeout>[] = []

function clearEmulationTimers() {
  for (const timer of emulationTimers) clearTimeout(timer)
  emulationTimers = []
}

const SIMULATED_TARGETS: Record<string, string> = {
  logger: '0.1.5',
  ai: '0.1.4',
  streamer: '0.10.4',
  indexer: '0.8.4',
  web: '0.13.10',
  flixer: '1.13.13',
}

const SIMULATED_PREVIOUS: Record<string, string> = {
  logger: '0.1.4',
  ai: '0.1.3',
  streamer: '0.10.3',
  indexer: '0.8.3',
  web: '0.13.9',
  flixer: '1.13.12',
}

const SIMULATED_SEQUENCE: Array<{ name: string; message: string; log: string }> = [
  { name: 'backup', message: 'Backing up the database', log: 'Database backup written: flixer-dev-emulated.dump' },
  { name: 'pull', message: 'Downloading new images', log: 'Pulled 6 updated container images' },
  { name: 'update:logger', message: 'Updating logger to 0.1.5', log: 'Recreated flixer-logger-1' },
  { name: 'verify:logger', message: 'Waiting for logger to be healthy', log: 'flixer-logger-1 is healthy' },
  { name: 'update:ai', message: 'Updating ai to 0.1.4', log: 'Recreated flixer-ai-1' },
  { name: 'verify:ai', message: 'Waiting for ai to be healthy', log: 'flixer-ai-1 is healthy' },
  { name: 'update:streamer', message: 'Updating streamer to 0.10.4', log: 'Recreated flixer-streamer-1' },
  { name: 'verify:streamer', message: 'Waiting for streamer to be healthy', log: 'flixer-streamer-1 is healthy' },
  { name: 'update:indexer', message: 'Updating indexer to 0.8.4', log: 'Recreated flixer-indexer-1' },
  { name: 'verify:indexer', message: 'Waiting for indexer to be healthy', log: 'flixer-indexer-1 is healthy' },
  { name: 'update:web', message: 'Updating web to 0.13.10', log: 'Recreated flixer-web-1' },
  { name: 'verify:web', message: 'Waiting for web to be healthy', log: 'flixer-web-1 is healthy' },
  { name: 'update:flixer', message: 'Updating flixer to 1.13.13', log: 'Recreated flixer-api-1' },
  { name: 'verify:flixer', message: 'Waiting for flixer to be healthy', log: 'flixer-api-1 is healthy' },
  { name: 'verify-final:flixer', message: 'Checking services after the rollout', log: 'All services passed post-rollout health checks' },
]

/** Shared state for the full-screen admin update overlay and development-mode update emulator. */
export function useUpdateOverlay() {
  const activeRun = ref<ExtendedUpdateRun | null>(null)
  const displayRun = computed(() => (isEmulated.value ? emulatedRun.value : activeRun.value))

  function syncRun(run: ExtendedUpdateRun | null) {
    if (isEmulated.value) return
    activeRun.value = run
    if (run?.status === 'running') {
      overlayOpen.value = true
    }
  }

  function openOverlay() {
    overlayOpen.value = true
  }

  function closeOverlay() {
    if (displayRun.value?.status === 'running') return
    overlayOpen.value = false
    if (isEmulated.value) {
      clearEmulationTimers()
      isEmulated.value = false
      emulatedRun.value = null
    }
  }

  function startEmulation(simulateRollback = false) {
    clearEmulationTimers()
    isEmulated.value = true
    overlayOpen.value = true

    const startedAt = new Date().toISOString()
    emulatedRun.value = {
      id: `emulated-${Date.now()}`,
      status: 'running',
      step: 'starting',
      startedAt,
      finishedAt: null,
      targets: { ...SIMULATED_TARGETS },
      previous: { ...SIMULATED_PREVIOUS },
      backup: 'flixer-dev-emulated.dump',
      error: '',
      steps: [],
      log: ['Starting emulated update run...'],
    }

    const failIndex = simulateRollback ? 7 : -1
    const stepDelayMs = 650

    SIMULATED_SEQUENCE.forEach((entry, idx) => {
      if (failIndex >= 0 && idx > failIndex) return
      const timer = setTimeout(() => {
        if (!emulatedRun.value) return
        const now = new Date().toISOString()
        const steps = [...(emulatedRun.value.steps ?? [])]
        if (steps.length > 0 && steps[steps.length - 1].status === 'running') {
          steps[steps.length - 1] = { ...steps[steps.length - 1], status: 'succeeded', finishedAt: now }
        }
        steps.push({ name: entry.name, message: entry.message, status: 'running', startedAt: now })
        emulatedRun.value = {
          ...emulatedRun.value,
          step: entry.name,
          steps,
          log: [...(emulatedRun.value.log ?? []), `[${new Date().toLocaleTimeString()}] ${entry.message}`],
        }

        if (failIndex >= 0 && idx === failIndex) {
          const rollbackTimer = setTimeout(() => {
            if (!emulatedRun.value) return
            const doneAt = new Date().toISOString()
            const finalSteps = [...(emulatedRun.value.steps ?? [])]
            finalSteps[finalSteps.length - 1] = { ...finalSteps[finalSteps.length - 1], status: 'failed', finishedAt: doneAt }
            finalSteps.push({ name: 'rollback', message: 'Restored previous versions', status: 'succeeded', startedAt: doneAt, finishedAt: doneAt })
            emulatedRun.value = {
              ...emulatedRun.value,
              status: 'rolled_back',
              step: 'rollback',
              finishedAt: doneAt,
              error: 'indexer did not become healthy within timeout (simulated)',
              steps: finalSteps,
              log: [...(emulatedRun.value.log ?? []), `[${new Date().toLocaleTimeString()}] Rolled back to previous releases`],
            }
          }, stepDelayMs)
          emulationTimers.push(rollbackTimer)
          return
        }

        if (idx === SIMULATED_SEQUENCE.length - 1) {
          const finishTimer = setTimeout(() => {
            if (!emulatedRun.value) return
            const doneAt = new Date().toISOString()
            const finalSteps = [...(emulatedRun.value.steps ?? [])]
            if (finalSteps.length > 0) {
              finalSteps[finalSteps.length - 1] = { ...finalSteps[finalSteps.length - 1], status: 'succeeded', finishedAt: doneAt }
            }
            emulatedRun.value = {
              ...emulatedRun.value,
              status: 'succeeded',
              finishedAt: doneAt,
              steps: finalSteps,
              log: [...(emulatedRun.value.log ?? []), `[${new Date().toLocaleTimeString()}] ${entry.log}`, `[${new Date().toLocaleTimeString()}] Update completed successfully`],
            }
          }, stepDelayMs)
          emulationTimers.push(finishTimer)
        } else {
          const logTimer = setTimeout(() => {
            if (!emulatedRun.value) return
            emulatedRun.value = {
              ...emulatedRun.value,
              log: [...(emulatedRun.value.log ?? []), `[${new Date().toLocaleTimeString()}] ${entry.log}`],
            }
          }, Math.floor(stepDelayMs * 0.6))
          emulationTimers.push(logTimer)
        }
      }, idx * stepDelayMs)
      emulationTimers.push(timer)
    })
  }

  return {
    overlayOpen,
    displayRun,
    isEmulated,
    syncRun,
    openOverlay,
    closeOverlay,
    startEmulation,
  }
}
