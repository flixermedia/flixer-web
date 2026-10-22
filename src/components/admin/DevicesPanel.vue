<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createApiKey, listApiKeys, listDevices, revokeApiKey, signOutDevice, type AdminDevice, type ApiKeyInfo, type CreatedApiKey } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { useLiveTopic } from '../../composables/useLive'
import AdminSection from './AdminSection.vue'
import StatusPill from './StatusPill.vue'

const { t, locale } = useI18n()

const devices = ref<AdminDevice[]>([])
const apiKeys = ref<ApiKeyInfo[]>([])
const devicesError = ref('')
const keysError = ref('')
const signingOutId = ref<string | null>(null)
const revokingId = ref<string | null>(null)
const creating = ref(false)
const showForm = ref(false)
const newKeyName = ref('')
const createdKey = ref<CreatedApiKey | null>(null)

async function loadDevices() {
  try {
    devices.value = await listDevices()
    devicesError.value = ''
  } catch (error: unknown) {
    devicesError.value = describeRequestError(error, t('admin.devices.loadError'))
  }
}

async function loadKeys() {
  try {
    apiKeys.value = await listApiKeys()
    keysError.value = ''
  } catch (error: unknown) {
    keysError.value = describeRequestError(error, t('admin.devices.keysLoadError'))
  }
}

async function signOut(device: AdminDevice) {
  if (!(await confirmAction(t('admin.devices.confirmSignOut', { device: `${device.app} · ${device.device}`, name: device.user.displayName }), { danger: true }))) return
  signingOutId.value = device.id
  try {
    await signOutDevice(device.id)
    notify.success(t('admin.devices.signOutSuccess'))
  } catch (error: unknown) {
    notify.error(describeRequestError(error, t('admin.devices.signOutError')))
  } finally {
    signingOutId.value = null
    await loadDevices()
  }
}

async function create() {
  const name = newKeyName.value.trim()
  if (!name || creating.value) return
  creating.value = true
  try {
    createdKey.value = await createApiKey(name)
    newKeyName.value = ''
    showForm.value = false
    await loadKeys()
  } catch (error: unknown) {
    notify.error(describeRequestError(error, t('admin.devices.createError')))
  } finally {
    creating.value = false
  }
}

async function revoke(key: ApiKeyInfo) {
  if (!(await confirmAction(t('admin.devices.confirmRevoke', { name: key.name }), { danger: true }))) return
  revokingId.value = key.id
  try {
    await revokeApiKey(key.id)
    if (createdKey.value?.id === key.id) createdKey.value = null
    notify.success(t('admin.devices.revokeSuccess'))
  } catch (error: unknown) {
    notify.error(describeRequestError(error, t('admin.devices.revokeError')))
  } finally {
    revokingId.value = null
    await loadKeys()
  }
}

async function copySecret() {
  if (!createdKey.value) return
  try {
    await navigator.clipboard.writeText(createdKey.value.secret)
    notify.success(t('admin.devices.copied'))
  } catch {
    notify.error(t('admin.devices.copyError'))
  }
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

function relativeTime(iso: string | null) {
  if (!iso) return t('admin.devices.never')
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  if (Math.abs(seconds) < 60) return t('admin.devices.justNow')
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? UNITS[2]
  return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(Math.round(seconds / size), unit)
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale.value, { dateStyle: 'medium' })

onMounted(() => {
  void loadDevices()
  void loadKeys()
})

const liveDevices = useLiveTopic<AdminDevice[]>('devices')
watch(liveDevices.data, (value) => {
  if (value) devices.value = value
})

</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.devices.title')" :description="t('admin.devices.description')">
      <p v-if="devicesError" role="alert" class="mb-3 text-sm text-red-300">{{ devicesError }}</p>
      <div class="overflow-x-auto">
        <table class="w-full min-w-160 text-left text-sm">
          <thead class="text-xs text-flixer-muted">
            <tr>
              <th class="pb-2 font-medium">{{ t('admin.devices.device') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.devices.app') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.devices.user') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.devices.ipAddress') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.devices.lastSeen') }}</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in devices" :key="d.id" class="border-t border-flixer-border">
              <td class="py-3 font-medium">{{ d.device }}</td>
              <td class="text-flixer-muted">{{ d.app }}</td>
              <td class="text-flixer-muted">{{ d.user.username }}</td>
              <td class="font-mono text-xs text-flixer-muted">{{ d.ipAddress ?? '—' }}</td>
              <td class="text-flixer-muted">{{ relativeTime(d.lastSeenAt) }}</td>
              <td class="text-right">
                <StatusPill v-if="d.current" tone="accent">{{ t('admin.devices.thisDevice') }}</StatusPill>
                <button v-else type="button" :disabled="signingOutId === d.id" class="rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="signOut(d)">
                  {{ t('admin.devices.signOut') }}
                </button>
              </td>
            </tr>
            <tr v-if="devices.length === 0 && !devicesError">
              <td colspan="6" class="border-t border-flixer-border py-6 text-center text-flixer-muted">{{ t('admin.devices.emptyDevices') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.devices.apiKeysTitle')" :description="t('admin.devices.apiKeysDescription')">
      <template #actions>
        <button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80" @click="showForm = !showForm">
          {{ t('admin.devices.newApiKey') }}
        </button>
      </template>

      <form v-if="showForm" class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="create">
        <label class="flex min-w-60 flex-1 flex-col gap-1 text-xs text-flixer-muted">
          {{ t('admin.devices.keyName') }}
          <input v-model="newKeyName" type="text" maxlength="100" required :placeholder="t('admin.devices.keyNamePlaceholder')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
        </label>
        <button type="submit" :disabled="creating || !newKeyName.trim()" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50">
          {{ t('admin.devices.createKey') }}
        </button>
      </form>

      <div v-if="createdKey" role="status" class="mb-4 rounded-lg border border-flixer-primary/50 bg-flixer-primary/10 p-4">
        <p class="text-sm font-semibold">{{ t('admin.devices.keyCreatedTitle', { name: createdKey.name }) }}</p>
        <p class="mt-1 text-xs text-flixer-muted">{{ t('admin.devices.keyCreatedWarning') }}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <code class="min-w-0 flex-1 break-all rounded bg-flixer-background px-3 py-2 font-mono text-xs">{{ createdKey.secret }}</code>
          <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="copySecret">
            {{ t('admin.devices.copy') }}
          </button>
          <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="createdKey = null">
            {{ t('admin.devices.done') }}
          </button>
        </div>
      </div>

      <p v-if="keysError" role="alert" class="mb-3 text-sm text-red-300">{{ keysError }}</p>
      <ul class="grid gap-2">
        <li v-for="k in apiKeys" :key="k.id" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-flixer-border bg-flixer-background/60 px-4 py-3">
          <div>
            <p class="text-sm font-semibold">{{ k.name }}</p>
            <p class="text-xs text-flixer-muted">
              <span class="font-mono">{{ k.prefix }}…</span> · {{ t('admin.devices.createdBy', { name: k.owner.displayName }) }} · {{ t('admin.devices.created') }} {{ formatDate(k.createdAt) }} · {{ t('admin.devices.used') }} {{ relativeTime(k.lastUsedAt) }}
            </p>
          </div>
          <button type="button" :disabled="revokingId === k.id" class="rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="revoke(k)">
            {{ t('admin.devices.revoke') }}
          </button>
        </li>
        <li v-if="apiKeys.length === 0 && !keysError" class="py-4 text-center text-sm text-flixer-muted">{{ t('admin.devices.emptyKeys') }}</li>
      </ul>
    </AdminSection>
  </div>
</template>
