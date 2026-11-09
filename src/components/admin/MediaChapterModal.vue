<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { getItemDetail, getItemPlaybackInfo, getStreamInfo, getTrickplay, updateMediaItem, type Trickplay } from '../../api'
import { buildHlsUrl, supportsNativeHls } from '../../api/playback'
import { configureWidevinePlayer, createShakaPlayer, destroyShakaPlayer, isCriticalShakaError, isShakaSupported } from '../player/adaptivePlayback'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import { thumbnailStyle } from '../../composables/trickplay.ts'

const props = defineProps<{ itemId: string }>()

defineOptions({ modalGroup: 'default' })

interface ChapterDraft {
  title: string
  startSeconds: number
  endSeconds: number
}

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()
const chapters = ref<ChapterDraft[]>([])
const selectedChapter = ref<number | null>(null)
const durationMs = ref(0)
const hasExactDuration = ref(false)
const currentMs = ref(0)
const loading = ref(true)
const saving = ref(false)
const previewError = ref('')
const loadError = ref('')
const previewMode = ref<'trickplay' | 'video'>('trickplay')
const playing = ref(false)
const streamUrl = ref('')
const trickplay = shallowRef<Trickplay | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const timeline = ref<HTMLElement | null>(null)
const selectedRange = ref<{ startMs: number; endMs: number } | null>(null)
const initialChapters = ref('')
let active = true
let fakeTimer: ReturnType<typeof setInterval> | undefined
let shakaPlayer: ReturnType<typeof createShakaPlayer> | null = null
let pointerStartMs = 0
let pointerSelecting = false

const durationSeconds = computed(() => durationMs.value / 1000)
const currentSeconds = computed(() => currentMs.value / 1000)
const previewStyle = computed(() => (trickplay.value ? thumbnailStyle(trickplay.value, currentSeconds.value + 1, 960) : {}))
const realPlaybackAvailable = computed(() => Boolean(streamUrl.value) && (supportsNativeHls() || isShakaSupported()))
const hasChanges = computed(() => JSON.stringify(chapters.value) !== initialChapters.value)
const validationError = computed(() => {
  if (
    !chapters.value.every(
      (chapter) =>
        chapter.title.trim().length > 0 &&
        chapter.title.trim().length <= 256 &&
        Number.isFinite(chapter.startSeconds) &&
        Number.isFinite(chapter.endSeconds) &&
        chapter.startSeconds >= 0 &&
        chapter.endSeconds > chapter.startSeconds &&
        (!hasExactDuration.value || chapter.endSeconds * 1000 <= durationMs.value),
    )
  )
    return t('mediaItem.chapterEditor.invalidRange')

  const sorted = [...chapters.value].sort((a, b) => a.startSeconds - b.startSeconds)
  if (sorted.some((chapter, index) => index > 0 && chapter.startSeconds < sorted[index - 1]!.endSeconds)) {
    return t('mediaItem.chapterEditor.overlap')
  }
  return ''
})

async function load() {
  const [detailError, detail] = await catchError(getItemDetail(props.itemId))
  if (!active) return
  if (detailError) {
    loadError.value = describeRequestError(detailError, t('admin.media.detailError'))
    loading.value = false
    return
  }

  chapters.value = detail.chapters.map((chapter) => ({
    title: chapter.title,
    startSeconds: chapter.startMs / 1000,
    endSeconds: chapter.endMs / 1000,
  }))
  initialChapters.value = JSON.stringify(chapters.value)
  durationMs.value = Math.max(0, (detail.runtimeMinutes ?? 0) * 60_000)
  loading.value = false
  void loadPreview()
}

