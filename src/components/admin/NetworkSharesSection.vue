<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ListSkeleton from '../ui/ListSkeleton.vue'
import { deleteNetworkShare, listNetworkShares, reconnectNetworkShare, type NetworkShare } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { useLiveTopic } from '../../composables/useLive'
import AdminSection from './AdminSection.vue'
import NetworkShareModal from './NetworkShareModal.vue'
import StatusPill from './StatusPill.vue'

const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()

const shares = ref<NetworkShare[]>([])
const loading = ref(true)
const error = ref('')
const busyId = ref<string | null>(null)

const TONES = { connected: 'good', connecting: 'warn', error: 'bad' } as const

async function load() {
  try {
    shares.value = await listNetworkShares()
    error.value = ''
  } catch (err: unknown) {
    error.value = describeRequestError(err, t('admin.networkShares.loadError'))
  } finally {
    loading.value = false
  }
}

async function openForm(share: NetworkShare | null) {
  const saved = await openModal<boolean>(NetworkShareModal, { props: { share: share ?? undefined } }).catch(() => false)
  if (!saved) return
  await load()
  emit('changed')
}

async function reconnect(share: NetworkShare) {
  busyId.value = share.id
  try {
    const result = await reconnectNetworkShare(share.id)
    if (result.status === 'connected') notify.success(t('admin.networkShares.reconnected'))
    else notify.error(result.error || t('admin.networkShares.reconnectError'))
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.networkShares.reconnectError')))
  } finally {
    busyId.value = null
    await load()
    emit('changed')
  }
}

async function remove(share: NetworkShare) {
  if (!(await confirmAction(t('admin.networkShares.confirmDelete', { name: share.name }), { danger: true }))) return
  busyId.value = share.id
  try {
    await deleteNetworkShare(share.id)
    notify.success(t('admin.networkShares.deleted'))
  } catch (err: unknown) {
    notify.error(describeRequestError(err, t('admin.networkShares.deleteError')))
  } finally {
    busyId.value = null
    await load()
    emit('changed')
  }
}

onMounted(load)

const live = useLiveTopic<NetworkShare[]>('shares')
watch(live.data, (value) => {
  if (value) shares.value = value
})
</script>

<template>
  <AdminSection :title="t('admin.networkShares.title')" :description="t('admin.networkShares.description')">
    <template #actions>
      <button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80" @click="openForm(null)">{{ t('admin.networkShares.add') }}</button>
    </template>

    <p v-if="error" role="alert" class="mb-3 text-sm text-red-300">{{ error }}</p>

    <ul class="flex flex-col gap-3">
      <li v-for="share in shares" :key="share.id" class="rounded-lg border border-flixer-border bg-flixer-background/60 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold">
              {{ share.name }} <StatusPill :tone="TONES[share.status]" class="ml-2">{{ t(`admin.networkShares.status.${share.status}`) }}</StatusPill>
            </p>
            <p class="mt-1 truncate font-mono text-xs text-flixer-muted">smb://{{ share.host }}/{{ share.share }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" :disabled="busyId === share.id" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="reconnect(share)">{{ t('admin.networkShares.reconnect') }}</button>
            <button type="button" :disabled="busyId === share.id" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="openForm(share)">{{ t('admin.networkShares.manage') }}</button>
            <button type="button" :disabled="busyId === share.id" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50" @click="remove(share)">{{ t('admin.networkShares.delete') }}</button>
          </div>
        </div>
        <p v-if="share.status === 'error' && share.error" class="mt-2 text-xs text-red-300">{{ share.error }}</p>
      </li>
      <li v-if="loading && shares.length === 0" class="rounded-lg border border-flixer-border p-4"><ListSkeleton :rows="2" /></li>
      <li v-if="!loading && shares.length === 0 && !error" class="rounded-lg border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted">{{ t('admin.networkShares.empty') }}</li>
    </ul>
  </AdminSection>
</template>
