<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, defineAsyncComponent, onMounted, provide, ref, shallowReactive, watch, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import axios from 'axios'
import LanguageModal from '../components/ui/LanguageModal.vue'
import { localeCountry, localeName } from '../i18n'
import 'flag-icons/css/flag-icons.min.css'
import logo from '../../resources/logo/flixer-logo.svg'
import { stepsFor } from './registry'
import RecoveryCodePrompt from './RecoveryCodePrompt.vue'
import { clearRecoveryCode, fetchSetupGate, getProgress, requestRecoveryKey, storedRecoveryCode, storeRecoveryCode, type SetupProgress, type WizardFlow } from './setupApi'
import { WIZARD_KEY, type StepHandle, type WizardContext } from './stepContract'
import { catchError } from '../utils/catchError'

const { t, locale } = useI18n()
const router = useRouter()

const progress = ref<SetupProgress | null>(null)
const flow = ref<WizardFlow>('quick')
const recovering = ref(false)
const needCode = ref(false)
const codeMessage = ref('')
const loadError = ref<'locked' | 'failed' | null>(null)
const lockedMessage = ref('')
const keyRequested = ref(false)
const index = ref(0)
const reached = ref(0)
const submitting = ref(false)
const handles = shallowReactive(new Map<number, StepHandle>())

const steps = computed(() => stepsFor(flow.value))
const components = computed(() => steps.value.map((step) => defineAsyncComponent(step.component)))
// Without a wizard to show (locked, failed, asking for a code) a small card reads better than an empty tall one.
const compact = computed(() => needCode.value || loadError.value !== null)
const isLast = computed(() => index.value === steps.value.length - 1)
// Steps that need a successful connection test say so; everything else can always continue.
const canContinue = computed(() => handles.get(index.value)?.canContinue !== false)

function isDone(id: string, current: SetupProgress): boolean {
  // A recovery reconnects the database again, whatever the earlier setup recorded.
  if (recovering.value) return false
  if (id === 'welcome') return current.state !== 'not_started'
  if (id === 'admin') return current.adminExists
  return current.completedSteps.includes(id)
}

/** Resume at the first step the server does not consider done, so a refresh or a second browser carries on where setup stopped. */
function firstIncomplete(current: SetupProgress, chosen: WizardFlow): number {
  const found = stepsFor(chosen).findIndex((step) => step.id === 'finish' || step.id === 'recovered' || !isDone(step.id, current))
  return found === -1 ? 0 : found
}

async function load(): Promise<void> {
  loadError.value = null
  needCode.value = false
  const gate = await fetchSetupGate()
  recovering.value = gate.kind === 'setup' && gate.status.state === 'recovery_required'
  if (recovering.value && !storedRecoveryCode()) {
    needCode.value = true
    return
  }
  const [error, result] = await catchError(getProgress())
  if (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 429)) {
      loadError.value = 'locked'
      const body = error.response.data as { error?: unknown } | undefined
      lockedMessage.value = typeof body?.error === 'string' ? body.error : ''
    } else {
      loadError.value = 'failed'
    }
    return
  }
  progress.value = result
  flow.value = recovering.value ? 'recovery' : result.flow
  index.value = reached.value = firstIncomplete(result, flow.value)
}

async function submitCode(code: string): Promise<void> {
  storeRecoveryCode(code)
  codeMessage.value = ''
  await load()
  if (loadError.value === 'locked') {
    clearRecoveryCode()
    codeMessage.value = lockedMessage.value
    loadError.value = null
    needCode.value = true
  }
}

async function useRecoveryKey(): Promise<void> {
  codeMessage.value = ''
  // The prompt still works if a key was already requested; a wrong or missing key is reported on submit.
  await catchError(requestRecoveryKey())
  keyRequested.value = true
  loadError.value = null
  needCode.value = true
}

async function refresh(): Promise<void> {
  const [error, result] = await catchError(getProgress())
  if (error) {
    // The server may be switching modes, or setup may have just been completed by an existing database; keep what we have.
    return
  }
  progress.value = result
}

async function waitUntilReady(): Promise<boolean> {
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    const gate = await fetchSetupGate()
    if (gate.kind === 'ready' || (gate.kind === 'setup' && gate.status.mode === 'ready' && gate.status.database === 'ok')) return true
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return false
}

async function advance(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    const ok = await handles.get(index.value)?.submit()
    if (ok && index.value < steps.value.length - 1) {
      index.value += 1
      reached.value = Math.max(reached.value, index.value)
    }
  } finally {
    submitting.value = false
  }
}

function back(): void {
  if (index.value > 0 && !submitting.value) index.value -= 1
}

function setHandle(i: number, instance: Element | ComponentPublicInstance | null): void {
  if (instance && 'submit' in instance) handles.set(i, instance as unknown as StepHandle)
  else handles.delete(i)
}

const context: WizardContext = {
  progress: computed(() => progress.value as SetupProgress) as unknown as WizardContext['progress'],
  flow,
  refresh,
  chooseFlow: (next) => {
    flow.value = next
  },
  waitUntilReady,
  advance,
}
provide(WIZARD_KEY, context)

// Keep the pane focused for keyboard and screen reader users when it changes.
const panes = ref<HTMLElement[]>([])
watch(index, async () => {
  await Promise.resolve()
  panes.value[index.value]?.querySelector<HTMLElement>('input, button, [tabindex]')?.focus({ preventScroll: true })
})

