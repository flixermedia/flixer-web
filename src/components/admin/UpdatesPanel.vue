<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyUpdates, getUpdateStatus, listSettings, updateSetting, type UpdateComponent, type UpdateStatus } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import StatusPill from './StatusPill.vue'

const POLL_MS = 4000

const { t, locale } = useI18n()

const status = ref<UpdateStatus | null>(null)
const isChecking = ref(false)
const isApplying = ref(false)
const checkEnabled = ref(true)
const autoUpdate = ref(false)
const updaterUrl = ref('')
const savedUrl = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
let unmounted = false

const running = computed(() => status.value?.run?.status === 'running')
const canUpdate = computed(() => Boolean(status.value?.canApply) && (status.value?.updatesAvailable ?? 0) > 0 && !running.value && !isApplying.value)

const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none transition focus:border-flixer-accent'
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

function tone(component: UpdateComponent) {
  if (!component.reachable) return 'bad'
  return component.updateAvailable ? 'warn' : 'good'
}

function label(component: UpdateComponent) {
  if (!component.reachable) return t('admin.updates.unreachable')
  if (!component.latest) return t('admin.updates.unknown')
  return component.updateAvailable ? t('admin.updates.available') : t('admin.updates.upToDate')
}

function formatTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' }) : t('admin.updates.never')
}

