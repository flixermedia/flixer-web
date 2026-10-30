<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { addMediaItemImage, getMediaItem, MEDIA_IMAGE_TYPES, refreshMediaItem, removeMediaItemImage, updateMediaItem, type MediaImageType, type MediaItemChanges, type MediaItemDetail } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AuthImage from '../ui/AuthImage.vue'
import StatusPill from './StatusPill.vue'
import SubtitlePanel from './SubtitlePanel.vue'

const props = defineProps<{ itemId: string }>()

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp,image/gif'
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const COMMON_PROVIDER_IDS = ['tmdb', 'tvdb', 'imdb', 'omdb', 'anilist', 'anidb', 'mal', 'musicbrainz', 'discogs', 'audiodb']

const item = ref<MediaItemDetail | null>(null)
const loadError = ref('')
const saveError = ref('')
const imageError = ref('')
const saving = ref(false)
const imageBusy = ref(false)
const changed = ref(false)
const newImageType = ref<MediaImageType>('poster')
const fileInput = ref<HTMLInputElement | null>(null)

const title = ref('')
const sortTitle = ref('')
const year = ref<number | null>(null)
const seasonNumber = ref<number | null>(null)
const episodeNumber = ref<number | null>(null)
const episodeEndNumber = ref<number | null>(null)
const overview = ref('')
const providerIds = ref<Record<string, string>>({})
const newProviderName = ref('')

const inputClass = 'rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text'
const hasSubtitles = computed(() => ['movie', 'episode', 'video'].includes(item.value?.type ?? ''))

const hasEpisodeNumbers = computed(() => item.value?.type === 'episode' || item.value?.type === 'track')
const hasSeasonNumber = computed(() => item.value?.type === 'season' || item.value?.type === 'episode')
const canSave = computed(() => title.value.trim().length > 0 && !saving.value)
const images = computed(() => item.value?.images ?? [])
const providerFields = computed(() => [...new Set([...COMMON_PROVIDER_IDS, ...Object.keys(providerIds.value)])])

// A cleared number box is v-model.number's empty string; treat it as "no value".
function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function applyDetail(detail: MediaItemDetail) {
  item.value = detail
  title.value = detail.title
  sortTitle.value = detail.sortTitle ?? ''
  year.value = detail.year
  seasonNumber.value = detail.seasonNumber
  episodeNumber.value = detail.episodeNumber
  episodeEndNumber.value = detail.episodeEndNumber
  overview.value = typeof detail.metadata.overview === 'string' ? detail.metadata.overview : ''
  providerIds.value = { ...detail.providerIds }
}

function addProviderField() {
  const provider = newProviderName.value.trim().toLowerCase()
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(provider)) {
    saveError.value = t('admin.media.providerIdInvalid')
    return
  }
  providerIds.value = { ...providerIds.value, [provider]: providerIds.value[provider] ?? '' }
  newProviderName.value = ''
  saveError.value = ''
}

async function load() {
  const [error, result] = await catchError(getMediaItem(props.itemId))
  if (error) {
    loadError.value = describeRequestError(error, t('admin.media.detailError'))
  } else {
    applyDetail(result)
  }
}

