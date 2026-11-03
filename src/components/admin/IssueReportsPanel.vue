<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  addAdminIssueReportUpdate,
  deleteAdminIssueReport,
  getAdminIssueReport,
  listAdminIssueReports,
  setAdminIssueReportChat,
  setAdminIssueReportStatus,
  type IssueReport,
  type IssueReportStatus,
} from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { confirmAction } from '../../composables/confirm'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'

const { t } = useI18n()
const reports = ref<IssueReport[]>([])
const selected = ref<IssueReport | null>(null)
const loading = ref(true)
const error = ref('')
const updateText = ref('')
const internalNote = ref(false)
const busy = ref(false)
const filter = ref<'all' | IssueReportStatus>('all')

const statuses: IssueReportStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const filteredReports = () => filter.value === 'all' ? reports.value : reports.value.filter((report) => report.status === filter.value)
const formatDate = (date: string) => new Date(date).toLocaleString()

async function load() {
  loading.value = true
  const [failure, result] = await catchError(listAdminIssueReports())
  loading.value = false
  if (failure) {
    error.value = describeRequestError(failure)
    return
  }
  reports.value = result
  error.value = ''
}

async function selectReport(id: string) {
  const [failure, result] = await catchError(getAdminIssueReport(id))
  if (failure) {
    notify.error(describeRequestError(failure))
    return
  }
  selected.value = result
}

async function applyUpdate(update: () => Promise<IssueReport>, successMessage: string): Promise<boolean> {
  if (busy.value || !selected.value) return false
  busy.value = true
  try {
    const [failure, result] = await catchError(update())
    if (failure) {
      notify.error(describeRequestError(failure))
      return false
    }
    selected.value = result
    reports.value = reports.value.map((report) => report.id === result.id ? result : report).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    notify.success(successMessage)
    return true
  } finally {
    busy.value = false
  }
}

async function changeStatus(event: Event) {
  if (!selected.value) return
  const status = (event.target as HTMLSelectElement).value as IssueReportStatus
  await applyUpdate(() => setAdminIssueReportStatus(selected.value!.id, status), t('issues.statusSaved'))
}

async function sendUpdate() {
  const body = updateText.value.trim()
  if (!body || !selected.value) return
  const id = selected.value.id
  const saved = await applyUpdate(() => addAdminIssueReportUpdate(id, body, internalNote.value), t(internalNote.value ? 'issues.noteSaved' : 'issues.updateSaved'))
  if (saved && selected.value?.id === id) updateText.value = ''
}

async function toggleChat() {
  if (!selected.value) return
  const id = selected.value.id
  const open = !selected.value.chatOpen
  await applyUpdate(() => setAdminIssueReportChat(id, open), t(open ? 'issues.chatOpened' : 'issues.chatClosed'))
}

async function deleteReport() {
  const report = selected.value
  if (!report || report.status !== 'closed' || busy.value) return
  if (!(await confirmAction(t('issues.confirmDelete', { title: report.title }), { danger: true }))) return
  busy.value = true
  try {
    const [failure] = await catchError(deleteAdminIssueReport(report.id))
    if (failure) {
      notify.error(describeRequestError(failure))
      return
    }
    reports.value = reports.value.filter((item) => item.id !== report.id)
    selected.value = null
    notify.success(t('issues.reportDeleted'))
  } finally {
    busy.value = false
  }
}

onMounted(() => void load())
</script>

