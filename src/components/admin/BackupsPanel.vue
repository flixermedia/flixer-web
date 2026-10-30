<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { clearBackupPassphrase, createBackup, deleteBackup, getBackupDownloadUrl, getBackupStatus, restoreBackup, setBackupPassphrase, updateSetting, uploadBackup, type BackupEntry, type BackupStatus } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import StatusPill from './StatusPill.vue'
import { confirmAction } from '../../composables/confirm'

const POLL_MS = 3000

const { t, te, locale } = useI18n()

const status = ref<BackupStatus | null>(null)
const loadError = ref('')
const isCreating = ref(false)
const uploadProgress = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const schedule = ref<BackupStatus['schedule']>('off')
const keep = ref(7)
const newPassphrase = ref('')
const isSavingPassphrase = ref(false)
const restoreTarget = ref<BackupEntry | null>(null)
const restorePassphrase = ref('')
const restoreConfirmed = ref(false)
const isRestoring = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let unmounted = false
let wasRunning = false

const running = computed(() => status.value?.run?.status === 'running')
const busy = computed(() => running.value || isCreating.value || isRestoring.value || uploadProgress.value !== null)
const ready = computed(() => status.value !== null)
const canRestore = computed(() => Boolean(status.value?.canRestore))
const scheduleDirty = computed(() => status.value !== null && (schedule.value !== status.value.schedule || keep.value !== status.value.keep))

const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none transition focus:border-flixer-accent'
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const quietButtonClass = 'rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60'
const dangerButtonClass = 'rounded bg-red-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60'

function formatTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' }) : t('admin.backups.never')
}

function formatSize(bytes: number) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function componentLabel(id: string) {
  return te(`admin.backups.components.${id}`) ? t(`admin.backups.components.${id}`) : id
}

function stepLabel(step: string) {
  return te(`admin.backups.steps.${step}`) ? t(`admin.backups.steps.${step}`) : step
}

function adopt(next: BackupStatus) {
  status.value = next
  if (!scheduleDirty.value) {
    schedule.value = next.schedule
    keep.value = next.keep
  }
}

// A restore restarts the API, so polling has to ride out failed requests instead of reporting them.
function schedulePoll() {
  clearTimeout(timer)
  if (unmounted || !running.value) return
  timer = setTimeout(async () => {
    await load(true)
    schedulePoll()
  }, POLL_MS)
}

async function load(quiet = false) {
  const [error, result] = await catchError(getBackupStatus())
  if (error) {
    if (!quiet) loadError.value = describeRequestError(error)
    return
  }
  adopt(result)
  loadError.value = ''
  if (wasRunning && !running.value) {
    const run = status.value?.run
    if (run?.status === 'succeeded') notify.success(t(run.kind === 'restore' ? 'admin.backups.run.restored' : 'admin.backups.run.created'))
  }
  wasRunning = running.value
}

async function create() {
  isCreating.value = true
  try {
    const [error] = await catchError(createBackup())
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      notify.success(t('admin.backups.started'))
      await load(true)
      wasRunning = running.value
      schedulePoll()
    }
  } finally {
    isCreating.value = false
  }
}

async function download(backup: BackupEntry) {
  const link = document.createElement('a')
  const [error, url] = await catchError(getBackupDownloadUrl(backup.name))
  if (error) {
    notify.error(describeRequestError(error))
  } else {
    link.href = url
    link.download = backup.name
    link.click()
  }
}

async function remove(backup: BackupEntry) {
  if (!(await confirmAction(t('admin.backups.confirmDelete', { name: backup.name }), { danger: true }))) return
  const [error] = await catchError(deleteBackup(backup.name))
  if (error) {
    notify.error(describeRequestError(error))
  } else {
    await load(true)
  }
}

function pickFile() {
  fileInput.value?.click()
}

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploadProgress.value = 0
  try {
    const [error] = await catchError(uploadBackup(file, (fraction) => (uploadProgress.value = fraction)))
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      notify.success(t('admin.backups.uploaded'))
      await load(true)
    }
  } finally {
    uploadProgress.value = null
  }
}

function openRestore(backup: BackupEntry) {
  restoreTarget.value = backup
  restorePassphrase.value = ''
  restoreConfirmed.value = false
}

async function restore() {
  const target = restoreTarget.value
  if (!target || !restoreConfirmed.value) return
  isRestoring.value = true
  try {
    const [error] = await catchError(restoreBackup(target.name, restorePassphrase.value))
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      notify.success(t('admin.backups.restoreStarted'))
      restoreTarget.value = null
      await load(true)
      wasRunning = true
      schedulePoll()
    }
  } finally {
    isRestoring.value = false
  }
}

