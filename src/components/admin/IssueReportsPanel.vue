<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui-sdk/vue/select'
import { computed, onMounted, ref } from 'vue'
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
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import {
  capturePageScreenshotAttachment,
  readImageFilesAsAttachments,
  type IssueAttachmentDraft,
} from '../../utils/issueAttachments'
import { runOptimistic } from '../../utils/optimistic'
import AdminSection from './AdminSection.vue'

const { t } = useI18n()
const reports = ref<IssueReport[]>([])
const selected = ref<IssueReport | null>(null)
const loading = ref(true)
const error = ref('')
const updateText = ref('')
const internalNote = ref(false)
const attachments = ref<IssueAttachmentDraft[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const capturing = ref(false)
const busy = ref(false)
const searchQuery = ref('')
const filter = ref<'all' | IssueReportStatus>('all')

const statuses: IssueReportStatus[] = ['open', 'in_progress', 'resolved', 'closed']

const filteredReports = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return reports.value.filter((report) => {
    if (filter.value !== 'all' && report.status !== filter.value) return false
    if (!q) return true
    return (
      report.title.toLowerCase().includes(q) ||
      report.category.toLowerCase().includes(q) ||
      report.requester.displayName.toLowerCase().includes(q) ||
      report.requester.username.toLowerCase().includes(q)
    )
  })
})

const canSend = computed(
  () => Boolean(selected.value) && !busy.value && !capturing.value && (Boolean(updateText.value.trim()) || attachments.value.length > 0),
)

const formatDate = (date: string) => new Date(date).toLocaleString()
const formatShortTime = (date: string) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

function setFilter(value: string | null) {
  if (value !== null) filter.value = value as 'all' | IssueReportStatus
}

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
  if (!selected.value && result.length) {
    void selectReport(result[0].id)
  }
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
    reports.value = reports.value
      .map((report) => (report.id === result.id ? result : report))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
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

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  try {
    const remaining = Math.max(0, 4 - attachments.value.length)
    if (remaining === 0) {
      notify.error('Maximum 4 images allowed per update.')
      return
    }
    const added = await readImageFilesAsAttachments(files, remaining)
    attachments.value.push(...added)
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Unable to read selected image.')
  } finally {
    input.value = ''
  }
}

async function captureScreenshot() {
  if (capturing.value || attachments.value.length >= 4) return
  capturing.value = true
  try {
    const shot = await capturePageScreenshotAttachment()
    attachments.value.push(shot)
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Unable to capture screenshot.')
  } finally {
    capturing.value = false
  }
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1)
}

async function sendUpdate() {
  const body = updateText.value.trim()
  if (!selected.value || (!body && attachments.value.length === 0)) return
  const id = selected.value.id
  const pendingAttachments = attachments.value.length ? [...attachments.value] : undefined
  const saved = await applyUpdate(
    () => addAdminIssueReportUpdate(id, body, internalNote.value, pendingAttachments),
    t(internalNote.value ? 'issues.noteSaved' : 'issues.updateSaved'),
  )
  if (saved && selected.value?.id === id) {
    updateText.value = ''
    attachments.value = []
  }
}

function onComposerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void sendUpdate()
  }
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
  const res = await runOptimistic({
    key: `admin:issue:delete:${report.id}`,
    apply: () => {
      const prevReports = [...reports.value]
      const prevSelected = selected.value
      reports.value = reports.value.filter((item) => item.id !== report.id)
      selected.value = null
      return { prevReports, prevSelected }
    },
    commit: async () => {
      await deleteAdminIssueReport(report.id)
    },
    rollback: ({ prevReports, prevSelected }) => {
      reports.value = prevReports
      selected.value = prevSelected
    },
    onError: (failure) => {
      notify.error(describeRequestError(failure))
    },
  })
  if (res.ok) notify.success(t('issues.reportDeleted'))
}

onMounted(() => void load())
</script>

