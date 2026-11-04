<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAccessOptions, getUserAccess, listMediaLibraries, previewUserAccess, saveUserAccess, type AccessOptions, type AccessPreview, type AccessSchedule, type AdminUser, type MediaLibrary, type ScheduleWindow } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import UserAvatar from '../ui/UserAvatar.vue'
import AdminToggle from './AdminToggle.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ user: AdminUser }>()
const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const libraries = ref<MediaLibrary[]>([])
const options = ref<AccessOptions>({ ratings: [], tags: [] })
const preview = ref<AccessPreview | null>(null)
const previewing = ref(false)
const hasPin = ref(false)
const newPin = ref('')
const removePin = ref(false)
const tagDraft = reactive({ blocked: '', allowed: '' })

const form = reactive({
  libraryMode: 'all' as 'all' | 'selected',
  libraryIds: [] as string[],
  maxAge: null as number | null,
  blockUnrated: false,
  allowedTags: [] as string[],
  blockedTags: [] as string[],
  scheduleEnabled: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  windows: [] as ScheduleWindow[],
  requireRequestApproval: false,
})

const DAYS = [0, 1, 2, 3, 4, 5, 6]
const presets = [
  { id: 'kids', maxAge: 7, blockUnrated: true, approval: true, icon: 'lucide:baby' },
  { id: 'preteen', maxAge: 13, blockUnrated: true, approval: true, icon: 'lucide:smile' },
  { id: 'teen', maxAge: 16, blockUnrated: false, approval: false, icon: 'lucide:graduation-cap' },
  { id: 'adult', maxAge: null, blockUnrated: false, approval: false, icon: 'lucide:user-round' },
] as const

const activePreset = computed(() => presets.find((preset) => preset.maxAge === form.maxAge && preset.blockUnrated === form.blockUnrated && preset.approval === form.requireRequestApproval)?.id ?? 'custom')
const dayName = (day: number) => new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + day)))
const dayInitial = (day: number) => dayName(day).slice(0, 1).toUpperCase()

const hasRestrictions = computed(() => form.libraryMode === 'selected' || form.maxAge !== null || form.blockUnrated || form.allowedTags.length > 0 || form.blockedTags.length > 0 || (form.scheduleEnabled && form.windows.length > 0))

function applyPreset(id: (typeof presets)[number]['id']) {
  const preset = presets.find((entry) => entry.id === id)
  if (!preset) return
  form.maxAge = preset.maxAge
  form.blockUnrated = preset.blockUnrated
  form.requireRequestApproval = preset.approval
}

function toggleLibrary(id: string) {
  const index = form.libraryIds.indexOf(id)
  if (index >= 0) form.libraryIds.splice(index, 1)
  else form.libraryIds.push(id)
}

function addTag(kind: 'blocked' | 'allowed') {
  const tag = tagDraft[kind].trim().toLowerCase()
  tagDraft[kind] = ''
  const list = kind === 'blocked' ? 'blockedTags' : 'allowedTags'
  if (!tag || form.allowedTags.includes(tag) || form.blockedTags.includes(tag)) return
  form[list].push(tag)
}

function addWindow(days: number[], from: string, to: string) {
  form.windows.push({ days: [...days], from, to })
  form.scheduleEnabled = true
}

function toggleDay(window: ScheduleWindow, day: number) {
  const index = window.days.indexOf(day)
  if (index >= 0) window.days.splice(index, 1)
  else window.days.push(day)
}

watch(
  () => form.scheduleEnabled,
  (enabled) => {
    if (enabled && form.windows.length === 0) addWindow([0, 1, 2, 3, 4, 5, 6], '07:00', '20:00')
  },
)

const scheduleValid = computed(() => !form.scheduleEnabled || (form.windows.length > 0 && form.windows.every((window) => window.days.length > 0 && window.from !== '' && window.to !== '')))
const pinValid = computed(() => newPin.value === '' || /^\d{6}$/.test(newPin.value))
const canSave = computed(() => !saving.value && scheduleValid.value && pinValid.value && (form.libraryMode === 'all' || form.libraryIds.length > 0))

function schedulePayload(): AccessSchedule | null {
  return form.scheduleEnabled && form.windows.length > 0 ? { timezone: form.timezone, windows: form.windows.map((window) => ({ ...window, days: [...window.days].sort() })) } : null
}

