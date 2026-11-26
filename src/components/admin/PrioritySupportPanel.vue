<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePrioritySupportChat } from '../../composables/usePrioritySupportChat'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'

const { t } = useI18n()
const router = useRouter()
const {
  isOpen,
  status,
  messages,
  roomOpen,
  isLoadingStatus,
  isSyncing,
  isAttaching,
  isEndingChat,
  hasPrioritySupport,
  refreshStatus,
  syncNow,
  openChat,
  closeChat,
  endChat,
  fetchMessages,
  attachDiagnostics,
} = usePrioritySupportChat()

const primaryButton = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const secondaryButton = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-xs font-semibold text-flixer-text transition hover:bg-flixer-surface disabled:opacity-60'

const activeSupportPlans = computed(() =>
  (status.value?.plans ?? []).filter((p) => p.active && (p.features?.includes('priority_support') || p.id === 'priority_support')),
)

function goToCloudSetup() {
  void router.push({ name: 'admin', query: { tab: 'cloud' } })
}

onMounted(async () => {
  await refreshStatus()
  if (hasPrioritySupport.value) {
    await fetchMessages(true)
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection
      :title="t('admin.prioritySupport.title')"
      :description="t('admin.prioritySupport.description')"
    >
      <template #actions>
        <span
          v-if="hasPrioritySupport"
          class="rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
          :class="roomOpen ? 'bg-emerald-500/20 text-emerald-200' : 'bg-flixer-surface text-flixer-muted'"
        >
          {{ roomOpen ? t('admin.prioritySupport.sessionActive') : t('admin.prioritySupport.readyToStart') }}
        </span>
      </template>

      <AdminSkeleton v-if="isLoadingStatus && !status" variant="fields" :rows="3" />

      <div v-else-if="!status?.connected" class="rounded border border-flixer-border bg-flixer-background p-5 text-xs">
        <h3 class="text-sm font-semibold text-flixer-text">{{ t('admin.prioritySupport.connectTitle') }}</h3>
        <p class="mt-1.5 text-flixer-muted">
          {{ t('admin.prioritySupport.connectDescription') }}
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" :class="primaryButton" @click="goToCloudSetup">
            {{ t('admin.prioritySupport.goToCloudSetup') }}
          </button>
        </div>
      </div>

      <div v-else-if="!hasPrioritySupport" class="rounded border border-flixer-border bg-flixer-background p-5 text-xs">
        <h3 class="text-sm font-semibold text-flixer-text">{{ t('admin.prioritySupport.upgradeTitle') }}</h3>
        <p class="mt-1.5 text-flixer-muted">
          {{ t('admin.prioritySupport.upgradeDescription', { email: status.account?.email || 'flixer.dev' }) }}
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <a
            :href="`${status.cloudWebUrl}/memberships`"
            target="_blank"
            rel="noopener noreferrer"
            :class="primaryButton"
          >
            {{ t('admin.prioritySupport.upgradeAction') }}
          </a>
          <button type="button" :class="secondaryButton" :disabled="isSyncing" @click="syncNow">
            {{ isSyncing ? t('admin.prioritySupport.syncing') : t('admin.prioritySupport.syncNow') }}
          </button>
        </div>
      </div>

      <div v-else class="grid gap-4 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-background p-4">
          <div>
            <div class="text-sm font-semibold text-flixer-text">
              {{ roomOpen ? t('admin.prioritySupport.activeSessionHeading') : t('admin.prioritySupport.startSessionHeading') }}
            </div>
            <p class="mt-1 text-flixer-muted">
              {{ t('admin.prioritySupport.linkedAs', { name: status.account?.displayName || status.account?.email || 'flixer.dev' }) }}
              <template v-if="activeSupportPlans.length > 0">
                · {{ t('admin.prioritySupport.coveredBy', { plans: activeSupportPlans.map((p) => p.name).join(', ') }) }}
              </template>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="!isOpen"
              type="button"
              :class="primaryButton"
              @click="openChat()"
            >
              {{ roomOpen || messages.length > 0 ? t('admin.prioritySupport.openChat') : t('admin.prioritySupport.startChat') }}
            </button>
            <button
              v-else
              type="button"
              :class="secondaryButton"
              @click="closeChat"
            >
              {{ t('admin.prioritySupport.closeChat') }}
            </button>
            <button
              v-if="roomOpen"
              type="button"
              class="rounded border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-60"
              :disabled="isEndingChat"
              :title="t('admin.prioritySupport.endChatTitle')"
              @click="endChat"
            >
              {{ isEndingChat ? t('admin.prioritySupport.endingChat') : t('admin.prioritySupport.endChat') }}
            </button>
            <button
              type="button"
              :class="secondaryButton"
              :disabled="isAttaching"
              @click="attachDiagnostics(true)"
            >
              {{ isAttaching ? t('admin.prioritySupport.gathering') : t('admin.prioritySupport.sendWithDiagnostics') }}
            </button>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2.5">
            <div class="text-flixer-muted">{{ t('admin.prioritySupport.queueLabel') }}</div>
            <div class="mt-0.5 font-semibold text-flixer-text">{{ t('admin.prioritySupport.queueValue') }}</div>
          </div>
          <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2.5">
            <div class="text-flixer-muted">{{ t('admin.prioritySupport.messagesCountLabel') }}</div>
            <div class="mt-0.5 font-semibold text-flixer-text">{{ messages.length }}</div>
          </div>
          <div class="rounded border border-flixer-border bg-flixer-background px-3 py-2.5">
            <div class="text-flixer-muted">{{ t('admin.prioritySupport.floatingWindowLabel') }}</div>
            <div class="mt-0.5 font-semibold text-flixer-text">{{ isOpen ? t('admin.prioritySupport.floatingOpen') : t('admin.prioritySupport.floatingClosed') }}</div>
          </div>
        </div>
      </div>
    </AdminSection>
  </div>
</template>
