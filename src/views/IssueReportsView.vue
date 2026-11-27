<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import {
  addAdminIssueReportUpdate,
  addIssueReportUpdate,
  deleteAdminIssueReport,
  getAdminIssueReport,
  getIssueReport,
  listAdminIssueReports,
  listIssueReports,
  setAdminIssueReportChat,
  setAdminIssueReportStatus,
  type IssueReport,
  type IssueReportStatus,
} from '../api'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import IssueReportForm from '../components/issues/IssueReportForm.vue'
import { confirmAction } from '../composables/confirm'
import { getMobileTabs } from '../composables/homeNav'
import { notify } from '../composables/notify'
import { useIssueReportsConfig } from '../composables/useIssueReportsConfig'
import { describeRequestError, useProfile } from '../composables/useProfile'
import { isTvMode } from '../platform/tvMode'
import { catchError } from '../utils/catchError'
import {
  capturePageScreenshotAttachment,
  readImageFilesAsAttachments,
  type IssueAttachmentDraft,
} from '../utils/issueAttachments'
import { runOptimistic } from '../utils/optimistic'

const props = defineProps<{ id?: string }>()
const { t } = useI18n()
const router = useRouter()
const { profile, load: loadProfile } = useProfile()
const { config, load: loadConfig } = useIssueReportsConfig()
const tabs = computed(getMobileTabs)
const isAdmin = computed(() => profile.value?.role === 'admin')

const reports = ref<IssueReport[]>([])
const active = ref<IssueReport | null>(null)
const loading = ref(true)
const error = ref('')
const createOpen = ref(false)
const searchQuery = ref('')
const statusFilter = ref<'all' | IssueReportStatus>('all')
const filterMenuOpen = ref(false)
const statuses: IssueReportStatus[] = ['open', 'in_progress', 'resolved', 'closed']

const replyText = ref('')
const internalNote = ref(false)
const attachments = ref<IssueAttachmentDraft[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const capturing = ref(false)
const busy = ref(false)

const filteredReports = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return reports.value.filter((report) => {
    if (isAdmin.value && statusFilter.value !== 'all' && report.status !== statusFilter.value) return false
    if (!q) return true
    return (
      report.title.toLowerCase().includes(q) ||
      report.category.toLowerCase().includes(q) ||
      report.status.toLowerCase().includes(q) ||
      (report.requester?.displayName?.toLowerCase().includes(q) ?? false) ||
      (report.requester?.username?.toLowerCase().includes(q) ?? false)
    )
  })
})

const canSend = computed(
  () =>
    Boolean(active.value) &&
    (isAdmin.value || active.value?.status !== 'closed') &&
    !busy.value &&
    !capturing.value &&
    (Boolean(replyText.value.trim()) || attachments.value.length > 0),
)

const statusLabel = (status: IssueReport['status']) => t(`issues.status.${status}`)
const dateLabel = (date: string) => new Date(date).toLocaleString()
const shortTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

function setStatusFilter(value: 'all' | IssueReportStatus) {
  statusFilter.value = value
  filterMenuOpen.value = false
}

async function loadList() {
  const [failure, value] = await catchError(isAdmin.value ? listAdminIssueReports() : listIssueReports())
  if (failure) {
    error.value = describeRequestError(failure)
    return
  }
  reports.value = value
}

async function loadActive(id?: string) {
  if (!id) {
    active.value = null
    return
  }
  createOpen.value = false
  const [failure, report] = await catchError(isAdmin.value ? getAdminIssueReport(id) : getIssueReport(id))
  if (failure) {
    error.value = describeRequestError(failure)
    active.value = null
    return
  }
  active.value = report
  reports.value = reports.value.map((r) => (r.id === report.id ? report : r))
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    await loadList()
    if (props.id) {
      await loadActive(props.id)
    } else if (isAdmin.value && reports.value.length && !createOpen.value) {
      await loadActive(reports.value[0].id)
    } else {
      active.value = null
    }
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createOpen.value = true
  if (props.id) {
    void router.push({ name: 'issues' })
  }
}

