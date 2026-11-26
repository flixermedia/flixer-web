<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  disconnectCloud,
  getCloudStatus,
  startCloudConnect,
  syncCloudEntitlements,
  updateCloudSettings,
  type CloudEntitlementStatus,
} from '../../api/cloud'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const status = ref<CloudEntitlementStatus | null>(null)
const isLoading = ref(true)
const isBusy = ref(false)
const isSavingSettings = ref(false)

const primaryButton = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const secondaryButton = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-xs font-semibold text-flixer-text transition hover:bg-flixer-surface disabled:opacity-60'
const dangerButton = 'rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-60'

const activePlans = computed(() => status.value?.plans.filter((p) => p.active) ?? [])

const healthBadge = computed(() => {
  const s = status.value
  if (!s?.connected) return { label: t('admin.cloud.notConnected'), className: 'bg-flixer-surface text-flixer-muted' }
  if (s.stale) return { label: t('admin.cloud.statusStale'), className: 'bg-amber-500/20 text-amber-200' }
  if (s.lastError) return { label: t('admin.cloud.statusWarning'), className: 'bg-amber-500/20 text-amber-200' }
  return { label: t('admin.cloud.statusConnected'), className: 'bg-emerald-500/20 text-emerald-200' }
})

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

async function load() {
  isLoading.value = true
  try {
    const [error, data] = await catchError(getCloudStatus())
    if (error) {
      notify.error(describeRequestError(error, t('admin.cloud.loadFailed')))
    } else if (data) {
      status.value = data
    }
  } finally {
    isLoading.value = false
  }
}

async function connect() {
  isBusy.value = true
  try {
    const redirectUri = `${window.location.origin}/admin/cloud/callback`
    const [error, data] = await catchError(startCloudConnect(redirectUri))
    if (error) {
      notify.error(describeRequestError(error, t('admin.cloud.connectStartFailed')))
      return
    }
    if (data?.authorizeUrl) {
      window.location.assign(data.authorizeUrl)
    }
  } finally {
    isBusy.value = false
  }
}

async function syncNow() {
  isBusy.value = true
  try {
    const [error, data] = await catchError(syncCloudEntitlements())
    if (error) {
      notify.error(describeRequestError(error, t('admin.cloud.syncFailed')))
    } else if (data) {
      status.value = data
      if (data.lastError) {
        notify.error(data.lastError)
      } else {
        notify.success(t('admin.cloud.synced'))
      }
    }
  } finally {
    isBusy.value = false
  }
}

async function disconnect() {
  isBusy.value = true
  try {
    const [error, data] = await catchError(disconnectCloud())
    if (error) {
      notify.error(describeRequestError(error, t('admin.cloud.disconnectFailed')))
    } else if (data) {
      status.value = data
      notify.success(t('admin.cloud.disconnected'))
    }
  } finally {
    isBusy.value = false
  }
}