async function loadPreview() {
  const [playbackError, playback] = await catchError(getItemPlaybackInfo(props.itemId))
  if (!active) return
  if (playbackError) {
    previewError.value = describeRequestError(playbackError, t('mediaItem.chapterEditor.playbackUnavailable'))
    return
  }
  streamUrl.value = playback.mediaSource.streamUrl
  const [infoError, info] = await catchError(getStreamInfo(streamUrl.value))
  if (!active) return
  if (infoError) {
    previewError.value = describeRequestError(infoError, t('mediaItem.chapterEditor.playbackUnavailable'))
  } else if (info.source.durationSeconds > 0) {
    durationMs.value = Math.round(info.source.durationSeconds * 1000)
    hasExactDuration.value = true
  }
  trickplay.value = await getTrickplay(streamUrl.value)
}

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  const clock = [minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':')
  return hours > 0 ? `${hours}:${clock}` : clock
}

function setCurrentTime(ms: number) {
  const end = durationMs.value > 0 ? durationMs.value : Number.MAX_SAFE_INTEGER
  currentMs.value = Math.min(end, Math.max(0, ms))
  if (previewMode.value === 'video' && video.value) video.value.currentTime = currentMs.value / 1000
}

function timelineTime(event: PointerEvent): number {
  const element = timeline.value
  if (!element || durationMs.value <= 0) return 0
  const bounds = element.getBoundingClientRect()
  if (bounds.width <= 0) return currentMs.value
  const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
  return Math.round(ratio * durationMs.value)
}

