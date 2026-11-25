<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUpdateOverlay } from '../../composables/useUpdateOverlay'

const { t } = useI18n()
const { displayRun, isEmulated, closeOverlay } = useUpdateOverlay()
const showLogs = ref(false)
const nowMs = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  tickTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(tickTimer)
})

const run = computed(() => displayRun.value)
const isRunning = computed(() => run.value?.status === 'running')
const isSucceeded = computed(() => run.value?.status === 'succeeded')
const isRolledBack = computed(() => run.value?.status === 'rolled_back')

const targetEntries = computed(() => {
  if (!run.value?.targets) return []
  return Object.entries(run.value.targets).map(([id, target]) => ({
    id,
    target,
    previous: run.value?.previous?.[id] ?? null,
    stepStatus: stepStatusFor(id),
  }))
})

function stepStatusFor(componentId: string): 'pending' | 'running' | 'succeeded' | 'failed' {
  const steps = run.value?.steps ?? []
  const verifyStep = steps.find((s) => s.name === `verify:${componentId}`)
  const updateStep = steps.find((s) => s.name === `update:${componentId}`)
  if (verifyStep) return verifyStep.status
  if (updateStep) return updateStep.status === 'failed' ? 'failed' : 'running'
  return 'pending'
}

const progressPercent = computed(() => {
  if (!run.value) return 0
  if (run.value.status === 'succeeded') return 100
  const steps = run.value.steps ?? []
  const totalEstimated = Math.max(steps.length, Object.keys(run.value.targets ?? {}).length * 2 + 3)
  const completed = steps.filter((s) => s.status === 'succeeded').length
  return Math.min(96, Math.max(6, Math.round((completed / totalEstimated) * 100)))
})