<template>
  <AdminSection :title="t('issues.adminTitle')" :description="t('issues.adminDescription')">
    <p v-if="error" class="mb-4 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ error }}</p>
    <div class="grid gap-5 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.5fr)]">
      <section class="min-w-0 overflow-hidden rounded border border-flixer-border">
        <div class="border-b border-flixer-border p-3">
          <label class="sr-only" for="issue-status-filter">{{ t('issues.filterStatus') }}</label>
          <select id="issue-status-filter" v-model="filter" class="w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white">
            <option value="all">{{ t('issues.allStatuses') }}</option>
            <option v-for="status in statuses" :key="status" :value="status">{{ t(`issues.status.${status}`) }}</option>
          </select>
        </div>
        <p v-if="loading" class="p-4 text-sm text-flixer-muted" role="status">{{ t('issues.loading') }}</p>
        <p v-else-if="!filteredReports().length" class="p-4 text-sm text-flixer-muted">{{ t('issues.noAdminReports') }}</p>
        <ul v-else class="max-h-[70vh] divide-y divide-flixer-border overflow-y-auto">
          <li v-for="report in filteredReports()" :key="report.id">
            <button type="button" class="w-full p-3 text-left transition hover:bg-white/5" :class="selected?.id === report.id ? 'bg-white/5' : ''" @click="selectReport(report.id)">
              <span class="flex items-start justify-between gap-2">
                <span class="min-w-0">
                  <span class="block truncate text-sm font-semibold text-white">{{ report.title }}</span>
                  <span class="mt-1 block truncate text-xs text-flixer-muted">{{ report.requester.displayName }} · {{ report.category }}</span>
                </span>
                <span class="shrink-0 rounded bg-white/10 px-2 py-1 text-[10px] text-flixer-text">{{ t(`issues.status.${report.status}`) }}</span>
              </span>
              <span class="mt-2 block text-[11px] text-flixer-muted">{{ formatDate(report.updatedAt) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="selected" class="min-w-0 rounded border border-flixer-border bg-flixer-background/40 p-4 sm:p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="break-words text-lg font-semibold text-white">{{ selected.title }}</h3>
            <p class="mt-1 text-sm text-flixer-muted">{{ selected.requester.displayName }} (@{{ selected.requester.username }}) · {{ selected.category }}</p>
            <p v-if="selected.mediaTitle" class="mt-1 text-sm text-flixer-muted">{{ t('issues.aboutMedia', { title: selected.mediaTitle }) }}</p>
          </div>
          <label class="flex items-center gap-2 text-xs text-flixer-muted">
            {{ t('issues.statusLabel') }}
            <select :value="selected.status" class="rounded border border-flixer-border bg-flixer-surface px-2 py-1.5 text-sm text-white" :disabled="busy" @change="changeStatus">
              <option v-for="status in statuses" :key="status" :value="status">{{ t(`issues.status.${status}`) }}</option>
            </select>
          </label>
        </div>
        <p class="mt-4 whitespace-pre-wrap rounded bg-white/5 p-3 text-sm leading-6 text-flixer-text">{{ selected.description }}</p>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" class="rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80 disabled:opacity-50" :disabled="busy" @click="toggleChat">
            {{ selected.chatOpen ? t('issues.closeLiveChat') : t('issues.openLiveChat') }}
          </button>
          <RouterLink v-if="selected.chatOpen && selected.chatConversationId" :to="{ name: 'chat', params: { id: selected.chatConversationId } }" class="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">{{ t('issues.openChat') }}</RouterLink>
          <button v-if="selected.status === 'closed'" type="button" class="rounded border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50" :disabled="busy" @click="deleteReport">{{ t('issues.deleteReport') }}</button>
        </div>

        <section class="mt-5">
          <h4 class="mb-3 font-semibold text-white">{{ t('issues.updates') }}</h4>
          <ol class="max-h-72 space-y-2 overflow-y-auto">
            <li v-for="update in selected.updates ?? []" :key="update.id" class="rounded border border-flixer-border bg-flixer-surface/50 p-3">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-flixer-muted">
                <span>{{ update.author?.displayName ?? t('issues.system') }}<span v-if="update.isInternal" class="ml-2 rounded bg-amber-400/10 px-1.5 py-0.5 text-amber-200">{{ t('issues.internalNote') }}</span></span>
                <time :datetime="update.createdAt">{{ formatDate(update.createdAt) }}</time>
              </div>
              <p class="mt-2 whitespace-pre-wrap text-sm text-flixer-text">{{ update.body }}</p>
            </li>
          </ol>
          <form class="mt-3 space-y-2" @submit.prevent="sendUpdate">
            <label class="block text-xs font-medium text-flixer-muted" for="issue-update">{{ internalNote ? t('issues.internalNote') : t('issues.publicUpdate') }}</label>
            <textarea id="issue-update" v-model="updateText" rows="3" maxlength="2000" class="w-full resize-y rounded border border-flixer-border bg-flixer-surface px-3 py-2 text-sm text-white outline-none focus:border-flixer-accent" />
            <div class="flex flex-wrap items-center justify-between gap-3">
              <label class="flex items-center gap-2 text-xs text-flixer-muted">
                <input v-model="internalNote" type="checkbox" class="accent-flixer-accent" />
                {{ t('issues.privateNote') }}
              </label>
              <button type="submit" class="rounded bg-white px-3 py-2 text-sm font-semibold text-flixer-background hover:bg-white/85 disabled:opacity-50" :disabled="busy || !updateText.trim()">
                {{ t('issues.addUpdate') }}
              </button>
            </div>
          </form>
        </section>
      </section>
      <div v-else class="grid min-h-48 place-items-center rounded border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted">
        {{ t('issues.selectTicket') }}
      </div>
    </div>
  </AdminSection>
</template>