function openLanguage(): void {
  void openModal(LanguageModal).catch(() => undefined)
}

onMounted(load)
</script>

<template>
  <main class="fixed inset-0 flex items-center justify-center overflow-hidden bg-flixer-background text-flixer-text md:p-8" :aria-label="t('setup.title')">
    <div class="flex h-full w-full flex-col overflow-hidden bg-flixer-background md:rounded-2xl md:border md:border-flixer-border md:bg-flixer-surface md:shadow-2xl md:shadow-black/60" :class="compact ? 'md:h-auto md:max-w-md' : 'md:h-[min(46rem,100%)] md:max-w-3xl'">
      <header class="relative flex shrink-0 flex-col gap-4 px-6 pt-6 sm:px-10">
        <button v-if="index === 0 && progress" type="button" class="absolute top-5 right-6 flex h-9 items-center gap-2 rounded-lg border border-flixer-border px-3 text-xs font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-flixer-accent sm:right-10" :aria-label="t('languageModal.title')" @click="openLanguage">
          <span v-if="localeCountry(locale)" class="fi rounded-sm" :class="`fi-${localeCountry(locale)}`" aria-hidden="true"></span>
          <Icon v-else icon="lucide:globe" class="size-4" aria-hidden="true" />
          {{ localeName(locale) }}
        </button>
        <img :src="logo" alt="Flixer" class="h-7 w-auto self-start md:h-10 md:self-center" />
        <ol v-if="progress && steps.length > 1" class="flex gap-2" :aria-label="t('setup.progress')">
          <li v-for="(step, i) in steps" :key="step.id" class="flex-1" :aria-current="i === index ? 'step' : undefined">
            <span class="block h-1 rounded-full transition-colors" :class="i <= index ? 'bg-flixer-accent' : 'bg-flixer-border'"></span>
            <span class="mt-2 hidden text-[11px] font-medium sm:block" :class="i === index ? 'text-flixer-text' : 'text-flixer-muted'">{{ t(step.titleKey) }}</span>
          </li>
        </ol>
      </header>

      <div v-if="needCode" class="flex flex-1 items-center justify-center px-6">
        <RecoveryCodePrompt :message="codeMessage" :title="keyRequested ? t('setup.key.title') : undefined" :description="keyRequested ? t('setup.key.description') : undefined" :hint="keyRequested ? t('setup.key.hint') : undefined" @submit="submitCode" />
      </div>

      <div v-else-if="loadError" class="flex flex-col items-center gap-5 px-8 pt-6 pb-12 text-center" role="alert">
        <div class="flex max-w-sm flex-col gap-2">
          <h2 class="text-xl font-semibold">{{ loadError === 'locked' ? t('setup.lockedTitle') : t('setup.loadFailedTitle') }}</h2>
          <p class="text-sm leading-6 text-flixer-muted">{{ loadError === 'locked' ? t('setup.locked') : t('setup.loadFailed') }}</p>
        </div>
        <div class="flex gap-3">
          <button v-if="loadError === 'locked'" type="button" class="h-11 rounded-lg bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110" @click="router.push({ name: 'login' })">{{ t('setup.signIn') }}</button>
          <button v-if="loadError === 'locked'" type="button" class="h-11 rounded-lg border border-flixer-border px-6 text-sm font-semibold transition hover:bg-white/5" @click="useRecoveryKey">{{ t('setup.key.use') }}</button>
          <button type="button" class="h-11 rounded-lg border border-flixer-border px-6 text-sm font-semibold transition hover:bg-white/5" @click="load">{{ t('setup.retry') }}</button>
        </div>
      </div>

      <div v-else-if="!progress" class="flex flex-1 items-center justify-center text-sm text-flixer-muted" role="status">{{ t('setup.loading') }}</div>

      <template v-else>
        <div class="relative min-h-0 flex-1 overflow-hidden">
          <div class="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none" :style="{ transform: `translateX(-${index * 100}%)` }">
            <section
              v-for="(step, i) in steps"
              :key="step.id"
              :ref="
                (el) => {
                  if (el) panes[i] = el as HTMLElement
                }
              "
              class="h-full w-full shrink-0 overflow-y-auto px-6 py-8 sm:px-10"
              :inert="i !== index"
              :aria-hidden="i !== index"
              :aria-label="t(step.titleKey)"
            >
              <div class="w-full max-w-xl md:max-w-none">
                <component :is="components[i]" v-if="i <= reached" :ref="(el: Element | ComponentPublicInstance | null) => setHandle(i, el)" />
              </div>
            </section>
          </div>
        </div>

        <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-flixer-border/60 px-6 py-4 sm:px-10">
          <button type="button" class="h-11 rounded-lg px-5 text-sm font-semibold text-flixer-muted transition hover:text-flixer-text disabled:invisible" :disabled="index === 0 || submitting" @click="back">{{ t('setup.back') }}</button>
          <button type="button" class="h-11 min-w-32 rounded-lg bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" :disabled="submitting || !canContinue" @click="advance">
            {{ submitting ? t('setup.working') : isLast ? t('setup.finish') : t('setup.continue') }}
          </button>
        </footer>
      </template>
    </div>
  </main>
</template>