const elapsedLabel = computed(() => {
  if (!run.value?.startedAt) return '0s'
  const end = run.value.finishedAt ? new Date(run.value.finishedAt).getTime() : nowMs.value
  const seconds = Math.max(0, Math.floor((end - new Date(run.value.startedAt).getTime()) / 1000))
  const mins = Math.floor(seconds / 60)
  const rem = seconds % 60
  return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`
})

const currentStepLabel = computed(() => {
  if (!run.value) return ''
  const steps = run.value.steps ?? []
  const active = [...steps].reverse().find((s) => s.status === 'running')
  if (active?.message) return active.message
  const [phase, component] = (run.value.step ?? '').split(':')
  return phase ? t(`admin.updates.run.steps.${phase}`, { component: component ?? '' }) : ''
})

function reloadApp() {
  window.location.reload()
}
</script>

<template>
  <div v-if="run" class="flixer-modal-overlay z-[210] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" :aria-label="t('admin.updates.overlay.title')">
    <div class="flixer-modal-card w-full max-w-2xl overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl">
      <div class="flixer-modal-header flex items-start justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="grid size-11 shrink-0 place-items-center rounded-full"
            :class="isRunning ? 'bg-flixer-primary/15 text-flixer-accent' : isSucceeded ? 'bg-emerald-500/15 text-emerald-400' : isRolledBack ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'">
            <Icon v-if="isRunning" icon="lucide:refresh-cw" class="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <Icon v-else-if="isSucceeded" icon="lucide:check-circle-2" class="size-5" aria-hidden="true" />
            <Icon v-else-if="isRolledBack" icon="lucide:rotate-ccw" class="size-5" aria-hidden="true" />
            <Icon v-else icon="lucide:alert-circle" class="size-5" aria-hidden="true" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-flixer-text">
                {{ isRunning ? t('admin.updates.overlay.updatingTitle') : isSucceeded ? t('admin.updates.overlay.succeededTitle') : isRolledBack ? t('admin.updates.overlay.rolledBackTitle') : t('admin.updates.overlay.failedTitle') }}
              </h2>
              <span v-if="isEmulated" class="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                {{ t('admin.updates.overlay.emulatedBadge') }}
              </span>
            </div>
            <p class="mt-0.5 text-sm text-flixer-muted">
              {{ isRunning ? currentStepLabel : isSucceeded ? t('admin.updates.run.succeeded') : run.error || t('admin.updates.run.failed', { error: '' }) }}
            </p>
          </div>
        </div>
        <span class="shrink-0 font-mono text-xs text-flixer-muted">{{ elapsedLabel }}</span>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto py-5">
        <div class="mb-5">
          <div class="mb-1.5 flex items-center justify-between text-xs text-flixer-muted">
            <span>{{ isRunning ? t('admin.updates.overlay.inProgress') : t('admin.updates.overlay.finished') }}</span>
            <span class="font-mono">{{ progressPercent }}%</span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-flixer-background">
            <div class="h-full rounded-full transition-all duration-500"
              :class="isSucceeded ? 'bg-emerald-500' : isRolledBack ? 'bg-amber-500' : run.status === 'failed' || run.status === 'rollback_failed' ? 'bg-red-500' : 'bg-flixer-primary'"
              :style="{ width: `${progressPercent}%` }"></div>
          </div>
        </div>

        <div v-if="targetEntries.length" class="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div v-for="entry in targetEntries" :key="entry.id"
            class="flex items-center justify-between rounded border border-flixer-border bg-flixer-background/60 px-3.5 py-2.5 text-sm">
            <div class="min-w-0">
              <div class="font-medium capitalize text-flixer-text">{{ entry.id }}</div>
              <div class="truncate font-mono text-xs text-flixer-muted">
                <template v-if="entry.previous">{{ entry.previous }} → </template>{{ entry.target }}
              </div>
            </div>
            <Icon v-if="entry.stepStatus === 'succeeded'" icon="lucide:check" class="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <Icon v-else-if="entry.stepStatus === 'failed'" icon="lucide:x" class="size-4 shrink-0 text-red-400" aria-hidden="true" />
            <Icon v-else-if="entry.stepStatus === 'running'" icon="lucide:loader-2" class="size-4 shrink-0 animate-spin text-flixer-accent motion-reduce:animate-none" aria-hidden="true" />
            <span v-else class="size-2 shrink-0 rounded-full bg-flixer-border"></span>
          </div>
        </div>

        <div v-if="run.steps?.length" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-flixer-muted">{{ t('admin.updates.overlay.stepsHeading') }}</h3>
          <ul class="space-y-1.5 text-sm">
            <li v-for="step in run.steps" :key="`${step.name}-${step.startedAt}`" class="flex items-center gap-2.5 text-flixer-muted">
              <Icon v-if="step.status === 'succeeded'" icon="lucide:check-circle-2" class="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <Icon v-else-if="step.status === 'failed'" icon="lucide:x-circle" class="size-4 shrink-0 text-red-400" aria-hidden="true" />
              <Icon v-else icon="lucide:loader-2" class="size-4 shrink-0 animate-spin text-flixer-accent motion-reduce:animate-none" aria-hidden="true" />
              <span :class="step.status === 'running' ? 'font-medium text-flixer-text' : ''">{{ step.message || step.name }}</span>
            </li>
          </ul>
        </div>

        <div v-if="run.log?.length" class="mt-5">
          <button type="button" class="flex items-center gap-1.5 text-xs font-medium text-flixer-muted hover:text-flixer-text" @click="showLogs = !showLogs">
            <Icon :icon="showLogs ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="size-3.5" aria-hidden="true" />
            {{ t('admin.updates.overlay.logsToggle', { count: run.log.length }) }}
          </button>
          <pre v-if="showLogs" class="mt-2 max-h-44 overflow-y-auto rounded border border-flixer-border bg-flixer-background p-3 font-mono text-[11px] leading-relaxed text-flixer-text">{{ run.log.join('\n') }}</pre>
        </div>
      </div>

      <div class="flixer-modal-actions flex items-center justify-between gap-3">
        <p class="text-xs text-flixer-muted">
          <template v-if="run.backup">{{ t('admin.updates.run.backup', { name: run.backup }) }}</template>
        </p>
        <div class="flex items-center gap-2.5">
          <button v-if="isSucceeded && !isEmulated" type="button"
            class="inline-flex items-center gap-2 rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80"
            @click="reloadApp">
            <Icon icon="lucide:rotate-cw" class="size-4" aria-hidden="true" />
            {{ t('admin.updates.overlay.reloadApp') }}
          </button>
          <button type="button"
            class="rounded border border-flixer-border bg-flixer-background/60 px-4 py-2 text-sm font-semibold text-flixer-text transition hover:bg-flixer-background disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="isRunning" @click="closeOverlay">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