function submitted(report: IssueReport) {
  createOpen.value = false
  reports.value = [report, ...reports.value.filter((r) => r.id !== report.id)]
  void router.push({ name: 'issues', params: { id: report.id } })
}

async function applyAdminUpdate(update: () => Promise<IssueReport>, successMessage: string): Promise<boolean> {
  if (busy.value || !active.value) return false
  busy.value = true
  try {
    const [failure, result] = await catchError(update())
    if (failure) {
      notify.error(describeRequestError(failure))
      return false
    }
    active.value = result
    reports.value = reports.value
      .map((r) => (r.id === result.id ? result : r))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    notify.success(successMessage)
    return true
  } finally {
    busy.value = false
  }
}

async function changeStatus(event: Event) {
  if (!active.value || !isAdmin.value) return
  const status = (event.target as HTMLSelectElement).value as IssueReportStatus
  await applyAdminUpdate(() => setAdminIssueReportStatus(active.value!.id, status), t('issues.statusSaved'))
}

async function toggleChat() {
  if (!active.value || !isAdmin.value) return
  const id = active.value.id
  const open = !active.value.chatOpen
  await applyAdminUpdate(() => setAdminIssueReportChat(id, open), t(open ? 'issues.chatOpened' : 'issues.chatClosed'))
}

async function deleteReport() {
  const report = active.value
  if (!report || !isAdmin.value || report.status !== 'closed' || busy.value) return
  if (!(await confirmAction(t('issues.confirmDelete', { title: report.title }), { danger: true }))) return
  const res = await runOptimistic({
    key: `admin:issue:delete:${report.id}`,
    apply: () => {
      const prevReports = [...reports.value]
      const prevActive = active.value
      reports.value = reports.value.filter((item) => item.id !== report.id)
      active.value = null
      return { prevReports, prevActive }
    },
    commit: async () => {
      await deleteAdminIssueReport(report.id)
    },
    rollback: ({ prevReports, prevActive }) => {
      reports.value = prevReports
      active.value = prevActive
    },
    onError: (failure) => {
      notify.error(describeRequestError(failure))
    },
  })
  if (res.ok) {
    notify.success(t('issues.reportDeleted'))
    if (props.id) void router.push({ name: 'issues' })
  }
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

async function sendReply() {
  if (!canSend.value || !active.value) return
  const id = active.value.id
  const body = replyText.value.trim()
  const pending = attachments.value.length ? [...attachments.value] : undefined
  if (isAdmin.value) {
    const saved = await applyAdminUpdate(
      () => addAdminIssueReportUpdate(id, body, internalNote.value, pending),
      t(internalNote.value ? 'issues.noteSaved' : 'issues.updateSaved'),
    )
    if (saved && active.value?.id === id) {
      replyText.value = ''
      attachments.value = []
    }
    return
  }

  busy.value = true
  try {
    const [failure, updated] = await catchError(addIssueReportUpdate(id, body, pending))
    if (failure) {
      notify.error(describeRequestError(failure))
      return
    }
    active.value = updated
    reports.value = reports.value
      .map((r) => (r.id === updated.id ? updated : r))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    replyText.value = ''
    attachments.value = []
  } finally {
    busy.value = false
  }
}

function onComposerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void sendReply()
  }
}

onMounted(async () => {
  await Promise.all([loadProfile(), loadConfig()])
  await loadAll()
})