function formatSize(bytes: number) {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// While an update runs the API restarts, so polling must keep going through failed requests.
function schedulePoll() {
  clearTimeout(timer)
  if (unmounted || !running.value) return
  timer = setTimeout(async () => {
    await load(false, true)
    schedulePoll()
  }, POLL_MS)
}

async function load(refresh = false, quiet = false) {
  try {
    status.value = await getUpdateStatus(refresh)
  } catch (error) {
    if (!quiet) notify.error(describeRequestError(error))
  }
}

async function check() {
  isChecking.value = true
  await load(true)
  isChecking.value = false
  if (status.value?.updatesAvailable === 0) notify.success(t('admin.updates.allCurrent'))
}

async function updateAll() {
  if (!window.confirm(t('admin.updates.confirm'))) return
  isApplying.value = true
  try {
    await applyUpdates()
    notify.success(t('admin.updates.started'))
    await load(false, true)
    schedulePoll()
  } catch (error) {
    notify.error(describeRequestError(error))
  } finally {
    isApplying.value = false
  }
}

async function save(key: string, value: unknown, revert: () => void) {
  try {
    await updateSetting(key, value)
  } catch (error) {
    revert()
    notify.error(describeRequestError(error))
  }
}

function setCheck(value: boolean) {
  const previous = checkEnabled.value
  checkEnabled.value = value
  void save('updates_check_enabled', value, () => (checkEnabled.value = previous))
}

function setAuto(value: boolean) {
  const previous = autoUpdate.value
  autoUpdate.value = value
  void save('updates_auto_update', value, () => (autoUpdate.value = previous))
}

async function saveUrl() {
  try {
    await updateSetting('updates_updater_url', updaterUrl.value.trim())
    savedUrl.value = updaterUrl.value.trim()
    notify.success(t('admin.updates.settings.save'))
  } catch (error) {
    notify.error(describeRequestError(error))
  }
}

onMounted(async () => {
  await load(false)
  schedulePoll()
  try {
    const settings = await listSettings()
    const value = (key: string) => settings.find((setting) => setting.key === key)?.value
    checkEnabled.value = value('updates_check_enabled') !== false
    autoUpdate.value = value('updates_auto_update') === true
    const url = value('updates_updater_url')
    updaterUrl.value = savedUrl.value = typeof url === 'string' ? url : ''
  } catch (error) {
    notify.error(describeRequestError(error))
  }
})

onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(timer)
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.updates.title')" :description="t('admin.updates.description')">
      <template #actions>
        <button type="button" class="rounded bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60" :disabled="isChecking || running" @click="check">
          {{ isChecking ? t('admin.updates.checking') : t('admin.updates.check') }}
        </button>
        <button type="button" :class="buttonClass" :disabled="!canUpdate" @click="updateAll">
          {{ running || isApplying ? t('admin.updates.updating') : t('admin.updates.updateAll') }}
        </button>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs uppercase tracking-wide text-flixer-muted">
            <tr>
              <th class="py-2 pr-4 font-medium">{{ t('admin.updates.component') }}</th>
              <th class="py-2 pr-4 font-medium">{{ t('admin.updates.installed') }}</th>
              <th class="py-2 pr-4 font-medium">{{ t('admin.updates.latest') }}</th>
              <th class="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-flixer-border">
            <tr v-for="component in status?.components ?? []" :key="component.id">
              <td class="py-2.5 pr-4 font-medium">{{ component.label }}</td>
              <td class="py-2.5 pr-4 font-mono text-xs">{{ component.installed ?? '—' }}</td>
              <td class="py-2.5 pr-4 font-mono text-xs">{{ component.latest ?? '—' }}</td>
              <td class="py-2.5 text-right"><StatusPill :tone="tone(component)">{{ label(component) }}</StatusPill></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="status" class="mt-3 text-xs text-flixer-muted">{{ t('admin.updates.lastChecked', { time: formatTime(status.lastCheckedAt) }) }}</p>
      <p v-if="status && !status.canApply" class="mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{{ t('admin.updates.notConfigured') }}</p>
      <p v-else-if="status && !status.updaterReachable" class="mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{{ t('admin.updates.unreachable') }}</p>

      <div v-if="status?.run" class="mt-4 rounded border px-3 py-2 text-sm" :class="status.run.status === 'failed' || status.run.status === 'rollback_failed' ? 'border-red-500/40 bg-red-500/10' : status.run.status === 'rolled_back' ? 'border-amber-500/40 bg-amber-500/10' : status.run.status === 'running' ? 'border-flixer-accent/40 bg-flixer-accent/10' : 'border-emerald-500/30 bg-emerald-500/10'">
        <p v-if="status.run.status === 'running'">{{ t('admin.updates.run.running') }} {{ t(`admin.updates.run.steps.${status.run.step.split(':')[0]}`, { component: status.run.step.split(':')[1] ?? '' }) }}</p>
        <p v-else-if="status.run.status === 'succeeded'">{{ t('admin.updates.run.succeeded') }}</p>
        <p v-else-if="status.run.status === 'rolled_back'">{{ t('admin.updates.run.rolledBack', { error: status.run.error ?? '' }) }}</p>
        <p v-else-if="status.run.status === 'rollback_failed'">{{ t('admin.updates.run.rollbackFailed', { error: status.run.error ?? '' }) }}</p>
        <p v-else>{{ t('admin.updates.run.failed', { error: status.run.error ?? '' }) }}</p>
        <p v-if="status.run.backup" class="mt-1 text-xs text-flixer-muted">{{ t('admin.updates.run.backup', { name: status.run.backup }) }}</p>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.updates.settings.title')">
      <div class="flex max-w-xl flex-col gap-4">
        <div class="flex flex-col divide-y divide-flixer-border">
          <AdminToggle :model-value="checkEnabled" :label="t('admin.updates.settings.check')" :description="t('admin.updates.settings.checkHelp')" @update:model-value="setCheck" />
          <AdminToggle :model-value="autoUpdate" :label="t('admin.updates.settings.auto')" :description="t('admin.updates.settings.autoHelp')" @update:model-value="setAuto" />
        </div>
        <form class="flex flex-col gap-1 text-sm" @submit.prevent="saveUrl">
          <label for="updater-url">{{ t('admin.updates.settings.url') }}</label>
          <div class="flex gap-2">
            <input id="updater-url" v-model="updaterUrl" placeholder="http://updater:8093" :class="inputClass" />
            <button type="submit" :class="buttonClass" class="shrink-0" :disabled="updaterUrl.trim() === savedUrl">{{ t('admin.updates.settings.save') }}</button>
          </div>
          <span class="text-xs text-flixer-muted">{{ t('admin.updates.settings.urlHelp') }}</span>
        </form>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.updates.backups.title')" :description="t('admin.updates.backups.help')">
      <p v-if="!status?.backups.length" class="text-sm text-flixer-muted">{{ t('admin.updates.backups.empty') }}</p>
      <ul v-else class="divide-y divide-flixer-border text-sm">
        <li v-for="backup in status.backups" :key="backup.name" class="flex items-center justify-between gap-3 py-2">
          <span class="truncate font-mono text-xs">{{ backup.name }}</span>
          <span class="shrink-0 text-xs text-flixer-muted">{{ formatSize(backup.sizeBytes) }} · {{ formatTime(backup.createdAt) }}</span>
        </li>
      </ul>
    </AdminSection>
  </div>
</template>
