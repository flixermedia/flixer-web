<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { SupportTicket } from '../../api/cloud'
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
  tickets,
  isLoadingTickets,
  isSubmittingTicket,
  deletingTicketId,
  refreshStatus,
  syncNow,
  openChat,
  closeChat,
  endChat,
  fetchMessages,
  attachDiagnostics,
  loadTickets,
  openTicketThread,
  submitNewTicket,
  removeTicket,
} = usePrioritySupportChat()

const showNewTicket = ref(false)
const newSubject = ref('')
const newCategory = ref('general')
const newMessage = ref('')
const openingTicketId = ref<string | null>(null)

async function handleCreateTicket() {
  if (!newSubject.value.trim() || !newMessage.value.trim()) return
  const created = await submitNewTicket(newSubject.value.trim(), newMessage.value.trim(), newCategory.value)
  if (created) {
    newSubject.value = ''
    newMessage.value = ''
    showNewTicket.value = false
    if (created.conversationId) {
      await router.push({ name: 'chat', params: { id: created.conversationId } })
    }
  }
}

async function selectTicket(ticket: SupportTicket) {
  if (ticket.conversationId) {
    await router.push({ name: 'chat', params: { id: ticket.conversationId } })
    return
  }
  openingTicketId.value = ticket.id
  try {
    const res = await openTicketThread(ticket.id)
    const conversationId = res.conversationId ?? res.ticket.conversationId
    if (conversationId) {
      ticket.conversationId = conversationId
      await router.push({ name: 'chat', params: { id: conversationId } })
    }
  } finally {
    openingTicketId.value = null
  }
}

async function handleDeleteTicket(ticket: SupportTicket) {
  await removeTicket(ticket.id)
}

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
    await Promise.all([fetchMessages(true), loadTickets()])
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

        <div class="mt-2 rounded border border-flixer-border bg-flixer-background p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-sm font-semibold text-flixer-text">Support Tickets</div>
              <p class="mt-0.5 text-flixer-muted">Open a ticket and a member of our team will get back to you shortly.</p>
            </div>
            <button type="button" :class="primaryButton" @click="showNewTicket = !showNewTicket">
              {{ showNewTicket ? 'Cancel' : '+ New Ticket' }}
            </button>
          </div>

          <form v-if="showNewTicket" class="mt-4 grid gap-3 border-t border-flixer-border pt-4" @submit.prevent="handleCreateTicket">
            <input
              v-model="newSubject"
              type="text"
              maxlength="160"
              placeholder="Subject"
              class="rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-xs text-flixer-text"
              required
            />
            <select v-model="newCategory" class="rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-xs text-flixer-text">
              <option value="general">General</option>
              <option value="playback">Playback</option>
              <option value="server">Server</option>
              <option value="billing">Billing</option>
              <option value="other">Other</option>
            </select>
            <textarea
              v-model="newMessage"
              rows="3"
              maxlength="2000"
              placeholder="Describe your issue…"
              class="rounded border border-flixer-border bg-flixer-surface p-3 text-xs text-flixer-text"
              required
            ></textarea>
            <div class="flex justify-end">
              <button type="submit" :class="primaryButton" :disabled="isSubmittingTicket">
                {{ isSubmittingTicket ? 'Submitting…' : 'Submit Ticket' }}
              </button>
            </div>
          </form>

          <div v-if="isLoadingTickets" class="mt-4 text-flixer-muted">Loading tickets…</div>
          <div v-else-if="tickets.length === 0" class="mt-4 text-flixer-muted">No support tickets submitted yet.</div>
          <div v-else class="mt-4 flex flex-col gap-2">
            <div
              v-for="ticket in tickets"
              :key="ticket.id"
              class="flex w-full items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-surface px-3 py-2.5 transition hover:border-flixer-primary/60"
            >
              <button
                type="button"
                class="min-w-0 flex-1 text-left"
                :disabled="openingTicketId === ticket.id"
                @click="selectTicket(ticket)"
              >
                <div class="truncate font-semibold text-flixer-text">{{ ticket.subject }}</div>
                <div class="mt-0.5 text-[11px] text-flixer-muted">{{ ticket.category }} · Open in Chat</div>
              </button>
              <div class="flex shrink-0 items-center gap-2">
                <span class="rounded border border-flixer-border bg-flixer-background px-2 py-0.5 text-[10px] font-semibold uppercase text-flixer-text">
                  {{ ticket.status.replaceAll('_', ' ') }}
                </span>
                <button
                  type="button"
                  class="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  :disabled="deletingTicketId === ticket.id"
                  @click.stop="handleDeleteTicket(ticket)"
                >
                  {{ deletingTicketId === ticket.id ? 'Deleting…' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminSection>
  </div>
</template>