// Only send fields that changed so untouched ones stay owned by the indexer.
async function save() {
  if (!item.value || !canSave.value) return
  const current = item.value
  const changes: MediaItemChanges = {}
  if (title.value.trim() !== current.title) changes.title = title.value.trim()
  if ((sortTitle.value.trim() || null) !== current.sortTitle) changes.sortTitle = sortTitle.value.trim() || null
  if (numberOrNull(year.value) !== current.year) changes.year = numberOrNull(year.value)
  if (numberOrNull(seasonNumber.value) !== current.seasonNumber) changes.seasonNumber = numberOrNull(seasonNumber.value)
  if (numberOrNull(episodeNumber.value) !== current.episodeNumber) changes.episodeNumber = numberOrNull(episodeNumber.value)
  if (numberOrNull(episodeEndNumber.value) !== current.episodeEndNumber) changes.episodeEndNumber = numberOrNull(episodeEndNumber.value)
  const previousOverview = typeof current.metadata.overview === 'string' ? current.metadata.overview : ''
  if (overview.value !== previousOverview) changes.overview = overview.value.trim() || null
  const providerChanges: NonNullable<MediaItemChanges['providerIds']> = {}
  for (const provider of providerFields.value) {
    const next = providerIds.value[provider]?.trim() ?? ''
    const previous = current.providerIds[provider] ?? ''
    if (next !== previous) providerChanges[provider] = next || null
  }
  if (Object.keys(providerChanges).length > 0) changes.providerIds = providerChanges

  if (Object.keys(changes).length === 0) {
    confirm(changed.value)
    return
  }
  saving.value = true
  saveError.value = ''
  try {
    const [error] = await catchError(updateMediaItem(current.id, changes))
    if (error) {
      saveError.value = describeRequestError(error, t('admin.media.saveError'))
    } else {
      if (changes.providerIds) {
        const [refreshError, refresh] = await catchError(refreshMediaItem(current.id, true))
        if (refreshError) {
          notify.error(describeRequestError(refreshError, t('admin.media.providerIdRescanError')))
        } else if (refresh.alreadyQueued) {
          notify.success(t('admin.media.rescanAlreadyQueued'))
        } else {
          notify.success(t('admin.media.providerIdsSaved'))
        }
      } else {
        notify.success(t('admin.media.saved'))
      }
      confirm(true)
    }
  } finally {
    saving.value = false
  }
}

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !item.value) return
  if (!ACCEPTED_IMAGES.split(',').includes(file.type)) {
    imageError.value = t('admin.media.imageInvalidType')
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    imageError.value = t('admin.media.imageTooLarge')
    return
  }
  imageBusy.value = true
  imageError.value = ''
  try {
    const [error, detail] = await catchError(addMediaItemImage(item.value.id, newImageType.value, file))
    if (error) {
      imageError.value = describeRequestError(error, t('admin.media.imageAddError'))
    } else {
      item.value = detail
      changed.value = true
      notify.success(t('admin.media.imageAdded'))
    }
  } finally {
    imageBusy.value = false
  }
}

async function removeImage(index: number) {
  if (!item.value || !(await confirmAction(t('admin.media.confirmRemoveImage'), { danger: true }))) return
  imageBusy.value = true
  imageError.value = ''
  try {
    const [error, detail] = await catchError(removeMediaItemImage(item.value.id, index))
    if (error) {
      imageError.value = describeRequestError(error, t('admin.media.imageRemoveError'))
    } else {
      item.value = detail
      changed.value = true
      notify.success(t('admin.media.imageRemoved'))
    }
  } finally {
    imageBusy.value = false
  }
}

function imageLabel(image: MediaItemDetail['images'][number]) {
  const size = image.width && image.height ? ` · ${image.width}×${image.height}` : ''
  return `${t(`admin.media.imageTypes.${image.type}`, image.type)}${size}`
}