async function saveSchedule() {
  const [scheduleError] = await catchError(updateSetting('backups_schedule', schedule.value))
  if (scheduleError) {
    notify.error(describeRequestError(scheduleError))
    return
  }
  const [keepError] = await catchError(updateSetting('backups_keep', Math.trunc(Number(keep.value))))
  if (keepError) {
    notify.error(describeRequestError(keepError))
    return
  }
  notify.success(t('admin.backups.schedule.saved'))
  await load(true)
}

async function savePassphrase() {
  isSavingPassphrase.value = true
  try {
    const [error] = await catchError(setBackupPassphrase(newPassphrase.value))
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      newPassphrase.value = ''
      notify.success(t('admin.backups.encryption.saved'))
      await load(true)
    }
  } finally {
    isSavingPassphrase.value = false
  }
}

async function removePassphrase() {
  if (!(await confirmAction(t('admin.backups.encryption.confirmRemove'), { danger: true }))) return
  const [error] = await catchError(clearBackupPassphrase())
  if (error) {
    notify.error(describeRequestError(error))
  } else {
    notify.success(t('admin.backups.encryption.removed'))
    await load(true)
  }
}

onMounted(async () => {
  await load()
  wasRunning = running.value
  schedulePoll()
})

onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(timer)
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.backups.title')" :description="t('admin.backups.description')">
      <template #actions>
        <input ref="fileInput" type="file" accept=".flxbak" class="hidden" @change="upload" />
        <button type="button" :class="quietButtonClass" :disabled="!ready || busy" @click="pickFile">
          {{ uploadProgress === null ? t('admin.backups.upload') : t('admin.backups.uploading', { percent: Math.round(uploadProgress * 100) }) }}
        </button>
        <button type="button" :class="buttonClass" :disabled="!ready || busy" @click="create">
          {{ running && status?.run?.kind === 'backup' ? t('admin.backups.creating') : t('admin.backups.create') }}
        </button>
      </template>

      <p v-if="loadError" role="alert" class="rounded border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ loadError }}</p>
      <AdminSkeleton v-else-if="!status" variant="table" />
      <template v-else>
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
          <div v-if="status.run" class="mb-4 rounded border px-3 py-2 text-sm" :class="status.run.status === 'failed' ? 'border-red-500/40 bg-red-500/10' : status.run.status === 'running' ? 'border-flixer-accent/40 bg-flixer-accent/10' : 'border-emerald-500/30 bg-emerald-500/10'" :aria-live="status.run.status === 'running' ? 'polite' : undefined">
            <p v-if="status.run.status === 'running'">{{ t(`admin.backups.run.running.${status.run.kind}`) }} {{ stepLabel(status.run.step) }}</p>
            <p v-else-if="status.run.status === 'succeeded'">{{ t(status.run.kind === 'restore' ? 'admin.backups.run.restored' : 'admin.backups.run.created') }}</p>
            <p v-else>{{ t(`admin.backups.run.failed.${status.run.kind}`, { error: status.run.error ?? '' }) }}</p>
            <p v-if="status.run.kind === 'restore' && status.run.status === 'succeeded'" class="mt-1 text-xs text-flixer-muted">{{ t('admin.backups.run.signInAgain') }}</p>
          </div>
        </Transition>

        <p v-if="!status.canRestore" class="mb-4 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{{ t('admin.backups.restoreUnavailable') }}</p>
        <p v-if="!status.backups.length" class="text-sm text-flixer-muted">{{ t('admin.backups.empty') }}</p>
        <ul v-else class="divide-y divide-flixer-border text-sm">
          <li v-for="backup in status.backups" :key="backup.name" class="flex flex-wrap items-center justify-between gap-3 py-3">
            <div class="min-w-0">
              <p class="font-medium">{{ formatTime(backup.createdAt) }}</p>
              <p class="mt-0.5 truncate font-mono text-xs text-flixer-muted">{{ backup.name }}</p>
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StatusPill :tone="backup.encrypted ? 'good' : 'warn'">{{ backup.encrypted ? t('admin.backups.encrypted') : t('admin.backups.notEncrypted') }}</StatusPill>
                <StatusPill v-for="component in backup.components" :key="component">{{ componentLabel(component) }}</StatusPill>
                <span v-if="backup.versions.flixer" class="text-xs text-flixer-muted">v{{ backup.versions.flixer }}</span>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span class="mr-2 text-xs text-flixer-muted">{{ formatSize(backup.size) }}</span>
              <button type="button" :class="quietButtonClass" @click="download(backup)">{{ t('admin.backups.download') }}</button>
              <button type="button" :class="quietButtonClass" :disabled="!canRestore || busy" :title="canRestore ? undefined : t('admin.backups.restoreUnavailable')" @click="openRestore(backup)">{{ t('admin.backups.restore') }}</button>
              <button type="button" :class="quietButtonClass" :disabled="!ready || busy" @click="remove(backup)">{{ t('admin.backups.delete') }}</button>
            </div>
          </li>
        </ul>
      </template>
    </AdminSection>

    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <AdminSection v-if="restoreTarget" :title="t('admin.backups.restoreTitle')" :description="t('admin.backups.restoreDescription', { time: formatTime(restoreTarget.createdAt) })">
        <form class="flex max-w-xl flex-col gap-4 text-sm" @submit.prevent="restore">
          <p class="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{{ t('admin.backups.restoreWarning') }}</p>
          <div v-if="restoreTarget.encrypted" class="flex flex-col gap-1">
            <label for="restore-passphrase">{{ t('admin.backups.restorePassphrase') }}</label>
            <input id="restore-passphrase" v-model="restorePassphrase" type="password" autocomplete="off" :class="inputClass" />
            <span class="text-xs text-flixer-muted">{{ t('admin.backups.restorePassphraseHelp') }}</span>
          </div>
          <label class="flex items-start gap-2">
            <input v-model="restoreConfirmed" type="checkbox" class="mt-0.5" />
            <span>{{ t('admin.backups.restoreConfirm') }}</span>
          </label>
          <div class="flex gap-2">
            <button type="submit" :class="dangerButtonClass" :disabled="!restoreConfirmed || isRestoring || !canRestore || busy">{{ t('admin.backups.restoreNow') }}</button>
            <button type="button" :class="quietButtonClass" @click="restoreTarget = null">{{ t('admin.backups.cancel') }}</button>
          </div>
        </form>
      </AdminSection>
    </Transition>

    <AdminSection :title="t('admin.backups.schedule.title')" :description="t('admin.backups.schedule.description')">
      <form class="flex max-w-xl flex-col gap-4 text-sm" @submit.prevent="saveSchedule">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label for="backup-schedule">{{ t('admin.backups.schedule.frequency') }}</label>
            <select id="backup-schedule" v-model="schedule" :class="inputClass">
              <option value="off">{{ t('admin.backups.schedule.off') }}</option>
              <option value="daily">{{ t('admin.backups.schedule.daily') }}</option>
              <option value="weekly">{{ t('admin.backups.schedule.weekly') }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label for="backup-keep">{{ t('admin.backups.schedule.keep') }}</label>
            <input id="backup-keep" v-model.number="keep" type="number" min="1" max="60" step="1" :class="inputClass" />
          </div>
        </div>
        <p class="text-xs text-flixer-muted">{{ t('admin.backups.schedule.help', { time: formatTime(status?.lastScheduledAt ?? null) }) }}</p>
        <div>
          <button type="submit" :class="buttonClass" :disabled="!scheduleDirty">{{ t('admin.backups.schedule.save') }}</button>
        </div>
      </form>
    </AdminSection>

    <AdminSection :title="t('admin.backups.encryption.title')" :description="t('admin.backups.encryption.description')">
      <div class="flex max-w-xl flex-col gap-4 text-sm">
        <div class="flex items-center gap-2">
          <StatusPill :tone="status?.passphraseSet ? 'good' : 'warn'">{{ status?.passphraseSet ? t('admin.backups.encryption.on') : t('admin.backups.encryption.off') }}</StatusPill>
        </div>
        <p v-if="status && !status.passphraseSet" class="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{{ t('admin.backups.encryption.offWarning') }}</p>
        <form class="flex flex-col gap-1" @submit.prevent="savePassphrase">
          <label for="backup-passphrase">{{ status?.passphraseSet ? t('admin.backups.encryption.change') : t('admin.backups.encryption.set') }}</label>
          <div class="flex gap-2">
            <input id="backup-passphrase" v-model="newPassphrase" type="password" autocomplete="new-password" minlength="8" maxlength="256" :disabled="!ready" :class="inputClass" />
            <button type="submit" :class="buttonClass" class="shrink-0" :disabled="!ready || newPassphrase.length < 8 || isSavingPassphrase">{{ t('admin.backups.encryption.save') }}</button>
          </div>
          <span class="text-xs text-flixer-muted">{{ t('admin.backups.encryption.help') }}</span>
        </form>
        <div v-if="status?.passphraseSet">
          <button type="button" :class="quietButtonClass" :disabled="!ready" @click="removePassphrase">{{ t('admin.backups.encryption.remove') }}</button>
        </div>
      </div>
    </AdminSection>
  </div>
</template>
