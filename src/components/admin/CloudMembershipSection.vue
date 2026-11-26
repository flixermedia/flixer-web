<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  disconnectCloud,
  getCloudStatus,
  startCloudConnect,
  syncCloudEntitlements,
  type CloudEntitlementStatus,
} from '../../api/cloud'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'

const status = ref<CloudEntitlementStatus | null>(null)
const isLoading = ref(true)
const isBusy = ref(false)

const primaryButton = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const secondaryButton = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-xs font-semibold text-flixer-text transition hover:bg-flixer-surface disabled:opacity-60'
const dangerButton = 'rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-60'

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
      notify.error(describeRequestError(error, 'Could not load Flixer Cloud status.'))
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
      notify.error(describeRequestError(error, 'Could not start Flixer Cloud connection.'))
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
      notify.error(describeRequestError(error, 'Could not sync Flixer Cloud memberships.'))
    } else if (data) {
      status.value = data
      if (data.lastError) {
        notify.error(data.lastError)
      } else {
        notify.success('Flixer Cloud memberships synced.')
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
      notify.error(describeRequestError(error, 'Could not disconnect Flixer Cloud.'))
    } else if (data) {
      status.value = data
      notify.success('Disconnected from Flixer Cloud.')
    }
  } finally {
    isBusy.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminSection
    title="Flixer Cloud"
    description="Link this server to your flixer.dev account to sync active memberships and entitlements."
  >
    <template #actions>
      <template v-if="status?.connected">
        <button type="button" :class="secondaryButton" :disabled="isLoading || isBusy" @click="syncNow">
          Sync now
        </button>
        <button type="button" :class="dangerButton" :disabled="isLoading || isBusy" @click="disconnect">
          Disconnect
        </button>
      </template>
      <button v-else type="button" :class="primaryButton" :disabled="isLoading || isBusy" @click="connect">
        Connect flixer.dev Account
      </button>
    </template>

    <AdminSkeleton v-if="isLoading" variant="fields" :rows="2" />

    <div v-else-if="!status?.connected" class="text-xs text-flixer-muted">
      <p>
        Not connected. Connect an administrator's
        <a
          v-if="status?.cloudWebUrl"
          :href="status.cloudWebUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-flixer-primary underline"
        >flixer.dev</a>
        <span v-else>flixer.dev</span>
        account to sync Priority Support and other Cloud memberships.
      </p>
      <p v-if="status?.lastError" class="mt-2 text-red-300">
        Last error: {{ status.lastError }}
      </p>
    </div>

    <div v-else class="grid gap-4 text-xs">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-background px-3 py-2.5">
        <div>
          <div class="font-semibold text-flixer-text">
            {{ status.account?.displayName || status.account?.email || 'Connected Account' }}
          </div>
          <div v-if="status.account?.email" class="text-flixer-muted">
            {{ status.account.email }}
          </div>
        </div>
        <div class="text-right text-flixer-muted">
          <div>Last synced: {{ formatDate(status.syncedAt) }}</div>
          <div v-if="status.stale" class="font-semibold text-amber-300">
            Offline grace period expired — sync required
          </div>
        </div>
      </div>

      <p v-if="status.lastError" class="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-200">
        Last sync warning: {{ status.lastError }}
      </p>

      <div>
        <div class="mb-2 font-semibold text-flixer-text">Synced Memberships</div>
        <p v-if="status.plans.length === 0" class="text-flixer-muted">
          No active or past memberships found on this flixer.dev account.
        </p>
        <ul v-else class="grid gap-2">
          <li
            v-for="plan in status.plans"
            :key="plan.id"
            class="flex flex-wrap items-center justify-between gap-2 rounded border border-flixer-border bg-flixer-background px-3 py-2"
          >
            <div>
              <span class="font-semibold text-flixer-text">{{ plan.name }}</span>
              <span class="ml-2 text-flixer-muted">({{ plan.id }})</span>
              <div v-if="plan.currentPeriodEnd" class="text-flixer-muted">
                {{ plan.cancelAtPeriodEnd ? 'Ends' : 'Renews' }}: {{ formatDate(plan.currentPeriodEnd) }}
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
</template>