<template>
  <AdminSection :title="t('issues.adminTitle')" :description="t('issues.adminDescription')">
    <p v-if="error" class="mb-4 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ error }}</p>
    <div class="grid h-[74vh] min-h-[34rem] overflow-hidden rounded border border-flixer-border bg-flixer-background lg:grid-cols-[20rem_minmax(0,1fr)]">
      <!-- Left sidebar: search, filter, and issue list -->
      <aside
        class="flex min-h-0 flex-col border-flixer-border lg:border-r"
        :class="selected ? 'hidden lg:flex' : 'flex'"
      >
        <div class="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-flixer-border px-4">
          <div class="min-w-0">
            <h2 class="truncate text-base font-bold tracking-tight text-white">Issues</h2>
            <p class="truncate text-xs text-flixer-muted">{{ filteredReports.length }} reports</p>
          </div>
          <Select :value="filter" @value-change="setFilter">
            <SelectTrigger
              :aria-label="t('issues.filterStatus')"
              class="h-9 w-32 shrink-0 rounded border border-flixer-border bg-white/[0.06] px-2.5 text-xs text-white focus-visible:outline-2 focus-visible:outline-flixer-accent"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="max-h-64 rounded border border-flixer-border bg-flixer-surface p-1 text-xs text-flixer-text shadow-xl">
              <SelectItem value="all" class="cursor-pointer rounded px-2.5 py-1.5 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t('issues.allStatuses') }}</SelectItem>
              <SelectItem v-for="status in statuses" :key="status" :value="status" class="cursor-pointer rounded px-2.5 py-1.5 outline-none data-highlighted:bg-white/10 data-selected:bg-white/10">{{ t(`issues.status.${status}`) }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="shrink-0 border-b border-flixer-border p-3">
          <div class="flex items-center gap-2 rounded bg-white/[0.08] px-3 py-1.5 focus-within:ring-2 focus-within:ring-flixer-accent/40">
            <Icon icon="lucide:search" class="size-4 shrink-0 text-flixer-muted" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search issues..."
              class="w-full bg-transparent text-sm text-white placeholder:text-flixer-muted focus:outline-none"
            />
          </div>
        </div>

        <p v-if="loading" class="p-4 text-sm text-flixer-muted" role="status">{{ t('issues.loading') }}</p>
        <p v-else-if="!filteredReports.length" class="p-4 text-sm text-flixer-muted">{{ t('issues.noAdminReports') }}</p>
        <ul v-else class="min-h-0 flex-1 divide-y divide-flixer-border/60 overflow-y-auto p-2 space-y-1">
          <li v-for="report in filteredReports" :key="report.id" class="border-none">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded p-2.5 text-left transition hover:bg-white/[0.06]"
              :class="selected?.id === report.id ? 'bg-white/[0.09] ring-1 ring-white/10' : ''"
              @click="selectReport(report.id)"
            >
              <span class="relative grid size-10 shrink-0 place-items-center rounded bg-gradient-to-br from-flixer-accent/80 to-flixer-primary/80 text-white">
                <Icon icon="lucide:life-buoy" class="size-4.5" />
                <span
                  class="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-flixer-background"
                  :class="report.status === 'open' ? 'bg-emerald-400' : report.status === 'in_progress' ? 'bg-amber-400' : 'bg-zinc-400'"
                />
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-baseline justify-between gap-2">
                  <span class="truncate text-sm font-semibold text-white">{{ report.title }}</span>
                  <span class="shrink-0 text-[11px] text-flixer-muted">{{ formatShortTime(report.updatedAt) }}</span>
                </span>
                <span class="mt-0.5 flex items-center justify-between gap-2">
                  <span class="truncate text-xs text-flixer-muted">{{ report.requester.displayName }} · {{ report.category }}</span>
                  <span class="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-flixer-text">{{ t(`issues.status.${report.status}`) }}</span>
                </span>
              </span>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Right pane: chat-style issue thread & composer -->
      <section
        v-if="selected"
        class="flex min-h-0 flex-col bg-flixer-background"
        :class="selected ? 'flex' : 'hidden lg:flex'"
      >
        <header class="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-flixer-border bg-flixer-background/95 px-3 sm:px-4">
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 lg:hidden"
              aria-label="Back to issues"
              @click="selected = null"
            >
              <Icon icon="lucide:chevron-left" class="size-5" />
            </button>
            <span class="relative grid size-10 shrink-0 place-items-center rounded bg-gradient-to-br from-flixer-accent to-flixer-primary text-white">
              <Icon icon="lucide:life-buoy" class="size-4.5" />
            </span>
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-white">{{ selected.title }}</h3>
              <p class="truncate text-xs text-flixer-muted">
                {{ selected.requester.displayName }} ({{ selected.requester.username }}) · {{ selected.category }}
                <template v-if="selected.mediaTitle"> · {{ selected.mediaTitle }}</template>
              </p>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-1.5">
            <select
              :value="selected.status"
              :aria-label="t('issues.statusLabel')"
              class="h-9 rounded border border-flixer-border bg-white/[0.06] px-2.5 text-xs font-medium text-white outline-none focus:border-flixer-accent"
              :disabled="busy"
              @change="changeStatus"
            >
              <option v-for="status in statuses" :key="status" :value="status" class="bg-flixer-surface">{{ t(`issues.status.${status}`) }}</option>
            </select>
            <button
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded bg-flixer-primary px-3 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              :disabled="busy"
              @click="toggleChat"
            >
              <Icon icon="lucide:message-square" class="size-3.5" />
              <span class="hidden sm:inline">{{ selected.chatOpen ? t('issues.closeLiveChat') : t('issues.openLiveChat') }}</span>
            </button>
            <RouterLink
              v-if="selected.chatOpen && selected.chatConversationId"
              :to="{ name: 'chat', params: { id: selected.chatConversationId } }"
              class="inline-flex h-9 items-center rounded border border-flixer-border bg-white/[0.06] px-3 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              {{ t('issues.openChat') }}
            </RouterLink>
            <button
              v-if="selected.status === 'closed'"
              type="button"
              class="grid size-9 place-items-center rounded border border-red-400/40 bg-red-500/10 text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
              :disabled="busy"
              :aria-label="t('issues.deleteReport')"
              :title="t('issues.deleteReport')"
              @click="deleteReport"
            >
              <Icon icon="lucide:trash-2" class="size-4" />
            </button>
          </div>
        </header>

        <!-- Scrollable thread -->
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <!-- Initial issue report bubble -->
          <div class="rounded border border-flixer-border bg-white/[0.04] p-4">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-flixer-muted">
              <span class="font-semibold text-white">{{ selected.requester.displayName }}</span>
              <time :datetime="selected.createdAt">{{ formatDate(selected.createdAt) }}</time>
            </div>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-flixer-text">{{ selected.description }}</p>
            <div v-if="selected.attachments?.length" class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <a
                v-for="att in selected.attachments"
                :key="att.id"
                :href="att.dataUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block overflow-hidden rounded border border-flixer-border bg-flixer-background transition hover:border-flixer-accent"
              >
                <img :src="att.dataUrl" :alt="att.name" class="h-28 w-full object-cover" />
              </a>
            </div>
          </div>

          <!-- Updates timeline -->
          <div
            v-for="update in selected.updates ?? []"
            :key="update.id"
            class="rounded border p-3.5"
            :class="
              update.isInternal
                ? 'border-amber-400/30 bg-amber-500/[0.07]'
                : update.author?.username === selected.requester.username
                  ? 'border-flixer-border bg-white/[0.04]'
                  : 'border-flixer-accent/30 bg-flixer-accent/[0.08]'
            "
          >
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-flixer-muted">
              <span class="flex items-center gap-2 font-medium text-white">
                {{ update.author?.displayName ?? t('issues.system') }}
                <span v-if="update.isInternal" class="inline-flex items-center gap-1 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                  <Icon icon="lucide:lock" class="size-2.5" />
                  {{ t('issues.internalNote') }}
                </span>
              </span>
              <time :datetime="update.createdAt">{{ formatDate(update.createdAt) }}</time>
            </div>
            <p v-if="update.body" class="mt-2 whitespace-pre-wrap text-sm leading-6 text-flixer-text">{{ update.body }}</p>
            <div v-if="update.attachments?.length" class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <a
                v-for="att in update.attachments"
                :key="att.id"
                :href="att.dataUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block overflow-hidden rounded border border-flixer-border bg-flixer-background transition hover:border-flixer-accent"
              >
                <img :src="att.dataUrl" :alt="att.name" class="h-28 w-full object-cover" />
              </a>
            </div>
          </div>
        </div>

        <!-- Chat-style composer -->
        <form class="shrink-0 border-t border-flixer-border bg-flixer-background px-3 py-3 sm:px-4" @submit.prevent="sendUpdate">
          <div v-if="attachments.length" class="mb-2.5 flex flex-wrap gap-2">
            <div
              v-for="(item, idx) in attachments"
              :key="`${item.name}-${idx}`"
              class="relative overflow-hidden rounded border border-flixer-border bg-flixer-surface"
            >
              <img :src="item.dataUrl" :alt="item.name" class="h-16 w-24 object-cover" />
              <button
                type="button"
                class="absolute right-1 top-1 grid size-5 place-items-center rounded bg-black/75 text-white transition hover:bg-red-500"
                aria-label="Remove attachment"
                @click="removeAttachment(idx)"
              >
                <Icon icon="lucide:x" class="size-3" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple class="hidden" @change="onFilesSelected" />
            <button
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-40"
              :disabled="busy || attachments.length >= 4"
              title="Upload image"
              aria-label="Upload image"
              @click="fileInput?.click()"
            >
              <Icon icon="lucide:image-plus" class="size-4.5" />
            </button>
            <button
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-40"
              :disabled="busy || capturing || attachments.length >= 4"
              title="Capture screenshot"
              aria-label="Capture screenshot"
              @click="captureScreenshot"
            >
              <Icon icon="lucide:camera" class="size-4.5" />
            </button>
            <button
              type="button"
              class="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded px-2.5 text-xs font-medium transition"
              :class="internalNote ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40' : 'text-flixer-muted hover:bg-white/10 hover:text-white'"
              :title="t('issues.privateNote')"
              @click="internalNote = !internalNote"
            >
              <Icon icon="lucide:lock" class="size-3.5 shrink-0 -translate-y-[0.5px]" />
              <span class="hidden leading-none sm:inline">{{ internalNote ? t('issues.internalNote') : 'Public' }}</span>
            </button>
            <div class="flex min-w-0 flex-1 items-center rounded bg-white/[0.08] px-4 py-1.5 focus-within:ring-2 focus-within:ring-flixer-accent/40">
              <textarea
                v-model="updateText"
                rows="1"
                maxlength="2000"
                class="max-h-28 min-h-6 w-full resize-none bg-transparent text-sm text-white placeholder:text-flixer-muted focus:outline-none"
                :placeholder="internalNote ? 'Add internal note… (Enter to send)' : 'Reply to issue… (Enter to send)'"
                @keydown="onComposerKeydown"
              />
            </div>
            <button
              type="submit"
              class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-35"
              aria-label="Send"
              :disabled="!canSend"
            >
              <Icon icon="lucide:send-horizontal" class="size-4.5" />
            </button>
          </div>
        </form>
      </section>

      <div v-else class="hidden place-items-center p-6 text-center text-sm text-flixer-muted lg:grid">
        {{ t('issues.selectTicket') }}
      </div>
    </div>
  </AdminSection>
</template>