watch(
  () => props.id,
  (nextId) => {
    void loadActive(nextId)
  },
)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <main class="w-full pt-16">
      <div
        class="grid h-[calc(100dvh-4rem)] grid-rows-[minmax(0,1fr)] overflow-hidden bg-flixer-background lg:grid-cols-[20rem_minmax(0,1fr)]">
        <!-- Left sidebar: Issues list -->
        <aside class="flex min-h-0 flex-col border-flixer-border bg-flixer-surface/35 lg:border-r"
          :class="active || createOpen ? 'hidden lg:flex' : 'flex'">
          <div class="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-flixer-border px-4">
            <h1 class="truncate text-xl font-bold tracking-tight text-white">
              {{ isAdmin ? 'Issues' : t('issues.myReports') }}
            </h1>
            <button
              v-if="!isTvMode && config?.enabled"
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded bg-white/[0.08] text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
              :aria-label="t('issues.newReport')"
              :title="t('issues.newReport')"
              @click="openCreate"
            >
              <Icon icon="lucide:plus" class="size-4" />
            </button>
          </div>

          <div class="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <label class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded bg-white/5 px-3 text-sm text-flixer-text focus-within:ring-1 focus-within:ring-flixer-accent">
              <Icon icon="lucide:search" class="size-4 shrink-0 text-flixer-muted" />
              <input v-model="searchQuery" type="search" placeholder="Search issues..."
                class="w-full bg-transparent text-sm text-white placeholder:text-flixer-muted focus:outline-none" />
            </label>
            <div v-if="isAdmin" class="relative shrink-0">
              <button
                type="button"
                class="grid size-9 place-items-center rounded border transition focus-visible:outline-2 focus-visible:outline-flixer-accent"
                :class="
                  statusFilter !== 'all'
                    ? 'border-flixer-accent/40 bg-flixer-accent/15 text-flixer-accent'
                    : 'border-flixer-border bg-white/[0.06] text-flixer-muted hover:bg-white/10 hover:text-white'
                "
                :aria-label="t('issues.filterStatus')"
                :aria-expanded="filterMenuOpen"
                :title="statusFilter === 'all' ? t('issues.allStatuses') : statusLabel(statusFilter)"
                @click="filterMenuOpen = !filterMenuOpen"
              >
                <Icon icon="lucide:list-filter" class="size-4" />
              </button>
              <div
                v-if="filterMenuOpen"
                class="fixed inset-0 z-20"
                @click="filterMenuOpen = false"
              />
              <div
                v-if="filterMenuOpen"
                class="absolute right-0 top-full z-30 mt-1.5 w-44 rounded border border-flixer-border bg-flixer-surface p-1 text-xs text-flixer-text shadow-xl"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitemradio"
                  :aria-checked="statusFilter === 'all'"
                  class="flex w-full items-center justify-between rounded px-2.5 py-2 text-left transition hover:bg-white/10"
                  :class="statusFilter === 'all' ? 'bg-white/10 font-semibold text-white' : ''"
                  @click="setStatusFilter('all')"
                >
                  <span>{{ t('issues.allStatuses') }}</span>
                  <Icon v-if="statusFilter === 'all'" icon="lucide:check" class="size-3.5 text-flixer-accent" />
                </button>
                <button
                  v-for="status in statuses"
                  :key="status"
                  type="button"
                  role="menuitemradio"
                  :aria-checked="statusFilter === status"
                  class="flex w-full items-center justify-between rounded px-2.5 py-2 text-left transition hover:bg-white/10"
                  :class="statusFilter === status ? 'bg-white/10 font-semibold text-white' : ''"
                  @click="setStatusFilter(status)"
                >
                  <span>{{ t(`issues.status.${status}`) }}</span>
                  <Icon v-if="statusFilter === status" icon="lucide:check" class="size-3.5 text-flixer-accent" />
                </button>
              </div>
            </div>
          </div>

          <p v-if="error" class="m-3 rounded border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200"
            role="alert">{{ error }}</p>
          <p v-if="loading" class="p-4 text-sm text-flixer-muted" role="status">{{ t('issues.loading') }}</p>
          <p v-else-if="!config?.enabled && !isAdmin" class="p-4 text-sm text-flixer-muted">{{ t('issues.disabled') }}
          </p>
          <div v-else-if="!filteredReports.length" class="p-6 text-center">
            <p class="text-sm text-flixer-muted">{{ isAdmin ? t('issues.noAdminReports') : t('issues.empty') }}</p>
            <button v-if="!isTvMode && config?.enabled && !isAdmin" type="button"
              class="mt-3 rounded bg-white px-4 py-2 text-xs font-semibold text-flixer-background hover:bg-white/85"
              @click="openCreate">
              {{ t('issues.newReport') }}
            </button>
          </div>
          <ul v-else class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 pb-20 md:pb-2">
            <li v-for="report in filteredReports" :key="report.id">
              <RouterLink :to="{ name: 'issues', params: { id: report.id } }"
                class="flex items-center gap-3 rounded p-2.5 transition hover:bg-white/[0.06]"
                :class="active?.id === report.id && !createOpen ? 'bg-white/[0.09] ring-1 ring-white/10' : ''">
                <span
                  class="relative grid size-10 shrink-0 place-items-center rounded bg-gradient-to-br from-flixer-accent/80 to-flixer-primary/80 text-white">
                  <Icon icon="lucide:life-buoy" class="size-4.5" />
                  <span class="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-flixer-background"
                    :class="report.status === 'open' ? 'bg-emerald-400' : report.status === 'in_progress' ? 'bg-amber-400' : 'bg-zinc-400'" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="truncate text-sm font-semibold text-white">{{ report.title }}</span>
                    <span class="shrink-0 text-[11px] text-flixer-muted">{{ shortTime(report.updatedAt) }}</span>
                  </span>
                  <span class="mt-0.5 flex items-center justify-between gap-2">
                    <span class="truncate text-xs text-flixer-muted">
                      <template v-if="isAdmin && report.requester">{{ report.requester.displayName }} · </template>{{
                        report.category }}
                    </span>
                    <span class="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-flixer-text">{{
                      statusLabel(report.status) }}</span>
                  </span>
                </span>
              </RouterLink>
            </li>
          </ul>
        </aside>

        <!-- Right pane: Create form OR active issue thread -->
        <section v-if="createOpen && !isTvMode && config?.enabled" class="flex min-h-0 flex-col bg-flixer-background">
          <header
            class="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-flixer-border bg-flixer-background/95 px-3 sm:px-4">
            <div class="flex items-center gap-3">
              <button type="button"
                class="grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 lg:hidden"
                aria-label="Back" @click="createOpen = false">
                <Icon icon="lucide:chevron-left" class="size-5" />
              </button>
              <h2 class="text-base font-semibold text-white">{{ t('issues.newReport') }}</h2>
            </div>
            <button type="button"
              class="rounded border border-flixer-border bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
              @click="createOpen = false">
              {{ t('common.cancel') }}
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div class="mx-auto max-w-2xl">
              <IssueReportForm @submitted="submitted" />
            </div>
          </div>
        </section>

        <section v-else-if="active" class="flex min-h-0 flex-col bg-flixer-background">
          <header
            class="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-flixer-border bg-flixer-background/95 px-3 sm:px-4">
            <div class="flex min-w-0 items-center gap-3">
              <RouterLink :to="{ name: 'issues' }"
                class="grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 lg:hidden"
                aria-label="Back">
                <Icon icon="lucide:chevron-left" class="size-5" />
              </RouterLink>
              <span
                class="grid size-10 shrink-0 place-items-center rounded bg-gradient-to-br from-flixer-accent to-flixer-primary text-white">
                <Icon icon="lucide:life-buoy" class="size-4.5" />
              </span>
              <div class="min-w-0">
                <h2 class="truncate text-sm font-semibold text-white">{{ active.title }}</h2>
                <p class="truncate text-xs text-flixer-muted">
                  <template v-if="isAdmin && active.requester">{{ active.requester.displayName }} ({{
                    active.requester.username }}) · </template>
                  <template v-else>{{ t('issues.ticketNumber', { id: active.id.slice(0, 8) }) }} · </template>
                  {{ active.category }}
                  <template v-if="active.mediaTitle"> · {{ active.mediaTitle }}</template>
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
              <template v-if="isAdmin">
                <select :value="active.status" :aria-label="t('issues.statusLabel')"
                  class="h-9 rounded border border-flixer-border bg-white/[0.06] px-2.5 text-xs font-medium text-white outline-none focus:border-flixer-accent"
                  :disabled="busy" @change="changeStatus">
                  <option v-for="status in statuses" :key="status" :value="status" class="bg-flixer-surface">{{
                    t(`issues.status.${status}`) }}</option>
                </select>
                <button type="button"
                  class="inline-flex h-9 items-center gap-1.5 rounded bg-flixer-primary px-3 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                  :disabled="busy" @click="toggleChat">
                  <Icon icon="lucide:message-square" class="size-3.5" />
                  <span class="hidden sm:inline">{{ active.chatOpen ? t('issues.closeLiveChat') :
                    t('issues.openLiveChat') }}</span>
                </button>
              </template>
              <span v-else class="rounded bg-white/10 px-2.5 py-1 text-xs font-medium text-white">{{
                statusLabel(active.status)
              }}</span>

              <RouterLink v-if="active.chatOpen && active.chatConversationId"
                :to="{ name: 'chat', params: { id: active.chatConversationId } }"
                class="inline-flex h-9 items-center gap-1.5 rounded border border-flixer-border bg-white/[0.06] px-3 text-xs font-semibold text-white transition hover:bg-white/10">
                <Icon icon="lucide:message-square" class="size-3.5" />
                {{ t('issues.openChat') }}
              </RouterLink>

              <button v-if="isAdmin && active.status === 'closed'" type="button"
                class="grid size-9 place-items-center rounded border border-red-400/40 bg-red-500/10 text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                :disabled="busy" :aria-label="t('issues.deleteReport')" :title="t('issues.deleteReport')"
                @click="deleteReport">
                <Icon icon="lucide:trash-2" class="size-4" />
              </button>
            </div>
          </header>

          <!-- Thread messages -->
          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <div class="rounded border border-flixer-border bg-white/[0.04] p-4">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-flixer-muted">
                <span class="font-semibold text-white">{{ active.requester?.displayName ?? 'You' }}</span>
                <time :datetime="active.createdAt">{{ dateLabel(active.createdAt) }}</time>
              </div>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-flixer-text">{{ active.description }}</p>
              <div v-if="active.attachments?.length" class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <a v-for="att in active.attachments" :key="att.id" :href="att.dataUrl" target="_blank"
                  rel="noopener noreferrer"
                  class="block overflow-hidden rounded border border-flixer-border bg-flixer-background transition hover:border-flixer-accent">
                  <img :src="att.dataUrl" :alt="att.name" class="h-28 w-full object-cover" />
                </a>
              </div>
            </div>

            <div v-for="update in active.updates ?? []" :key="update.id" class="rounded border p-3.5" :class="update.isInternal
              ? 'border-amber-400/30 bg-amber-500/[0.07]'
              : update.author?.username === active.requester?.username
                ? 'border-flixer-border bg-white/[0.04]'
                : 'border-flixer-accent/30 bg-flixer-accent/[0.08]'
              ">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-flixer-muted">
                <span class="flex items-center gap-2 font-medium text-white">
                  {{ update.author?.displayName ?? t('issues.system') }}
                  <span v-if="update.isInternal"
                    class="inline-flex items-center gap-1 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                    <Icon icon="lucide:lock" class="size-2.5" />
                    {{ t('issues.internalNote') }}
                  </span>
                </span>
                <time :datetime="update.createdAt">{{ dateLabel(update.createdAt) }}</time>
              </div>
              <p v-if="update.body" class="mt-2 whitespace-pre-wrap text-sm leading-6 text-flixer-text">{{ update.body
              }}</p>
              <div v-if="update.attachments?.length" class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <a v-for="att in update.attachments" :key="att.id" :href="att.dataUrl" target="_blank"
                  rel="noopener noreferrer"
                  class="block overflow-hidden rounded border border-flixer-border bg-flixer-background transition hover:border-flixer-accent">
                  <img :src="att.dataUrl" :alt="att.name" class="h-28 w-full object-cover" />
                </a>
              </div>
            </div>
          </div>

          <!-- Composer -->
          <form v-if="isAdmin || active.status !== 'closed'"
            class="shrink-0 border-t border-flixer-border bg-flixer-background px-3 py-3 sm:px-4"
            @submit.prevent="sendReply">
            <div v-if="attachments.length" class="mb-2.5 flex flex-wrap gap-2">
              <div v-for="(item, idx) in attachments" :key="`${item.name}-${idx}`"
                class="relative overflow-hidden rounded border border-flixer-border bg-flixer-surface">
                <img :src="item.dataUrl" :alt="item.name" class="h-16 w-24 object-cover" />
                <button type="button"
                  class="absolute right-1 top-1 grid size-5 place-items-center rounded bg-black/75 text-white transition hover:bg-red-500"
                  aria-label="Remove attachment" @click="removeAttachment(idx)">
                  <Icon icon="lucide:x" class="size-3" />
                </button>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple
                class="hidden" @change="onFilesSelected" />
              <button type="button"
                class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-40"
                :disabled="busy || attachments.length >= 4" title="Upload image" aria-label="Upload image"
                @click="fileInput?.click()">
                <Icon icon="lucide:image-plus" class="size-4.5" />
              </button>
              <button type="button"
                class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-40"
                :disabled="busy || capturing || attachments.length >= 4" title="Capture screenshot"
                aria-label="Capture screenshot" @click="captureScreenshot">
                <Icon icon="lucide:camera" class="size-4.5" />
              </button>
              <button v-if="isAdmin" type="button"
                class="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded px-2.5 text-xs font-medium transition"
                :class="internalNote ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40' : 'text-flixer-muted hover:bg-white/10 hover:text-white'"
                :title="t('issues.privateNote')" @click="internalNote = !internalNote">
                <Icon icon="lucide:lock" class="size-3.5 shrink-0 -translate-y-[0.5px]" />
                <span class="hidden leading-none sm:inline">{{ internalNote ? t('issues.internalNote') : 'Public'
                }}</span>
              </button>
              <div
                class="flex min-w-0 flex-1 items-center rounded bg-white/[0.08] px-4 py-1.5 focus-within:ring-2 focus-within:ring-flixer-accent/40">
                <textarea v-model="replyText" rows="1" maxlength="2000"
                  class="max-h-28 min-h-6 w-full resize-none bg-transparent text-sm text-white placeholder:text-flixer-muted focus:outline-none"
                  :placeholder="isAdmin && internalNote ? 'Add internal note… (Enter to send)' : 'Reply to issue… (Enter to send)'"
                  @keydown="onComposerKeydown" />
              </div>
              <button type="submit"
                class="grid size-9 shrink-0 place-items-center rounded text-flixer-accent transition hover:bg-white/10 disabled:opacity-35"
                aria-label="Send" :disabled="!canSend">
                <Icon icon="lucide:send-horizontal" class="size-4.5" />
              </button>
            </div>
          </form>
        </section>

        <div v-else class="hidden flex-col items-center justify-center gap-3 p-6 text-center lg:flex">
          <p class="text-sm text-flixer-muted">{{ t('issues.selectTicket') }}</p>
          <button v-if="!isTvMode && config?.enabled" type="button"
            class="rounded bg-white px-4 py-2 text-xs font-semibold text-flixer-background hover:bg-white/85"
            @click="openCreate">
            {{ t('issues.newReport') }}
          </button>
        </div>
      </div>
    </main>
    <MobileTabBar :tabs="tabs" />
  </div>
</template>