async function load() {
  const [error, result] = await catchError(Promise.all([getUserAccess(props.user.id), listMediaLibraries(), getAccessOptions()]))
  if (error) {
    notify.error(describeRequestError(error, t('admin.access.loadError')))
    close()
    return
  }
  const [policy, libs, opts] = result
  libraries.value = libs
  options.value = opts
  form.libraryMode = policy.libraryMode
  form.libraryIds = [...policy.libraryIds]
  form.maxAge = policy.maxAge
  form.blockUnrated = policy.blockUnrated
  form.allowedTags = [...policy.allowedTags]
  form.blockedTags = [...policy.blockedTags]
  form.requireRequestApproval = policy.requireRequestApproval
  hasPin.value = policy.hasPin
  if (policy.schedule) {
    form.scheduleEnabled = true
    form.timezone = policy.schedule.timezone
    form.windows = policy.schedule.windows.map((window) => ({ ...window, days: [...window.days] }))
  }
  loading.value = false
  await refreshPreview()
}

async function save() {
  saving.value = true
  try {
    const [error] = await catchError(
      saveUserAccess(props.user.id, {
        libraryMode: form.libraryMode,
        libraryIds: form.libraryIds,
        maxAge: form.maxAge,
        blockUnrated: form.blockUnrated,
        allowedTags: form.allowedTags,
        blockedTags: form.blockedTags,
        schedule: schedulePayload(),
        requireRequestApproval: form.requireRequestApproval,
        ...(newPin.value ? { pin: newPin.value } : removePin.value ? { pin: null } : {}),
      }),
    )
    if (error) {
      notify.error(describeRequestError(error, t('admin.access.saveError')))
      return
    }
    notify.success(t('admin.access.saved', { name: props.user.displayName }))
    confirm(true)
  } finally {
    saving.value = false
  }
}

// Previews the unsaved form, so an admin can see the effect before committing.
async function refreshPreview() {
  if (!canSave.value) return
  previewing.value = true
  try {
    const [error, result] = await catchError(previewUserAccess(props.user.id, { libraryMode: form.libraryMode, libraryIds: form.libraryIds, maxAge: form.maxAge, blockUnrated: form.blockUnrated, allowedTags: form.allowedTags, blockedTags: form.blockedTags, schedule: schedulePayload() }))
    if (!error) preview.value = result
  } finally {
    previewing.value = false
  }
}

const secondaryButton = 'flex h-11 items-center justify-center rounded border border-flixer-border px-5 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60'
const chip = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium'
const input = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-flixer-accent'

const ratingSteps = computed(() => [{ age: null as number | null, label: t('admin.access.noLimit'), examples: '' }, ...options.value.ratings.map((rating) => ({ age: rating.age as number | null, label: rating.age === 0 ? t('admin.access.allAges') : rating.age >= 18 ? t('admin.access.adultsOnly') : `${rating.age}+`, examples: rating.examples }))])
const selectedStep = computed(() => ratingSteps.value.find((step) => step.age === form.maxAge))

let previewTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => JSON.stringify([form, newPin.value === '']),
  () => {
    if (loading.value) return
    clearTimeout(previewTimer)
    previewTimer = setTimeout(() => void refreshPreview(), 500)
  },
)
onBeforeUnmount(() => clearTimeout(previewTimer))