async function toggleAutoSync(enabled: boolean) {
  if (!status.value) return
  isSavingSettings.value = true
  try {
    const [error, data] = await catchError(updateCloudSettings({ autoSyncEnabled: enabled }))
    if (error) {
      notify.error(describeRequestError(error, t('admin.cloud.settingsSaveFailed')))
    } else if (data) {
      status.value = data
      notify.success(enabled ? t('admin.cloud.autoSyncEnabled') : t('admin.cloud.autoSyncDisabled'))
    }
  } finally {
    isSavingSettings.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection
      :title="t('admin.cloud.connectionTitle')"
      :description="t('admin.cloud.connectionDescription')"
    >
      <template #actions>
        <template v-if="status?.connected">
          <a
            :href="`${status.cloudWebUrl}/account`"
            target="_blank"
            rel="noopener noreferrer"
            :class="secondaryButton"
          >
            {{ t('admin.cloud.manageOnCloud') }}
          </a>
          <button type="button" :class="secondaryButton" :disabled="isLoading || isBusy" @click="syncNow">
            {{ t('admin.cloud.syncNow') }}
          </button>
          <button type="button" :class="dangerButton" :disabled="isLoading || isBusy" @click="disconnect">
            {{ t('admin.cloud.disconnect') }}
          </button>
        </template>
        <button v-else type="button" :class="primaryButton" :disabled="isLoading || isBusy" @click="connect">
          {{ t('admin.cloud.connectAccount') }}
        </button>
      </template>

      <AdminSkeleton v-if="isLoading" variant="fields" :rows="3" />

      <div v-else class="grid gap-4 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-background px-3 py-2.5">
          <div>
            <div class="font-semibold text-flixer-text">
              <template v-if="status?.connected">
                {{ status.account?.displayName || status.account?.email || t('admin.cloud.connectedAccountFallback') }}
              </template>
              <template v-else>
                {{ t('admin.cloud.notConnected') }}
              </template>
            </div>
            <div v-if="status?.connected && status.account?.email" class="text-flixer-muted">
              {{ status.account.email }}
            </div>
            <div v-else-if="!status?.connected" class="text-flixer-muted">
              {{ t('admin.cloud.notConnectedHint') }}
            </div>
          </div>
          <span class="rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide" :class="healthBadge.className">
            {{ healthBadge.label }}
          </span>
        </div>

        <div v-if="status?.lastError" class="flex flex-wrap items-center justify-between gap-2 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-200">
          <span>{{ t('admin.cloud.lastSyncError', { error: status.lastError }) }}</span>
          <button v-if="status.connected" type="button" :class="secondaryButton" :disabled="isBusy" @click="syncNow">
            {{ t('admin.cloud.retrySync') }}
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2">
            <div class="text-flixer-muted">{{ t('admin.cloud.instanceId') }}</div>
            <div class="mt-0.5 truncate font-mono text-[11px] text-flixer-text">
              {{ status?.instanceId || t('admin.cloud.generatedOnFirstConnect') }}
            </div>
          </div>
          <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2">
            <div class="text-flixer-muted">{{ t('admin.cloud.linkId') }}</div>
            <div class="mt-0.5 truncate font-mono text-[11px] text-flixer-text">
              {{ status?.linkId || '—' }}
            </div>
          </div>
        </div>
      </div>
    </AdminSection>

    <AdminSection
      :title="t('admin.cloud.membershipsTitle')"
      :description="t('admin.cloud.membershipsDescription')"
    >
      <template #actions>
        <a
          v-if="status?.cloudWebUrl"
          :href="`${status.cloudWebUrl}/memberships`"
          target="_blank"
          rel="noopener noreferrer"
          :class="secondaryButton"
        >
          {{ t('admin.cloud.viewPlans') }}
        </a>
      </template>

      <AdminSkeleton v-if="isLoading" variant="fields" :rows="2" />

      <div v-else-if="!status?.connected" class="text-xs text-flixer-muted">
        {{ t('admin.cloud.connectToView') }}
      </div>

      <div v-else class="grid gap-4 text-xs">
        <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2.5">
          <div class="font-semibold text-flixer-text">{{ t('admin.cloud.activeEntitlements') }}</div>
          <p v-if="activePlans.length === 0" class="mt-1 text-flixer-muted">
            {{ t('admin.cloud.noActiveEntitlements') }}
          </p>
          <div v-else class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="plan in activePlans"
              :key="plan.id"
              class="rounded border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200"
            >
              {{ plan.name }} ({{ plan.id }})
            </span>
          </div>
        </div>

        <div v-if="status.plans.length > 0">
          <div class="mb-2 font-semibold text-flixer-text">{{ t('admin.cloud.allSyncedPlans') }}</div>
          <ul class="grid gap-2">
            <li
              v-for="plan in status.plans"
              :key="plan.id"
              class="flex flex-wrap items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-background px-3 py-2.5"
            >
              <div>
                <span class="font-semibold text-flixer-text">{{ plan.name }}</span>
                <span class="ml-2 font-mono text-[11px] text-flixer-muted">{{ plan.id }}</span>
                <div class="mt-0.5 text-flixer-muted">
                  {{ plan.kind === 'one_time' ? t('admin.cloud.oneTimePass') : t('admin.cloud.subscription') }}
                  <template v-if="plan.currentPeriodEnd">
                    · {{ plan.cancelAtPeriodEnd ? t('admin.cloud.ends') : t('admin.cloud.renews') }} {{ formatDate(plan.currentPeriodEnd) }}
                  </template>
                </div>
              </div>
              <span
                class="rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                :class="plan.active ? 'bg-emerald-500/20 text-emerald-200' : 'bg-flixer-surface text-flixer-muted'"
              >
                {{ plan.status }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </AdminSection>

    <AdminSection
      :title="t('admin.cloud.syncBehaviorTitle')"
      :description="t('admin.cloud.syncBehaviorDescription')"
    >
      <AdminSkeleton v-if="isLoading" variant="fields" :rows="2" />

      <div v-else class="grid gap-4 text-xs">
        <AdminToggle
          :model-value="status?.autoSyncEnabled ?? true"
          :disabled="isSavingSettings"
          :label="t('admin.cloud.autoSyncToggle')"
          @update:model-value="toggleAutoSync"
        />
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2">
            <div class="text-flixer-muted">{{ t('admin.cloud.lastSuccessfulSync') }}</div>
            <div class="mt-0.5 text-flixer-text">{{ formatDate(status?.syncedAt ?? null) }}</div>
          </div>
          <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2">
            <div class="text-flixer-muted">{{ t('admin.cloud.lastSyncAttempt') }}</div>
            <div class="mt-0.5 text-flixer-text">{{ formatDate(status?.lastSyncAttemptAt ?? null) }}</div>
          </div>
          <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2">
            <div class="text-flixer-muted">{{ t('admin.cloud.offlineGracePeriod') }}</div>
            <div class="mt-0.5 text-flixer-text">{{ t('admin.cloud.graceDays', { days: status?.gracePeriodDays ?? 7 }) }}</div>
          </div>
        </div>
      </div>
    </AdminSection>
  </div>
</template>