function beginRange(event: PointerEvent) {
  if (durationMs.value <= 0) return
  const time = timelineTime(event)
  pointerStartMs = time
  pointerSelecting = true
  selectedRange.value = { startMs: time, endMs: time }
  setCurrentTime(time)
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function updateRange(event: PointerEvent) {
  if (!pointerSelecting) return
  selectedRange.value = { startMs: Math.min(pointerStartMs, timelineTime(event)), endMs: Math.max(pointerStartMs, timelineTime(event)) }
}

function finishRange(event: PointerEvent) {
  if (!pointerSelecting) return
  updateRange(event)
  pointerSelecting = false
  if (!selectedRange.value || selectedRange.value.endMs - selectedRange.value.startMs < 1000) {
    selectedRange.value = null
    return
  }
  setCurrentTime(selectedRange.value.startMs)
}

function chapterPosition(chapter: ChapterDraft) {
  const scale = durationMs.value > 0 ? 100 / durationMs.value : 0
  return {
    left: `${chapter.startSeconds * 1000 * scale}%`,
    width: `${Math.max(0.5, (chapter.endSeconds - chapter.startSeconds) * 1000 * scale)}%`,
  }
}

function playheadPosition(ms: number) {
  return `${durationMs.value > 0 ? (ms / durationMs.value) * 100 : 0}%`
}

function clearFakeTimer() {
  if (fakeTimer) clearInterval(fakeTimer)
  fakeTimer = undefined
  playing.value = false
}

function togglePreviewPlayback() {
  if (previewMode.value === 'video') {
    if (!video.value) return
    if (video.value.paused) void video.value.play()
    else video.value.pause()
    return
  }
  if (playing.value) {
    clearFakeTimer()
    return
  }
  playing.value = true
  fakeTimer = setInterval(() => {
    if (currentMs.value >= durationMs.value) {
      clearFakeTimer()
      return
    }
    setCurrentTime(currentMs.value + 500)
  }, 500)
}

async function useRealPlayback() {
  if (!realPlaybackAvailable.value) return
  clearFakeTimer()
  previewMode.value = 'video'
  previewError.value = ''
  await nextTick()
  const player = video.value
  if (!player) return
  const source = buildHlsUrl(streamUrl.value)
  if (isShakaSupported()) {
    const adaptivePlayer = createShakaPlayer(player)
    shakaPlayer = adaptivePlayer
    adaptivePlayer.addEventListener('error', (event) => {
      if (!isCriticalShakaError(event) || shakaPlayer !== adaptivePlayer) return
      previewError.value = t('mediaItem.chapterEditor.playbackUnavailable')
      useTrickplay()
    })
    await configureWidevinePlayer(adaptivePlayer)
    const [loadError] = await catchError(adaptivePlayer.load(source, currentSeconds.value))
    if (loadError) {
      if (active && previewMode.value === 'video') {
        previewError.value = t('mediaItem.chapterEditor.playbackUnavailable')
        useTrickplay()
      }
      return
    }
  } else if (supportsNativeHls()) {
    player.addEventListener(
      'loadedmetadata',
      () => {
        if (previewMode.value === 'video') player.currentTime = currentSeconds.value
      },
      { once: true },
    )
    player.src = source
  } else {
    return
  }
  if (!active || previewMode.value !== 'video') return
  const [playError] = await catchError(player.play())
  if (playError && active) previewError.value = describeRequestError(playError, t('mediaItem.chapterEditor.playbackUnavailable'))
}

function useTrickplay() {
  if (video.value) {
    currentMs.value = Math.round(video.value.currentTime * 1000)
    video.value.pause()
    video.value.removeAttribute('src')
    video.value.load()
  }
  const player = shakaPlayer
  shakaPlayer = null
  void destroyShakaPlayer(player).catch((error: unknown) => console.warn('Could not stop chapter preview playback', error))
  clearFakeTimer()
  previewMode.value = 'trickplay'
}

function addChapter() {
  const range = selectedRange.value
  const startMs = range?.startMs ?? currentMs.value
  const endMs = range?.endMs ?? Math.min(durationMs.value || startMs + 30_000, startMs + 30_000)
  if (endMs <= startMs) return
  const next = chapters.value.length
  const chapter = {
    title: t('mediaItem.chapterN', { n: next + 1 }),
    startSeconds: Number((startMs / 1000).toFixed(3)),
    endSeconds: Number((endMs / 1000).toFixed(3)),
  }
  chapters.value.push(chapter)
  chapters.value.sort((left, right) => left.startSeconds - right.startSeconds)
  selectedChapter.value = chapters.value.indexOf(chapter)
  selectedRange.value = null
}

function selectChapter(index: number) {
  selectedChapter.value = index
  const chapter = chapters.value[index]
  if (chapter) setCurrentTime(chapter.startSeconds * 1000)
}

function removeChapter(index: number) {
  chapters.value.splice(index, 1)
  if (selectedChapter.value === index) selectedChapter.value = null
  else if (selectedChapter.value !== null && selectedChapter.value > index) selectedChapter.value--
}

async function save() {
  if (saving.value || !hasChanges.value || validationError.value) return
  saving.value = true
  const [error] = await catchError(
    updateMediaItem(props.itemId, {
      chapters: chapters.value.map((chapter) => ({
        title: chapter.title.trim(),
        startMs: Math.round(chapter.startSeconds * 1000),
        endMs: Math.round(chapter.endSeconds * 1000),
      })),
    }),
  )
  saving.value = false
  if (error) {
    notify.error(describeRequestError(error, t('mediaItem.chapterEditor.saveError')))
    return
  }
  notify.success(t('mediaItem.chapterEditor.saved'))
  confirm(true)
}

function onVideoTimeUpdate() {
  if (video.value) currentMs.value = Math.round(video.value.currentTime * 1000)
}

function onVideoPlay() {
  playing.value = true
}

function onVideoPause() {
  playing.value = false
}

void load()

onBeforeUnmount(() => {
  active = false
  clearFakeTimer()
  const player = shakaPlayer
  shakaPlayer = null
  void destroyShakaPlayer(player).catch((error: unknown) => console.warn('Could not stop chapter preview playback', error))
})
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-3">
    <ModalContent
      class="flixer-modal-card flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/60"
    >
      <header class="shrink-0 border-b border-flixer-border px-5 py-4">
        <ModalTitle class="text-lg font-semibold">{{ t('mediaItem.chapterEditor.title') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm text-flixer-muted">{{ t('mediaItem.chapterEditor.description') }}</ModalDescription>
      </header>

      <div v-if="loading" class="p-6 text-sm text-flixer-muted" role="status" aria-busy="true">{{ t('common.loading') }}</div>
      <p v-else-if="loadError" role="alert" class="m-5 text-sm text-red-300">{{ loadError }}</p>
      <div v-else class="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <section class="min-w-0 space-y-3">
          <div class="relative aspect-video overflow-hidden rounded border border-flixer-border bg-black">
            <div v-if="previewMode === 'trickplay'" class="absolute inset-0 bg-black bg-cover bg-center" :style="previewStyle" aria-hidden="true" />
            <video v-else ref="video" class="size-full bg-black object-contain" controls playsinline @timeupdate="onVideoTimeUpdate" @play="onVideoPlay" @pause="onVideoPause" />
            <div v-if="previewMode === 'trickplay' && !trickplay" class="absolute inset-0 grid place-items-center px-6 text-center text-sm text-flixer-muted">
              {{ t('mediaItem.chapterEditor.noTrickplay') }}
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button
                type="button"
                :disabled="previewMode === 'trickplay' ? !trickplay || durationMs <= 0 : !realPlaybackAvailable"
                class="grid size-9 place-items-center rounded bg-white/10 text-white hover:bg-white/15 disabled:opacity-40"
                :aria-label="playing ? t('mediaItem.chapterEditor.pause') : t('mediaItem.chapterEditor.play')"
                @click="togglePreviewPlayback"
              >
                <Icon :icon="playing ? 'lucide:pause' : 'lucide:play'" class="size-4" aria-hidden="true" />
              </button>
              <span class="font-mono text-xs text-flixer-muted">{{ formatTime(currentMs) }} / {{ formatTime(durationMs) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :disabled="!trickplay"
                class="rounded px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-40"
                :class="previewMode === 'trickplay' ? 'bg-white/15 text-white' : 'text-flixer-muted'"
                @click="useTrickplay"
              >
                {{ t('mediaItem.chapterEditor.useTrickplay') }}
              </button>
              <button
                type="button"
                :disabled="!realPlaybackAvailable"
                class="rounded px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-40"
                :class="previewMode === 'video' ? 'bg-white/15 text-white' : 'text-flixer-muted'"
                @click="useRealPlayback"
              >
                {{ t('mediaItem.chapterEditor.useVideo') }}
              </button>
            </div>
          </div>
          <p v-if="previewError" role="status" class="text-xs text-amber-200">{{ previewError }}</p>

          <div
            ref="timeline"
            class="relative h-12 touch-none cursor-crosshair overflow-hidden rounded border border-flixer-border bg-flixer-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent"
            role="slider"
            tabindex="0"
            :aria-label="t('mediaItem.chapterEditor.timeline')"
            :aria-valuemin="0"
            :aria-valuemax="durationMs"
            :aria-valuenow="currentMs"
            @pointerdown.prevent="beginRange"
            @pointermove="updateRange"
            @pointerup="finishRange"
            @pointercancel="finishRange"
            @keydown.left.prevent="setCurrentTime(currentMs - 5000)"
            @keydown.right.prevent="setCurrentTime(currentMs + 5000)"
          >
            <div
              v-for="(chapter, index) in chapters"
              :key="`range-${index}`"
              class="pointer-events-none absolute inset-y-0 bg-flixer-accent/25"
              :class="selectedChapter === index ? 'bg-flixer-accent/45' : ''"
              :style="chapterPosition(chapter)"
            />
            <div
              v-if="selectedRange"
              class="pointer-events-none absolute inset-y-0 bg-white/25"
              :style="{ left: playheadPosition(selectedRange.startMs), width: `${((selectedRange.endMs - selectedRange.startMs) / Math.max(1, durationMs)) * 100}%` }"
            />
            <div
              v-for="(chapter, index) in chapters"
              :key="`marker-${index}`"
              class="pointer-events-none absolute inset-y-0 border-l border-white/60"
              :style="{ left: playheadPosition(chapter.startSeconds * 1000) }"
            />
            <div class="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white" :style="{ left: playheadPosition(currentMs) }" />
          </div>
          <p class="text-xs text-flixer-muted">{{ t('mediaItem.chapterEditor.selectRangeHint') }}</p>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p v-if="selectedRange" class="font-mono text-xs text-flixer-muted">{{ formatTime(selectedRange.startMs) }} – {{ formatTime(selectedRange.endMs) }}</p>
            <span v-else class="text-xs text-flixer-muted">{{ t('mediaItem.chapterEditor.clickTimeline') }}</span>
            <button
              type="button"
              :disabled="durationMs <= 0"
              class="ml-auto rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-40"
              @click="addChapter"
            >
              <Icon icon="lucide:plus" class="mr-1 inline size-3.5" aria-hidden="true" />
              {{ t('mediaItem.chapterEditor.add') }}
            </button>
          </div>
        </section>

        <section class="min-w-0 space-y-3">
          <h3 class="text-sm font-semibold">
            {{ t('mediaItem.chapters') }} <span class="text-xs font-normal text-flixer-muted">({{ chapters.length }})</span>
          </h3>
          <p v-if="chapters.length === 0" class="rounded border border-dashed border-flixer-border px-4 py-8 text-center text-sm text-flixer-muted">{{ t('mediaItem.chapterEditor.empty') }}</p>
          <ol v-else class="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            <li
              v-for="(chapter, index) in chapters"
              :key="index"
              class="rounded border p-3 transition"
              :class="selectedChapter === index ? 'border-flixer-accent/60 bg-flixer-accent/5' : 'border-flixer-border bg-flixer-background/40'"
            >
              <div class="mb-2 flex items-center gap-2">
                <button type="button" class="min-w-0 flex-1 truncate text-left text-xs font-semibold text-white hover:text-flixer-accent" @click="selectChapter(index)">
                  {{ formatTime(chapter.startSeconds * 1000) }} – {{ formatTime(chapter.endSeconds * 1000) }}
                </button>
                <button
                  type="button"
                  class="grid size-7 shrink-0 place-items-center rounded text-red-200/80 hover:bg-red-400/10 hover:text-red-200"
                  :aria-label="t('mediaItem.chapterEditor.remove')"
                  @click="removeChapter(index)"
                >
                  <Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" />
                </button>
              </div>
              <label class="sr-only" :for="`chapter-title-${index}`">{{ t('mediaItem.chapterEditor.chapterTitle') }}</label>
              <input
                :id="`chapter-title-${index}`"
                v-model="chapter.title"
                type="text"
                maxlength="256"
                :placeholder="t('mediaItem.chapterEditor.chapterTitle')"
                class="w-full rounded border border-flixer-border bg-flixer-background px-2 py-1.5 text-sm text-white"
              />
              <div class="mt-2 grid grid-cols-2 gap-2">
                <label class="flex flex-col gap-1 text-[10px] text-flixer-muted">
                  {{ t('mediaItem.chapterEditor.startSeconds') }}
                  <input
                    v-model.number="chapter.startSeconds"
                    type="number"
                    min="0"
                    :max="durationSeconds || undefined"
                    step="0.001"
                    class="w-full rounded border border-flixer-border bg-flixer-background px-2 py-1 text-xs text-white"
                  />
                </label>
                <label class="flex flex-col gap-1 text-[10px] text-flixer-muted">
                  {{ t('mediaItem.chapterEditor.endSeconds') }}
                  <input
                    v-model.number="chapter.endSeconds"
                    type="number"
                    min="0"
                    :max="durationSeconds || undefined"
                    step="0.001"
                    class="w-full rounded border border-flixer-border bg-flixer-background px-2 py-1 text-xs text-white"
                  />
                </label>
              </div>
            </li>
          </ol>
          <p v-if="validationError" role="alert" class="text-xs text-red-300">{{ validationError }}</p>
        </section>
      </div>

      <footer class="flex shrink-0 justify-end gap-2 border-t border-flixer-border px-5 py-4">
        <button type="button" class="rounded bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15" @click="close()">{{ t('common.cancel') }}</button>
        <button
          type="button"
          :disabled="saving || !hasChanges || !!validationError || loading"
          class="rounded bg-flixer-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50"
          @click="save"
        >
          {{ t(saving ? 'mediaItem.chapterEditor.saving' : 'common.save') }}
        </button>
      </footer>
    </ModalContent>
  </ModalRoot>
</template>