onMounted(load)
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/60">
      <header class="flex shrink-0 items-center gap-4 border-b border-flixer-border px-6 py-5">
        <div class="size-11 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="user.avatarUrl" :name="user.displayName" /></div>
        <div class="min-w-0 flex-1">
          <ModalTitle class="flex items-center gap-2 text-lg font-semibold"><Icon icon="lucide:shield-check" class="size-5 text-flixer-accent" aria-hidden="true" />{{ t('admin.access.title', { name: user.displayName }) }}</ModalTitle>
          <ModalDescription class="mt-0.5 text-sm text-flixer-muted">{{ t('admin.access.description') }}</ModalDescription>
        </div>
        <span :class="[chip, hasRestrictions ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300']">
          <Icon :icon="hasRestrictions ? 'lucide:lock' : 'lucide:lock-open'" class="size-3.5" aria-hidden="true" />{{ hasRestrictions ? t('admin.access.restricted') : t('admin.access.unrestricted') }}
        </span>
      </header>

      <div v-if="loading" class="grid h-64 place-items-center text-sm text-flixer-muted">{{ t('common.loading') }}</div>
      <div v-else class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin]">
        <section>
          <h3 class="text-sm font-semibold">{{ t('admin.access.presets') }}</h3>
          <p class="mt-0.5 text-xs text-flixer-muted">{{ t('admin.access.presetsDescription') }}</p>
          <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button v-for="preset in presets" :key="preset.id" type="button" class="flex flex-col items-start gap-1 rounded border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="activePreset === preset.id ? 'border-flixer-primary bg-flixer-primary/10' : 'border-flixer-border hover:bg-white/5'" :aria-pressed="activePreset === preset.id" @click="applyPreset(preset.id)">
              <Icon :icon="preset.icon" class="size-5" :class="activePreset === preset.id ? 'text-flixer-accent' : 'text-flixer-muted'" aria-hidden="true" />
              <span class="text-sm font-semibold">{{ t(`admin.access.preset.${preset.id}`) }}</span>
              <span class="text-xs text-flixer-muted">{{ t(`admin.access.preset.${preset.id}Description`) }}</span>
            </button>
          </div>
        </section>

        <section class="border-t border-flixer-border pt-5">
          <h3 class="text-sm font-semibold">{{ t('admin.access.libraries') }}</h3>
          <p class="mt-0.5 text-xs text-flixer-muted">{{ t('admin.access.librariesDescription') }}</p>
          <div class="mt-3 inline-flex rounded border border-flixer-border p-0.5" role="group" :aria-label="t('admin.access.libraries')">
            <button v-for="mode in ['all', 'selected'] as const" :key="mode" type="button" class="rounded px-4 py-1.5 text-xs font-semibold transition" :class="form.libraryMode === mode ? 'bg-flixer-primary text-white' : 'text-flixer-muted hover:text-flixer-text'" :aria-pressed="form.libraryMode === mode" @click="form.libraryMode = mode">{{ t(`admin.access.libraryMode.${mode}`) }}</button>
          </div>
          <Transition name="fade">
            <div v-if="form.libraryMode === 'selected'" class="mt-3 grid gap-2 sm:grid-cols-2">
              <label v-for="library in libraries" :key="library.id" class="flex cursor-pointer items-center gap-3 rounded border p-3 transition has-focus-visible:outline-2 has-focus-visible:outline-flixer-accent" :class="form.libraryIds.includes(library.id) ? 'border-flixer-primary bg-flixer-primary/10' : 'border-flixer-border hover:bg-white/5'">
                <input type="checkbox" class="sr-only" :checked="form.libraryIds.includes(library.id)" @change="toggleLibrary(library.id)" />
                <Icon :icon="form.libraryIds.includes(library.id) ? 'lucide:circle-check' : 'lucide:circle'" class="size-5 shrink-0" :class="form.libraryIds.includes(library.id) ? 'text-flixer-accent' : 'text-flixer-muted'" aria-hidden="true" />
                <span class="min-w-0"><span class="block truncate text-sm font-medium">{{ library.name }}</span><span class="block text-xs capitalize text-flixer-muted">{{ library.type }}</span></span>
              </label>
              <p v-if="libraries.length === 0" class="text-sm text-flixer-muted">{{ t('admin.access.noLibraries') }}</p>
            </div>
          </Transition>
          <p v-if="form.libraryMode === 'selected' && form.libraryIds.length === 0" class="mt-2 text-xs text-amber-300">{{ t('admin.access.pickLibrary') }}</p>
        </section>

        <section class="border-t border-flixer-border pt-5">
          <h3 class="text-sm font-semibold">{{ t('admin.access.rating') }}</h3>
          <p class="mt-0.5 text-xs text-flixer-muted">{{ t('admin.access.ratingDescription') }}</p>
          <div class="mt-3 flex flex-wrap gap-2" role="group" :aria-label="t('admin.access.rating')">
            <button v-for="step in ratingSteps" :key="String(step.age)" type="button" class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="form.maxAge === step.age ? 'border-flixer-primary bg-flixer-primary text-white' : 'border-flixer-border text-flixer-muted hover:bg-white/5 hover:text-flixer-text'" :aria-pressed="form.maxAge === step.age" @click="form.maxAge = step.age">{{ step.label }}</button>
          </div>
          <p v-if="selectedStep?.examples" class="mt-2 text-xs text-flixer-muted">{{ t('admin.access.ratingExamples', { examples: selectedStep.examples }) }}</p>
          <AdminToggle v-model="form.blockUnrated" class="mt-2" :label="t('admin.access.blockUnrated')" :description="t('admin.access.blockUnratedDescription')" />
        </section>

        <section class="border-t border-flixer-border pt-5">
          <h3 class="text-sm font-semibold">{{ t('admin.access.tags') }}</h3>
          <p class="mt-0.5 text-xs text-flixer-muted">{{ t('admin.access.tagsDescription') }}</p>
          <datalist id="access-tag-suggestions"><option v-for="tag in options.tags" :key="tag" :value="tag" /></datalist>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <div v-for="kind in ['blocked', 'allowed'] as const" :key="kind">
              <label class="flex items-center gap-1.5 text-xs font-semibold" :for="`access-${kind}`"><Icon :icon="kind === 'blocked' ? 'lucide:ban' : 'lucide:check'" class="size-3.5" :class="kind === 'blocked' ? 'text-rose-300' : 'text-emerald-300'" aria-hidden="true" />{{ t(`admin.access.${kind}Tags`) }}</label>
              <input :id="`access-${kind}`" v-model="tagDraft[kind]" list="access-tag-suggestions" :class="[input, 'mt-1.5']" :placeholder="t('admin.access.tagPlaceholder')" maxlength="60" @keydown.enter.prevent="addTag(kind)" @change="addTag(kind)" />
              <p class="mt-1 text-xs text-flixer-muted">{{ t(`admin.access.${kind}TagsHint`) }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="tag in form[kind === 'blocked' ? 'blockedTags' : 'allowedTags']" :key="tag" :class="[chip, kind === 'blocked' ? 'border-rose-400/40 bg-rose-400/10 text-rose-200' : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200']">
                  {{ tag }}
                  <button type="button" class="-mr-1 grid size-4 place-items-center rounded-full hover:bg-white/15" :aria-label="t('admin.access.removeTag', { tag })" @click="form[kind === 'blocked' ? 'blockedTags' : 'allowedTags'].splice(form[kind === 'blocked' ? 'blockedTags' : 'allowedTags'].indexOf(tag), 1)"><Icon icon="lucide:x" class="size-3" aria-hidden="true" /></button>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="border-t border-flixer-border pt-5">
          <AdminToggle v-model="form.scheduleEnabled" :label="t('admin.access.schedule')" :description="t('admin.access.scheduleDescription')" />
          <Transition name="fade">
            <div v-if="form.scheduleEnabled" class="mt-3 flex flex-col gap-3">
              <div v-for="(window, index) in form.windows" :key="index" class="flex flex-wrap items-center gap-x-4 gap-y-3 rounded border border-flixer-border p-3">
                <div class="flex gap-1" role="group" :aria-label="t('admin.access.days')">
                  <button v-for="day in DAYS" :key="day" type="button" class="grid size-8 place-items-center rounded-full text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="window.days.includes(day) ? 'bg-flixer-primary text-white' : 'bg-white/5 text-flixer-muted hover:bg-white/10'" :title="dayName(day)" :aria-label="dayName(day)" :aria-pressed="window.days.includes(day)" @click="toggleDay(window, day)">{{ dayInitial(day) }}</button>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <input v-model="window.from" type="time" :class="[input, 'w-auto']" :aria-label="t('admin.access.from')" />
                  <span class="text-flixer-muted">–</span>
                  <input v-model="window.to" type="time" :class="[input, 'w-auto']" :aria-label="t('admin.access.to')" />
                </div>
                <button type="button" class="ml-auto grid size-8 place-items-center rounded text-flixer-muted transition hover:bg-rose-500/10 hover:text-rose-300" :aria-label="t('admin.access.removeWindow')" @click="form.windows.splice(index, 1); if (form.windows.length === 0) form.scheduleEnabled = false"><Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" /></button>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <button type="button" class="flex items-center gap-1.5 text-xs font-semibold text-flixer-accent hover:underline" @click="addWindow([1, 2, 3, 4, 5], '16:00', '20:00')"><Icon icon="lucide:plus" class="size-3.5" aria-hidden="true" />{{ t('admin.access.addWindow') }}</button>
                <label class="ml-auto flex items-center gap-2 text-xs text-flixer-muted">{{ t('admin.access.timezone') }}<input v-model="form.timezone" :class="[input, 'w-48 py-1.5']" maxlength="64" /></label>
              </div>
              <p v-if="!scheduleValid" class="text-xs text-amber-300">{{ t('admin.access.scheduleInvalid') }}</p>
            </div>
          </Transition>
        </section>

        <section class="border-t border-flixer-border pt-5">
          <h3 class="text-sm font-semibold">{{ t('admin.access.pin') }}</h3>
          <p class="mt-0.5 text-xs text-flixer-muted">{{ t('admin.access.pinDescription') }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <input v-model="newPin" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" :class="[input, 'w-44']" :placeholder="hasPin ? t('admin.access.pinReplace') : t('admin.access.pinNew')" :aria-label="t('admin.access.pin')" @input="removePin = false" />
            <span v-if="hasPin && !removePin" :class="[chip, 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300']"><Icon icon="lucide:key-round" class="size-3.5" aria-hidden="true" />{{ t('admin.access.pinSet') }}</span>
            <button v-if="hasPin && !removePin && !newPin" type="button" class="text-xs font-semibold text-rose-300 hover:underline" @click="removePin = true">{{ t('admin.access.pinRemove') }}</button>
            <span v-if="removePin" class="text-xs text-amber-300">{{ t('admin.access.pinWillRemove') }}</span>
          </div>
          <p v-if="!pinValid" class="mt-2 text-xs text-amber-300">{{ t('admin.access.pinInvalid') }}</p>
        </section>

        <section class="border-t border-flixer-border pt-5">
          <AdminToggle v-model="form.requireRequestApproval" :label="t('admin.access.requestApproval')" :description="t('admin.access.requestApprovalDescription')" />
        </section>

        <section class="border-t border-flixer-border pt-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="flex items-center gap-2 text-sm font-semibold"><Icon icon="lucide:eye" class="size-4 text-flixer-accent" aria-hidden="true" />{{ t('admin.access.preview') }}</h3>
              <p class="mt-0.5 text-xs text-flixer-muted">{{ t('admin.access.previewDescription') }}</p>
            </div>
            <button type="button" class="flex h-9 shrink-0 items-center gap-1.5 rounded border border-flixer-border px-3 text-xs font-semibold transition hover:bg-white/5 disabled:opacity-60" :disabled="previewing || !canSave" @click="refreshPreview"><Icon icon="lucide:refresh-cw" class="size-3.5" :class="{ 'animate-spin': previewing }" aria-hidden="true" />{{ t('admin.access.previewRefresh') }}</button>
          </div>
          <div v-if="preview" class="mt-3 flex flex-col gap-3">
            <div v-for="library in preview.libraries" :key="library.id">
              <div class="flex items-baseline justify-between text-xs"><span class="font-medium">{{ library.name }}</span><span class="text-flixer-muted">{{ library.hidden ? t('admin.access.libraryHidden') : t('admin.access.visibleOf', { visible: library.visible, total: library.total }) }}</span></div>
              <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full bg-flixer-primary transition-all duration-500" :style="{ width: `${library.hidden || library.total === 0 ? 0 : Math.round((library.visible / library.total) * 100)}%` }"></div></div>
            </div>
            <div v-if="preview.blocked.length > 0" class="mt-1">
              <p class="text-xs font-semibold text-flixer-muted">{{ t('admin.access.blockedExamples') }}</p>
              <ul class="mt-1.5 flex flex-wrap gap-1.5">
                <li v-for="item in preview.blocked" :key="item.id" :class="[chip, 'border-flixer-border text-flixer-muted']" :title="t(`admin.access.reason.${item.reason}`)"><Icon icon="lucide:eye-off" class="size-3" aria-hidden="true" /><span class="max-w-48 truncate">{{ item.title }}</span><span class="opacity-70">· {{ t(`admin.access.reason.${item.reason}`) }}</span></li>
              </ul>
            </div>
            <p v-if="preview.schedule.configured" class="flex items-center gap-1.5 text-xs" :class="preview.schedule.allowedNow ? 'text-emerald-300' : 'text-amber-300'"><Icon icon="lucide:clock" class="size-3.5" aria-hidden="true" />{{ preview.schedule.allowedNow ? t('admin.access.allowedNow') : t('admin.access.blockedNow') }}</p>
          </div>
        </section>
      </div>

      <footer class="flex shrink-0 flex-col-reverse gap-3 border-t border-flixer-border px-6 py-4 sm:flex-row sm:justify-end">
        <button type="button" :class="secondaryButton" :disabled="saving" @click="close()">{{ t('common.cancel') }}</button>
        <button type="button" class="flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="!canSave || loading" @click="save">{{ t('common.save') }}</button>
      </footer>
    </ModalContent>
  </ModalRoot>
</template>