void load()
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ item ? t('admin.media.editTitle', { title: item.title }) : t('admin.media.edit') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('admin.media.modalDescription') }}</ModalDescription>

      <p v-if="loadError" role="alert" class="mt-4 text-sm text-red-300">{{ loadError }}</p>

      <form v-else-if="item" id="media-item-form" class="mt-4 grid min-h-24 flex-1 gap-5 overflow-y-auto pr-1" @submit.prevent="save">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-xs text-flixer-muted sm:col-span-2">
            {{ t('admin.media.fieldTitle') }}
            <input v-model="title" type="text" maxlength="1000" required :class="inputClass" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.media.fieldSortTitle') }}
            <input v-model="sortTitle" type="text" maxlength="1000" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.media.fieldYear') }}
            <input v-model.number="year" type="number" min="0" :class="inputClass" />
          </label>
          <label v-if="hasSeasonNumber" class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.media.fieldSeason') }}
            <input v-model.number="seasonNumber" type="number" min="0" :class="inputClass" />
          </label>
          <template v-if="hasEpisodeNumbers">
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.media.fieldEpisode') }}
              <input v-model.number="episodeNumber" type="number" min="0" :class="inputClass" />
            </label>
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.media.fieldEpisodeEnd') }}
              <input v-model.number="episodeEndNumber" type="number" min="0" :class="inputClass" />
            </label>
          </template>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted sm:col-span-2">
            {{ t('admin.media.fieldOverview') }}
            <textarea v-model="overview" rows="4" maxlength="20000" :class="inputClass"></textarea>
          </label>
        </div>

        <section :aria-label="t('admin.media.providerIds')">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <h3 class="text-xs font-semibold text-flixer-muted">{{ t('admin.media.providerIds') }}</h3>
            <div class="flex items-center gap-2">
              <input v-model="newProviderName" type="text" maxlength="32" :aria-label="t('admin.media.providerIdName')" :placeholder="t('admin.media.providerIdName')" :class="inputClass" class="py-1 text-xs" @keydown.enter.prevent="addProviderField" />
              <button type="button" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15" @click="addProviderField">{{ t('admin.media.addProviderId') }}</button>
            </div>
          </div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label v-for="provider in providerFields" :key="provider" class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ provider }}
              <input v-model="providerIds[provider]" type="text" maxlength="256" :aria-label="`${t('admin.media.providerIds')} ${provider}`" :class="inputClass" />
            </label>
          </div>
        </section>

        <section :aria-label="t('admin.media.images')">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <h3 class="text-xs font-semibold text-flixer-muted">{{ t('admin.media.images') }}</h3>
            <div class="flex items-center gap-2">
              <select v-model="newImageType" :aria-label="t('admin.media.imageType')" :class="inputClass" class="py-1 text-xs">
                <option v-for="option in MEDIA_IMAGE_TYPES" :key="option" :value="option">{{ t(`admin.media.imageTypes.${option}`) }}</option>
              </select>
              <button type="button" :disabled="imageBusy" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50" @click="fileInput?.click()">{{ t('admin.media.addImage') }}</button>
              <input ref="fileInput" type="file" :accept="ACCEPTED_IMAGES" class="hidden" @change="onFileChosen" />
            </div>
          </div>
          <p v-if="imageError" role="alert" class="mt-2 text-xs text-red-300">{{ imageError }}</p>
          <ul v-if="images.length" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <li v-for="image in images" :key="`${image.index}-${image.type}-${image.provider}-${image.width}`" class="flex flex-col gap-1">
              <div class="overflow-hidden rounded bg-white/5" :class="image.type === 'poster' ? 'aspect-[2/3]' : 'aspect-video'">
                <AuthImage v-if="image.available" :item-id="item.id" :index="image.index" :version="item.updatedAt" :width="480" :alt="imageLabel(image)" />
                <span v-else class="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-flixer-muted">{{ t('admin.media.imagePending') }}</span>
              </div>
              <p class="truncate text-[11px] text-flixer-muted">{{ imageLabel(image) }}</p>
              <p class="flex items-center justify-between gap-1 text-[11px] text-flixer-muted">
                <StatusPill v-if="image.manual" tone="accent">{{ t('admin.media.imageManual') }}</StatusPill>
                <span v-else class="truncate">{{ image.provider }}</span>
                <button v-if="image.manual" type="button" :disabled="imageBusy" class="text-red-300 hover:underline disabled:opacity-50" @click="removeImage(image.index)">{{ t('admin.media.removeImage') }}</button>
              </p>
            </li>
          </ul>
          <p v-else class="mt-2 text-xs text-flixer-muted">{{ t('admin.media.noImages') }}</p>
        </section>

        <SubtitlePanel v-if="hasSubtitles" :item-id="item.id" />

        <dl class="grid gap-1 text-xs text-flixer-muted">
          <div class="flex gap-2">
            <dt>{{ t('admin.media.path') }}:</dt>
            <dd class="min-w-0 break-all font-mono">{{ item.path }}</dd>
          </div>
          <div v-if="item.childCount > 0">{{ t('admin.media.children', { count: item.childCount }) }}</div>
        </dl>

        <p v-if="saveError" role="alert" class="text-sm text-red-300">{{ saveError }}</p>
      </form>

      <div class="mt-5 flex shrink-0 justify-end gap-2">
        <button v-if="item" type="submit" form="media-item-form" :disabled="!canSave" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50">{{ t('admin.media.save') }}</button>
        <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="changed ? confirm(true) : close()">{{ t('admin.media.cancel') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
